import { create } from 'zustand';
import { TickData, CandleData, Timeframe, PaperOrder, PaperPosition } from '../types';

interface TradingStore {
    // Current symbol and timeframe
    currentSymbol: string;
    currentTimeframe: Timeframe;

    // Price data
    currentPrice: number;
    ticks: TickData[];
    candles: CandleData[];

    // Orders and positions
    orders: PaperOrder[];
    positions: PaperPosition[];

    // Portfolio
    portfolioValue: number;
    cashBalance: number;
    totalPnL: number;
    dayPnL: number;

    // Loading states
    isLoadingCandles: boolean;
    isLoadingOrders: boolean;
    isLoadingPositions: boolean;

    // Order refresh trigger
    orderRefreshTrigger: number;

    // Actions
    setCurrentSymbol: (symbol: string) => void;
    setCurrentTimeframe: (timeframe: Timeframe) => void;
    setCurrentPrice: (price: number) => void;
    addTick: (tick: TickData) => void;
    setCandles: (candles: CandleData[]) => void;
    updateCandle: (candle: CandleData) => void;
    setOrders: (orders: PaperOrder[]) => void;
    addOrder: (order: PaperOrder) => void;
    updateOrder: (orderId: number, updates: Partial<PaperOrder>) => void;
    setPositions: (positions: PaperPosition[]) => void;
    updatePosition: (positionId: number, updates: Partial<PaperPosition>) => void;
    setPortfolio: (data: {
        portfolioValue: number;
        cashBalance: number;
        totalPnL: number;
        dayPnL: number;
    }) => void;
    triggerOrderRefresh: () => void;
    reset: () => void;
}

export const useTradingStore = create<TradingStore>((set) => ({
    // Initial state
    currentSymbol: 'NIFTY 50',
    currentTimeframe: '5m',
    currentPrice: 0,
    ticks: [],
    candles: [],
    orders: [],
    positions: [],
    portfolioValue: 0,
    cashBalance: 0,
    totalPnL: 0,
    dayPnL: 0,
    isLoadingCandles: false,
    isLoadingOrders: false,
    isLoadingPositions: false,
    orderRefreshTrigger: 0,

    // Actions
    setCurrentSymbol: (symbol) => set({ currentSymbol: symbol }),

    setCurrentTimeframe: (timeframe) => set({ currentTimeframe: timeframe }),

    setCurrentPrice: (price) => set({ currentPrice: price }),

    addTick: (tick) =>
        set((state) => ({
            ticks: [...state.ticks.slice(-999), tick], // Keep last 1000 ticks
            currentPrice: tick.price,
        })),

    setCandles: (candles) =>
        set({ candles, isLoadingCandles: false }),

    updateCandle: (candle) =>
        set((state) => {
            const candles = [...state.candles];
            const lastCandle = candles[candles.length - 1];

            if (lastCandle && lastCandle.timestamp === candle.timestamp) {
                // Update last candle
                candles[candles.length - 1] = candle;
            } else {
                // Add new candle
                candles.push(candle);
            }

            return { candles };
        }),

    setOrders: (orders) =>
        set({ orders, isLoadingOrders: false }),

    addOrder: (order) =>
        set((state) => ({
            orders: [order, ...state.orders],
        })),

    updateOrder: (orderId, updates) =>
        set((state) => ({
            orders: state.orders.map((order) =>
                order.id === orderId ? { ...order, ...updates } : order
            ),
        })),

    setPositions: (positions) =>
        set({ positions, isLoadingPositions: false }),

    updatePosition: (positionId, updates) =>
        set((state) => ({
            positions: state.positions.map((position) =>
                position.id === positionId ? { ...position, ...updates } : position
            ),
        })),

    setPortfolio: (data) =>
        set({
            portfolioValue: data.portfolioValue,
            cashBalance: data.cashBalance,
            totalPnL: data.totalPnL,
            dayPnL: data.dayPnL,
        }),

    triggerOrderRefresh: () =>
        set((state) => ({
            orderRefreshTrigger: state.orderRefreshTrigger + 1,
        })),

    reset: () =>
        set({
            currentSymbol: 'NIFTY 50',
            currentTimeframe: '5m',
            currentPrice: 0,
            ticks: [],
            candles: [],
            orders: [],
            positions: [],
            portfolioValue: 0,
            cashBalance: 0,
            totalPnL: 0,
            dayPnL: 0,
        }),
}));
