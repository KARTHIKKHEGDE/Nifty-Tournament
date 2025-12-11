import React, { useState, useCallback, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, X, Plus, BarChart2 } from 'lucide-react';
import { useCombobox } from 'downshift';
import { useSymbolStore, WatchlistSymbol } from '../../stores/symbolStore';
import {
    getSuggestions,
    formatSuggestion,
    isOptionSuggestion,
    SearchSuggestion
} from '../../utils/searchUtils';
import SimpleOrderModal from '../trading/SimpleOrderModal';
import { OrderSide, TickData } from '../../types';
import wsService from '../../services/websocket';

interface WatchlistSidebarProps {
    onSymbolSelect: (symbol: WatchlistSymbol) => void;
}

export default function WatchlistSidebar({ onSymbolSelect }: WatchlistSidebarProps) {
    const { watchlist, removeFromWatchlist, addToWatchlist } = useSymbolStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);
    const [hoveredSuggestion, setHoveredSuggestion] = useState<number | null>(null);
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [orderModalOpen, setOrderModalOpen] = useState(false);
    const [selectedSymbol, setSelectedSymbol] = useState<WatchlistSymbol | null>(null);
    const [orderSide, setOrderSide] = useState<OrderSide>(OrderSide.BUY);
    const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);

    // Subscribe to WebSocket ticks for real-time watchlist price updates
    useEffect(() => {
        console.log('📡 [WatchlistSidebar] Setting up WebSocket tick listener for watchlist');
        
        const unsubscribe = wsService.on('tick', (tickData: TickData) => {
            // Update watchlist prices in real-time via store
            if (tickData && tickData.symbol && tickData.last_price) {
                useSymbolStore.setState((state) => ({
                    watchlist: state.watchlist.map(item => 
                        item.symbol === tickData.symbol
                            ? { ...item, ltp: tickData.last_price }
                            : item
                    )
                }));
            }
        });

        return () => {
            console.log('🧹 [WatchlistSidebar] Cleaning up WebSocket tick listener');
            unsubscribe();
        };
    }, []);

    // Subscribe to WebSocket when new symbols are added to watchlist
    useEffect(() => {
        // Subscribe to all watchlist symbols that have instrumentToken
        watchlist.forEach(item => {
            if (item.instrumentToken) {
                console.log(`📤 [WatchlistSidebar] Ensuring subscription for ${item.symbol} (${item.instrumentToken})`);
                wsService.subscribe(item.symbol, item.instrumentToken);
            }
        });
    }, [watchlist]);

    // Fetch suggestions when search query changes
    React.useEffect(() => {
        const fetchSuggestions = async () => {
            if (!searchQuery.trim()) {
                setSuggestions([]);
                return;
            }
            const results = await getSuggestions(searchQuery);
            setSuggestions(results);
        };
        fetchSuggestions();
    }, [searchQuery]);

    const handleSuggestionSelect = useCallback((selectedItem: SearchSuggestion | null) => {
        if (!selectedItem) return;

        if (typeof selectedItem === 'string') {
            const displayName = formatSuggestion(selectedItem);
            const indexSymbol: WatchlistSymbol = {
                symbol: displayName,
                displayName: displayName,
                ltp: 0,
                change: 0,
                changePercent: 0,
            };
            addToWatchlist(indexSymbol);
        } else {
            const optionSymbol: WatchlistSymbol = {
                symbol: selectedItem.tradingSymbol || formatSuggestion(selectedItem),
                displayName: formatSuggestion(selectedItem),
                ltp: 0,
                change: 0,
                changePercent: 0,
                instrumentToken: selectedItem.instrumentToken,
            };
            addToWatchlist(optionSymbol);
        }
        setSearchQuery('');
    }, [addToWatchlist]);

    const {
        isOpen,
        getMenuProps,
        getInputProps,
        highlightedIndex,
        getItemProps,
    } = useCombobox({
        items: suggestions,
        inputValue: searchQuery,
        onInputValueChange: ({ inputValue }) => {
            setSearchQuery(inputValue || '');
        },
        onSelectedItemChange: () => { },
        itemToString: (item) => (item ? formatSuggestion(item) : ''),
    });

    // Don't filter watchlist - show all symbols always
    const filteredWatchlist = watchlist;

    const handleChartClick = (symbol: WatchlistSymbol) => {
        onSymbolSelect(symbol);
    };

    const handleRemove = (symbol: string, e: React.MouseEvent) => {
        e.stopPropagation();
        removeFromWatchlist(symbol);
    };

    const handleBuySell = (item: WatchlistSymbol, side: OrderSide, e: React.MouseEvent) => {
        e.stopPropagation();
        setClickPosition({ x: e.clientX, y: e.clientY });
        setSelectedSymbol(item);
        setOrderSide(side);
        setOrderModalOpen(true);
    };

    // Check if symbol is an option (contains CE or PE)
    const isOption = (symbol: string) => {
        return symbol.includes('CE') || symbol.includes('PE');
    };

    // Extract instrument type from symbol
    const getInstrumentType = (symbol: string): 'CE' | 'PE' | 'INDEX' => {
        if (symbol.includes('CE')) return 'CE';
        if (symbol.includes('PE')) return 'PE';
        return 'INDEX';
    };

    return (
        <div className="w-64 bg-[#1a1d23] border-r border-gray-800 flex flex-col h-full">
            <div className="p-3 border-b border-gray-800">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 z-10" />
                    <input
                        {...getInputProps()}
                        type="text"
                        placeholder="Search: nifty 25500..."
                        className="w-full bg-[#131722] border border-gray-700 rounded-md pl-10 pr-3 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />

                    {isOpen && suggestions.length > 0 && (
                        <ul
                            {...getMenuProps()}
                            className="absolute top-full left-0 w-80 mt-1 bg-[#131722] border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto z-50"
                        >
                            {suggestions.map((suggestion, index) => {
                                const isOption = isOptionSuggestion(suggestion);
                                const displayText = formatSuggestion(suggestion);
                                const isHovered = hoveredSuggestion === index;

                                return (
                                    <li
                                        key={index}
                                        {...getItemProps({ item: suggestion, index })}
                                        onMouseEnter={() => setHoveredSuggestion(index)}
                                        onMouseLeave={() => setHoveredSuggestion(null)}
                                        className={`w-full px-3 py-2.5 cursor-pointer transition-all duration-150 ${highlightedIndex === index
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-300 hover:bg-[#1e2329]'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium">
                                                    {displayText}
                                                </div>
                                                {isOption && suggestion.expiry && (
                                                    <div className="text-xs opacity-60 mt-1">
                                                        Expiry: {new Date(suggestion.expiry).toLocaleDateString('en-IN')}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                {!isHovered && isOption ? (
                                                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded">
                                                        {suggestion.optionType}
                                                    </span>
                                                ) : isHovered ? (
                                                    <>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSuggestionSelect(suggestion);
                                                            }}
                                                            className="w-8 h-8 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                                                            title="Add to watchlist"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const symbol: WatchlistSymbol = typeof suggestion === 'string'
                                                                    ? {
                                                                        symbol: formatSuggestion(suggestion),
                                                                        displayName: formatSuggestion(suggestion),
                                                                        ltp: 0,
                                                                        change: 0,
                                                                        changePercent: 0,
                                                                    }
                                                                    : {
                                                                        symbol: suggestion.tradingSymbol || formatSuggestion(suggestion),
                                                                        displayName: formatSuggestion(suggestion),
                                                                        ltp: 0,
                                                                        change: 0,
                                                                        changePercent: 0,
                                                                        instrumentToken: suggestion.instrumentToken,
                                                                    };
                                                                onSymbolSelect(symbol);
                                                                setSearchQuery('');
                                                            }}
                                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors whitespace-nowrap"
                                                            title="View chart"
                                                        >
                                                            Chart
                                                        </button>
                                                    </>
                                                ) : null}
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>

            <div className="px-3 py-2 border-b border-gray-800">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Default Watchlist
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto">
                {filteredWatchlist.map((item) => (
                    <div
                        key={item.symbol}
                        className="relative border-b border-gray-800 hover:bg-[#1e2329] transition-colors cursor-pointer"
                        onMouseEnter={() => setHoveredSymbol(item.symbol)}
                        onMouseLeave={() => setHoveredSymbol(null)}
                    >
                        <div className="px-3 py-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-200">
                                    {item.displayName}
                                </span>
                                {hoveredSymbol === item.symbol && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => handleRemove(item.symbol, e)}
                                            className="w-6 h-6 flex items-center justify-center bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded transition-colors"
                                            title="Remove from watchlist"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                        {isOption(item.symbol) && (
                                            <>
                                                <button
                                                    onClick={(e) => handleBuySell(item, OrderSide.BUY, e)}
                                                    className="w-6 h-6 rounded bg-green-500/20 hover:bg-green-500 text-green-500 hover:text-white flex items-center justify-center text-xs font-bold transition-colors"
                                                    title="Buy"
                                                >
                                                    B
                                                </button>
                                                <button
                                                    onClick={(e) => handleBuySell(item, OrderSide.SELL, e)}
                                                    className="w-6 h-6 rounded bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center text-xs font-bold transition-colors"
                                                    title="Sell"
                                                >
                                                    S
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => handleChartClick(item)}
                                            className="w-6 h-6 rounded bg-blue-500/20 hover:bg-blue-500 text-blue-500 hover:text-white flex items-center justify-center transition-colors"
                                            title="Chart"
                                        >
                                            <BarChart2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-white">
                                    ₹{item.ltp.toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </span>
                                <div
                                    className={`flex items-center gap-1 text-xs font-medium ${item.changePercent >= 0
                                        ? 'text-green-500'
                                        : 'text-red-500'
                                        }`}
                                >
                                    {item.changePercent >= 0 ? (
                                        <TrendingUp className="w-3 h-3" />
                                    ) : (
                                        <TrendingDown className="w-3 h-3" />
                                    )}
                                    <span>
                                        {item.changePercent >= 0 ? '+' : ''}
                                        {item.changePercent.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-3 border-t border-gray-800">
                <p className="text-xs text-gray-500 text-center">
                    {filteredWatchlist.length} {filteredWatchlist.length === 1 ? 'symbol' : 'symbols'}
                </p>
            </div>

            {/* Order Modal */}
            {selectedSymbol && (
                <SimpleOrderModal
                    isOpen={orderModalOpen}
                    onClose={() => {
                        setOrderModalOpen(false);
                        setSelectedSymbol(null);
                        setClickPosition(null);
                    }}
                    symbol={selectedSymbol.symbol}
                    currentPrice={selectedSymbol.ltp}
                    instrumentType={getInstrumentType(selectedSymbol.symbol)}
                    initialSide={orderSide}
                    lotSize={selectedSymbol.symbol.toUpperCase().includes('BANK') || selectedSymbol.symbol.toUpperCase() === 'BANKNIFTY' ? 35 : 75}
                    clickPosition={clickPosition}
                />
            )}
        </div>
    );
}
