import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useUserStore } from '../stores/userStore';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
    const router = useRouter();
    const { loadUser, isAuthenticated } = useUserStore();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load user on app mount and wait for it to complete
        const initAuth = async () => {
            await loadUser();
            setIsLoading(false);
        };

        initAuth();
    }, [loadUser]);

    useEffect(() => {
        // Only redirect after loading is complete
        if (isLoading) return;

        // Redirect to login if not authenticated and trying to access protected routes
        const publicPaths = ['/', '/auth/login', '/auth/signup'];
        const isPublicPath = publicPaths.includes(router.pathname);

        if (!isAuthenticated && !isPublicPath) {
            router.push('/auth/login');
        }
    }, [isAuthenticated, router, isLoading]);

    // Show nothing while loading auth state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    return <Component {...pageProps} />;
}
