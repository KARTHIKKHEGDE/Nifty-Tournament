import api, { handleApiError } from './api';
import { Tournament, TournamentParticipant, TournamentRanking } from '../types';

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
}

export default new TournamentService();
