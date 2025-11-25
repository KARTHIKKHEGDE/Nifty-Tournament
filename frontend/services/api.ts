import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getLocalStorage, removeLocalStorage } from '../utils/formatters';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getLocalStorage<string>('access_token', '');

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error: AxiosError) => {
        if (error.response) {
            // Server responded with error status
            const status = error.response.status;

            if (status === 401) {
                // Unauthorized - clear token and redirect to login
                removeLocalStorage('access_token');
                removeLocalStorage('user');

                if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth')) {
                    window.location.href = '/auth/login';
                }
            } else if (status === 403) {
                console.error('Forbidden: You do not have permission to access this resource');
            } else if (status === 404) {
                console.error('Not Found: The requested resource was not found');
            } else if (status >= 500) {
                console.error('Server Error: Please try again later');
            }
        } else if (error.request) {
            // Request was made but no response received
            console.error('Network Error: Please check your internet connection');
        } else {
            // Something else happened
            console.error('Error:', error.message);
        }

        return Promise.reject(error);
    }
);

// Helper function to handle API errors
export const handleApiError = (error: any): string => {
    if (error.response?.data?.detail) {
        return error.response.data.detail;
    } else if (error.response?.data?.message) {
        return error.response.data.message;
    } else if (error.message) {
        return error.message;
    }
    return 'An unexpected error occurred';
};

export default api;
