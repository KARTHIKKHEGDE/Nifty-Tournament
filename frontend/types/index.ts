// User Types
export interface User {
    id: number;
    email: string;
    username: string;
    is_admin: boolean;
    created_at: string;
}

export interface UserWithWallet extends User {
    wallet?: Wallet;
}

// Wallet Types
export interface Wallet {
    id: number;
    user_id: number;
    balance: number;
    currency: string;
    created_at: string;
    updated_at: string;
}

// Order Types
export enum OrderType {
    MARKET = 'MARKET',
    LIMIT = 'LIMIT',
    STOP_LOSS = 'STOP_LOSS',
    STOP_LOSS_LIMIT = 'STOP_LOSS_LIMIT'
}

export enum OrderSide {
    BUY = 'BUY',
    SELL = 'SELL'
}

export enum OrderStatus {
    PENDING = 'PENDING',
    OPEN = 'OPEN',
    FILLED = 'FILLED',
    PARTIALLY_FILLED = 'PARTIALLY_FILLED',
    CANCELLED = 'CANCELLED',
    REJECTED = 'REJECTED'
}

export interface PaperOrder {
    id: number;
    user_id: number;
    symbol: string;
    instrument_type: 'INDEX' | 'CE' | 'PE';
    order_type: OrderType;
    side: OrderSide;
    quantity: number;
    price?: number;
    stop_loss?: number;
    take_profit?: number;
    filled_quantity: number;
    average_price?: number;
    status: OrderStatus;
    created_at: string;
    updated_at: string;
}

// Position Types
export interface PaperPosition {
    id: number;
    user_id: number;
    symbol: string;
    instrument_type: 'INDEX' | 'CE' | 'PE';
    quantity: number;
    average_price: number;
    current_price?: number;
    unrealized_pnl?: number;
    realized_pnl: number;
    created_at: string;
    updated_at: string;
}

// Tournament Types
export enum TournamentStatus {
    UPCOMING = 'UPCOMING',
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

export interface Tournament {
    id: number;
    name: string;
    description?: string;
    start_date: string;
    end_date: string;
    entry_fee: number;
    prize_pool: number;
    max_participants?: number;
    status: TournamentStatus;
    rules?: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface TournamentParticipant {
    id: number;
    tournament_id: number;
    user_id: number;
    entry_fee_paid: boolean;
    initial_balance: number;
    current_balance: number;
    total_pnl: number;
    rank?: number;
    joined_at: string;
}

export interface TournamentRanking {
    id: number;
    tournament_id: number;
    user_id: number;
    username: string;
    total_pnl: number;
    roi_percentage: number;
    total_trades: number;
    winning_trades: number;
    rank: number;
    updated_at: string;
}

// Chart Types
export interface CandleData {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

export interface TickData {
    symbol: string;
    price: number;
    volume: number;
    timestamp: number;
}

export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d';

export interface ChartSettings {
    theme: 'dark' | 'light';
    indicators: string[];
    drawingTools: boolean;
    gridLines: boolean;
}

// Options Types
export interface OptionData {
    symbol: string;
    strike_price: number;
    expiry_date: string;
    option_type: 'CE' | 'PE';
    ltp: number;
    open_interest: number;
    change_percent: number;
    volume: number;
    bid: number;
    ask: number;
    iv?: number; // Implied Volatility
    delta?: number;
    gamma?: number;
    theta?: number;
    vega?: number;
    instrument_token?: number; // Zerodha instrument token for fetching candle data
}

export interface OptionsChain {
    spot_price: number;
    expiry_dates: string[];
    selected_expiry: string;
    calls: OptionData[];
    puts: OptionData[];
}

// WebSocket Types
export enum WSMessageType {
    SUBSCRIBE = 'subscribe',
    UNSUBSCRIBE = 'unsubscribe',
    PRICE_UPDATE = 'price_update',
    OPTIONS_UPDATE = 'options_update',
    ORDER_UPDATE = 'order_update',
    POSITION_UPDATE = 'position_update',
    ERROR = 'error'
}

export interface WSMessage {
    type: WSMessageType;
    data?: any;
    symbol?: string;
    error?: string;
}

// API Response Types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

// Form Types
export interface LoginForm {
    email: string;
    password: string;
}

export interface SignupForm {
    email: string;
    username: string;
    password: string;
    confirm_password: string;
}

export interface OrderForm {
    symbol: string;
    instrument_type: 'INDEX' | 'CE' | 'PE';
    order_type: OrderType;
    side: OrderSide;
    quantity: number;
    price?: number;
    stop_loss?: number;
    take_profit?: number;
}

// Leaderboard Types
export interface LeaderboardEntry {
    rank: number;
    user_id: number;
    username: string;
    total_pnl: number;
    roi_percentage: number;
    total_trades: number;
    win_rate: number;
    avatar?: string;
}

// Prize Distribution Types
export enum PaymentStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
}

export interface PrizeDistribution {
    id: number;
    tournament_id: number;
    user_id: number;
    rank: number;
    prize_amount: number;
    payment_status: PaymentStatus;
    payment_method?: string;
    payment_details?: Record<string, any>;
    paid_at?: string;
    created_at: string;
}

// User Settings Types
export interface UserSettings {
    id: number;
    user_id: number;
    chart_theme: 'dark' | 'light';
    default_timeframe: Timeframe;
    default_indicators: string[];
    notifications_enabled: boolean;
    email_notifications: boolean;
    sound_alerts: boolean;
    created_at: string;
    updated_at: string;
}
