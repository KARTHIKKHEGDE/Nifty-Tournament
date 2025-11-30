import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import KlineChart from '../../components/charts/KlineChart';
import api from '../../services/api';
import { CandleData } from '../../types';

export default function ChartPage() {
    const router = useRouter();
    const [candles, setCandles] = useState<CandleData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
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

        const { symbol, instrument_token, type, strike } = router.query;

        if (symbol) {
            setSymbol(symbol as string);
        }

        const fetchCandles = async () => {
            if (!instrument_token) return;

            try {
                const response = await api.get('/api/candles/', {
                    params: {
                        symbol: symbol,
                        instrument_token: instrument_token,
                        timeframe: '5minute',
                        limit: 400
                    }
                });
                setCandles(response.data);
            } catch (error) {
                console.error('Error fetching candle data:', error);
                // Fallback mock data
                setCandles([
                    {
                        timestamp: Date.now() - 3600000,
                        open: 100,
                        high: 105,
                        low: 95,
                        close: 102,
                        volume: 1000,
                    }
                ]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCandles();
    }, [router.isReady, router.query]);

    return (
        <>
            <Head>
                <title>{symbol || 'Chart'} - NIFTY Trader</title>
            </Head>
            <div className="h-screen w-screen bg-[#0a0a0a] overflow-hidden">
                {isLoading ? (
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
