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
    const [currentTimeframe, setCurrentTimeframe] = useState('5m');

    useEffect(() => {
        setWindowHeight(window.innerHeight);
        const handleResize = () => setWindowHeight(window.innerHeight);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Map timeframe to backend format
    const mapTimeframeToBackend = (timeframe: string): string => {
        const mapping: Record<string, string> = {
            '1m': 'minute',
            '3m': '3minute',
            '5m': '5minute',
            '15m': '15minute',
            '30m': '30minute',
            '1h': '60minute',
            '1d': 'day'
        };
        return mapping[timeframe] || timeframe;
    };

    useEffect(() => {
        if (!router.isReady) return;

        const { symbol, instrument_token, timeframe } = router.query;

        if (symbol) {
            setSymbol(symbol as string);
        }

        if (timeframe) {
            setCurrentTimeframe(timeframe as string);
        }

        if (instrument_token && symbol) {
            const token = parseInt(instrument_token as string);
            const symbolStr = symbol as string;
            const tf = (timeframe as string) || '5m';
            const backendTf = mapTimeframeToBackend(tf);

            // Initial fetch - WebSocket will handle real-time updates
            fetchCandles(symbolStr, token, backendTf, 200);
        }
    }, [router.isReady, router.query, fetchCandles]);

    const handleTimeframeChange = (timeframe: string) => {
        setCurrentTimeframe(timeframe);
        const { symbol, instrument_token } = router.query;
        
        if (symbol && instrument_token) {
            const backendTf = mapTimeframeToBackend(timeframe);
            fetchCandles(
                symbol as string,
                parseInt(instrument_token as string),
                backendTf,
                200
            );
        }
    };

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
                        onTimeframeChange={handleTimeframeChange}
                        currentTimeframe={currentTimeframe}
                    />
                )}
            </div>
        </>
    );
}
