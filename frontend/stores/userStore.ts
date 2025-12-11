import { create } from 'zustand';
import { User, Wallet } from '../types';
import authService from '../services/authService';
import { getLocalStorage } from '../utils/formatters';

interface UserStore {
    user: User | null;
    wallet: Wallet | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    setUser: (user: User | null) => void;
    setWallet: (wallet: Wallet | null) => void;
    loadUser: () => Promise<void>;
    logout: () => void;
    clearError: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
    user: null,
    wallet: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    setUser: (user) => set({ user, isAuthenticated: !!user }),

    setWallet: (wallet) => {
        set({ wallet });
        // Persist to localStorage
        if (wallet) {
            localStorage.setItem('wallet', JSON.stringify(wallet));
        }
    },

    loadUser: async () => {
        set({ isLoading: true, error: null });

        try {
            // Check if token exists
            const token = authService.getToken();
            if (!token) {
                set({ user: null, wallet: null, isAuthenticated: false, isLoading: false });
                return;
            }

            // Try to get user from localStorage first
            const cachedUser = getLocalStorage<User | null>('user', null);
            if (cachedUser) {
                set({ user: cachedUser, isAuthenticated: true });
            }

            // Fetch fresh user data from API
            const user = await authService.getCurrentUser();
            
            // Initialize wallet with default balance if not exists
            const cachedWallet = getLocalStorage<Wallet | null>('wallet', null);
            const wallet: Wallet = cachedWallet || {
                id: user.id,
                user_id: user.id,
                balance: 1000000, // Default 10 Lakhs for demo trading
                currency: 'INR',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            
            // Save wallet to localStorage
            if (!cachedWallet) {
                localStorage.setItem('wallet', JSON.stringify(wallet));
            }
            
            set({ user, wallet, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
            set({
                user: null,
                wallet: null,
                isAuthenticated: false,
                isLoading: false,
                error: error.message,
            });
        }
    },

    logout: () => {
        authService.logout();
        set({
            user: null,
            wallet: null,
            isAuthenticated: false,
            error: null,
        });
    },

    clearError: () => set({ error: null }),
}));
