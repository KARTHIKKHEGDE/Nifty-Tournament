import { useState } from 'react';
import api from '../services/api';
import { CandleData } from '../types';

interface UseChartDataOptions {
    autoRefresh?: boolean;
    refreshInterval?: number; // in milliseconds
}

export function useChartData(options: UseChartDataOptions = {}) {
    const { autoRefresh = false, refreshInterval = 30000 } = options;

    const [candles, setCandles] = useState<CandleData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCandles = async (
        symbol: string,
        instrumentToken: number,
        timeframe: string = '5minute',
        limit: number = 200
    ) => {
        setIsLoading(true);
        setError(null);

        try {
            console.log(`🔄 [useChartData] Fetching ${limit} candles for ${symbol} (${timeframe})`);

            const response = await api.get('/api/candles/', {
                params: {
                    symbol,
                    instrument_token: instrumentToken,
                    timeframe,
                    limit
                }
            });

            console.log(`✅ [useChartData] Received ${response.data.length} candles`);
            setCandles(response.data);
            return response.data;
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch candles';
            setError(errorMessage);
            console.error('❌ [useChartData] Error:', errorMessage);

            // Return empty array on error
            setCandles([]);
            return [];
        } finally {
            setIsLoading(false);
        }
    };

    const refreshCandles = async (
        symbol: string,
        instrumentToken: number,
        timeframe: string = '5minute',
        limit: number = 200
    ) => {
        console.log('🔄 [useChartData] Auto-refreshing candles...');
        return fetchCandles(symbol, instrumentToken, timeframe, limit);
    };

    return {
        candles,
        isLoading,
        error,
        fetchCandles,
        refreshCandles,
        setCandles, // Allow manual updates
    };
}
