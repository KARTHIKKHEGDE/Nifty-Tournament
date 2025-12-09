/**
 * Admin Store - State management for admin dashboard
 */

import { create } from 'zustand';
import * as adminService from '../services/adminService';
import toast from 'react-hot-toast';

interface DashboardData {
    total_users: number;
    active_users: number;
    total_tournaments: number;
    active_tournaments: number;
    completed_tournaments: number;
    total_participants: number;
    total_orders: number;
    executed_orders: number;
    total_revenue: number;
    platform_balance: number;
}

interface Tournament {
    id: number;
    name: string;
    description?: string;
    status: string;
    entry_fee: number;
    prize_pool: number;
    starting_balance: number;
    max_participants?: number;
    current_participants: number;
    start_date: string;
    end_date: string;
    registration_deadline: string;
    rules?: string;
    created_at: string;
}

interface Participant {
    id: number;
    user_id: number;
    username: string;
    email: string;
    starting_balance: number;
    current_balance: number;
    total_pnl: number;
    roi: number;
    total_trades: number;
    winning_trades: number;
    losing_trades: number;
    win_rate: number;
    rank?: number;
    joined_at: string;
    last_trade_at?: string;
}

interface User {
    id: number;
    email: string;
    username: string;
    is_active: boolean;
    is_admin: boolean;
    created_at: string;
    updated_at: string;
    current_balance: number;
    tournaments_joined: number;
    total_trades: number;
    total_pnl: number;
}

interface AdminStore {
    // Dashboard
    dashboardData: DashboardData | null;
    recentActivity: any[];
    topPerformers: any[];

    // Tournaments
    tournaments: Tournament[];
    selectedTournament: Tournament | null;
    tournamentParticipants: Participant[];
    tournamentAnalytics: any | null;

    // Users
    users: User[];
    selectedUser: any | null;

    // Analytics
    revenueAnalytics: any | null;
    userGrowth: any | null;
    tournamentPerformance: any | null;

    // Loading states
    loading: {
        dashboard: boolean;
        tournaments: boolean;
        participants: boolean;
        users: boolean;
        analytics: boolean;
    };

    // Actions
    fetchDashboardData: () => Promise<void>;
    fetchRecentActivity: (limit?: number, offset?: number) => Promise<void>;
    fetchTopPerformers: (metric?: string, limit?: number) => Promise<void>;

    fetchTournaments: (filters?: any) => Promise<void>;
    fetchTournamentDetails: (tournamentId: number) => Promise<void>;
    fetchTournamentParticipants: (tournamentId: number, limit?: number, offset?: number) => Promise<void>;
    fetchTournamentAnalytics: (tournamentId: number) => Promise<void>;

    createTournament: (data: any) => Promise<boolean>;
    updateTournament: (tournamentId: number, data: any) => Promise<boolean>;
    deleteTournament: (tournamentId: number) => Promise<boolean>;
    startTournament: (tournamentId: number) => Promise<boolean>;
    endTournament: (tournamentId: number) => Promise<boolean>;

    removeParticipant: (tournamentId: number, userId: number, reason?: string) => Promise<boolean>;
    addParticipant: (tournamentId: number, userId: number, startingBalance?: number) => Promise<boolean>;

    fetchUsers: (filters?: any) => Promise<void>;
    fetchUserDetails: (userId: number) => Promise<void>;
    activateUser: (userId: number) => Promise<boolean>;
    deactivateUser: (userId: number) => Promise<boolean>;
    makeAdmin: (userId: number) => Promise<boolean>;
    revokeAdmin: (userId: number) => Promise<boolean>;
    deleteUser: (userId: number) => Promise<boolean>;

    fetchRevenueAnalytics: () => Promise<void>;
    fetchUserGrowth: () => Promise<void>;
    fetchTournamentPerformance: () => Promise<void>;

    sendBulkNotification: (data: any) => Promise<boolean>;
}

export const useAdminStore = create<AdminStore>((set, get) => ({
    // Initial state
    dashboardData: null,
    recentActivity: [],
    topPerformers: [],
    tournaments: [],
    selectedTournament: null,
    tournamentParticipants: [],
    tournamentAnalytics: null,
    users: [],
    selectedUser: null,
    revenueAnalytics: null,
    userGrowth: null,
    tournamentPerformance: null,

    loading: {
        dashboard: false,
        tournaments: false,
        participants: false,
        users: false,
        analytics: false,
    },

    // Dashboard actions
    fetchDashboardData: async () => {
        set((state) => ({ loading: { ...state.loading, dashboard: true } }));
        try {
            const data = await adminService.getDashboardOverview();
            set({ dashboardData: data });
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to fetch dashboard data');
        } finally {
            set((state) => ({ loading: { ...state.loading, dashboard: false } }));
        }
    },

    fetchRecentActivity: async (limit = 50, offset = 0) => {
        try {
            const data = await adminService.getRecentActivity(limit, offset);
            set({ recentActivity: data.activities });
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to fetch recent activity');
        }
    },

    fetchTopPerformers: async (metric = 'pnl', limit = 10) => {
        try {
            const data = await adminService.getTopPerformers(metric, limit);
            set({ topPerformers: data.performers });
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to fetch top performers');
        }
    },

    // Tournament actions
    fetchTournaments: async (filters?: any) => {
        set((state) => ({ loading: { ...state.loading, tournaments: true } }));
        try {
            const data = await adminService.getAllTournaments(filters);
            set({ tournaments: data });
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to fetch tournaments');
        } finally {
            set((state) => ({ loading: { ...state.loading, tournaments: false } }));
        }
    },

    fetchTournamentDetails: async (tournamentId: number) => {
        try {
            const data = await adminService.getTournamentDetails(tournamentId);
            set({ selectedTournament: data });
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to fetch tournament details');
        }
    },

    fetchTournamentParticipants: async (tournamentId: number, limit = 100, offset = 0) => {
        set((state) => ({ loading: { ...state.loading, participants: true } }));
        try {
            const data = await adminService.getTournamentParticipants(tournamentId, limit, offset);
            set({ tournamentParticipants: data.participants });
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to fetch participants');
        } finally {
            set((state) => ({ loading: { ...state.loading, participants: false } }));
        }
    },

    fetchTournamentAnalytics: async (tournamentId: number) => {
        try {
            const data = await adminService.getTournamentAnalytics(tournamentId);
            set({ tournamentAnalytics: data });
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to fetch tournament analytics');
        }
    },

    createTournament: async (data: any) => {
        try {
            await adminService.createTournament(data);
            toast.success('Tournament created successfully');
            get().fetchTournaments();
            return true;
        } catch (error: any) {
            // Handle validation errors with more details
            if (error.response?.status === 422 && error.response?.data?.detail) {
                const detail = error.response.data.detail;
                if (Array.isArray(detail)) {
                    // Pydantic validation errors
                    const errors = detail.map((err: any) => `${err.loc[1]}: ${err.msg}`).join(', ');
                    toast.error(`Validation error: ${errors}`);
                } else if (typeof detail === 'string') {
                    toast.error(detail);
                } else {
                    toast.error('Validation error: Please check all fields');
                }
            } else {
                toast.error(error.response?.data?.detail || 'Failed to create tournament');
            }
            console.error('Tournament creation error:', error.response?.data);
            return false;
        }
    },

    updateTournament: async (tournamentId: number, data: any) => {
        try {
            await adminService.updateTournament(tournamentId, data);
            toast.success('Tournament updated successfully');
            get().fetchTournaments();
            return true;
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to update tournament');
            return false;
        }
    },

    deleteTournament: async (tournamentId: number) => {
        try {
            await adminService.deleteTournament(tournamentId);
            toast.success('Tournament deleted successfully');
            get().fetchTournaments();
            return true;
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to delete tournament');
            return false;
        }
    },

    startTournament: async (tournamentId: number) => {
        try {
            await adminService.startTournament(tournamentId);
            toast.success('Tournament started successfully');
            get().fetchTournaments();
            get().fetchTournamentDetails(tournamentId);
            return true;
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to start tournament');
            return false;
        }
    },

    endTournament: async (tournamentId: number) => {
        try {
            await adminService.endTournament(tournamentId);
            toast.success('Tournament ended successfully');
            get().fetchTournaments();
            get().fetchTournamentDetails(tournamentId);
            return true;
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to end tournament');
            return false;
        }
    },

    removeParticipant: async (tournamentId: number, userId: number, reason?: string) => {
        try {
            await adminService.removeParticipant(tournamentId, userId, reason);
            toast.success('Participant removed successfully');
            get().fetchTournamentParticipants(tournamentId);
            get().fetchTournamentDetails(tournamentId);
            return true;
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to remove participant');
            return false;
        }
    },

    addParticipant: async (tournamentId: number, userId: number, startingBalance?: number) => {
        try {
            await adminService.addParticipant(tournamentId, userId, startingBalance);
            toast.success('Participant added successfully');
            get().fetchTournamentParticipants(tournamentId);
            get().fetchTournamentDetails(tournamentId);
            return true;
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to add participant');
            return false;
        }
    },

    // User actions
    fetchUsers: async (filters?: any) => {
        set((state) => ({ loading: { ...state.loading, users: true } }));
        try {
            const data = await adminService.getAllUsers(filters);
            set({ users: data.users });
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to fetch users');
        } finally {
            set((state) => ({ loading: { ...state.loading, users: false } }));
        }
    },

    fetchUserDetails: async (userId: number) => {
        try {
            const data = await adminService.getUserDetails(userId);
            set({ selectedUser: data });
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to fetch user details');
        }
    },

    activateUser: async (userId: number) => {
        try {
            await adminService.activateUser(userId);
            toast.success('User activated successfully');
            get().fetchUsers();
            return true;
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to activate user');
            return false;
        }
    },

    deactivateUser: async (userId: number) => {
        try {
            await adminService.deactivateUser(userId);
            toast.success('User deactivated successfully');
            get().fetchUsers();
            return true;
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to deactivate user');
            return false;
        }
    },

    makeAdmin: async (userId: number) => {
        try {
            await adminService.makeAdmin(userId);
            toast.success('Admin privileges granted successfully');
            get().fetchUsers();
            return true;
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to grant admin privileges');
            return false;
        }
    },

    revokeAdmin: async (userId: number) => {
        try {
            await adminService.revokeAdmin(userId);
            toast.success('Admin privileges revoked successfully');
            get().fetchUsers();
            return true;
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to revoke admin privileges');
            return false;
        }
    },

    deleteUser: async (userId: number) => {
        try {
            await adminService.deleteUser(userId);
            toast.success('User deleted successfully');
            get().fetchUsers();
            return true;
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to delete user');
            return false;
        }
    },

    // Analytics actions
    fetchRevenueAnalytics: async () => {
        set((state) => ({ loading: { ...state.loading, analytics: true } }));
        try {
            const data = await adminService.getRevenueAnalytics();
            set({ revenueAnalytics: data });
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to fetch revenue analytics');
        } finally {
            set((state) => ({ loading: { ...state.loading, analytics: false } }));
        }
    },

    fetchUserGrowth: async () => {
        try {
            const data = await adminService.getUserGrowth();
            set({ userGrowth: data });
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to fetch user growth');
        }
    },

    fetchTournamentPerformance: async () => {
        try {
            const data = await adminService.getTournamentPerformance();
            set({ tournamentPerformance: data });
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to fetch tournament performance');
        }
    },

    sendBulkNotification: async (data: any) => {
        try {
            await adminService.sendBulkNotification(data);
            toast.success('Notifications sent successfully');
            return true;
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to send notifications');
            return false;
        }
    },
}));
