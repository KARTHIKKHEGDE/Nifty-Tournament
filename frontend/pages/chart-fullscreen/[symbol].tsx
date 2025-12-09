// Full-screen chart page (no dashboard layout, no navigation)
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import KlineChart from '../../components/charts/KlineChart';
import { useChartData } from '../../hooks/useChartData';
import { WatchlistSymbol } from '../../stores/symbolStore';

export default function ChartFullscreen() {
    const router = useRouter();
    const { symbol, instrument_token, timeframe } = router.query;
    
    const { candles, isLoading, fetchCandles } = useChartData();
    const [currentTimeframe, setCurrentTimeframe] = useState(timeframe as string || '5m');
    const [chartSymbol, setChartSymbol] = useState<WatchlistSymbol | null>(null);

    useEffect(() => {
        if (symbol && instrument_token && typeof symbol === 'string') {
            const decodedSymbol = (symbol as string).replace(/-/g, ' ');
            
            const symbolObj: WatchlistSymbol = {
                symbol: decodedSymbol,
                displayName: decodedSymbol,
                ltp: 0,
                change: 0,
                changePercent: 0,
                instrumentToken: parseInt(instrument_token as string),
            };
            
            setChartSymbol(symbolObj);
        }
    }, [symbol, instrument_token]);

    useEffect(() => {
        console.log('🔄 [ChartFullscreen useEffect] Triggered with:', {
            chartSymbol: chartSymbol?.symbol,
            currentTimeframe,
            instrumentToken: chartSymbol?.instrumentToken
        });
        
        if (chartSymbol) {
            // Map frontend timeframe to backend format
            const mapTimeframeToBackend = (tf: string): string => {
                const mapping: Record<string, string> = {
                    '1m': 'minute',
                    '3m': '3minute',
                    '5m': '5minute',
                    '15m': '15minute',
                    '30m': '30minute',
                    '1h': '60minute',
                    '1d': 'day'
                };
                return mapping[tf] || tf;
            };
            
            const backendTimeframe = mapTimeframeToBackend(currentTimeframe);
            console.log('📡 [ChartFullscreen useEffect] Fetching candles:', backendTimeframe);
            fetchCandles(chartSymbol.symbol, chartSymbol.instrumentToken!, backendTimeframe, 200);
        } else {
            console.log('⏸️ [ChartFullscreen useEffect] Skipping: No chartSymbol');
        }
    }, [chartSymbol, currentTimeframe, fetchCandles]);

    const handleTimeframeChange = (timeframe: string) => {
        console.log('🔄 [ChartFullscreen] Timeframe change requested:', timeframe);
        console.log('📊 [ChartFullscreen] Current symbol:', chartSymbol);
        
        setCurrentTimeframe(timeframe);
        
        if (chartSymbol) {
            const mapTimeframeToBackend = (tf: string): string => {
                const mapping: Record<string, string> = {
                    '1m': 'minute',
                    '3m': '3minute',
                    '5m': '5minute',
                    '15m': '15minute',
                    '30m': '30minute',
                    '1h': '60minute',
                    '1d': 'day'
                };
                return mapping[tf] || tf;
            };
            
            const backendTimeframe = mapTimeframeToBackend(timeframe);
            console.log('📡 [ChartFullscreen] Calling fetchCandles with:', {
                symbol: chartSymbol.symbol,
                instrumentToken: chartSymbol.instrumentToken,
                backendTimeframe,
                limit: 200
            });
            
            fetchCandles(chartSymbol.symbol, chartSymbol.instrumentToken!, backendTimeframe, 200);
        } else {
            console.warn('⚠️ [ChartFullscreen] No chartSymbol available');
        }
    };

    if (!chartSymbol) {
        return (
            <div className="h-screen w-screen bg-[#0a0a0a] flex items-center justify-center text-white">
                <div className="text-center">
                    <p className="text-lg">Loading chart...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-[#0a0a0a] flex flex-col overflow-hidden">
            {/* Simple header with symbol name */}
            <div className="bg-[#131722] border-b border-[#2a2e39] px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-white font-semibold text-lg">{chartSymbol.displayName}</h1>
                    <span className="text-xs text-gray-400">Full Screen Chart</span>
                </div>
                <button
                    onClick={() => window.close()}
                    className="text-xs text-gray-400 hover:text-white px-3 py-1 rounded hover:bg-[#2a2e39] transition-colors"
                >
                    Close Window
                </button>
            </div>

            {/* Chart takes full remaining height */}
            <div className="flex-1 relative">
                {isLoading && candles.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        Loading Chart...
                    </div>
                ) : (
                    <KlineChart
                        data={candles.length > 0 ? candles : [
                            {
                                timestamp: Date.now() - 3600000,
                                open: 25000,
                                high: 25200,
                                low: 24800,
                                close: 25100,
                                volume: 1000000,
                            },
                        ]}
                        symbol={chartSymbol.symbol}
                        showVolume={false}
                        height="100%"
                        onTimeframeChange={handleTimeframeChange}
                        currentTimeframe={currentTimeframe}
                        instrumentToken={chartSymbol.instrumentToken}
                    />
                )}
            </div>
        </div>
    );
}
