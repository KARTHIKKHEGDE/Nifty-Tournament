import React, { useState } from 'react';
import { Search, TrendingUp, TrendingDown } from 'lucide-react';
import { useSymbolStore, WatchlistSymbol } from '../../stores/symbolStore';

interface WatchlistSidebarProps {
    onSymbolSelect: (symbol: WatchlistSymbol) => void;
}

export default function WatchlistSidebar({ onSymbolSelect }: WatchlistSidebarProps) {
    const { watchlist } = useSymbolStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);

    const filteredWatchlist = watchlist.filter((item) =>
        item.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleChartClick = (symbol: WatchlistSymbol) => {
        onSymbolSelect(symbol);
    };

    return (
        <div className="w-64 bg-[#1a1d23] border-r border-gray-800 flex flex-col h-full">
            {/* Search Bar */}
            <div className="p-3 border-b border-gray-800">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search eg: nifty, sensex"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#131722] border border-gray-700 rounded-md pl-10 pr-3 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
            </div>

            {/* Watchlist Header */}
            <div className="px-3 py-2 border-b border-gray-800">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Default Watchlist
                </h3>
            </div>

            {/* Watchlist Items */}
            <div className="flex-1 overflow-y-auto">
                {filteredWatchlist.map((item) => (
                    <div
                        key={item.symbol}
                        className="relative border-b border-gray-800 hover:bg-[#1e2329] transition-colors cursor-pointer"
                        onMouseEnter={() => setHoveredSymbol(item.symbol)}
                        onMouseLeave={() => setHoveredSymbol(null)}
                    >
                        <div className="px-3 py-3">
                            {/* Symbol Name */}
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-200">
                                    {item.displayName}
                                </span>
                                {hoveredSymbol === item.symbol && (
                                    <button
                                        onClick={() => handleChartClick(item)}
                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                                    >
                                        Chart
                                    </button>
                                )}
                            </div>

                            {/* Price and Change */}
                            {hoveredSymbol !== item.symbol && (
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
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Info */}
            <div className="p-3 border-t border-gray-800">
                <p className="text-xs text-gray-500 text-center">
                    {filteredWatchlist.length} {filteredWatchlist.length === 1 ? 'symbol' : 'symbols'}
                </p>
            </div>
        </div>
    );
}
