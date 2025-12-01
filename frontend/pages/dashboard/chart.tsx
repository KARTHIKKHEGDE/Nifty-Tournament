import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import KlineChart from '../../components/charts/KlineChart';
import { useChartData } from '../../hooks/useChartData';

export default function ChartPage() {
    const router = useRouter();
    const { candles, isLoading, fetchCandles } = useChartData();
    const [symbol, setSymbol] = useState('');
    const [windowHeight, setWindowHeight] = useState(600);

    useEffect(() => {
        setWindowHeight(window.innerHeight);
        const handleResize = () => setWindowHeight(window.innerHeight);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!router.isReady) return;

        const { symbol, instrument_token } = router.query;

        if (symbol) {
            setSymbol(symbol as string);
        }

        if (instrument_token && symbol) {
            const token = parseInt(instrument_token as string);
            const symbolStr = symbol as string;

            // Initial fetch
            fetchCandles(symbolStr, token, '5minute', 200);

            // Auto-refresh every 30 seconds
            const refreshInterval = setInterval(() => {
                console.log('🔄 Auto-refreshing candle data...');
                fetchCandles(symbolStr, token, '5minute', 200);
            }, 30000);

            return () => clearInterval(refreshInterval);
        }
    }, [router.isReady, router.query, fetchCandles]);

    return (
        <>
            <Head>
                <title>{symbol || 'Chart'} - NIFTY Trader</title>
            </Head>
            <div className="h-screen w-screen bg-[#0a0a0a] overflow-hidden">
                {isLoading && candles.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-gray-400">Loading chart data...</div>
                    </div>
                ) : (
                    <KlineChart
                        data={candles}
                        symbol={symbol}
                        showVolume={false}
                        height={windowHeight}
                        isNiftyChart={false}
                    />
                )}
            </div>
        </>
    );
}
