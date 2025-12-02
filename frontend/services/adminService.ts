/**
 * Admin Service - API calls for admin operations
 */

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Get auth token from localStorage
const getAuthToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('token');
    }
    return null;
};

// Create axios instance with auth header
const adminApi = axios.create({
    baseURL: `${API_URL}/api/admin`,
});

// Add auth token to all requests
adminApi.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ============================================================================
// Dashboard
// ============================================================================

export const getDashboardOverview = async () => {
    const response = await adminApi.get('/dashboard/overview');
    return response.data;
};

export const getRecentActivity = async (limit = 50, offset = 0) => {
    const response = await adminApi.get('/dashboard/recent-activity', {
        params: { limit, offset },
    });
    return response.data;
};

export const getTopPerformers = async (metric = 'pnl', limit = 10) => {
    const response = await adminApi.get('/dashboard/top-performers', {
        params: { metric, limit },
    });
    return response.data;
};

// ============================================================================
// Tournament Management
// ============================================================================

export const getAllTournaments = async (filters?: {
    status?: string;
    limit?: number;
    offset?: number;
}) => {
    const response = await adminApi.get('/tournaments', { params: filters });
    return response.data;
};

export const getTournamentDetails = async (tournamentId: number) => {
    const response = await adminApi.get(`/tournaments/${tournamentId}`);
    return response.data;
};

export const createTournament = async (data: any) => {
    const response = await adminApi.post('/tournaments', data);
    return response.data;
};

export const updateTournament = async (tournamentId: number, data: any) => {
    const response = await adminApi.put(`/tournaments/${tournamentId}`, data);
    return response.data;
};

export const deleteTournament = async (tournamentId: number) => {
    const response = await adminApi.delete(`/tournaments/${tournamentId}`);
    return response.data;
};

export const startTournament = async (tournamentId: number) => {
    const response = await adminApi.post(`/tournaments/${tournamentId}/start`);
    return response.data;
};

export const endTournament = async (tournamentId: number) => {
    const response = await adminApi.post(`/tournaments/${tournamentId}/end`);
    return response.data;
};

export const getTournamentAnalytics = async (tournamentId: number) => {
    const response = await adminApi.get(`/tournaments/${tournamentId}/analytics`);
    return response.data;
};

export const getTournamentParticipants = async (
    tournamentId: number,
    limit = 100,
    offset = 0
) => {
    const response = await adminApi.get(`/tournaments/${tournamentId}/participants`, {
        params: { limit, offset },
    });
    return response.data;
};

export const removeParticipant = async (
    tournamentId: number,
    userId: number,
    reason?: string
) => {
    const response = await adminApi.delete(
        `/tournaments/${tournamentId}/participants/${userId}`,
        { data: { reason } }
    );
    return response.data;
};

export const addParticipant = async (
    tournamentId: number,
    userId: number,
    startingBalance?: number
) => {
    const response = await adminApi.post(`/tournaments/${tournamentId}/participants`, {
        user_id: userId,
        starting_balance: startingBalance,
    });
    return response.data;
};

// ============================================================================
// User Management
// ============================================================================

export const getAllUsers = async (filters?: {
    limit?: number;
    offset?: number;
    is_active?: boolean;
    is_admin?: boolean;
    search?: string;
}) => {
    const response = await adminApi.get('/users', { params: filters });
    return response.data;
};

export const getUserDetails = async (userId: number) => {
    const response = await adminApi.get(`/users/${userId}`);
    return response.data;
};

export const getUserTournaments = async (userId: number) => {
    const response = await adminApi.get(`/users/${userId}/tournaments`);
    return response.data;
};

export const activateUser = async (userId: number) => {
    const response = await adminApi.put(`/users/${userId}/activate`);
    return response.data;
};

export const deactivateUser = async (userId: number) => {
    const response = await adminApi.put(`/users/${userId}/deactivate`);
    return response.data;
};

export const makeAdmin = async (userId: number) => {
    const response = await adminApi.put(`/users/${userId}/make-admin`);
    return response.data;
};

export const revokeAdmin = async (userId: number) => {
    const response = await adminApi.put(`/users/${userId}/revoke-admin`);
    return response.data;
};

export const deleteUser = async (userId: number) => {
    const response = await adminApi.delete(`/users/${userId}`);
    return response.data;
};

// ============================================================================
// Analytics
// ============================================================================

export const getRevenueAnalytics = async () => {
    const response = await adminApi.get('/analytics/revenue');
    return response.data;
};

export const getUserGrowth = async () => {
    const response = await adminApi.get('/analytics/user-growth');
    return response.data;
};

export const getTournamentPerformance = async () => {
    const response = await adminApi.get('/analytics/tournament-performance');
    return response.data;
};

export const getTradingVolume = async () => {
    const response = await adminApi.get('/analytics/trading-volume');
    return response.data;
};

export const getUserEngagement = async () => {
    const response = await adminApi.get('/analytics/user-engagement');
    return response.data;
};

// ============================================================================
// Bulk Operations
// ============================================================================

export const sendBulkNotification = async (data: {
    user_ids: number[];
    title: string;
    message: string;
    type?: string;
    action_url?: string;
}) => {
    const response = await adminApi.post('/bulk/send-notification', data);
    return response.data;
};

// ============================================================================
// Audit Log
// ============================================================================

export const getAuditLog = async (filters?: {
    limit?: number;
    offset?: number;
    action_type?: string;
    admin_user_id?: number;
}) => {
    const response = await adminApi.get('/audit-log', { params: filters });
    return response.data;
};

// ============================================================================
// Platform Stats (Legacy)
// ============================================================================

export const getPlatformStats = async () => {
    const response = await adminApi.get('/stats');
    return response.data;
};

export default {
    // Dashboard
    getDashboardOverview,
    getRecentActivity,
    getTopPerformers,

    // Tournaments
    getAllTournaments,
    getTournamentDetails,
    createTournament,
    updateTournament,
    deleteTournament,
    startTournament,
    endTournament,
    getTournamentAnalytics,
    getTournamentParticipants,
    removeParticipant,
    addParticipant,

    // Users
    getAllUsers,
    getUserDetails,
    getUserTournaments,
    activateUser,
    deactivateUser,
    makeAdmin,
    revokeAdmin,
    deleteUser,

    // Analytics
    getRevenueAnalytics,
    getUserGrowth,
    getTournamentPerformance,
    getTradingVolume,
    getUserEngagement,

    // Bulk Operations
    sendBulkNotification,

    // Audit
    getAuditLog,

    // Stats
    getPlatformStats,
};
