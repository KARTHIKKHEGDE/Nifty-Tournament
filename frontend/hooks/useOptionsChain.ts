import { useState } from 'react';
import api from '../services/api';
import { OptionData } from '../types';

interface OptionsChainData {
    calls: OptionData[];
    puts: OptionData[];
    spotPrice: number;
}

export function useOptionsChain() {
    const [optionsData, setOptionsData] = useState<OptionsChainData>({
        calls: [],
        puts: [],
        spotPrice: 0,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchOptionsChain = async (
        symbol: string,
        expiryDate?: string,
        strikeRange: { above: number; below: number } = { above: 10, below: 10 }
    ) => {
        setIsLoading(true);
        setError(null);

        try {
            console.log(`🔄 [useOptionsChain] Fetching options chain for ${symbol}`);

            // Map symbol names if necessary
            let apiSymbol = symbol;
            if (symbol === 'NIFTY 50') apiSymbol = 'NIFTY';
            if (symbol === 'NIFTY BANK') apiSymbol = 'BANKNIFTY';

            const params = expiryDate ? `?expiry_date=${expiryDate}` : '';
            const response = await api.get(`/api/candles/options-chain/${apiSymbol}${params}`);
            const data = response.data;

            // Get all unique strikes and sort them
            const allStrikes = new Set<number>();
            data.ce_options?.forEach((opt: any) => allStrikes.add(opt.strike));
            data.pe_options?.forEach((opt: any) => allStrikes.add(opt.strike));
            const sortedStrikes = Array.from(allStrikes).sort((a, b) => a - b);

            // Find ATM strike index (closest to spot price)
            let atmIndex = 0;
            let minDiff = Number.MAX_VALUE;

            sortedStrikes.forEach((strike, index) => {
                const diff = Math.abs(strike - data.spot_price);
                if (diff < minDiff) {
                    minDiff = diff;
                    atmIndex = index;
                }
            });

            // Filter strikes based on range
            const startIdx = Math.max(0, atmIndex - strikeRange.below);
            const endIdx = Math.min(sortedStrikes.length, atmIndex + strikeRange.above + 1);
            const allowedStrikes = new Set(sortedStrikes.slice(startIdx, endIdx));

            console.log(`📊 [useOptionsChain] ATM: ${sortedStrikes[atmIndex]}, Range: ${startIdx}-${endIdx}`);

            // Transform and filter API data
            const mapOption = (opt: any, type: 'CE' | 'PE'): OptionData => ({
                symbol: opt.tradingsymbol,
                strike_price: opt.strike,
                expiry_date: opt.expiry,
                option_type: type,
                ltp: opt.ltp,
                open_interest: opt.oi,
                change_percent: opt.change,
                volume: opt.volume,
                bid: 0,
                ask: 0,
                iv: 0,
                delta: 0,
                gamma: 0,
                theta: 0,
                vega: 0,
                instrument_token: opt.instrument_token,
            });

            const calls = data.ce_options
                .filter((opt: any) => allowedStrikes.has(opt.strike))
                .map((opt: any) => mapOption(opt, 'CE'));

            const puts = data.pe_options
                .filter((opt: any) => allowedStrikes.has(opt.strike))
                .map((opt: any) => mapOption(opt, 'PE'));

            const result = {
                calls,
                puts,
                spotPrice: data.spot_price,
            };

            console.log(`✅ [useOptionsChain] Loaded ${calls.length} calls, ${puts.length} puts`);
            setOptionsData(result);
            return result;
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch options chain';
            setError(errorMessage);
            console.error('❌ [useOptionsChain] Error:', errorMessage);

            // Return empty data on error
            const emptyResult = { calls: [], puts: [], spotPrice: 0 };
            setOptionsData(emptyResult);
            return emptyResult;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        optionsData,
        isLoading,
        error,
        fetchOptionsChain,
        setOptionsData, // Allow manual updates
    };
}
