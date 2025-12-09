import { useState, useCallback, useEffect, useRef } from 'react';
import api from '../services/api';
import { CandleData, TickData } from '../types';
import wsService from '../services/websocket';
import { getLocalStorage } from '../utils/formatters';
import { CandleBuilder, getTimeframeMinutes } from '../utils/candleBuilder';

interface UseChartDataOptions {
    autoRefresh?: boolean;
    refreshInterval?: number;
}

export function useChartData(options: UseChartDataOptions = {}) {
    const { autoRefresh = false, refreshInterval = 30000 } = options;

    const [candles, setCandles] = useState<CandleData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const candleBuilderRef = useRef<CandleBuilder | null>(null);
    const currentSymbolRef = useRef<string>('');
    const currentTimeframeRef = useRef<string>('5m');
    const currentInstrumentTokenRef = useRef<number | undefined>(undefined);

    const onCandleComplete = useCallback((candle: CandleData) => {
        console.log(`🕯️ [useChartData] Candle completed:`, candle);
        setCandles(prev => [...prev, candle]);
    }, []);

    const fetchCandles = useCallback(async (
        symbol: string,
        instrumentToken: number,
        timeframe: string = '5minute',
        limit: number = 200
    ) => {
        setIsLoading(true);
        setError(null);

        try {
            console.log(`🔄 [useChartData] Fetching ${limit} candles for ${symbol}`);

            const response = await api.get('/api/candles/', {
                params: {
                    symbol,
                    instrument_token: instrumentToken,
                    timeframe,
                    limit
                }
            });

            console.log(`✅ [useChartData] Received ${response.data.length} candles`);

            setCandles(response.data);

            // Store for WebSocket subscription
            currentSymbolRef.current = symbol;
            currentTimeframeRef.current = timeframe;
            currentInstrumentTokenRef.current = instrumentToken;

            // Initialize candle builder for real-time updates
            const timeframeMinutes = getTimeframeMinutes(timeframe);
            candleBuilderRef.current = new CandleBuilder(
                timeframeMinutes,
                onCandleComplete
            );

            return response.data;
        } catch (err: any) {
            setError(err.message);
            console.error('❌ [useChartData] Fetch error:', err);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [onCandleComplete]);

    // Subscribe to WebSocket ticks for real-time updates
    useEffect(() => {
        if (!currentSymbolRef.current || !candleBuilderRef.current) {
            console.log('⏸️ [useChartData] Skipping WebSocket setup: missing symbol or candle builder');
            return;
        }


        const symbol = currentSymbolRef.current;
        const instrumentToken = currentInstrumentTokenRef.current;
        let unsubscribeFn: (() => void) | null = null;
        let subscribedUnsubscribe: (() => void) | null = null;

        console.log('📡 [useChartData] Setting up WebSocket for:', symbol);

        try {
            // Read token from local storage and pass to connect()
            const token = getLocalStorage<string>('access_token', '');
            console.log(`🔑 [useChartData] Access token retrieved: ${token ? 'YES (' + token.substring(0, 20) + '...)' : 'NO'}`);

            if (!token) {
                console.error('❌ [useChartData] No access_token found in localStorage — cannot open authenticated WebSocket.');
                console.log('💡 [useChartData] Please log in to establish WebSocket connection');
                return;
            }

            if (!instrumentToken) {
                console.error('❌ [useChartData] No instrument token available for subscription');
                return;
            }

            // Connect WebSocket with token in query string
            console.log(`🔌 [useChartData] Connecting WebSocket with token...`);
            wsService.connect(token);

            console.log(`📊 [useChartData] WebSocket state: ${wsService.getConnectionState()}`);

            // Subscribe to symbol (will be queued if socket not open yet)
            console.log(`📤 [useChartData] Subscribing to symbol: ${symbol}, instrument: ${instrumentToken}`);
            wsService.subscribe(symbol, instrumentToken);


            // Listen for subscription confirmation
            subscribedUnsubscribe = wsService.on('subscribed', (data: any) => {
                console.log(`✅ [useChartData] Subscription confirmed:`, data);
            });

            // Listen for tick updates
            console.log(`👂 [useChartData] Setting up tick listener for: ${symbol}`);
            const tickUnsubscribe = wsService.on('tick', (tickData: TickData) => {
                console.log(`📈 [useChartData] Tick received:`, tickData);

                if (tickData.symbol === symbol && candleBuilderRef.current) {
                    console.log(`✅ [useChartData] Processing tick for ${symbol}: price=${tickData.price}, volume=${tickData.volume}`);

                    candleBuilderRef.current.processTick(tickData);
                    const currentCandle = candleBuilderRef.current.getCurrentCandle();

                    if (currentCandle) {
                        console.log(`🕯️ [useChartData] Current candle updated:`, currentCandle);

                        setCandles(prev => {
                            const lastCandle = prev[prev.length - 1];
                            if (lastCandle && lastCandle.timestamp === currentCandle.timestamp) {
                                console.log(`🔄 [useChartData] Updating existing candle at ${currentCandle.timestamp}`);
                                return [...prev.slice(0, -1), currentCandle];
                            } else {
                                console.log(`➕ [useChartData] Appending new candle at ${currentCandle.timestamp}`);
                                return [...prev, currentCandle];
                            }
                        });
                    }
                } else {
                    if (tickData.symbol !== symbol) {
                        console.log(`⚠️ [useChartData] Tick for different symbol: ${tickData.symbol} (expected: ${symbol})`);
                    }
                    if (!candleBuilderRef.current) {
                        console.error(`❌ [useChartData] Candle builder not initialized`);
                    }
                }
            });
            
            // Listen for completed candles from backend
            const candleUnsubscribe = wsService.on('candle', (data: any) => {
                console.log(`🕯️ [useChartData] Completed candle received from backend:`, data);
                if (data.symbol === symbol && data.candle) {
                    setCandles(prev => [...prev, data.candle]);
                }
            });
            
            // Listen for real-time candle updates from backend
            const candleUpdateUnsubscribe = wsService.on('candle_update', (data: any) => {
                console.log(`🔄 [useChartData] Candle update received from backend:`, data);
                if (data.symbol === symbol && data.candle) {
                    setCandles(prev => {
                        const lastCandle = prev[prev.length - 1];
                        if (lastCandle && lastCandle.timestamp === data.candle.timestamp) {
                            return [...prev.slice(0, -1), data.candle];
                        } else {
                            return [...prev, data.candle];
                        }
                    });
                }
            });
            
            unsubscribeFn = () => {
                tickUnsubscribe();
                candleUnsubscribe();
                candleUpdateUnsubscribe();
            };

            console.log(`✅ [useChartData] WebSocket setup complete for: ${symbol}`);

        } catch (err) {
            console.error('❌ [useChartData] WebSocket subscription error:', err);
        }

        return () => {
            console.log(`🧹 [useChartData] Cleaning up WebSocket subscription for: ${symbol}`);
            try {
                if (symbol) {
                    console.log(`📤 [useChartData] Unsubscribing from: ${symbol}`);
                    wsService.unsubscribe(symbol, instrumentToken);
                }
                if (subscribedUnsubscribe) {
                    console.log(`🔇 [useChartData] Removing subscribed listener`);
                    subscribedUnsubscribe();
                }
                if (unsubscribeFn) {
                    console.log(`🔇 [useChartData] Removing tick listener`);
                    unsubscribeFn();
                }
                console.log(`✅ [useChartData] Cleanup complete`);
            } catch (err) {
                console.error('❌ [useChartData] Cleanup error:', err);
            }
        };
    }, []);

    const refreshCandles = useCallback(async (
        symbol: string,
        instrumentToken: number,
        timeframe: string = '5minute',
        limit: number = 200
    ) => {
        console.log('🔄 [useChartData] Auto-refreshing candles...');
        return fetchCandles(symbol, instrumentToken, timeframe, limit);
    }, [fetchCandles]);

    return {
        candles,
        isLoading,
        error,
        fetchCandles,
        refreshCandles,
        setCandles,
    };
}
