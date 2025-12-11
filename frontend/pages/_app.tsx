import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Toaster } from 'react-hot-toast';
import { useUserStore } from '../stores/userStore';
import { useSymbolStore } from '../stores/symbolStore';
import { initializeInstrumentCache } from '../utils/searchUtils';
import wsService from '../services/websocket';
import { getLocalStorage } from '../utils/formatters';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
    const router = useRouter();
    const { loadUser, isAuthenticated } = useUserStore();
    const { initializeWatchlist, watchlist } = useSymbolStore();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load user and instrument cache on app mount
        const initAuth = async () => {
            await loadUser();
            // Load instruments for instant search (only option instruments)
            console.log('📥 Initializing instrument cache...');
            await initializeInstrumentCache();
            console.log('✅ Instrument cache ready!');
            setIsLoading(false);
        };

        initAuth();
    }, [loadUser]);

    // Auto-subscribe to watchlist symbols for live prices
    useEffect(() => {
        if (!isAuthenticated || isLoading) return;

        const setupLiveUpdates = async () => {
            try {
                // Initialize watchlist
                initializeWatchlist();

                // Get access token
                const token = getLocalStorage<string>('access_token', '');
                if (!token) {
                    console.log('⚠️ [APP] No access token, skipping WebSocket subscription');
                    return;
                }

                // Connect to WebSocket
                console.log('🔌 [APP] Connecting to WebSocket for live prices...');
                await wsService.connect(token);

                // Subscribe to all watchlist symbols
                const symbols = useSymbolStore.getState().watchlist;
                console.log(`📡 [APP] Auto-subscribing to ${symbols.length} watchlist symbols`);
                
                symbols.forEach(item => {
                    if (item.instrumentToken) {
                        console.log(`📤 [APP] Subscribing to ${item.symbol} (${item.instrumentToken})`);
                        wsService.subscribe(item.symbol, item.instrumentToken);
                    }
                });

                // Listen for tick updates to update watchlist prices
                const unsubscribe = wsService.on('tick', (tickData: any) => {
                    if (tickData && tickData.symbol && tickData.last_price) {
                        useSymbolStore.setState((state) => ({
                            watchlist: state.watchlist.map(item => 
                                item.symbol === tickData.symbol
                                    ? { ...item, ltp: tickData.last_price }
                                    : item
                            )
                        }));
                    }
                });

                return () => {
                    unsubscribe();
                };
            } catch (error) {
                console.error('❌ [APP] Failed to setup live updates:', error);
            }
        };

        setupLiveUpdates();
    }, [isAuthenticated, isLoading, initializeWatchlist]);

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

    return (
        <>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#1f2937',
                        color: '#fff',
                        border: '1px solid #374151',
                    },
                    success: {
                        iconTheme: {
                            primary: '#10b981',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                        },
                    },
                }}
            />
            <Component {...pageProps} />
        </>
    );
}
