'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { CandleData } from '../../types';
import {
    Plus, Minus, TrendingUp, TrendingDown, Move, MousePointer2,
    Pencil, Ruler, Circle, Square, Triangle, Type, Trash2,
    Undo, Redo, Settings, ChevronLeft, ChevronRight, Activity
} from 'lucide-react';

interface KlineChartProps {
    data: CandleData[];
    symbol: string;
    showVolume?: boolean;
    height?: number;
    onLoadMore?: () => void;
    isNiftyChart?: boolean; // If true, shows Open Positions instead of Buy/Sell buttons
}

function KlineChartComponent({ data, symbol, showVolume = true, height = 600, onLoadMore, isNiftyChart = false }: KlineChartProps) {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<any>(null);
    const [currentPrice, setCurrentPrice] = useState<number>(0);
    const [priceChange, setPriceChange] = useState<number>(0);
    const [priceChangePercent, setPriceChangePercent] = useState<number>(0);
    const [activeIndicators, setActiveIndicators] = useState<string[]>([]);
    const [chartReady, setChartReady] = useState(false);
    const [selectedTimeframe, setSelectedTimeframe] = useState('5m');
    const [activeTool, setActiveTool] = useState<string>('cursor');
    const [showIndicatorMenu, setShowIndicatorMenu] = useState(false);

    useEffect(() => {
        if (!chartRef.current) return;

        let disposeFunc: any = null;
        let mounted = true;

        import('klinecharts').then(({ init, dispose }) => {
            if (!chartRef.current || !mounted) return;

            disposeFunc = dispose;

            try {
                chartInstance.current = init(chartRef.current, {
                    styles: {
                        grid: {
                            show: true,
                            horizontal: {
                                show: true,
                                size: 1,
                                color: '#1a1a1a',
                                style: 'dashed',
                            },
                            vertical: {
                                show: true,
                                size: 1,
                                color: '#1a1a1a',
                                style: 'dashed',
                            },
                        },
                        candle: {
                            type: 'candle_solid',
                            bar: {
                                upColor: '#26a69a',
                                downColor: '#ef5350',
                                noChangeColor: '#888888',
                                upBorderColor: '#26a69a',
                                downBorderColor: '#ef5350',
                                noChangeBorderColor: '#888888',
                                upWickColor: '#26a69a',
                                downWickColor: '#ef5350',
                                noChangeWickColor: '#888888',
                            },
                            tooltip: {
                                showRule: 'always',
                                showType: 'standard',
                                labels: ['O', 'H', 'L', 'C'],
                                text: {
                                    size: 11,
                                    family: 'Arial, sans-serif',
                                    weight: 'normal',
                                    color: '#ffffff',
                                },
                            },
                        },
                        indicator: {
                            tooltip: {
                                showRule: 'always',
                                showType: 'standard',
                                text: {
                                    size: 11,
                                    family: 'Arial, sans-serif',
                                    weight: 'normal',
                                    color: '#ffffff',
                                },
                            },
                            bars: [
                                {
                                    style: 'solid',
                                    color: '#2962ff',
                                    size: 1,
                                },
                                {
                                    style: 'solid',
                                    color: '#ff6d00',
                                    size: 1,
                                },
                                {
                                    style: 'solid',
                                    color: '#ab47bc',
                                    size: 1,
                                },
                            ],
                        },
                        xAxis: {
                            show: true,
                            axisLine: {
                                show: true,
                                color: '#2a2a2a',
                                size: 1,
                            },
                            tickLine: {
                                show: false,
                            },
                            tickText: {
                                show: true,
                                color: '#888888',
                                family: 'Arial, sans-serif',
                                size: 11,
                                weight: 'normal',
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
                                color: '#2a2a2a',
                                size: 1,
                            },
                            tickLine: {
                                show: false,
                            },
                            tickText: {
                                show: true,
                                color: '#888888',
                                family: 'Arial, sans-serif',
                                size: 11,
                                weight: 'normal',
                            },
                        },
                        crosshair: {
                            show: true,
                            horizontal: {
                                show: true,
                                line: {
                                    show: true,
                                    style: 'dashed',
                                    dashValue: [4, 2],
                                    size: 1,
                                    color: '#888888',
                                },
                                text: {
                                    show: true,
                                    color: '#ffffff',
                                    size: 11,
                                    family: 'Arial, sans-serif',
                                    weight: 'normal',
                                    backgroundColor: '#888888',
                                    borderRadius: 2,
                                    paddingLeft: 4,
                                    paddingRight: 4,
                                    paddingTop: 2,
                                    paddingBottom: 2,
                                },
                            },
                            vertical: {
                                show: true,
                                line: {
                                    show: true,
                                    style: 'dashed',
                                    dashValue: [4, 2],
                                    size: 1,
                                    color: '#888888',
                                },
                                text: {
                                    show: true,
                                    color: '#ffffff',
                                    size: 11,
                                    family: 'Arial, sans-serif',
                                    weight: 'normal',
                                    backgroundColor: '#888888',
                                    borderRadius: 2,
                                    paddingLeft: 4,
                                    paddingRight: 4,
                                    paddingTop: 2,
                                    paddingBottom: 2,
                                },
                            },
                        },
                    },
                });

                if (showVolume) {
                    chartInstance.current.createIndicator('VOL', false, {
                        id: 'volume_pane',
                        height: 80,
                    });
                }

                setChartReady(true);

                if (onLoadMore) {
                    chartInstance.current.setLoadMoreDataCallback(({ timestamp }: { timestamp: number }) => {
                        onLoadMore();
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
            const formattedData = data.map((candle) => ({
                timestamp: candle.timestamp,
                open: candle.open,
                high: candle.high,
                low: candle.low,
                close: candle.close,
                volume: candle.volume || 0,
            }));

            try {
                chartInstance.current.applyNewData(formattedData);
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
            }
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
                    calcParams = [9];
                    isOverlay = true;
                    break;
                case 'EMA':
                    calcParams = [9, 21];
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
        setShowIndicatorMenu(false);
    };

    const isPriceUp = priceChange >= 0;
    const timeframes = ['5y', '1y', '3m', '1m', '5d', '1d'];

    return (
        <div className="relative bg-[#0a0a0a] overflow-hidden" style={{ height: `${height}px` }}>
            {/* Left Toolbar */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#131722] border-r border-[#2a2e39] z-20 flex flex-col items-center py-4 gap-1">
                <button
                    onClick={() => setActiveTool('cursor')}
                    className={`w-9 h-9 flex items-center justify-center rounded transition-colors ${activeTool === 'cursor' ? 'bg-[#2962ff] text-white' : 'text-[#787b86] hover:bg-[#1e222d]'
                        }`}
                    title="Cursor"
                >
                    <MousePointer2 className="w-4 h-4" />
                </button>
                <button
                    onClick={() => setActiveTool('crosshair')}
                    className={`w-9 h-9 flex items-center justify-center rounded transition-colors ${activeTool === 'crosshair' ? 'bg-[#2962ff] text-white' : 'text-[#787b86] hover:bg-[#1e222d]'
                        }`}
                    title="Crosshair"
                >
                    <Plus className="w-4 h-4" />
                </button>

                <div className="w-8 h-px bg-[#2a2e39] my-2"></div>

                <button
                    onClick={() => setActiveTool('trendline')}
                    className={`w-9 h-9 flex items-center justify-center rounded transition-colors ${activeTool === 'trendline' ? 'bg-[#2962ff] text-white' : 'text-[#787b86] hover:bg-[#1e222d]'
                        }`}
                    title="Trend Line"
                >
                    <Pencil className="w-4 h-4" />
                </button>
                <button
                    onClick={() => setActiveTool('horizontal')}
                    className={`w-9 h-9 flex items-center justify-center rounded transition-colors ${activeTool === 'horizontal' ? 'bg-[#2962ff] text-white' : 'text-[#787b86] hover:bg-[#1e222d]'
                        }`}
                    title="Horizontal Line"
                >
                    <Minus className="w-4 h-4" />
                </button>
                <button
                    onClick={() => setActiveTool('rectangle')}
                    className={`w-9 h-9 flex items-center justify-center rounded transition-colors ${activeTool === 'rectangle' ? 'bg-[#2962ff] text-white' : 'text-[#787b86] hover:bg-[#1e222d]'
                        }`}
                    title="Rectangle"
                >
                    <Square className="w-4 h-4" />
                </button>
                <button
                    onClick={() => setActiveTool('circle')}
                    className={`w-9 h-9 flex items-center justify-center rounded transition-colors ${activeTool === 'circle' ? 'bg-[#2962ff] text-white' : 'text-[#787b86] hover:bg-[#1e222d]'
                        }`}
                    title="Circle"
                >
                    <Circle className="w-4 h-4" />
                </button>

                <div className="w-8 h-px bg-[#2a2e39] my-2"></div>

                <button
                    className="w-9 h-9 flex items-center justify-center rounded text-[#787b86] hover:bg-[#1e222d] transition-colors"
                    title="Measure"
                >
                    <Ruler className="w-4 h-4" />
                </button>
                <button
                    className="w-9 h-9 flex items-center justify-center rounded text-[#787b86] hover:bg-[#1e222d] transition-colors"
                    title="Zoom In"
                >
                    <Plus className="w-4 h-4" />
                </button>
                <button
                    className="w-9 h-9 flex items-center justify-center rounded text-[#787b86] hover:bg-[#1e222d] transition-colors"
                    title="Zoom Out"
                >
                    <Minus className="w-4 h-4" />
                </button>

                <div className="flex-1"></div>

                <button
                    className="w-9 h-9 flex items-center justify-center rounded text-[#787b86] hover:bg-[#1e222d] transition-colors"
                    title="Settings"
                >
                    <Settings className="w-4 h-4" />
                </button>
            </div>

            {/* Top Header */}
            <div className="absolute top-0 left-12 right-0 h-12 bg-[#131722] border-b border-[#2a2e39] z-10 flex items-center justify-between px-4">
                {/* Left: Symbol and Price Info */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-white font-semibold text-sm">{symbol}</h3>
                        <span className="text-[#787b86] text-xs">NSE</span>
                    </div>

                    {currentPrice > 0 && (
                        <>
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-semibold ${isPriceUp ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                                    {currentPrice.toFixed(2)}
                                </span>
                                <span className={`text-xs ${isPriceUp ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                                    {isPriceUp ? '+' : ''}{priceChange.toFixed(2)}
                                </span>
                                <span className={`text-xs ${isPriceUp ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                                    ({isPriceUp ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                                </span>
                            </div>
                            <div className="text-[#787b86] text-xs">
                                Volume SMA 9 <span className="text-[#ef5350]">91.036K</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Center: Timeframe Selector */}
                <div className="flex items-center gap-1">
                    {timeframes.map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setSelectedTimeframe(tf)}
                            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${selectedTimeframe === tf
                                ? 'bg-[#2962ff] text-white'
                                : 'text-[#787b86] hover:bg-[#1e222d]'
                                }`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>

                {/* Right: Indicators and Actions */}
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <button
                            onClick={() => setShowIndicatorMenu(!showIndicatorMenu)}
                            className="px-3 py-1.5 text-xs font-medium text-[#787b86] hover:bg-[#1e222d] rounded transition-colors flex items-center gap-1"
                        >
                            <Activity className="w-3.5 h-3.5" />
                            Indicators
                        </button>

                        {showIndicatorMenu && (
                            <div className="absolute top-full right-0 mt-1 w-48 bg-[#1e222d] border border-[#2a2e39] rounded shadow-lg py-1">
                                <button
                                    onClick={() => toggleIndicator('MA')}
                                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${activeIndicators.includes('MA') ? 'text-[#2962ff]' : 'text-white'
                                        }`}
                                >
                                    Moving Average
                                </button>
                                <button
                                    onClick={() => toggleIndicator('EMA')}
                                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${activeIndicators.includes('EMA') ? 'text-[#2962ff]' : 'text-white'
                                        }`}
                                >
                                    EMA
                                </button>
                                <button
                                    onClick={() => toggleIndicator('BOLL')}
                                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${activeIndicators.includes('BOLL') ? 'text-[#2962ff]' : 'text-white'
                                        }`}
                                >
                                    Bollinger Bands
                                </button>
                                <button
                                    onClick={() => toggleIndicator('RSI')}
                                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${activeIndicators.includes('RSI') ? 'text-[#2962ff]' : 'text-white'
                                        }`}
                                >
                                    RSI
                                </button>
                                <button
                                    onClick={() => toggleIndicator('MACD')}
                                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${activeIndicators.includes('MACD') ? 'text-[#2962ff]' : 'text-white'
                                        }`}
                                >
                                    MACD
                                </button>
                            </div>
                        )}
                    </div>


                    {isNiftyChart ? (
                        // For NIFTY: Show Open Positions button
                        <button className="px-4 py-1.5 flex items-center justify-center rounded bg-[#2962ff] text-white text-xs font-semibold hover:bg-[#1e53e5] transition-colors">
                            Open Positions
                        </button>
                    ) : (
                        // For Options: Show Buy and Sell buttons
                        <>
                            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#26a69a] text-white text-xs font-bold hover:bg-[#1f8a7f] transition-colors">
                                B
                            </button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#ef5350] text-white text-xs font-bold hover:bg-[#d84946] transition-colors">
                                S
                            </button>
                        </>
                    )}

                </div>
            </div>

            {/* Chart Area */}
            <div className="absolute top-12 left-12 right-0 bottom-0">
                <div ref={chartRef} className="w-full h-full" />
            </div>

            {/* Bottom Time Info */}
            <div className="absolute bottom-2 right-4 text-[#787b86] text-xs z-10">
                21:42:39 (UTC+5:30)
            </div>
        </div>
    );
}

// Export with dynamic import to avoid SSR
export default dynamic(() => Promise.resolve(KlineChartComponent), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-[600px] bg-[#0a0a0a]">
            <div className="text-[#787b86]">Loading chart...</div>
        </div>
    ),
});
