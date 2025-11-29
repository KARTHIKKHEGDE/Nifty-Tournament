import { create } from 'zustand';

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
    setShowChart: (show: boolean) => void;
    initializeWatchlist: () => void;
}

export const useSymbolStore = create<SymbolStore>((set) => ({
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
                {
                    symbol: 'SENSEX',
                    displayName: 'SENSEX',
                    ltp: 80500.00,
                    change: 200.75,
                    changePercent: 0.25,
                    instrumentToken: 265,
                },
            ],
        }),
}));
