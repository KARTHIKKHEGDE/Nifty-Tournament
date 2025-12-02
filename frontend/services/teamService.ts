import api from './api';
import { Team, TeamCreate } from '../types';

class TeamService {
    /**
     * Create a new team for a tournament
     */
    async createTeam(data: TeamCreate): Promise<Team> {
        const response = await api.post('/teams', data);
        return response.data;
    }

    /**
     * Get all teams for a tournament
     */
    async getTournamentTeams(tournamentId: number): Promise<Team[]> {
        const response = await api.get(`/teams/tournament/${tournamentId}`);
        return response.data;
    }

    /**
     * Get team details by ID
     */
    async getTeam(teamId: number): Promise<Team> {
        const response = await api.get(`/teams/${teamId}`);
        return response.data;
    }

    /**
     * Get user's team for a specific tournament
     */
    async getMyTeam(tournamentId: number): Promise<Team | null> {
        const response = await api.get(`/teams/my-team/${tournamentId}`);
        return response.data;
    }

    /**
     * Join an existing team
     */
    async joinTeam(teamId: number): Promise<{ message: string; team_id: number; member_id: number }> {
        const response = await api.post(`/teams/${teamId}/join`);
        return response.data;
    }

    /**
     * Leave a team
     */
    async leaveTeam(teamId: number): Promise<{ message: string; team_id: number }> {
        const response = await api.post(`/teams/${teamId}/leave`);
        return response.data;
    }

    /**
     * Register team for tournament (captain only)
     */
    async registerTeam(teamId: number): Promise<{ message: string; participant_id: number; starting_balance: number }> {
        const response = await api.post(`/teams/${teamId}/register`);
        return response.data;
    }
}

export default new TeamService();
