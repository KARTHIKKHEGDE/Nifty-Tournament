'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { CandleData } from '../../types';
import {
    Minus, TrendingUp, TrendingDown, Move, MousePointer2,
    Pencil, Ruler, Circle, Square, Triangle, Type, Trash2,
    Undo, Redo, Settings, ChevronLeft, ChevronRight, ChevronDown, Activity
} from 'lucide-react';

interface KlineChartProps {
    data: CandleData[];
    symbol: string;
    showVolume?: boolean;
    height?: number | string;
    onLoadMore?: () => void;
    isNiftyChart?: boolean; // If true, shows Open Positions instead of Buy/Sell buttons
    onTimeframeChange?: (timeframe: string) => void; // Callback when timeframe changes
    currentTimeframe?: string; // Current timeframe from parent
}

function KlineChartComponent({
    data,
    symbol,
    showVolume = false,
    height = 600,
    onLoadMore,
    isNiftyChart = false,
    onTimeframeChange,
    currentTimeframe,
}: KlineChartProps) {
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
    const [showTimeframeMenu, setShowTimeframeMenu] = useState(false);

    // Currently selected overlay (for delete, etc.)
    const [selectedOverlay, setSelectedOverlay] = useState<any>(null);

    // Sync selectedTimeframe with currentTimeframe prop
    useEffect(() => {
        if (currentTimeframe && currentTimeframe !== selectedTimeframe) {
            setSelectedTimeframe(currentTimeframe);
        }
    }, [currentTimeframe, selectedTimeframe]);

    // Resize handler
    useEffect(() => {
        const handleResize = () => {
            if (chartInstance.current) {
                chartInstance.current.resize();
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Init chart
    useEffect(() => {
        if (!chartRef.current) return;

        let disposeFunc: any = null;
        let mounted = true;

        import('klinecharts')
            .then((klinecharts: any) => {
                const { init, dispose, registerIndicator } = klinecharts;
                if (!chartRef.current || !mounted) return;

                // Register ATR Indicator
                registerIndicator({
                    name: 'ATR',
                    shortName: 'ATR',
                    calcParams: [14],
                    figures: [{ key: 'atr', title: 'ATR: ', type: 'line' }],
                    calc: (dataList: any[], indicator: any) => {
                        const params = indicator.calcParams;
                        const period = params[0];
                        const result: any[] = [];
                        const trList: number[] = [];

                        dataList.forEach((kLineData, i) => {
                            const prevClose =
                                i > 0 ? dataList[i - 1].close : kLineData.open;
                            const high = kLineData.high;
                            const low = kLineData.low;

                            const tr = Math.max(
                                high - low,
                                Math.abs(high - prevClose),
                                Math.abs(low - prevClose)
                            );
                            trList.push(tr);

                            let atr;
                            if (i >= period - 1) {
                                if (i === period - 1) {
                                    // First ATR is simple average of TR
                                    let sum = 0;
                                    for (let j = 0; j < period; j++) {
                                        sum += trList[j];
                                    }
                                    atr = sum / period;
                                } else {
                                    // Subsequent ATRs: (Previous ATR * (n-1) + Current TR) / n
                                    const prevAtr = result[i - 1].atr;
                                    atr =
                                        (prevAtr * (period - 1) + tr) / period;
                                }
                            }

                            result.push({ atr: atr });
                        });
                        return result;
                    },
                });

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
                        chartInstance.current.setLoadMoreDataCallback(
                            ({ timestamp }: { timestamp: number }) => {
                                onLoadMore();
                                return null;
                            }
                        );
                    }
                } catch (initError) {
                    console.error('Error initializing chart:', initError);
                }
            })
            .catch((error) => {
                console.error('Error loading klinecharts:', error);
            });

        return () => {
            mounted = false;
            if (chartInstance.current && chartRef.current && disposeFunc) {
                disposeFunc(chartRef.current);
                chartInstance.current = null;
            }
        };
    }, [showVolume, onLoadMore]);

    // Apply data to chart
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

    // Indicator toggle logic (unchanged)
    const toggleIndicator = (indicatorName: string) => {
        if (!chartInstance.current) return;

        let paneId = 'candle_pane';
        let isOverlay = true;
        let calcParams: number[] = [];

        switch (indicatorName) {
            // Trend Indicators (Overlay)
            case 'MA':
                calcParams = [5, 10, 20, 60];
                isOverlay = true;
                break;
            case 'EMA':
                calcParams = [6, 12, 26];
                isOverlay = true;
                break;
            case 'SMA':
                calcParams = [12, 26];
                isOverlay = true;
                break;
            case 'WMA':
                calcParams = [12, 26];
                isOverlay = true;
                break;
            case 'BBI':
                calcParams = [3, 6, 12, 24];
                isOverlay = true;
                break;
            case 'BOLL':
                calcParams = [20, 2];
                isOverlay = true;
                break;
            case 'SAR':
                calcParams = [2, 2, 20];
                isOverlay = true;
                break;
            case 'ICHIMOKU':
                calcParams = [26, 9, 52];
                isOverlay = true;
                break;

            // Momentum Indicators (Separate Pane)
            case 'MACD':
                calcParams = [12, 26, 9];
                isOverlay = false;
                paneId = 'macd_pane';
                break;
            case 'KDJ':
                calcParams = [9, 3, 3];
                isOverlay = false;
                paneId = 'kdj_pane';
                break;
            case 'RSI':
                calcParams = [6, 12, 24];
                isOverlay = false;
                paneId = 'rsi_pane';
                break;
            case 'WR':
                calcParams = [6, 10, 14];
                isOverlay = false;
                paneId = 'wr_pane';
                break;
            case 'ROC':
                calcParams = [12, 6];
                isOverlay = false;
                paneId = 'roc_pane';
                break;
            case 'CCI':
                calcParams = [13];
                isOverlay = false;
                paneId = 'cci_pane';
                break;
            case 'TRIX':
                calcParams = [12, 9];
                isOverlay = false;
                paneId = 'trix_pane';
                break;

            // Volume Indicators
            case 'VOL':
                calcParams = [5, 10, 20];
                isOverlay = false;
                paneId = 'volume_pane';
                break;
            case 'OBV':
                calcParams = [30];
                isOverlay = false;
                paneId = 'obv_pane';
                break;

            // Volatility Indicators
            case 'ATR':
                calcParams = [14];
                isOverlay = false;
                paneId = 'atr_pane';
                break;
            case 'BIAS':
                calcParams = [6, 12, 24];
                isOverlay = false;
                paneId = 'bias_pane';
                break;

            // Market Strength Indicators
            case 'BRAR':
                calcParams = [26];
                isOverlay = false;
                paneId = 'brar_pane';
                break;
            case 'VR':
                calcParams = [26, 6];
                isOverlay = false;
                paneId = 'vr_pane';
                break;
            case 'PSY':
                calcParams = [12, 6];
                isOverlay = false;
                paneId = 'psy_pane';
                break;
        }

        if (activeIndicators.includes(indicatorName)) {
            chartInstance.current.removeIndicator(paneId, indicatorName);
            setActiveIndicators(
                activeIndicators.filter((ind) => ind !== indicatorName)
            );
        } else {
            chartInstance.current.createIndicator(indicatorName, isOverlay, {
                id: paneId,
                calcParams: calcParams,
            });
            setActiveIndicators([...activeIndicators, indicatorName]);
        }
        setShowIndicatorMenu(false);
    };

    // 🔹 GRAWW-STYLE LINE TOOL HANDLER 🔹
    const handleToolClick = (tool: string) => {
        setActiveTool(tool);

        if (!chartInstance.current) return;

        if (tool === 'line') {
            // Create a straight line segment that finishes on second click
            chartInstance.current.createOverlay({
                name: 'segment',
                groupId: 'drawing', // so ESC can clear all drawings in this group
                mode: 'normal', // 2-click draw
                lock: false,
                styles: {
                    line: {
                        color: '#03a9f4', // Groww-style blue
                        size: 1.5,
                    },
                    point: {
                        show: true,
                        color: '#03a9f4',
                        radius: 3,
                    },
                },
                onDrawStart: (event: any) => {
                    // optional logging
                    // console.log('Line drawing started', event);
                },
                onDrawing: (event: any) => {
                    // console.log('Drawing in progress', event);
                },
                onDrawEnd: (event: any) => {
                    const overlay = event?.overlay;
                    if (overlay) {
                        setSelectedOverlay(overlay);
                    }
                    // Auto switch back to cursor after drawing one line (Groww behaviour)
                    setActiveTool('cursor');
                },
                onSelected: (event: any) => {
                    const overlay = event?.overlay;
                    if (overlay) {
                        setSelectedOverlay(overlay);
                    }
                },
                onDeselected: () => {
                    setSelectedOverlay(null);
                },
            });
        } else if (tool === 'cursor') {
            // Exit draw mode visually
            setSelectedOverlay(null);
        } else if (tool === 'levels') {
            // Future: horizontal lines / levels
        } else if (tool === 'text') {
            // Future: text annotation tool
        }
    };

    const handleClearAllOverlays = () => {
        if (chartInstance.current) {
            chartInstance.current.removeOverlay(); // no args = remove all overlays
            setSelectedOverlay(null);
        }
    };

    const handleDeleteSelectedOverlay = () => {
        if (selectedOverlay && chartInstance.current && selectedOverlay.id) {
            chartInstance.current.removeOverlay(selectedOverlay.id);
            setSelectedOverlay(null);
        }
    };

    // ESC + Delete keyboard handling
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (activeTool === 'line' && chartInstance.current) {
                    // Clear all drawing-group overlays (including in-progress)
                    chartInstance.current.removeOverlay({
                        groupId: 'drawing',
                    });
                }
                setActiveTool('cursor');
                setSelectedOverlay(null);
            }

            if (
                (e.key === 'Delete' || e.key === 'Backspace') &&
                selectedOverlay
            ) {
                e.preventDefault(); // avoid browser navigation
                handleDeleteSelectedOverlay();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeTool, selectedOverlay]);

    const isPriceUp = priceChange >= 0;
    const timeframes = ['5y', '1y', '3m', '1m', '5d', '1d'];

    return (
        <div
            className="relative bg-[#0a0a0a] overflow-hidden"
            style={{
                height:
                    typeof height === 'number' ? `${height}px` : height,
            }}
        >
            {/* Left Toolbar */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#131722] border-r border-[#2a2e39] z-20 flex flex-col items-center py-4 gap-3">
                {/* Line with dots (Groww-style line tool) */}
                <button
                    onClick={() => handleToolClick('line')}
                    className={`w-9 h-9 flex items-center justify-center rounded transition-colors ${
                        activeTool === 'line'
                            ? 'bg-[#2a2e39] text-white'
                            : 'text-[#787b86] hover:bg-[#1e222d]'
                    }`}
                    title="Trend Line"
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <circle cx="6" cy="18" r="2" />
                        <line x1="8" y1="18" x2="16" y2="6" />
                        <circle cx="18" cy="6" r="2" />
                    </svg>
                </button>

                {/* Horizontal levels placeholder */}
                <button
                    onClick={() => setActiveTool('levels')}
                    className={`w-9 h-9 flex items-center justify-center rounded transition-colors ${
                        activeTool === 'levels'
                            ? 'bg-[#2a2e39] text-white'
                            : 'text-[#787b86] hover:bg-[#1e222d]'
                    }`}
                    title="Levels"
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <line x1="4" y1="6" x2="20" y2="6" />
                        <line x1="4" y1="12" x2="20" y2="12" />
                        <line x1="4" y1="18" x2="20" y2="18" />
                        <circle cx="8" cy="6" r="1.5" fill="currentColor" />
                        <circle cx="14" cy="12" r="1.5" fill="currentColor" />
                        <circle cx="10" cy="18" r="1.5" fill="currentColor" />
                    </svg>
                </button>

                {/* Text tool placeholder */}
                <button
                    onClick={() => setActiveTool('text')}
                    className={`w-9 h-9 flex items-center justify-center rounded transition-colors ${
                        activeTool === 'text'
                            ? 'bg-[#2a2e39] text-white'
                            : 'text-[#787b86] hover:bg-[#1e222d]'
                    }`}
                    title="Text"
                >
                    <Type className="w-5 h-5" />
                </button>

                {/* Clear All Drawings */}
                <button
                    onClick={handleClearAllOverlays}
                    className="w-9 h-9 flex items-center justify-center rounded transition-colors text-red-500 hover:bg-[#1e222d]"
                    title="Clear All Drawings"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>

            {/* Top Header */}
            <div className="absolute top-0 left-12 right-0 h-12 bg-[#131722] border-b border-[#2a2e39] z-10 flex items-center justify-between px-4">
                {/* Left Section */}
                <div className="flex items-center gap-3">
                    {/* Symbol Name */}
                    <h3 className="text-white font-semibold text-sm">
                        {symbol}
                    </h3>

                    {/* Timeframe Selector */}
                    <div className="relative">
                        <button
                            onClick={() =>
                                setShowTimeframeMenu(!showTimeframeMenu)
                            }
                            className="px-3 py-1 text-xs font-medium rounded bg-[#2a2e39] text-white hover:bg-[#363a45] transition-colors flex items-center gap-1"
                        >
                            {selectedTimeframe}
                            <ChevronDown className="w-3 h-3" />
                        </button>

                        {showTimeframeMenu && (
                            <div className="absolute top-full left-0 mt-1 w-32 bg-[#1e222d] border border-[#2a2e39] rounded shadow-lg py-1 z-50">
                                {['1m', '3m', '5m', '15m', '30m', '1h', '1d'].map(
                                    (tf) => (
                                        <button
                                            key={tf}
                                            onClick={() => {
                                                setSelectedTimeframe(tf);
                                                setShowTimeframeMenu(false);
                                                if (onTimeframeChange) {
                                                    onTimeframeChange(tf);
                                                }
                                            }}
                                            className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${
                                                selectedTimeframe === tf
                                                    ? 'text-[#2962ff] bg-[#2a2e39]'
                                                    : 'text-white'
                                            }`}
                                        >
                                            {tf}
                                        </button>
                                    )
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sliders Icon */}
                    <button className="w-6 h-6 flex items-center justify-center rounded text-[#787b86] hover:bg-[#1e222d] transition-colors">
                        <Settings className="w-4 h-4" />
                    </button>

                    {/* Indicators Button */}
                    <div className="relative">
                        <button
                            onClick={() =>
                                setShowIndicatorMenu(!showIndicatorMenu)
                            }
                            className="px-3 py-1 text-xs font-medium text-[#787b86] hover:bg-[#1e222d] rounded transition-colors flex items-center gap-1"
                        >
                            <Activity className="w-3.5 h-3.5" />
                            Indicators
                        </button>

                        {showIndicatorMenu && (
                            <div className="absolute top-full left-0 mt-1 w-56 max-h-96 overflow-y-auto bg-[#1e222d] border border-[#2a2e39] rounded shadow-lg py-1 z-50">
                                {/* Trend Indicators */}
                                <div className="px-3 py-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                                    Trend
                                </div>
                                <button
                                    onClick={() => toggleIndicator('MA')}
                                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${
                                        activeIndicators.includes('MA')
                                            ? 'text-[#2962ff]'
                                            : 'text-white'
                                    }`}
                                >
                                    MA - Moving Average
                                </button>
                                <button
                                    onClick={() => toggleIndicator('EMA')}
                                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${
                                        activeIndicators.includes('EMA')
                                            ? 'text-[#2962ff]'
                                            : 'text-white'
                                    }`}
                                >
                                    EMA - Exponential MA
                                </button>
                                <button
                                    onClick={() => toggleIndicator('SMA')}
                                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${
                                        activeIndicators.includes('SMA')
                                            ? 'text-[#2962ff]'
                                            : 'text-white'
                                    }`}
                                >
                                    SMA - Smoothed MA
                                </button>
                                <button
                                    onClick={() => toggleIndicator('WMA')}
                                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${
                                        activeIndicators.includes('WMA')
                                            ? 'text-[#2962ff]'
                                            : 'text-white'
                                    }`}
                                >
                                    WMA - Weighted MA
                                </button>
                                <button
                                    onClick={() => toggleIndicator('BBI')}
                                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${
                                        activeIndicators.includes('BBI')
                                            ? 'text-[#2962ff]'
                                            : 'text-white'
                                    }`}
                                >
                                    BBI - Bull Bear Index
                                </button>
                                <button
                                    onClick={() => toggleIndicator('BOLL')}
                                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${
                                        activeIndicators.includes('BOLL')
                                            ? 'text-[#2962ff]'
                                            : 'text-white'
                                    }`}
                                >
                                    BOLL - Bollinger Bands
                                </button>
                                <button
                                    onClick={() => toggleIndicator('SAR')}
                                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${
                                        activeIndicators.includes('SAR')
                                            ? 'text-[#2962ff]'
                                            : 'text-white'
                                    }`}
                                >
                                    SAR - Parabolic SAR
                                </button>
                                <button
                                    onClick={() =>
                                        toggleIndicator('ICHIMOKU')
                                    }
                                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${
                                        activeIndicators.includes('ICHIMOKU')
                                            ? 'text-[#2962ff]'
                                            : 'text-white'
                                    }`}
                                >
                                    ICHIMOKU - Ichimoku Cloud
                                </button>

                                <div className="border-t border-[#2a2e39] my-1"></div>

                                {/* Momentum Indicators */}
                                <div className="px-3 py-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                                    Momentum
                                </div>
                                <button
                                    onClick={() => toggleIndicator('MACD')}
                                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${
                                        activeIndicators.includes('MACD')
                                            ? 'text-[#2962ff]'
                                            : 'text-white'
                                    }`}
                                >
                                    MACD
                                </button>
                                <button
                                    onClick={() => toggleIndicator('KDJ')}
                                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${
                                        activeIndicators.includes('KDJ')
                                            ? 'text-[#2962ff]'
                                            : 'text-white'
                                    }`}
                                >
                                    KDJ - Stochastic
                                </button>
                                <button
                                    onClick={() => toggleIndicator('RSI')}
                                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${
                                        activeIndicators.includes('RSI')
                                            ? 'text-[#2962ff]'
                                            : 'text-white'
                                    }`}
                                >
                                    RSI
                                </button>
                                <button
                                    onClick={() => toggleIndicator('WR')}
                                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${
                                        activeIndicators.includes('WR')
                                            ? 'text-[#2962ff]'
                                            : 'text-white'
                                    }`}
                                >
                                    WR - Williams %R
                                </button>
                                <button
                                    onClick={() => toggleIndicator('ROC')}
                                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${
                                        activeIndicators.includes('ROC')
                                            ? 'text-[#2962ff]'
                                            : 'text-white'
                                    }`}
                                >
                                    ROC - Rate of Change
                                </button>
                                <button
                                    onClick={() => toggleIndicator('CCI')}
                                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${
                                        activeIndicators.includes('CCI')
                                            ? 'text-[#2962ff]'
                                            : 'text-white'
                                    }`}
                                >
                                    CCI - Commodity Channel
                                </button>
                                <button
                                    onClick={() => toggleIndicator('TRIX')}
                                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${
                                        activeIndicators.includes('TRIX')
                                            ? 'text-[#2962ff]'
                                            : 'text-white'
                                    }`}
                                >
                                    TRIX - Triple EMA
                                </button>

                                <div className="border-t border-[#2a2e39] my-1"></div>

                                {/* Volume Indicators */}
                                <div className="px-3 py-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                                    Volume
                                </div>
                                <button
                                    onClick={() => toggleIndicator('VOL')}
                                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${
                                        activeIndicators.includes('VOL')
                                            ? 'text-[#2962ff]'
                                            : 'text-white'
                                    }`}
                                >
                                    VOL - Volume
                                </button>
                                <button
                                    onClick={() => toggleIndicator('OBV')}
                                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${
                                        activeIndicators.includes('OBV')
                                            ? 'text-[#2962ff]'
                                            : 'text-white'
                                    }`}
                                >
                                    OBV - On-Balance Volume
                                </button>

                                <div className="border-t border-[#2a2e39] my-1"></div>

                                {/* Volatility Indicators */}
                                <div className="px-3 py-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                                    Volatility
                                </div>
                                <button
                                    onClick={() => toggleIndicator('ATR')}
                                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${
                                        activeIndicators.includes('ATR')
                                            ? 'text-[#2962ff]'
                                            : 'text-white'
                                    }`}
                                >
                                    ATR - Average True Range
                                </button>
                                <button
                                    onClick={() => toggleIndicator('BIAS')}
                                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${
                                        activeIndicators.includes('BIAS')
                                            ? 'text-[#2962ff]'
                                            : 'text-white'
                                    }`}
                                >
                                    BIAS - Price Deviation
                                </button>

                                <div className="border-t border-[#2a2e39] my-1"></div>

                                {/* Market Strength */}
                                <div className="px-3 py-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                                    Market Strength
                                </div>
                                <button
                                    onClick={() => toggleIndicator('BRAR')}
                                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${
                                        activeIndicators.includes('BRAR')
                                            ? 'text-[#2962ff]'
                                            : 'text-white'
                                    }`}
                                >
                                    BRAR - Buy/Sell Power
                                </button>
                                <button
                                    onClick={() => toggleIndicator('VR')}
                                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${
                                        activeIndicators.includes('VR')
                                            ? 'text-[#2962ff]'
                                            : 'text-white'
                                    }`}
                                >
                                    VR - Volume Ratio
                                </button>
                                <button
                                    onClick={() => toggleIndicator('PSY')}
                                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${
                                        activeIndicators.includes('PSY')
                                            ? 'text-[#2962ff]'
                                            : 'text-white'
                                    }`}
                                >
                                    PSY - Psychological Line
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Undo/Redo (UI only currently) */}
                    <button className="w-6 h-6 flex items-center justify-center rounded text-[#787b86] hover:bg-[#1e222d] transition-colors">
                        <Undo className="w-4 h-4" />
                    </button>
                    <button className="w-6 h-6 flex items-center justify-center rounded text-[#787b86] hover:bg-[#1e222d] transition-colors">
                        <Redo className="w-4 h-4" />
                    </button>
                </div>

                {/* Right Section - Utility Icons */}
                <div className="flex items-center gap-2">
                    {/* Fullscreen */}
                    <button className="w-8 h-8 flex items-center justify-center rounded text-[#787b86] hover:bg-[#1e222d] transition-colors">
                        <Square className="w-4 h-4" />
                    </button>

                    {/* Settings */}
                    <button className="w-8 h-8 flex items-center justify-center rounded text-[#787b86] hover:bg-[#1e222d] transition-colors">
                        <Settings className="w-4 h-4" />
                    </button>

                    {/* Screenshot */}
                    <button className="w-8 h-8 flex items-center justify-center rounded text-[#787b86] hover:bg-[#1e222d] transition-colors">
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                        </svg>
                    </button>

                    {/* Expand */}
                    <button className="w-8 h-8 flex items-center justify-center rounded text-[#787b86] hover:bg-[#1e222d] transition-colors">
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                        </svg>
                    </button>
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
