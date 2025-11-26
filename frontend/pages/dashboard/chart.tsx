import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { X } from 'lucide-react';
import KlineChart from '../../components/charts/KlineChart';
import OrderPanel from '../../components/trading/OrderPanel';
import { CandleData, OrderSide, WSMessageType } from '../../types';
import api from '../../services/api';
import websocketService from '../../services/websocketService';
import authService from '../../services/authService';

export default function ChartPage() {
    const router = useRouter();
    const { symbol, instrument_token, strike, ltp, type, oi, volume, change } = router.query;
    const [candles, setCandles] = useState<CandleData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [windowHeight, setWindowHeight] = useState(800);
    const [wsConnected, setWsConnected] = useState(false);
    const currentCandleRef = useRef<CandleData | null>(null);
    const candleIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Set window height on client side
        setWindowHeight(window.innerHeight);

        const handleResize = () => {
            setWindowHeight(window.innerHeight);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchCandles = async () => {
            if (!symbol || !instrument_token) return;

            setIsLoading(true);
            try {
                const response = await api.get(
                    `/api/candles/?symbol=${symbol}&instrument_token=${instrument_token}&timeframe=5minute&limit=400`
                );
                setCandles(response.data);
            } catch (error) {
                console.error('Error fetching candles:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (router.isReady) {
            fetchCandles();
        }
    }, [router.isReady, symbol, instrument_token]);

    // WebSocket connection and live candle updates
    useEffect(() => {
        if (!router.isReady || !symbol) return;

        const token = authService.getToken();
        if (!token) {
            console.warn('No auth token available for WebSocket connection');
            return;
        }

        let unsubscribeTick: (() => void) | null = null;
        let unsubscribePrice: (() => void) | null = null;

        const connectWebSocket = async () => {
            try {
                console.log('Connecting to WebSocket for live candles...');
                await websocketService.connect(token);
                setWsConnected(true);
                console.log('WebSocket connected, subscribing to:', symbol);

                // Subscribe to symbol
                websocketService.subscribe(symbol as string);

                // Handle tick data for live candle formation
                unsubscribeTick = websocketService.on(WSMessageType.TICK, (data: any) => {
                    console.log('Received tick data:', data);
                    updateLiveCandle(data);
                });

                // Handle price updates
                unsubscribePrice = websocketService.on(WSMessageType.PRICE_UPDATE, (data: any) => {
                    console.log('Received price update:', data);
                    if (data.symbol === symbol) {
                        updateLiveCandle({
                            last_price: data.price,
                            volume: data.volume,
                            timestamp: new Date(data.timestamp).getTime(),
                        });
                    }
                });

                console.log('Subscribed to live updates for:', symbol);
            } catch (error) {
                console.error('WebSocket connection failed:', error);
                setWsConnected(false);
            }
        };

        connectWebSocket();

        // Setup candle interval (5 minutes = 300000ms)
        candleIntervalRef.current = setInterval(() => {
            if (currentCandleRef.current) {
                console.log('Creating new candle, closing current candle');
                // Push current candle to array and start a new one
                setCandles(prev => [...prev, currentCandleRef.current!]);
                currentCandleRef.current = null;
            }
        }, 300000); // 5 minutes

        return () => {
            if (unsubscribeTick) unsubscribeTick();
            if (unsubscribePrice) unsubscribePrice();
            if (symbol) {
                websocketService.unsubscribe(symbol as string);
            }
            if (candleIntervalRef.current) {
                clearInterval(candleIntervalRef.current);
            }
        };
    }, [router.isReady, symbol]);

    const updateLiveCandle = (tickData: any) => {
        const price = tickData.last_price || tickData.price;
        const tickVolume = tickData.volume || 0;
        const timestamp = tickData.timestamp || Date.now();

        setCandles(prevCandles => {
            if (prevCandles.length === 0) {
                // Create first candle
                const newCandle: CandleData = {
                    timestamp,
                    open: price,
                    high: price,
                    low: price,
                    close: price,
                    volume: tickVolume,
                };
                currentCandleRef.current = newCandle;
                return [newCandle];
            }

            // Update last candle
            const updatedCandles = [...prevCandles];
            const lastCandle = updatedCandles[updatedCandles.length - 1];

            // Check if we should update the last candle or create a new one
            const candleAge = timestamp - lastCandle.timestamp;
            const fiveMinutes = 5 * 60 * 1000;

            if (candleAge < fiveMinutes) {
                // Update existing candle
                const updatedCandle: CandleData = {
                    ...lastCandle,
                    high: Math.max(lastCandle.high, price),
                    low: Math.min(lastCandle.low, price),
                    close: price,
                    volume: (lastCandle.volume || 0) + tickVolume,
                };
                updatedCandles[updatedCandles.length - 1] = updatedCandle;
                currentCandleRef.current = updatedCandle;
            } else {
                // Create new candle
                const newCandle: CandleData = {
                    timestamp,
                    open: price,
                    high: price,
                    low: price,
                    close: price,
                    volume: tickVolume,
                };
                updatedCandles.push(newCandle);
                currentCandleRef.current = newCandle;
            }

            return updatedCandles;
        });
    };

    if (!router.isReady) {
        return null;
    }

    const currentPrice = parseFloat(ltp as string) || 0;
    const strikePrice = parseFloat(strike as string) || 0;
    const openInterest = parseFloat(oi as string) || 0;
    const volumeValue = parseFloat(volume as string) || 0;
    const changePercent = parseFloat(change as string) || 0;

    // Exness color palette
    const exnessColors = {
        background: '#0a0e27',
        cardBg: '#131722',
        border: '#2a2e39',
        textPrimary: '#d1d4dc',
        textSecondary: '#787b86',
        bullish: '#26a69a',
        bearish: '#ef5350',
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: exnessColors.background }}>
            {/* Header */}
            <div
                className="border-b px-6 py-4 flex items-center justify-between"
                style={{
                    backgroundColor: exnessColors.cardBg,
                    borderColor: exnessColors.border
                }}
            >
                <div>
                    <h2 className="text-xl font-bold" style={{ color: exnessColors.textPrimary }}>
                        {symbol}
                    </h2>
                    <p className="text-sm" style={{ color: exnessColors.textSecondary }}>
                        Strike: ₹{strikePrice.toLocaleString('en-IN')} •
                        LTP: ₹{currentPrice.toFixed(2)} •
                        {type === 'CE' ? 'Call' : 'Put'} Option
                        {wsConnected && (
                            <span className="ml-2" style={{ color: exnessColors.bullish }}>
                                ● Live
                            </span>
                        )}
                    </p>
                </div>
                <button
                    onClick={() => window.close()}
                    className="p-2 rounded-lg transition-colors hover:bg-white/5"
                    title="Close"
                >
                    <X className="w-6 h-6" style={{ color: exnessColors.textSecondary }} />
                </button>
            </div>

            {/* Content - Chart + Order Panel Side by Side */}
            <div className="flex-1 flex overflow-hidden">
                {/* Chart Section - 70% width */}
                <div className="flex-1 p-4 overflow-auto" style={{ backgroundColor: exnessColors.background }}>
                    {isLoading ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: exnessColors.bullish }}></div>
                                <p style={{ color: exnessColors.textSecondary }}>Loading chart...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full">
                            <KlineChart
                                data={candles.length > 0 ? candles : [
                                    {
                                        timestamp: Date.now() - 3600000,
                                        open: currentPrice * 0.98,
                                        high: currentPrice * 1.02,
                                        low: currentPrice * 0.96,
                                        close: currentPrice,
                                        volume: volumeValue,
                                    },
                                ]}
                                symbol={symbol as string}
                                showVolume={true}
                                height={windowHeight - 100}
                            />
                        </div>
                    )}
                </div>

                {/* Order Panel Section - 30% width */}
                <div
                    className="w-[400px] border-l overflow-auto"
                    style={{
                        backgroundColor: exnessColors.cardBg,
                        borderColor: exnessColors.border
                    }}
                >
                    <div className="p-4">
                        <OrderPanel
                            symbol={symbol as string}
                            currentPrice={currentPrice}
                            instrumentType={type as 'CE' | 'PE'}
                            initialSide={OrderSide.BUY}
                        />

                        {/* Option Details */}
                        <div
                            className="mt-6 rounded-lg p-4"
                            style={{ backgroundColor: exnessColors.background }}
                        >
                            <h3 className="text-sm font-semibold mb-4" style={{ color: exnessColors.textPrimary }}>
                                Option Details
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm" style={{ color: exnessColors.textSecondary }}>
                                        Strike Price
                                    </span>
                                    <span className="text-sm font-semibold" style={{ color: exnessColors.textPrimary }}>
                                        ₹{strikePrice.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm" style={{ color: exnessColors.textSecondary }}>
                                        Option Type
                                    </span>
                                    <span
                                        className="text-sm font-semibold"
                                        style={{ color: type === 'CE' ? exnessColors.bullish : exnessColors.bearish }}
                                    >
                                        {type === 'CE' ? 'Call (CE)' : 'Put (PE)'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm" style={{ color: exnessColors.textSecondary }}>
                                        Open Interest
                                    </span>
                                    <span className="text-sm font-semibold" style={{ color: exnessColors.textPrimary }}>
                                        {openInterest.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm" style={{ color: exnessColors.textSecondary }}>
                                        Volume
                                    </span>
                                    <span className="text-sm font-semibold" style={{ color: exnessColors.textPrimary }}>
                                        {volumeValue.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm" style={{ color: exnessColors.textSecondary }}>
                                        Change %
                                    </span>
                                    <span
                                        className="text-sm font-semibold"
                                        style={{
                                            color: changePercent > 0 ? exnessColors.bullish :
                                                changePercent < 0 ? exnessColors.bearish : exnessColors.textSecondary
                                        }}
                                    >
                                        {changePercent > 0 ? '+' : ''}{changePercent.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Trading Tips */}
                        <div
                            className="mt-6 rounded-lg p-4"
                            style={{ backgroundColor: exnessColors.background }}
                        >
                            <h3 className="text-sm font-semibold mb-3" style={{ color: exnessColors.textPrimary }}>
                                Quick Tips
                            </h3>
                            <div className="space-y-2 text-xs" style={{ color: exnessColors.textSecondary }}>
                                <p>• Use indicators to analyze price trends</p>
                                <p>• Set stop loss to manage risk</p>
                                <p>• Monitor volume for trade confirmation</p>
                                <p>• Check Greeks before trading</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
