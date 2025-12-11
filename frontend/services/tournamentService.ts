import api, { handleApiError } from './api';
import { Tournament, TournamentParticipant, TournamentRanking, PaperOrder, PaperPosition } from '../types';

interface TournamentPnL {
    unrealised: number;
    realised: number;
    total: number;
}

class TournamentService {
    /**
     * Get all tournaments
     */
    async getTournaments(status?: string): Promise<Tournament[]> {
        try {
            const response = await api.get<Tournament[]>('/api/tournaments/', {
                params: status ? { status_filter: status } : {},
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Get a specific tournament
     */
    async getTournament(tournamentId: number): Promise<Tournament> {
        try {
            const response = await api.get<Tournament>(`/api/tournaments/${tournamentId}`);
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Join a tournament
     */
    async joinTournament(tournamentId: number): Promise<TournamentParticipant> {
        try {
            const response = await api.post<TournamentParticipant>(
                `/api/tournaments/${tournamentId}/join`
            );
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Get tournament leaderboard
     */
    async getLeaderboard(tournamentId: number): Promise<TournamentRanking[]> {
        try {
            const response = await api.get<TournamentRanking[]>(
                `/api/tournaments/${tournamentId}/leaderboard`
            );
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Get user's tournament participation
     */
    async getMyParticipation(tournamentId: number): Promise<TournamentParticipant | null> {
        try {
            const response = await api.get<TournamentParticipant>(
                `/api/tournaments/${tournamentId}/my-participation`
            );
            return response.data;
        } catch (error) {
            return null;
        }
    }

    /**
     * Get user's tournament rankings
     */
    async getMyRankings(): Promise<TournamentRanking[]> {
        try {
            const response = await api.get<TournamentRanking[]>('/api/tournaments/my-rankings');
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    // ==================== TOURNAMENT TRADING API ====================

    /**
     * Check if user has joined a tournament
     */
    async getParticipant(tournamentId: string): Promise<{ joined: boolean; participant?: TournamentParticipant; userId?: string }> {
        try {
            const response = await api.get(`/api/tournaments/${tournamentId}/participant`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                return { joined: false };
            }
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Get user's P&L within tournament
     */
    async getTournamentPnl(tournamentId: string): Promise<TournamentPnL> {
        try {
            const response = await api.get(`/api/tournaments/${tournamentId}/pnl`);
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Get user's positions within tournament
     */
    async getTournamentPositions(tournamentId: string): Promise<PaperPosition[]> {
        try {
            const response = await api.get(`/api/tournaments/${tournamentId}/positions`);
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Get user's orders within tournament
     */
    async getTournamentOrders(tournamentId: string): Promise<PaperOrder[]> {
        try {
            const response = await api.get(`/api/tournaments/${tournamentId}/orders`);
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Place order within tournament
     */
    async placeTournamentOrder(tournamentId: string, order: any): Promise<PaperOrder> {
        try {
            const response = await api.post(`/api/tournaments/${tournamentId}/orders`, order);
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Cancel order within tournament
     */
    async cancelTournamentOrder(tournamentId: string, orderId: number): Promise<void> {
        try {
            await api.delete(`/api/tournaments/${tournamentId}/orders/${orderId}`);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Close position within tournament
     */
    async closeTournamentPosition(tournamentId: string, positionId: number): Promise<void> {
        try {
            await api.delete(`/api/tournaments/${tournamentId}/positions/${positionId}`);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }
}

export default new TournamentService();
