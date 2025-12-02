import React, { useEffect } from 'react';
import Head from 'next/head';
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
        }
    };

    return (
        <>
            <Head>
                <title>{title} - NIFTY Trader</title>
            </Head>

            <div className="min-h-screen bg-[#131722] flex flex-col">
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

