'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { CandleData } from '../../types';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface KlineChartProps {
    data: CandleData[];
    symbol: string;
    showVolume?: boolean;
    height?: number;
    onLoadMore?: () => void;
}

function KlineChartComponent({ data, symbol, showVolume = false, height = 600, onLoadMore }: KlineChartProps) {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<any>(null);
    const [currentPrice, setCurrentPrice] = useState<number>(0);
    const [priceChange, setPriceChange] = useState<number>(0);
    const [priceChangePercent, setPriceChangePercent] = useState<number>(0);
    const [activeIndicators, setActiveIndicators] = useState<string[]>(['MA']);
    const [chartReady, setChartReady] = useState(false);

    useEffect(() => {
        console.log('Chart init useEffect triggered, chartRef.current:', !!chartRef.current);
        if (!chartRef.current) {
            console.log('No chartRef, returning');
            return;
        }

        let disposeFunc: any = null;
        let mounted = true;

        console.log('Loading klinecharts...');
        import('klinecharts').then(({ init, dispose }) => {
            console.log('Klinecharts loaded successfully');
            if (!chartRef.current || !mounted) {
                console.log('chartRef lost or unmounted during import');
                return;
            }

            disposeFunc = dispose;

            console.log('Initializing chart with container:', chartRef.current);
            console.log('Container dimensions:', {
                width: chartRef.current.offsetWidth,
                height: chartRef.current.offsetHeight
            });

            try {
                chartInstance.current = init(chartRef.current, {
                    styles: {
                        grid: {
                            show: true,
                            horizontal: {
                                show: true,
                                size: 1,
                                color: '#1e293b',
                                style: 'solid',
                            },
                            vertical: {
                                show: true,
                                size: 1,
                                color: '#1e293b',
                                style: 'solid',
                            },
                        },
                        candle: {
                            type: 'candle_solid',
                            bar: {
                                upColor: '#22c55e',
                                downColor: '#ef4444',
                                noChangeColor: '#64748b',
                                upBorderColor: '#22c55e',
                                downBorderColor: '#ef4444',
                                noChangeBorderColor: '#64748b',
                                upWickColor: '#22c55e',
                                downWickColor: '#ef4444',
                                noChangeWickColor: '#64748b',
                            },
                            tooltip: {
                                showRule: 'always',
                                showType: 'standard',
                                labels: ['O: ', 'H: ', 'L: ', 'C: ', 'Vol: '],
                                text: {
                                    size: 12,
                                    family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                                    weight: '500',
                                    color: '#e2e8f0',
                                },
                            },
                        },
                        indicator: {
                            tooltip: {
                                showRule: 'always',
                                showType: 'standard',
                                text: {
                                    size: 12,
                                    family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                                    weight: '500',
                                    color: '#e2e8f0',
                                },
                            },
                            bars: [
                                {
                                    style: 'solid',
                                    color: '#3b82f6',
                                    size: 2,
                                },
                                {
                                    style: 'solid',
                                    color: '#f59e0b',
                                    size: 2,
                                },
                                {
                                    style: 'solid',
                                    color: '#8b5cf6',
                                    size: 2,
                                },
                            ],
                        },
                        xAxis: {
                            show: true,
                            axisLine: {
                                show: true,
                                color: '#334155',
                                size: 1,
                            },
                            tickLine: {
                                show: true,
                                length: 4,
                                color: '#334155',
                                size: 1,
                            },
                            tickText: {
                                show: true,
                                color: '#94a3b8',
                                family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                                size: 11,
                                weight: '500',
                            },
                        },
                        yAxis: {
                            show: true,
                            position: 'right',
                            type: 'normal',
                            inside: false,
                            reverse: false,
                            axisLine: {
                                show: true,
                                color: '#334155',
                                size: 1,
                            },
                            tickLine: {
                                show: true,
                                length: 4,
                                color: '#334155',
                                size: 1,
                            },
                            tickText: {
                                show: true,
                                color: '#94a3b8',
                                family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                                size: 11,
                                weight: '500',
                            },
                        },
                        crosshair: {
                            show: true,
                            horizontal: {
                                show: true,
                                line: {
                                    show: true,
                                    style: 'solid',
                                    dashValue: [4, 4],
                                    size: 1,
                                    color: '#3b82f6',
                                },
                                text: {
                                    show: true,
                                    color: '#ffffff',
                                    size: 11,
                                    family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                                    weight: '600',
                                    backgroundColor: '#3b82f6',
                                    borderRadius: 4,
                                    paddingLeft: 8,
                                    paddingRight: 8,
                                    paddingTop: 4,
                                    paddingBottom: 4,
                                },
                            },
                            vertical: {
                                show: true,
                                line: {
                                    show: true,
                                    style: 'solid',
                                    dashValue: [4, 4],
                                    size: 1,
                                    color: '#3b82f6',
                                },
                                text: {
                                    show: true,
                                    color: '#ffffff',
                                    size: 11,
                                    family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                                    weight: '600',
                                    backgroundColor: '#3b82f6',
                                    borderRadius: 4,
                                    paddingLeft: 8,
                                    paddingRight: 8,
                                    paddingTop: 4,
                                    paddingBottom: 4,
                                },
                            },
                        },
                    },
                });

                console.log('Chart initialized:', chartInstance.current);

                chartInstance.current.createIndicator('MA', true, {
                    id: 'candle_pane',
                    calcParams: [5, 10, 20, 30],
                });
                console.log('MA indicator created');

                if (showVolume) {
                    chartInstance.current.createIndicator('VOL', false, {
                        id: 'volume_pane',
                    });
                    console.log('VOL indicator created');
                }

                setChartReady(true);
                console.log('Chart ready set to true');

                // Setup lazy loading
                if (onLoadMore) {
                    chartInstance.current.setLoadMoreDataCallback(({ timestamp }: { timestamp: number }) => {
                        console.log('Load more triggered at timestamp:', timestamp);
                        onLoadMore();
                        // Return null to stop internal loading animation if any, 
                        // or we could return a promise if we wanted to handle it strictly inside.
                        // Since we update props, we return null here and let the prop update handle new data.
                        return null;
                    });
                }
            } catch (initError) {
                console.error('Error initializing chart:', initError);
            }
        }).catch((error) => {
            console.error('Error loading klinecharts:', error);
        });

        return () => {
            mounted = false;
            if (chartInstance.current && chartRef.current && disposeFunc) {
                disposeFunc(chartRef.current);
                chartInstance.current = null;
            }
        };
    }, [showVolume]);

    useEffect(() => {
        if (chartInstance.current && data.length > 0 && chartReady) {
            console.log('Applying data to chart:', data.length, 'candles');

            const formattedData = data.map((candle) => ({
                timestamp: candle.timestamp,
                open: candle.open,
                high: candle.high,
                low: candle.low,
                close: candle.close,
                volume: candle.volume || 0,
            }));

            console.log('Formatted data sample:', formattedData[0]);

            try {
                chartInstance.current.applyNewData(formattedData);
                console.log('Chart data applied successfully');
            } catch (error) {
                console.error('Error applying chart data:', error);
            }

            const latestCandle = data[data.length - 1];
            const firstCandle = data[0];
            if (latestCandle && firstCandle) {
                setCurrentPrice(latestCandle.close);
                const change = latestCandle.close - firstCandle.open;
                const changePercent = (change / firstCandle.open) * 100;
                setPriceChange(change);
                setPriceChangePercent(changePercent);
                console.log('Price updated:', latestCandle.close);
            }
        } else {
            console.log('Chart not ready or no data:', {
                hasChart: !!chartInstance.current,
                dataLength: data.length,
                chartReady
            });
        }
    }, [data, chartReady]);

    const toggleIndicator = (indicatorName: string) => {
        if (!chartInstance.current) return;

        if (activeIndicators.includes(indicatorName)) {
            chartInstance.current.removeIndicator(indicatorName);
            setActiveIndicators(activeIndicators.filter(ind => ind !== indicatorName));
        } else {
            let paneId = 'candle_pane';
            let isOverlay = true;
            let calcParams: number[] = [];

            switch (indicatorName) {
                case 'MA':
                    calcParams = [5, 10, 20, 30];
                    isOverlay = true;
                    break;
                case 'EMA':
                    calcParams = [9, 12, 26];
                    isOverlay = true;
                    break;
                case 'BOLL':
                    calcParams = [20, 2];
                    isOverlay = true;
                    break;
                case 'RSI':
                    calcParams = [14];
                    isOverlay = false;
                    paneId = 'rsi_pane';
                    break;
                case 'MACD':
                    calcParams = [12, 26, 9];
                    isOverlay = false;
                    paneId = 'macd_pane';
                    break;
            }

            chartInstance.current.createIndicator(indicatorName, isOverlay, {
                id: paneId,
                calcParams: calcParams,
            });

            setActiveIndicators([...activeIndicators, indicatorName]);
        }
    };

    const isPriceUp = priceChange >= 0;

    return (
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl overflow-hidden border border-slate-700/50 shadow-2xl">
            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-md border-b border-slate-700/50">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                                <Activity className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white tracking-tight">{symbol}</h3>
                                <p className="text-xs text-slate-400 font-medium">Live Chart</p>
                            </div>
                        </div>

                        {currentPrice > 0 && (
                            <div className="flex items-center gap-4 pl-6 border-l border-slate-700">
                                <div>
                                    <p className="text-2xl font-bold text-white tabular-nums">
                                        ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {isPriceUp ? (
                                            <TrendingUp className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <TrendingDown className="w-4 h-4 text-red-500" />
                                        )}
                                        <span className={`text-sm font-semibold tabular-nums ${isPriceUp ? 'text-green-500' : 'text-red-500'}`}>
                                            {isPriceUp ? '+' : ''}{priceChange.toFixed(2)} ({isPriceUp ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/50">
                            <span className="text-xs font-semibold text-slate-300">Candlestick</span>
                        </div>

                        <button
                            onClick={() => toggleIndicator('MA')}
                            className={`px-3 py-1.5 rounded-lg border transition-colors ${activeIndicators.includes('MA')
                                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                                : 'bg-slate-800/50 border-slate-700/30 text-slate-400 hover:border-slate-600'
                                }`}
                        >
                            <span className="text-xs font-semibold">MA</span>
                        </button>

                        <button
                            onClick={() => toggleIndicator('EMA')}
                            className={`px-3 py-1.5 rounded-lg border transition-colors ${activeIndicators.includes('EMA')
                                ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                                : 'bg-slate-800/50 border-slate-700/30 text-slate-400 hover:border-slate-600'
                                }`}
                        >
                            <span className="text-xs font-semibold">EMA</span>
                        </button>

                        <button
                            onClick={() => toggleIndicator('BOLL')}
                            className={`px-3 py-1.5 rounded-lg border transition-colors ${activeIndicators.includes('BOLL')
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                : 'bg-slate-800/50 border-slate-700/30 text-slate-400 hover:border-slate-600'
                                }`}
                        >
                            <span className="text-xs font-semibold">BB</span>
                        </button>

                        <button
                            onClick={() => toggleIndicator('RSI')}
                            className={`px-3 py-1.5 rounded-lg border transition-colors ${activeIndicators.includes('RSI')
                                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                : 'bg-slate-800/50 border-slate-700/30 text-slate-400 hover:border-slate-600'
                                }`}
                        >
                            <span className="text-xs font-semibold">RSI</span>
                        </button>

                        <button
                            onClick={() => toggleIndicator('MACD')}
                            className={`px-3 py-1.5 rounded-lg border transition-colors ${activeIndicators.includes('MACD')
                                ? 'bg-pink-500/10 border-pink-500/30 text-pink-400'
                                : 'bg-slate-800/50 border-slate-700/30 text-slate-400 hover:border-slate-600'
                                }`}
                        >
                            <span className="text-xs font-semibold">MACD</span>
                        </button>

                        {showVolume && (
                            <div className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30">
                                <span className="text-xs font-semibold text-purple-400">Volume</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="pt-20">
                <div ref={chartRef} style={{ height: `${height}px`, width: '100%' }} />
            </div>

            <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-md border-t border-slate-700/50">
                <div className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="font-medium">Real-time Data</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">Scroll</kbd>
                            <span>Zoom</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">Drag</kbd>
                            <span>Pan</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">Click</kbd>
                            <span>Crosshair</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Export with dynamic import to avoid SSR
export default dynamic(() => Promise.resolve(KlineChartComponent), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-[600px] bg-slate-900 rounded-xl">
            <div className="text-slate-400">Loading chart...</div>
        </div>
    ),
});
