import api, { handleApiError } from './api';
import { User, LoginForm, SignupForm } from '../types';
import { setLocalStorage, removeLocalStorage } from '../utils/formatters';

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: User;
}

class AuthService {
    /**
     * Sign up a new user
     */
    async signup(data: SignupForm): Promise<AuthResponse> {
        try {
            // Create user account
            await api.post<User>('/api/auth/signup', {
                email: data.email,
                username: data.username,
                password: data.password,
            });

            // Auto-login after signup
            return await this.login({
                email: data.email,
                password: data.password,
            });
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Login user
     */
    async login(data: LoginForm): Promise<AuthResponse> {
        try {
            // Send JSON data with email and password
            const response = await api.post<{ access_token: string; token_type: string }>('/api/auth/login', {
                email: data.email,
                password: data.password,
            });

            // Store token first
            setLocalStorage('access_token', response.data.access_token);

            // Fetch user data
            const user = await this.getCurrentUser();

            const authResponse: AuthResponse = {
                access_token: response.data.access_token,
                token_type: response.data.token_type,
                user: user,
            };

            // Store user data
            setLocalStorage('user', user);

            return authResponse;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Logout user
     */
    logout(): void {
        removeLocalStorage('access_token');
        removeLocalStorage('user');

        if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
        }
    }

    /**
     * Get current user
     */
    async getCurrentUser(): Promise<User> {
        try {
            const response = await api.get<User>('/api/auth/me');
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        if (typeof window === 'undefined') return false;

        const token = localStorage.getItem('access_token');
        return !!token;
    }

    /**
     * Get stored auth token
     */
    getToken(): string | null {
        if (typeof window === 'undefined') return null;

        return localStorage.getItem('access_token');
    }

    /**
     * Store authentication data
     */
    private storeAuthData(data: AuthResponse): void {
        setLocalStorage('access_token', data.access_token);
        setLocalStorage('user', data.user);
    }
}

export default new AuthService();
