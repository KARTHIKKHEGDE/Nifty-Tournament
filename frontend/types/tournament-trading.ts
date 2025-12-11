/**
 * Tournament Trading Types
 * Defines the mode-based trading system for demo vs tournament isolation
 */

export type TradingMode = "demo" | "tournament";

export interface ModeProps {
    mode?: TradingMode;
    contextId?: string | null;
    userId?: string;
}

export interface TournamentParticipant {
    id: number;
    user_id: number;
    tournament_id: number;
    joined_at: string;
    initial_balance: number;
    current_balance: number;
    rank?: number;
    pnl?: number;
    is_active: boolean;
}

export interface TournamentTradingContext {
    tournamentId: string;
    participant: TournamentParticipant;
    virtualBalance: number;
    isJoined: boolean;
}
