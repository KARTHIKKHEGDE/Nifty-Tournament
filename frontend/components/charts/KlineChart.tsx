'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { CandleData } from '../../types';
import {
  Minus,
  MousePointer2,
  Type,
  Trash2,
  Undo,
  Redo,
  ChevronDown,
  Activity,
  Square,
} from 'lucide-react';
import { registerCustomOverlays } from '../../utils/klineOverlays';
import { customATRIndicator, toggleIndicator as toggleChartIndicator } from '../../utils/indicatorUtils';

interface KlineChartProps {
  data: CandleData[];
  symbol: string;
  showVolume?: boolean;
  height?: number | string;
  onLoadMore?: () => void;
  isNiftyChart?: boolean;
  onTimeframeChange?: (timeframe: string) => void;
  currentTimeframe?: string;
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
  const [activeTool, setActiveTool] = useState<
    'cursor' | 'line' | 'brush' | 'rect' | 'rotRect' | 'trendLine'
  >('cursor');
  const [showIndicatorMenu, setShowIndicatorMenu] = useState(false);
  const [showTimeframeMenu, setShowTimeframeMenu] = useState(false);
  const [showMoreToolsMenu, setShowMoreToolsMenu] = useState(false);
  const [showScreenshotMenu, setShowScreenshotMenu] = useState(false);

  const [selectedOverlay, setSelectedOverlay] = useState<any>(null);

  // Sync timeframe from parent
  useEffect(() => {
    if (currentTimeframe && currentTimeframe !== selectedTimeframe) {
      setSelectedTimeframe(currentTimeframe);
    }
  }, [currentTimeframe, selectedTimeframe]);

  // Resize handling
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

        // Register our custom overlays (brush, rect, rotated rect)
        registerCustomOverlays(klinecharts);

        // Register custom ATR indicator
        registerIndicator(customATRIndicator);

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

          // Subscribe to overlay click for selection
          chartInstance.current.subscribeAction(
            'onOverlayClick',
            (event: any) => {
              const overlay =
                event?.overlay || event?.overlayEvent?.overlay;
              if (overlay) {
                setSelectedOverlay(overlay);
              }
            }
          );

          // Deselect when clicking empty chart
          chartInstance.current.subscribeAction('onClick', (event: any) => {
            if (!event.overlay && !event.overlayEvent) {
              setSelectedOverlay(null);
            }
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
        } catch (err) {
          console.error('Error initializing chart:', err);
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

  // Apply data
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

  // Indicator toggle - uses utility function
  const toggleIndicator = (indicatorName: string) => {
    toggleChartIndicator(
      chartInstance.current,
      indicatorName,
      activeIndicators,
      setActiveIndicators,
      setShowIndicatorMenu
    );
  };

  // ============= DRAWING TOOL LOGIC =============

  const startOverlayForTool = (tool: typeof activeTool) => {
    if (!chartInstance.current) return;

    // Clear any in-progress drawing-group overlays
    // (optional, but keeps behaviour clean)
    // chartInstance.current.removeOverlay({ groupId: 'drawing-temp' });

    if (tool === 'line') {
      chartInstance.current.createOverlay({
        name: 'segment',
        groupId: 'drawing',
        mode: 'normal',
        styles: {
          line: {
            color: '#03a9f4',
            size: 1.4,
          },
        },
        onDrawEnd: (event: any) => {
          if (event?.overlay) {
            setSelectedOverlay(event.overlay);
          }
          setActiveTool('cursor');
        },
        onSelected: (event: any) => {
          if (event?.overlay) setSelectedOverlay(event.overlay);
        },
        onDeselected: () => {
          setSelectedOverlay(null);
        },
      });
    }

    if (tool === 'brush') {
      chartInstance.current.createOverlay({
        name: 'freeBrush',
        groupId: 'drawing',
        mode: 'normal',
        styles: {
          line: {
            color: '#fbc02d',
            size: 1.6,
          },
        },
        onDrawEnd: (event: any) => {
          if (event?.overlay) {
            setSelectedOverlay(event.overlay);
          }
          setActiveTool('cursor');
        },
        onSelected: (event: any) => {
          if (event?.overlay) setSelectedOverlay(event.overlay);
        },
        onDeselected: () => {
          setSelectedOverlay(null);
        },
      });
    }

    if (tool === 'rect') {
      chartInstance.current.createOverlay({
        name: 'rectBox',
        groupId: 'drawing',
        mode: 'normal',
        onDrawEnd: (event: any) => {
          if (event?.overlay) {
            setSelectedOverlay(event.overlay);
          }
          setActiveTool('cursor');
        },
        onSelected: (event: any) => {
          if (event?.overlay) setSelectedOverlay(event.overlay);
        },
        onDeselected: () => {
          setSelectedOverlay(null);
        },
      });
    }

    if (tool === 'rotRect') {
      chartInstance.current.createOverlay({
        name: 'rotatedRect',
        groupId: 'drawing',
        mode: 'normal',
        onDrawEnd: (event: any) => {
          if (event?.overlay) setSelectedOverlay(event.overlay);
          setActiveTool('cursor');
        },
        onSelected: (event: any) => {
          if (event?.overlay) setSelectedOverlay(event.overlay);
        },
        onDeselected: () => {
          setSelectedOverlay(null);
        },
      });
    }

    if (tool === 'trendLine') {
      chartInstance.current.createOverlay({
        name: 'trendLine',
        groupId: 'drawing',
        mode: 'normal',
        onDrawEnd: (event: any) => {
          if (event?.overlay) setSelectedOverlay(event.overlay);
          setActiveTool('cursor');
        },
        onSelected: (event: any) => {
          if (event?.overlay) setSelectedOverlay(event.overlay);
        },
        onDeselected: () => {
          setSelectedOverlay(null);
        },
      });
    }
  };

  const handleToolClick = (tool: typeof activeTool) => {
    setActiveTool(tool);
    setShowMoreToolsMenu(false);

    if (tool === 'cursor') {
      setSelectedOverlay(null);
      return;
    }
    startOverlayForTool(tool);
  };

  const handleClearAllOverlays = () => {
    if (chartInstance.current) {
      chartInstance.current.removeOverlay();
      setSelectedOverlay(null);
    }
  };

  const handleDeleteSelectedOverlay = () => {
    if (selectedOverlay && chartInstance.current && selectedOverlay.id) {
      chartInstance.current.removeOverlay(selectedOverlay.id);
      setSelectedOverlay(null);
    }
  };

  // ESC / Delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveTool('cursor');
        setSelectedOverlay(null);
      }

      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedOverlay
      ) {
        e.preventDefault();
        handleDeleteSelectedOverlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOverlay]);

  const isPriceUp = priceChange >= 0;

  return (
    <div
      className="relative bg-[#0a0a0a] overflow-hidden"
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    >
      {/* Left Toolbar */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#131722] border-r border-[#2a2e39] z-20 flex flex-col items-center py-4 gap-3">
        {/* Cursor */}
        <button
          onClick={() => handleToolClick('cursor')}
          className={`w-9 h-9 flex items-center justify-center rounded transition-colors ${activeTool === 'cursor'
            ? 'bg-[#2a2e39] text-white'
            : 'text-[#787b86] hover:bg-[#1e222d]'
            }`}
          title="Cursor"
        >
          <MousePointer2 className="w-4 h-4" />
        </button>

        {/* Segment Line Tool */}
        <button
          onClick={() => handleToolClick('line')}
          className={`w-9 h-9 flex items-center justify-center rounded transition-colors ${
            activeTool === 'line'
              ? 'bg-[#2a2e39] text-white'
              : 'text-[#787b86] hover:bg-[#1e222d]'
          }`}
          title="Segment Line"
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

        {/* More Tools Menu Button */}
        <div className="relative">
          <button
            onClick={() => setShowMoreToolsMenu((prev) => !prev)}
            className={`w-9 h-9 flex items-center justify-center rounded transition-colors ${activeTool === 'brush' ||
              activeTool === 'rect' ||
              activeTool === 'rotRect' ||
              activeTool === 'trendLine'
              ? 'bg-[#2a2e39] text-white'
              : 'text-[#787b86] hover:bg-[#1e222d]'
              }`}
            title="More Tools"
          >
            {/* Icon: grid/more tools icon */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </button>

          {showMoreToolsMenu && (
            <div className="absolute left-11 top-0 bg-[#1e222d] border border-[#2a2e39] rounded shadow-lg z-50 py-1 w-48">
              <button
                onClick={() => handleToolClick('trendLine')}
                className="w-full px-3 py-2 text-left text-xs hover:bg-[#2a2e39] text-white"
              >
                Multi-Point Trend
              </button>
              <button
                onClick={() => handleToolClick('rect')}
                className="w-full px-3 py-2 text-left text-xs hover:bg-[#2a2e39] text-white"
              >
                Rectangle
              </button>
              <button
                onClick={() => handleToolClick('rotRect')}
                className="w-full px-3 py-2 text-left text-xs hover:bg-[#2a2e39] text-white"
              >
                Rotated Rectangle
              </button>
              <button
                onClick={() => handleToolClick('brush')}
                className="w-full px-3 py-2 text-left text-xs hover:bg-[#2a2e39] text-white"
              >
                Free Brush
              </button>
            </div>
          )}
        </div>

        {/* Horizontal levels placeholder (you can later map to horizontalStraightLine overlay) */}
        <button
          onClick={() => { }}
          className="w-9 h-9 flex items-center justify-center rounded transition-colors text-[#787b86] hover:bg-[#1e222d]"
          title="Levels (future)"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Text tool - you can later hook to custom text overlay */}
        <button
          onClick={() => { }}
          className="w-9 h-9 flex items-center justify-center rounded transition-colors text-[#787b86] hover:bg-[#1e222d]"
          title="Text (future)"
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
          <h3 className="text-white font-semibold text-sm">{symbol}</h3>

          {/* Timeframe selector */}
          <div className="relative">
            <button
              onClick={() => setShowTimeframeMenu(!showTimeframeMenu)}
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
                      className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${selectedTimeframe === tf
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

          {/* Indicators */}
          <div className="relative">
            <button
              onClick={() => setShowIndicatorMenu(!showIndicatorMenu)}
              className="px-3 py-1 text-xs font-medium text-[#787b86] hover:bg-[#1e222d] rounded transition-colors flex items-center gap-1"
            >
              <Activity className="w-3.5 h-3.5" />
              Indicators
            </button>

            {showIndicatorMenu && (
              <div className="absolute top-full left-0 mt-1 w-56 max-h-96 overflow-y-auto bg-[#1e222d] border border-[#2a2e39] rounded shadow-lg py-1 z-50">
                {/* Trend */}
                <div className="px-3 py-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                  Trend
                </div>
                {[
                  ['MA', 'MA - Moving Average'],
                  ['EMA', 'EMA - Exponential MA'],
                  ['SMA', 'SMA - Smoothed MA'],
                  ['WMA', 'WMA - Weighted MA'],
                  ['BBI', 'BBI - Bull Bear Index'],
                  ['BOLL', 'BOLL - Bollinger Bands'],
                  ['SAR', 'SAR - Parabolic SAR'],
                  ['ICHIMOKU', 'ICHIMOKU - Ichimoku Cloud'],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => toggleIndicator(key)}
                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${activeIndicators.includes(key)
                      ? 'text-[#2962ff]'
                      : 'text-white'
                      }`}
                  >
                    {label}
                  </button>
                ))}

                <div className="border-t border-[#2a2e39] my-1" />

                {/* Momentum */}
                <div className="px-3 py-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                  Momentum
                </div>
                {[
                  'MACD',
                  'KDJ',
                  'RSI',
                  'WR',
                  'ROC',
                  'CCI',
                  'TRIX',
                ].map((key) => (
                  <button
                    key={key}
                    onClick={() => toggleIndicator(key)}
                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${activeIndicators.includes(key)
                      ? 'text-[#2962ff]'
                      : 'text-white'
                      }`}
                  >
                    {key}
                  </button>
                ))}

                <div className="border-t border-[#2a2e39] my-1" />

                {/* Volume */}
                <div className="px-3 py-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                  Volume
                </div>
                {['VOL', 'OBV'].map((key) => (
                  <button
                    key={key}
                    onClick={() => toggleIndicator(key)}
                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${activeIndicators.includes(key)
                      ? 'text-[#2962ff]'
                      : 'text-white'
                      }`}
                  >
                    {key}
                  </button>
                ))}

                <div className="border-t border-[#2a2e39] my-1" />

                {/* Volatility */}
                <div className="px-3 py-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                  Volatility
                </div>
                {['ATR', 'BIAS'].map((key) => (
                  <button
                    key={key}
                    onClick={() => toggleIndicator(key)}
                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${activeIndicators.includes(key)
                      ? 'text-[#2962ff]'
                      : 'text-white'
                      }`}
                  >
                    {key}
                  </button>
                ))}

                <div className="border-t border-[#2a2e39] my-1" />

                {/* Market Strength */}
                <div className="px-3 py-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                  Market Strength
                </div>
                {['BRAR', 'VR', 'PSY'].map((key) => (
                  <button
                    key={key}
                    onClick={() => toggleIndicator(key)}
                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${activeIndicators.includes(key)
                      ? 'text-[#2962ff]'
                      : 'text-white'
                      }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Undo / Redo (UI only now) */}
          <button className="w-6 h-6 flex items-center justify-center rounded text-[#787b86] hover:bg-[#1e222d] transition-colors">
            <Undo className="w-4 h-4" />
          </button>
          <button className="w-6 h-6 flex items-center justify-center rounded text-[#787b86] hover:bg-[#1e222d] transition-colors">
            <Redo className="w-4 h-4" />
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Fullscreen placeholder */}
          <button className="w-8 h-8 flex items-center justify-center rounded text-[#787b86] hover:bg-[#1e222d] transition-colors">
            <Square className="w-4 h-4" />
          </button>

          {/* Screenshot Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowScreenshotMenu(!showScreenshotMenu)}
              className="w-8 h-8 flex items-center justify-center rounded text-[#787b86] hover:bg-[#1e222d] transition-colors"
            >
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

            {showScreenshotMenu && (
              <div className="absolute right-0 top-10 bg-[#1e222d] border border-[#2a2e39] rounded shadow-lg z-50 py-1 w-52">
                <button
                  onClick={() => {
                    // TODO: Implement save chart image functionality
                    console.log('Save chart image');
                    setShowScreenshotMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-[#2a2e39] text-white flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Save chart image
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement copy chart image functionality
                    console.log('Copy chart image');
                    setShowScreenshotMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-[#2a2e39] text-white flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy chart image
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="absolute top-12 left-12 right-0 bottom-8">
        <div ref={chartRef} className="w-full h-full" />
      </div>

      {/* Bottom Timeframe Bar (TradingView Style) */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-[#131722] border-t border-[#2a2e39] flex items-center justify-between px-3 z-10">
        {/* Left: Timeframe Buttons */}
        <div className="flex items-center gap-1">
          {[
            { label: '1d', value: '1m' },
            { label: '5d', value: '5m' },
            { label: '1m', value: '15m' },
            { label: '3m', value: '30m' },
            { label: '6m', value: '1h' },
            { label: '1y', value: '1d' },
            { label: '5y', value: '1w' },
            { label: 'All', value: 'all' },
          ].map((tf) => (
            <button
              key={tf.value}
              onClick={() => {
                setSelectedTimeframe(tf.value);
                onTimeframeChange?.(tf.value);
              }}
              className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors ${selectedTimeframe === tf.value
                ? 'bg-[#2962ff] text-white'
                : 'text-[#787b86] hover:text-white hover:bg-[#1e222d]'
                }`}
            >
              {tf.label}
            </button>
          ))}

          {/* Zoom Reset Button */}
          <button className="ml-2 w-5 h-5 flex items-center justify-center rounded text-[#787b86] hover:text-white hover:bg-[#1e222d] transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        {/* Right: Time Display, % / log / auto */}
        <div className="flex items-center gap-4">
          {/* Current Time */}
          <div className="text-[#787b86] text-[11px] font-medium">
            {new Date().toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })} UTC+5:30
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-[#2a2e39]" />

          {/* % / log / auto Toggle */}
          <div className="flex items-center gap-1">
            <button className="px-2 py-0.5 text-[11px] font-medium text-[#787b86] hover:text-white transition-colors">
              %
            </button>
            <button className="px-2 py-0.5 text-[11px] font-medium text-[#787b86] hover:text-white transition-colors">
              log
            </button>
            <button className="px-2 py-0.5 text-[11px] font-medium text-[#2962ff] transition-colors">
              auto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(KlineChartComponent), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px] bg-[#0a0a0a]">
      <div className="text-[#787b86]">Loading chart...</div>
    </div>
  ),
});
