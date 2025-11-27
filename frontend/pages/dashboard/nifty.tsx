import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import KlineChart from '../../components/charts/KlineChart';
import SymbolTabs from '../../components/trading/SymbolTabs';
import TimeframeSelector from '../../components/trading/TimeframeSelector';
import OrdersHistory from '../../components/trading/OrdersHistory';
import PositionsTable from '../../components/trading/PositionsTable';
import OptionsChain from '../../components/options/OptionsChain';
import Loader from '../../components/common/Loader';
import { useTradingStore } from '../../stores/tradingStore';
import { useUserStore } from '../../stores/userStore';
import tradingService from '../../services/tradingService';
import websocketService from '../../services/websocketService';
import { WSMessageType } from '../../types';
import authService from '../../services/authService';

export default function NiftyTradingPage() {
    const {
        currentSymbol,
        currentTimeframe,
        currentPrice,
        candles,
        orderRefreshTrigger,
        setCurrentSymbol,
        setCurrentTimeframe,
        setCurrentPrice,
        setCandles,
        updateCandle,
    } = useTradingStore();

    const { user } = useUserStore();
    const [isLoadingCandles, setIsLoadingCandles] = useState(true);
    const [wsConnected, setWsConnected] = useState(false);
    const [instrumentToken, setInstrumentToken] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'chart' | 'optionchain'>('chart');
    const [optionsData, setOptionsData] = useState<{ calls: any[]; puts: any[] }>({
        calls: [],
        puts: [],
    });

    // Fetch instrument token for current symbol
    const fetchInstrumentToken = async (symbol: string) => {
        try {
            // Map symbol to instrument name
            const symbolMap: { [key: string]: string } = {
                'NIFTY 50': 'NIFTY 50',
                'BANKNIFTY': 'NIFTY BANK',
            };

            const instrumentName = symbolMap[symbol] || symbol;
            const token = await tradingService.getInstrumentToken(instrumentName, 'NSE');

            if (token) {
                setInstrumentToken(token);
                console.log(`Instrument token for ${symbol}:`, token);
            } else {
                console.warn(`No instrument token found for ${symbol}, will use mock data`);
            }

            return token;
        } catch (error) {
            console.error('Failed to fetch instrument token:', error);
            return null;
        }
    };

    // Load historical candles
    const loadCandles = async (limit: number = 400, isLoadMore: boolean = false) => {
        if (!isLoadMore) setIsLoadingCandles(true);

        try {
            // Get instrument token if not already fetched
            let token = instrumentToken;
            if (!token) {
                token = await fetchInstrumentToken(currentSymbol);
            }

            // Calculate limit for pagination
            const currentLength = isLoadMore ? candles.length : 0;
            const newLimit = currentLength + limit;

            console.log(`Loading candles: limit=${newLimit}, isLoadMore=${isLoadMore}`);

            const data = await tradingService.getCandles(
                currentSymbol,
                currentTimeframe,
                newLimit,
                token || undefined
            );

            if (data && data.length > 0) {
                setCandles(data);
                console.log(`Loaded ${data.length} candles for ${currentSymbol}`);
            }
        } catch (error) {
            console.error('Failed to load candles:', error);
        } finally {
            if (!isLoadMore) setIsLoadingCandles(false);
        }
    };

    const handleLoadMore = () => {
        console.log('Loading more historical data...');
        loadCandles(400, true);
    };

    // Fetch options chain data
    const fetchOptionsChain = async () => {
        try {
            const backendSymbol = currentSymbol.includes('NIFTY') ? 'NIFTY' : 'BANKNIFTY';
            const response = await tradingService.getOptionsChain(backendSymbol);

            // Get all unique strikes and sort them
            const allStrikes = new Set<number>();
            response.ce_options?.forEach((opt: any) => allStrikes.add(opt.strike));
            response.pe_options?.forEach((opt: any) => allStrikes.add(opt.strike));
            const sortedStrikes = Array.from(allStrikes).sort((a, b) => a - b);

            // Find ATM strike index (closest to spot price)
            let atmIndex = 0;
            let minDiff = Number.MAX_VALUE;

            sortedStrikes.forEach((strike, index) => {
                const diff = Math.abs(strike - response.spot_price);
                if (diff < minDiff) {
                    minDiff = diff;
                    atmIndex = index;
                }
            });

            // Filter strikes (10 above and 10 below ATM)
            const startIdx = Math.max(0, atmIndex - 10);
            const endIdx = Math.min(sortedStrikes.length, atmIndex + 11);
            const allowedStrikes = new Set(sortedStrikes.slice(startIdx, endIdx));

            // Transform and filter API data
            const calls = response.ce_options
                .filter((opt: any) => allowedStrikes.has(opt.strike))
                .map((opt: any) => ({
                    symbol: opt.tradingsymbol,
                    strike_price: opt.strike,
                    expiry_date: opt.expiry,
                    option_type: 'CE',
                    ltp: opt.ltp,
                    open_interest: opt.oi,
                    change_percent: opt.change,
                    volume: opt.volume,
                    instrument_token: opt.instrument_token,
                }));

            const puts = response.pe_options
                .filter((opt: any) => allowedStrikes.has(opt.strike))
                .map((opt: any) => ({
                    symbol: opt.tradingsymbol,
                    strike_price: opt.strike,
                    expiry_date: opt.expiry,
                    option_type: 'PE',
                    ltp: opt.ltp,
                    open_interest: opt.oi,
                    change_percent: opt.change,
                    volume: opt.volume,
                    instrument_token: opt.instrument_token,
                }));

            setOptionsData({ calls, puts });
        } catch (error) {
            console.error('Failed to fetch options chain:', error);
        }
    };


    // Initialize WebSocket connection
    useEffect(() => {
        const token = authService.getToken();
        if (!token) return;

        websocketService
            .connect(token)
            .then(() => {
                setWsConnected(true);
                websocketService.subscribe(currentSymbol);
            })
            .catch((error) => {
                // Only log if it's not a "connection in progress" error
                if (!error.message?.includes('already in progress')) {
                    console.error('WebSocket connection failed:', error);
                }
            });

        // Handle price updates
        const unsubscribePrice = websocketService.on(WSMessageType.PRICE_UPDATE, (data) => {
            if (data.symbol === currentSymbol) {
                setCurrentPrice(data.price);

                // Update last candle with new price
                if (candles.length > 0) {
                    const lastCandle = candles[candles.length - 1];
                    const updatedCandle = {
                        ...lastCandle,
                        close: data.price,
                        high: Math.max(lastCandle.high, data.price),
                        low: Math.min(lastCandle.low, data.price),
                        volume: (lastCandle.volume || 0) + (data.volume || 0),
                    };
                    updateCandle(updatedCandle);
                }
            }
        });

        return () => {
            unsubscribePrice();
            websocketService.disconnect();
        };
    }, [currentSymbol]);

    // Load candles when symbol or timeframe changes
    useEffect(() => {
        loadCandles();
    }, [currentSymbol, currentTimeframe]);

    // Subscribe to new symbol when changed
    useEffect(() => {
        if (wsConnected) {
            websocketService.subscribe(currentSymbol);
        }
    }, [currentSymbol, wsConnected]);

    return (
        <DashboardLayout title="NIFTY Trading">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">NIFTY Trading</h1>
                        <p className="text-gray-400">
                            Practice trading with real-time market data • Paper Trading Mode
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div
                            className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                                }`}
                        />
                        <span className="text-sm text-gray-400">
                            {wsConnected ? 'Live Data' : 'Disconnected'}
                        </span>
                    </div>
                </div>

                {/* Symbol Tabs */}
                <SymbolTabs selected={currentSymbol} onChange={setCurrentSymbol} />

                {/* Chart / Option Chain Tabs */}
                <div className="flex gap-6 border-b border-gray-700">
                    <button
                        onClick={() => setActiveTab('chart')}
                        className={`py-3 px-1 text-sm font-medium transition-colors ${activeTab === 'chart'
                            ? 'text-blue-400 border-b-2 border-blue-400'
                            : 'text-gray-400 hover:text-gray-300'
                            }`}
                    >
                        Chart
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('optionchain');
                            fetchOptionsChain();
                        }}
                        className={`py-3 px-1 text-sm font-medium transition-colors ${activeTab === 'optionchain'
                            ? 'text-orange-400 border-b-2 border-orange-400'
                            : 'text-gray-400 hover:text-gray-300'
                            }`}
                    >
                        Option chain
                    </button>
                </div>

                {/* Main Trading Interface */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Chart/Option Chain Section (3 columns) */}
                    <div className="lg:col-span-3 space-y-4">
                        {activeTab === 'chart' ? (
                            <>
                                {/* Timeframe Selector */}
                                <div className="flex items-center justify-between">
                                    <TimeframeSelector
                                        selected={currentTimeframe}
                                        onChange={setCurrentTimeframe}
                                    />

                                    {/* Current Price Display */}
                                    <div className="bg-gray-800 px-6 py-3 rounded-lg">
                                        <p className="text-sm text-gray-400 mb-1">Current Price</p>
                                        <p className="text-2xl font-bold text-white">
                                            ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>

                                {/* Chart */}
                                {isLoadingCandles ? (
                                    <div className="bg-gray-800 rounded-lg flex items-center justify-center" style={{ height: '600px' }}>
                                        <Loader text="Loading chart data..." />
                                    </div>
                                ) : (
                                    <KlineChart
                                        data={candles}
                                        symbol={currentSymbol}
                                        showVolume={false} // NIFTY index doesn't have volume
                                        height={600}
                                        onLoadMore={handleLoadMore}
                                        isNiftyChart={true} // NIFTY is view-only, no Buy/Sell
                                    />
                                )}

                                {/* Orders History Button */}
                                <div className="flex justify-center">
                                    <OrdersHistory refreshTrigger={orderRefreshTrigger} />
                                </div>
                            </>
                        ) : (
                            /* Option Chain View */
                            <OptionsChain
                                spotPrice={currentPrice}
                                calls={optionsData.calls}
                                puts={optionsData.puts}
                            />
                        )}
                    </div>

                    {/* Open Positions Panel (1 column) */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Positions Table */}
                        <PositionsTable />

                        {/* Quick Info Card */}
                        <div className="bg-gray-800 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-white mb-3">Quick Info</h3>
                            <div className="text-sm text-gray-400 space-y-2">
                                <p>• NIFTY 50 is an index (view-only)</p>
                                <p>• Trade options from Options Chain</p>
                                <p>• Monitor positions here in real-time</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trading Tips */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <h3 className="text-blue-400 font-semibold mb-2">💡 Paper Trading</h3>
                        <p className="text-sm text-gray-400">
                            All trades are simulated with virtual money. Perfect for learning without risk.
                        </p>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                        <h3 className="text-green-400 font-semibold mb-2">📊 Real Data</h3>
                        <p className="text-sm text-gray-400">
                            Live market data from Zerodha Kite Connect API. Practice with real conditions.
                        </p>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                        <h3 className="text-purple-400 font-semibold mb-2">🏆 Compete</h3>
                        <p className="text-sm text-gray-400">
                            Join tournaments and compete for real money prizes based on your performance.
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
