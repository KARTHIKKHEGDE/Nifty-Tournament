import { create } from 'zustand';
import api from '../services/api';

export interface WatchlistSymbol {
    symbol: string;
    displayName: string;
    ltp: number;
    change: number;
    changePercent: number;
    instrumentToken?: number;
}

interface SymbolStore {
    selectedSymbol: WatchlistSymbol | null;
    watchlist: WatchlistSymbol[];
    showChart: boolean;

    // Actions
    setSelectedSymbol: (symbol: WatchlistSymbol | null) => void;
    updateWatchlistPrice: (symbol: string, ltp: number, change: number, changePercent: number) => void;
    addToWatchlist: (symbol: WatchlistSymbol) => void;
    removeFromWatchlist: (symbol: string) => void;
    setShowChart: (show: boolean) => void;
    initializeWatchlist: () => void;
    fetchWatchlistPrices: () => Promise<void>;
}

export const useSymbolStore = create<SymbolStore>((set, get) => ({
    selectedSymbol: null,
    watchlist: [],
    showChart: false,

    setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),

    updateWatchlistPrice: (symbol, ltp, change, changePercent) =>
        set((state) => ({
            watchlist: state.watchlist.map((item) =>
                item.symbol === symbol
                    ? { ...item, ltp, change, changePercent }
                    : item
            ),
        })),

    addToWatchlist: (symbol) =>
        set((state) => {
            // Check if symbol already exists
            const exists = state.watchlist.some((item) => item.symbol === symbol.symbol);
            if (exists) {
                return state;
            }
            return {
                watchlist: [...state.watchlist, symbol],
            };
        }),

    removeFromWatchlist: (symbol) =>
        set((state) => ({
            watchlist: state.watchlist.filter((item) => item.symbol !== symbol),
        })),

    setShowChart: (show) => set({ showChart: show }),

    initializeWatchlist: () =>
        set({
            watchlist: [
                {
                    symbol: 'NIFTY 50',
                    displayName: 'NIFTY 50',
                    ltp: 24500.00,
                    change: 125.50,
                    changePercent: 0.52,
                    instrumentToken: 256265,
                },
                {
                    symbol: 'BANKNIFTY',
                    displayName: 'BANKNIFTY',
                    ltp: 51200.00,
                    change: -85.25,
                    changePercent: -0.17,
                    instrumentToken: 260105,
                },
            ],
        }),

    fetchWatchlistPrices: async () => {
        try {
            const watchlist = get().watchlist;

            const pricePromises = watchlist.map(async (item) => {
                try {
                    if (!item.instrumentToken) return null;

                    // Fetch 2 daily candles (today and yesterday)
                    const response = await api.get('/api/candles/', {
                        params: {
                            symbol: item.symbol,
                            instrument_token: item.instrumentToken,
                            timeframe: 'day',
                            limit: 2
                        }
                    });

                    const candles = response.data;
                    if (candles && candles.length >= 2) {
                        const todayCandle = candles[candles.length - 1];
                        const yesterdayCandle = candles[candles.length - 2];

                        // Check if market is open (9:15 AM to 3:30 PM IST)
                        const now = new Date();
                        const hours = now.getHours();
                        const minutes = now.getMinutes();
                        const currentTime = hours * 60 + minutes;
                        const marketOpen = 9 * 60 + 15;  // 9:15 AM
                        const marketClose = 15 * 60 + 30; // 3:30 PM

                        // Check if todayCandle is actually from today
                        const candleDate = new Date(todayCandle.timestamp);
                        const isToday = candleDate.getDate() === now.getDate() &&
                            candleDate.getMonth() === now.getMonth() &&
                            candleDate.getFullYear() === now.getFullYear();

                        const isMarketOpen = isToday && currentTime >= marketOpen && currentTime <= marketClose;

                        let ltp: number;
                        let change: number;
                        let changePercent: number;

                        if (isMarketOpen) {
                            // MARKET OPEN & DATA IS FROM TODAY: Current price vs yesterday's close
                            ltp = todayCandle.close;
                            change = ltp - yesterdayCandle.close;
                            changePercent = (change / yesterdayCandle.close) * 100;
                        } else {
                            // MARKET CLOSED or HOLIDAY: Today's close vs yesterday's close
                            ltp = todayCandle.close;
                            change = todayCandle.close - yesterdayCandle.close;
                            changePercent = (change / yesterdayCandle.close) * 100;
                        }

                        return { symbol: item.symbol, ltp, change, changePercent };
                    } else if (candles && candles.length === 1) {
                        // Fallback: only today's data
                        const todayCandle = candles[0];
                        const ltp = todayCandle.close;
                        const change = ltp - todayCandle.open;
                        const changePercent = (change / todayCandle.open) * 100;
                        return { symbol: item.symbol, ltp, change, changePercent };
                    }
                    return null;
                } catch (error) {
                    console.error(`Failed to fetch ${item.symbol}:`, error);
                    return null;
                }
            });

            const prices = await Promise.all(pricePromises);

            prices.forEach((priceData) => {
                if (priceData) {
                    get().updateWatchlistPrice(
                        priceData.symbol,
                        priceData.ltp,
                        priceData.change,
                        priceData.changePercent
                    );
                }
            });
        } catch (error) {
            console.error('❌ Failed to fetch watchlist:', error);
        }
    },
}));
