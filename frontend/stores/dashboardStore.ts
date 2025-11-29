import { create } from 'zustand';

export interface TradeMetrics {
    profitFactor: number;
    totalTrades: number;
    winRate: number;
    winningTrades: number;
    losingTrades: number;
    avgWinPerTrade: number;
    avgLossPerTrade: number;
    maxDrawdown: number;
    expectancyPerTrade: number;
}

interface DashboardStore {
    equity: number;
    marginAvailable: number;
    openingBalance: number;
    tradeMetrics: TradeMetrics;
    isLoadingMetrics: boolean;

    // Actions
    setEquity: (equity: number) => void;
    setMarginAvailable: (margin: number) => void;
    setOpeningBalance: (balance: number) => void;
    setTradeMetrics: (metrics: TradeMetrics) => void;
    setLoadingMetrics: (loading: boolean) => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
    equity: 100000,
    marginAvailable: 100000,
    openingBalance: 100000,
    tradeMetrics: {
        profitFactor: 0,
        totalTrades: 0,
        winRate: 0,
        winningTrades: 0,
        losingTrades: 0,
        avgWinPerTrade: 0,
        avgLossPerTrade: 0,
        maxDrawdown: 0,
        expectancyPerTrade: 0,
    },
    isLoadingMetrics: false,

    setEquity: (equity) => set({ equity }),
    setMarginAvailable: (margin) => set({ marginAvailable: margin }),
    setOpeningBalance: (balance) => set({ openingBalance: balance }),
    setTradeMetrics: (metrics) => set({ tradeMetrics: metrics }),
    setLoadingMetrics: (loading) => set({ isLoadingMetrics: loading }),
}));
