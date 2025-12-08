import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { TrendingUp, TrendingDown, Activity, Target, Award, BarChart3 } from 'lucide-react';
import { useUserStore } from '../../stores/userStore';
import { useDashboardStore } from '../../stores/dashboardStore';
import { useTradingStore } from '../../stores/tradingStore';
import { useSymbolStore, WatchlistSymbol } from '../../stores/symbolStore';
import KlineChart from '../../components/charts/KlineChart';
import OptionsChain from '../../components/options/OptionsChain';
import { formatCurrency } from '../../utils/formatters';
import { OptionData } from '../../types';
import { useChartData } from '../../hooks/useChartData';
import { useOptionsChain } from '../../hooks/useOptionsChain';

export default function DashboardHome() {
    const router = useRouter();
    const { user } = useUserStore();
    const { equity, marginAvailable, openingBalance, tradeMetrics } = useDashboardStore();
    const { orders } = useTradingStore();
    const { selectedSymbol, setSelectedSymbol, setShowChart, showChart } = useSymbolStore();

    // Use hooks
    const { candles, isLoading: isLoadingChart, fetchCandles, setCandles } = useChartData();
    const { optionsData, isLoading: isLoadingOptions, fetchOptionsChain } = useOptionsChain();

    // State
    const [activeTab, setActiveTab] = useState<'CHART' | 'OPTION_CHAIN'>('CHART');
    const [currentTimeframe, setCurrentTimeframe] = useState('5m');

    // Watch URL for chart/option-chain routes (Zerodha-style)
    useEffect(() => {
        // Check if we're on a chart or option-chain route
        const isChartRoute = router.pathname.startsWith('/chart');
        const isOptionChainRoute = router.pathname.startsWith('/option-chain');
        const { symbol, instrument_token } = router.query;
        
        if ((isChartRoute || isOptionChainRoute) && symbol && typeof symbol === 'string') {
            console.log('🔵 [Dashboard] Route detected:', { pathname: router.pathname, symbol, instrument_token });
            
            // Decode symbol (convert hyphens back to spaces)
            const decodedSymbol = symbol.replace(/-/g, ' ');
            
            // Set active tab based on route
            if (isOptionChainRoute) {
                setActiveTab('OPTION_CHAIN');
            } else {
                setActiveTab('CHART');
            }
            
            // Create symbol object from URL
            const chartSymbol: WatchlistSymbol = {
                symbol: decodedSymbol,
                displayName: decodedSymbol,
                ltp: 0,
                change: 0,
                changePercent: 0,
                instrumentToken: instrument_token ? parseInt(instrument_token as string) : undefined,
            };
            
            // Show chart panel (no page change)
            setSelectedSymbol(chartSymbol);
            setShowChart(true);
            
            // Fetch chart data if on chart route
            if (isChartRoute && instrument_token) {
                const backendTimeframe = mapTimeframeToBackend(currentTimeframe);
                fetchCandles(decodedSymbol, parseInt(instrument_token as string), backendTimeframe, 200);
            }
            
            // Fetch option chain if on option-chain route
            if (isOptionChainRoute) {
                fetchOptionsChain(decodedSymbol, undefined, { above: 15, below: 15 });
            }
        } else {
            // No chart in URL, show dashboard metrics
            if (showChart) {
                setShowChart(false);
            }
        }
    }, [router.pathname, router.query]);

    // Debug: Component mount
    useEffect(() => {
        console.log('🚀 [Dashboard] Component mounted');
        console.log('🚀 [Dashboard] Initial state - showChart:', showChart);
        console.log('🚀 [Dashboard] Initial state - selectedSymbol:', selectedSymbol);
        console.log('🚀 [Dashboard] Initial state - currentTimeframe:', currentTimeframe);
    }, []);

    // Map frontend timeframe to backend format
    const mapTimeframeToBackend = (timeframe: string): string => {
        const mapping: Record<string, string> = {
            '1m': 'minute',
            '3m': '3minute',
            '5m': '5minute',
            '15m': '15minute',
            '30m': '30minute',
            '1h': '60minute',
            '1d': 'day'
        };
        const mapped = mapping[timeframe] || timeframe;
        console.log(`🔄 [mapTimeframe] ${timeframe} → ${mapped}`);
        return mapped;
    };

    const handleSymbolChartFetch = async (symbol: WatchlistSymbol, timeframe: string) => {
        console.log('🔵 [handleSymbolChartFetch] Symbol:', symbol.symbol, 'Timeframe:', timeframe);

        if (!symbol.instrumentToken) {
            console.error('❌ No instrument token found for symbol:', symbol.symbol);
            return;
        }

        const backendTimeframe = mapTimeframeToBackend(timeframe);
        // Fetch initial candles - WebSocket will handle real-time updates
        await fetchCandles(symbol.symbol, symbol.instrumentToken, backendTimeframe, 200);
    };

    const handleTimeframeChange = (timeframe: string) => {
        console.log('🟢 [handleTimeframeChange] Timeframe changed to:', timeframe);
        setCurrentTimeframe(timeframe);
        if (selectedSymbol) {
            handleSymbolChartFetch(selectedSymbol, timeframe);
        }
    };

    const handleSymbolSelect = async (symbol: WatchlistSymbol) => {
        console.log('🟣 [handleSymbolSelect] Symbol selected:', symbol.symbol);
        
        // Navigate to /chart/SYMBOL route (Zerodha-style)
        const params = new URLSearchParams();
        if (symbol.instrumentToken) {
            params.set('instrument_token', symbol.instrumentToken.toString());
        }
        
        // Change URL to /chart/SYMBOL without page reload (encode symbol for clean URL)
        const encodedSymbol = symbol.symbol.replace(/\s+/g, '-');
        router.push(`/chart/${encodedSymbol}?${params.toString()}`, undefined, { shallow: true });
    };

    // Handle option selection (for chart button)
    const handleOptionSelect = (option: OptionData, action?: 'BUY' | 'SELL' | 'CHART' | 'WATCHLIST') => {
        if (action === 'WATCHLIST') {
            const symbolExists = useSymbolStore.getState().watchlist.find(item => item.symbol === option.symbol);
            if (symbolExists) {
                console.log(`⚠️ ${option.symbol} is already in watchlist`);
                return;
            }
            useSymbolStore.setState((state) => ({
                watchlist: [...state.watchlist, {
                    symbol: option.symbol,
                    displayName: option.symbol,
                    ltp: option.ltp,
                    change: 0,
                    changePercent: option.change_percent,
                    instrumentToken: option.instrument_token,
                }]
            }));
            console.log(`✅ Added ${option.symbol} to watchlist`);
            return;
        }
        if (action === 'CHART') {
            // Navigate to /chart/SYMBOL route (Zerodha-style)
            const params = new URLSearchParams();
            if (option.instrument_token) {
                params.set('instrument_token', option.instrument_token.toString());
            }

            console.log('📊 [Dashboard] Opening chart:', option.symbol);

            // Change URL to /chart/SYMBOL without page reload (encode symbol for clean URL)
            const encodedSymbol = option.symbol.replace(/\s+/g, '-');
            router.push(`/chart/${encodedSymbol}?${params.toString()}`, undefined, { shallow: true });
            return;
        }
        // For BUY/SELL actions, you can add logic here if needed
    };

    // Effect to fetch options chain when tab changes to OPTION_CHAIN
    useEffect(() => {
        if (activeTab === 'OPTION_CHAIN' && selectedSymbol) {
            fetchOptionsChain(selectedSymbol.displayName, undefined, { above: 15, below: 15 });
        }
    }, [activeTab, selectedSymbol, fetchOptionsChain]);

    // Debug effect to monitor candles state
    useEffect(() => {
        console.log('📊 [Candles State Changed] Length:', candles.length);
        console.log('📊 [Candles State Changed] Data:', candles.slice(0, 3));
    }, [candles]);

    // Mock recent orders (you can replace with real API call)
    const recentOrders = orders.slice(0, 10);

    return (
        <DashboardLayout
            title={showChart && selectedSymbol ? selectedSymbol.displayName : "Dashboard"}
            showWatchlist={true}
            onSymbolSelect={handleSymbolSelect}
        >
            {showChart && selectedSymbol ? (
                // Chart View - Opens when URL has symbol param
                <div className="h-full flex flex-col bg-[#0a0a0a]">
                    {/* Header with Tabs and Close Button */}
                    <div className="flex items-center justify-between px-4 bg-[#131722] border-b border-[#2a2e39]">
                        <div className="flex items-center gap-6">
                            {/* Tabs */}
                            <button
                                onClick={() => {
                                    const symbol = router.query.symbol || selectedSymbol?.symbol;
                                    const token = router.query.instrument_token;
                                    const params = new URLSearchParams();
                                    if (token) params.set('instrument_token', token as string);
                                    const encodedSymbol = (symbol as string)?.replace(/\s+/g, '-') || symbol;
                                    router.push(`/chart/${encodedSymbol}?${params.toString()}`, undefined, { shallow: true });
                                }}
                                className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'CHART'
                                    ? 'text-[#ff5722] border-[#ff5722]'
                                    : 'text-gray-400 border-transparent hover:text-white'
                                    }`}
                            >
                                Chart
                            </button>
                            <button
                                onClick={() => {
                                    const symbol = router.query.symbol || selectedSymbol?.symbol;
                                    const token = router.query.instrument_token;
                                    const params = new URLSearchParams();
                                    if (token) params.set('instrument_token', token as string);
                                    const encodedSymbol = (symbol as string)?.replace(/\s+/g, '-') || symbol;
                                    router.push(`/option-chain/${encodedSymbol}?${params.toString()}`, undefined, { shallow: true });
                                }}
                                className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'OPTION_CHAIN'
                                    ? 'text-[#ff5722] border-[#ff5722]'
                                    : 'text-gray-400 border-transparent hover:text-white'
                                    }`}
                            >
                                Option chain
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white">{selectedSymbol.displayName}</span>
                                <span className={`text-xs ${selectedSymbol.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {selectedSymbol.ltp.toFixed(2)}
                                </span>
                            </div>
                            <button
                                onClick={() => {
                                    router.push('/dashboard', undefined, { shallow: true });
                                    setShowChart(false);
                                }}
                                className="text-xs text-gray-400 hover:text-white px-3 py-1 rounded hover:bg-[#2a2e39] transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 relative">
                        {activeTab === 'CHART' ? (
                            isLoadingChart ? (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                    Loading Chart...
                                </div>
                            ) : (
                                <KlineChart
                                    data={candles.length > 0 ? candles : [
                                        {
                                            timestamp: Date.now() - 3600000,
                                            open: selectedSymbol.ltp * 0.98,
                                            high: selectedSymbol.ltp * 1.02,
                                            low: selectedSymbol.ltp * 0.96,
                                            close: selectedSymbol.ltp,
                                            volume: 1000000,
                                        },
                                    ]}
                                    symbol={selectedSymbol.symbol}
                                    showVolume={false}
                                    height="100%"
                                    onTimeframeChange={handleTimeframeChange}
                                    currentTimeframe={currentTimeframe}
                                    instrumentToken={selectedSymbol.instrumentToken}
                                />
                            )
                        ) : (
                            // Option Chain View
                            <div className="h-full overflow-hidden bg-[#0a0a0a]">
                                {isLoadingOptions ? (
                                    <div className="h-full flex items-center justify-center text-gray-400">
                                        Loading Option Chain...
                                    </div>
                                ) : (
                                    <div className="h-full overflow-y-auto">
                                        <OptionsChain
                                            spotPrice={optionsData.spotPrice}
                                            calls={optionsData.calls}
                                            puts={optionsData.puts}
                                            symbol={selectedSymbol?.displayName || selectedSymbol?.symbol || 'NIFTY'}
                                            onOptionSelect={handleOptionSelect}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // Dashboard Widgets View - Shows when no symbol in URL
                <div className="p-6 space-y-6">
                    {/* Admin Panel Button - Only show for admins */}
                    {user?.is_admin && (
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 border border-purple-500 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">Admin Panel</h3>
                                    <p className="text-sm text-purple-100">
                                        Manage tournaments, users, and view analytics
                                    </p>
                                </div>
                                <button
                                    onClick={() => router.push('/admin')}
                                    className="px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Open Admin Panel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Equity Summary Card */}
                    <div className="bg-[#1a1d23] border border-gray-800 rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Equity Summary</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-sm text-gray-400 mb-1">Equity</p>
                                <p className="text-2xl font-bold text-white">
                                    {formatCurrency(equity)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400 mb-1">Margin Available</p>
                                <p className="text-2xl font-bold text-green-500">
                                    {formatCurrency(marginAvailable)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400 mb-1">Opening Balance</p>
                                <p className="text-2xl font-bold text-gray-300">
                                    {formatCurrency(openingBalance)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Trade Metrics Card */}
                    <div className="bg-[#1a1d23] border border-gray-800 rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Trade Metrics</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <div className="bg-[#131722] border border-gray-700 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Target className="w-4 h-4 text-blue-400" />
                                    <p className="text-xs text-gray-400">Profit Factor</p>
                                </div>
                                <p className="text-xl font-bold text-white">
                                    {tradeMetrics.profitFactor.toFixed(2)}
                                </p>
                            </div>

                            <div className="bg-[#131722] border border-gray-700 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Activity className="w-4 h-4 text-purple-400" />
                                    <p className="text-xs text-gray-400">Total Trades</p>
                                </div>
                                <p className="text-xl font-bold text-white">
                                    {tradeMetrics.totalTrades}
                                </p>
                            </div>

                            <div className="bg-[#131722] border border-gray-700 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Award className="w-4 h-4 text-green-400" />
                                    <p className="text-xs text-gray-400">Win Rate</p>
                                </div>
                                <p className="text-xl font-bold text-green-500">
                                    {tradeMetrics.winRate.toFixed(1)}%
                                </p>
                            </div>

                            <div className="bg-[#131722] border border-gray-700 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="w-4 h-4 text-green-400" />
                                    <p className="text-xs text-gray-400">Winning Trades</p>
                                </div>
                                <p className="text-xl font-bold text-green-500">
                                    {tradeMetrics.winningTrades}
                                </p>
                            </div>

                            <div className="bg-[#131722] border border-gray-700 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingDown className="w-4 h-4 text-red-400" />
                                    <p className="text-xs text-gray-400">Losing Trades</p>
                                </div>
                                <p className="text-xl font-bold text-red-500">
                                    {tradeMetrics.losingTrades}
                                </p>
                            </div>

                            <div className="bg-[#131722] border border-gray-700 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <BarChart3 className="w-4 h-4 text-green-400" />
                                    <p className="text-xs text-gray-400">Avg Win/Trade</p>
                                </div>
                                <p className="text-xl font-bold text-green-500">
                                    {formatCurrency(tradeMetrics.avgWinPerTrade)}
                                </p>
                            </div>

                            <div className="bg-[#131722] border border-gray-700 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <BarChart3 className="w-4 h-4 text-red-400" />
                                    <p className="text-xs text-gray-400">Avg Loss/Trade</p>
                                </div>
                                <p className="text-xl font-bold text-red-500">
                                    {formatCurrency(tradeMetrics.avgLossPerTrade)}
                                </p>
                            </div>

                            <div className="bg-[#131722] border border-gray-700 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingDown className="w-4 h-4 text-orange-400" />
                                    <p className="text-xs text-gray-400">Max Drawdown</p>
                                </div>
                                <p className="text-xl font-bold text-orange-500">
                                    {formatCurrency(tradeMetrics.maxDrawdown)}
                                </p>
                            </div>

                            <div className="bg-[#131722] border border-gray-700 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Target className="w-4 h-4 text-blue-400" />
                                    <p className="text-xs text-gray-400">Expectancy/Trade</p>
                                </div>
                                <p className="text-xl font-bold text-blue-400">
                                    {formatCurrency(tradeMetrics.expectancyPerTrade)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Recent Orders */}
                    <div className="bg-[#1a1d23] border border-gray-800 rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Recent Orders</h2>
                        {recentOrders.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-800">
                                            <th className="text-left text-xs font-medium text-gray-400 pb-3">Time</th>
                                            <th className="text-left text-xs font-medium text-gray-400 pb-3">Symbol</th>
                                            <th className="text-left text-xs font-medium text-gray-400 pb-3">Side</th>
                                            <th className="text-right text-xs font-medium text-gray-400 pb-3">Qty</th>
                                            <th className="text-right text-xs font-medium text-gray-400 pb-3">Price</th>
                                            <th className="text-left text-xs font-medium text-gray-400 pb-3">Status</th>
                                            <th className="text-right text-xs font-medium text-gray-400 pb-3">P&L</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentOrders.map((order, index) => (
                                            <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50">
                                                <td className="py-3 text-sm text-gray-300">
                                                    {new Date(order.timestamp || Date.now()).toLocaleTimeString()}
                                                </td>
                                                <td className="py-3 text-sm text-white font-medium">
                                                    {order.symbol}
                                                </td>
                                                <td className="py-3">
                                                    <span className={`text-xs font-medium px-2 py-1 rounded ${order.order_side === 'BUY'
                                                        ? 'bg-blue-900/30 text-blue-400'
                                                        : 'bg-red-900/30 text-red-400'
                                                        }`}>
                                                        {order.order_side}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-sm text-gray-300 text-right">
                                                    {order.quantity}
                                                </td>
                                                <td className="py-3 text-sm text-gray-300 text-right">
                                                    ₹{order.price?.toFixed(2)}
                                                </td>
                                                <td className="py-3">
                                                    <span className={`text-xs font-medium px-2 py-1 rounded ${order.status === 'COMPLETE'
                                                        ? 'bg-green-900/30 text-green-400'
                                                        : order.status === 'PENDING'
                                                            ? 'bg-yellow-900/30 text-yellow-400'
                                                            : 'bg-gray-700 text-gray-400'
                                                        }`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-sm text-right">
                                                    <span className={order.pnl && order.pnl > 0 ? 'text-green-500' : 'text-red-500'}>
                                                        {order.pnl ? formatCurrency(order.pnl) : '-'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-gray-400">No recent orders</p>
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                >
                                    Start Trading
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
