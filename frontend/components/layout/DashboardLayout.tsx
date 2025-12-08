import React, { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import MainNavbar from './Navbar';
import WatchlistSidebar from './WatchlistSidebar';
import { useSymbolStore, WatchlistSymbol } from '../../stores/symbolStore';

interface DashboardLayoutProps {
    children: React.ReactNode;
    title?: string;
    showWatchlist?: boolean;
    onSymbolSelect?: (symbol: WatchlistSymbol) => void;
}

export default function DashboardLayout({
    children,
    title = 'Dashboard',
    showWatchlist = true,
    onSymbolSelect,
}: DashboardLayoutProps) {
    const router = useRouter();
    const { initializeWatchlist, fetchWatchlistPrices } = useSymbolStore();

    useEffect(() => {
        // Initialize watchlist with default symbols
        initializeWatchlist();

        // Fetch real prices immediately
        fetchWatchlistPrices();

        // Set up auto-refresh every 30 seconds
        const interval = setInterval(() => {
            fetchWatchlistPrices();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [initializeWatchlist, fetchWatchlistPrices]);

    const handleSymbolSelect = (symbol: WatchlistSymbol) => {
        if (onSymbolSelect) {
            onSymbolSelect(symbol);
        } else {
            // Default behavior: Navigate to chart route (Zerodha-style)
            const params = new URLSearchParams();
            if (symbol.instrumentToken) {
                params.set('instrument_token', symbol.instrumentToken.toString());
            }
            
            // Encode symbol for clean URL (spaces to hyphens)
            const encodedSymbol = symbol.symbol.replace(/\s+/g, '-');
            router.push(`/chart/${encodedSymbol}?${params.toString()}`, undefined, { shallow: true });
        }
    };

    return (
        <>
            <Head>
                <title>{title} - NIFTY Trader</title>
            </Head>

            <div className="h-screen bg-[#131722] flex flex-col overflow-hidden">
                <MainNavbar />
                <div className="flex flex-1 overflow-hidden">
                    {showWatchlist && (
                        <WatchlistSidebar onSymbolSelect={handleSymbolSelect} />
                    )}
                    <main className="flex-1 overflow-y-auto">
                        {children}
                    </main>
                </div>
            </div>
        </>
    );
}

