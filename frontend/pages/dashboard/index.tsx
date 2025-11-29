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
import api from '../../services/api';
import { OptionData } from '../../types';

export default function DashboardHome() {
    const router = useRouter();
    const { user } = useUserStore();
    const { equity, marginAvailable, openingBalance, tradeMetrics } = useDashboardStore();
    const { orders } = useTradingStore();
    const { selectedSymbol, setSelectedSymbol, setShowChart, showChart } = useSymbolStore();

    // State
    const [candles, setCandles] = useState<any[]>([]);
    const [isLoadingChart, setIsLoadingChart] = useState(false);
    const [activeTab, setActiveTab] = useState<'CHART' | 'OPTION_CHAIN'>('CHART');
    const [optionsData, setOptionsData] = useState<{ calls: OptionData[]; puts: OptionData[]; spotPrice: number }>({
        calls: [],
        puts: [],
        spotPrice: 0
    });
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);
    const [currentTimeframe, setCurrentTimeframe] = useState('5m');

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

    const fetchOptionsChain = async (symbol: string) => {
        setIsLoadingOptions(true);
        try {
            // Map symbol names if necessary (e.g., "NIFTY 50" -> "NIFTY")
            let apiSymbol = symbol;
            if (symbol === 'NIFTY 50') apiSymbol = 'NIFTY';
            if (symbol === 'NIFTY BANK') apiSymbol = 'BANKNIFTY';

            const response = await api.get(`/api/candles/options-chain/${apiSymbol}`);
            const data = response.data;

            // Process data similar to OptionsPage
            const allStrikes = new Set<number>();
            data.ce_options?.forEach((opt: any) => allStrikes.add(opt.strike));
            data.pe_options?.forEach((opt: any) => allStrikes.add(opt.strike));
            const sortedStrikes = Array.from(allStrikes).sort((a, b) => a - b);

            // Find ATM strike index
            let atmIndex = 0;
            let minDiff = Number.MAX_VALUE;
            sortedStrikes.forEach((strike, index) => {
                const diff = Math.abs(strike - data.spot_price);
                if (diff < minDiff) {
                    minDiff = diff;
                    atmIndex = index;
                }
            });

            // Filter strikes (15 above and 15 below ATM for dashboard view)
            const startIdx = Math.max(0, atmIndex - 15);
            const endIdx = Math.min(sortedStrikes.length, atmIndex + 16);
            const allowedStrikes = new Set(sortedStrikes.slice(startIdx, endIdx));

            const mapOption = (opt: any, type: 'CE' | 'PE'): OptionData => ({
                symbol: opt.tradingsymbol,
                strike_price: opt.strike,
                expiry_date: opt.expiry,
                option_type: type,
                ltp: opt.ltp,
                open_interest: opt.oi,
                change_percent: opt.change,
                volume: opt.volume,
                bid: 0, ask: 0, iv: 0, delta: 0, gamma: 0, theta: 0, vega: 0,
                instrument_token: opt.instrument_token,
            });

            const calls = data.ce_options
                .filter((opt: any) => allowedStrikes.has(opt.strike))
                .map((opt: any) => mapOption(opt, 'CE'));

            const puts = data.pe_options
                .filter((opt: any) => allowedStrikes.has(opt.strike))
                .map((opt: any) => mapOption(opt, 'PE'));

            setOptionsData({ calls, puts, spotPrice: data.spot_price });
        } catch (error) {
            console.error('Error fetching options chain:', error);
        } finally {
            setIsLoadingOptions(false);
        }
    };

    const fetchCandles = async (symbol: WatchlistSymbol, timeframe: string) => {
        console.log('🔵 [fetchCandles] START - Symbol:', symbol.symbol, 'Timeframe:', timeframe);
        console.log('🔵 [fetchCandles] Symbol object:', JSON.stringify(symbol, null, 2));

        if (!symbol.instrumentToken) {
            console.error('❌ [fetchCandles] No instrument token found for symbol:', symbol.symbol);
            return;
        }

        console.log('🔵 [fetchCandles] Instrument token:', symbol.instrumentToken);
        setIsLoadingChart(true);

        try {
            const backendTimeframe = mapTimeframeToBackend(timeframe);
            const params = {
                symbol: symbol.symbol,
                instrument_token: symbol.instrumentToken,
                timeframe: backendTimeframe,
                limit: 200
            };

            console.log('🔵 [fetchCandles] API Request params:', params);
            console.log('🔵 [fetchCandles] Making API call to /api/candles/');

            const response = await api.get('/api/candles/', { params });

            console.log('✅ [fetchCandles] API Response received');
            console.log('✅ [fetchCandles] Response status:', response.status);
            console.log('✅ [fetchCandles] Response data length:', response.data?.length);
            console.log('✅ [fetchCandles] First 3 candles:', response.data?.slice(0, 3));

            setCandles(response.data);
            console.log('✅ [fetchCandles] Candles state updated successfully');
        } catch (error: any) {
            console.error('❌ [fetchCandles] Error occurred:', error);
            console.error('❌ [fetchCandles] Error message:', error.message);
            console.error('❌ [fetchCandles] Error response:', error.response?.data);
            console.error('❌ [fetchCandles] Error status:', error.response?.status);

            // Use mock data as fallback
            const mockCandles = [
                {
                    timestamp: Date.now() - 3600000,
                    open: symbol.ltp * 0.98,
                    high: symbol.ltp * 1.02,
                    low: symbol.ltp * 0.96,
                    close: symbol.ltp,
                    volume: 1000000,
                },
            ];

            console.log('⚠️ [fetchCandles] Using mock data as fallback:', mockCandles);
            setCandles(mockCandles);
        } finally {
            setIsLoadingChart(false);
            console.log('🔵 [fetchCandles] END - Loading state set to false');
        }
    };

    const handleTimeframeChange = (timeframe: string) => {
        console.log('🟢 [handleTimeframeChange] Timeframe changed to:', timeframe);
        console.log('🟢 [handleTimeframeChange] Current selected symbol:', selectedSymbol?.symbol);

        setCurrentTimeframe(timeframe);
        if (selectedSymbol) {
            console.log('🟢 [handleTimeframeChange] Calling fetchCandles...');
            fetchCandles(selectedSymbol, timeframe);
        } else {
            console.warn('⚠️ [handleTimeframeChange] No symbol selected, skipping fetch');
        }
    };

    const handleSymbolSelect = async (symbol: WatchlistSymbol) => {
        console.log('🟣 [handleSymbolSelect] Symbol selected:', symbol.symbol);
        console.log('🟣 [handleSymbolSelect] Symbol details:', JSON.stringify(symbol, null, 2));
        console.log('🟣 [handleSymbolSelect] Current timeframe:', currentTimeframe);

        setSelectedSymbol(symbol);
        setShowChart(true);
        setActiveTab('CHART'); // Reset to chart tab

        console.log('🟣 [handleSymbolSelect] Calling fetchCandles...');
        // Fetch candle data for the selected symbol with current timeframe
        await fetchCandles(symbol, currentTimeframe);
    };

    // Effect to fetch options chain when tab changes to OPTION_CHAIN
    useEffect(() => {
        if (activeTab === 'OPTION_CHAIN' && selectedSymbol) {
            fetchOptionsChain(selectedSymbol.displayName);
        }
    }, [activeTab, selectedSymbol]);

    // Debug effect to monitor candles state
    useEffect(() => {
        console.log('📊 [Candles State Changed] Length:', candles.length);
        console.log('📊 [Candles State Changed] Data:', candles.slice(0, 3));
    }, [candles]);

    // Mock recent orders (you can replace with real API call)
    const recentOrders = orders.slice(0, 10);

    return (
        <DashboardLayout
            title="Dashboard"
            showWatchlist={true}
            onSymbolSelect={handleSymbolSelect}
        >
            {showChart && selectedSymbol ? (
                // Chart View - Full Screen
                <div className="h-full flex flex-col bg-[#0a0a0a]">
                    {/* Header with Tabs and Close Button */}
                    <div className="flex items-center justify-between px-4 bg-[#131722] border-b border-[#2a2e39]">
                        <div className="flex items-center gap-6">
                            {/* Tabs */}
                            <button
                                onClick={() => setActiveTab('CHART')}
                                className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'CHART'
                                    ? 'text-[#ff5722] border-[#ff5722]'
                                    : 'text-gray-400 border-transparent hover:text-white'
                                    }`}
                            >
                                Chart
                            </button>
                            <button
                                onClick={() => setActiveTab('OPTION_CHAIN')}
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
                                onClick={() => setShowChart(false)}
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
                                    showVolume={true}
                                    height="100%"
                                    onTimeframeChange={handleTimeframeChange}
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
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // Dashboard Widgets View
                <div className="p-6 space-y-6">
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
                                                    <span className={`text-xs font-medium px-2 py-1 rounded ${order.side === 'BUY'
                                                        ? 'bg-blue-900/30 text-blue-400'
                                                        : 'bg-red-900/30 text-red-400'
                                                        }`}>
                                                        {order.side}
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
                                    onClick={() => router.push('/dashboard/options')}
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
