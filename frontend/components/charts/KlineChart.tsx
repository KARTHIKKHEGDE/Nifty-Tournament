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
  Settings,
  ChevronDown,
  Activity,
  Square,
} from 'lucide-react';
import { registerCustomOverlays } from '../../Klineutils/klineOverlays';

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
    'cursor' | 'line' | 'brush' | 'rect' | 'rotRect'
  >('cursor');
  const [showIndicatorMenu, setShowIndicatorMenu] = useState(false);
  const [showTimeframeMenu, setShowTimeframeMenu] = useState(false);
  const [showBrushMenu, setShowBrushMenu] = useState(false);

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

        // Custom ATR indicator (your logic)
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
                  let sum = 0;
                  for (let j = 0; j < period; j++) {
                    sum += trList[j];
                  }
                  atr = sum / period;
                } else {
                  const prevAtr = result[i - 1].atr;
                  atr = (prevAtr * (period - 1) + tr) / period;
                }
              }

              result.push({ atr });
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

  // Indicator toggle (same as your logic)
  const toggleIndicator = (indicatorName: string) => {
    if (!chartInstance.current) return;

    let paneId = 'candle_pane';
    let isOverlay = true;
    let calcParams: number[] = [];

    switch (indicatorName) {
      // Trend
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

      // Momentum
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

      // Volume
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

      // Volatility
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

      // Market Strength
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
        calcParams,
      });
      setActiveIndicators([...activeIndicators, indicatorName]);
    }
    setShowIndicatorMenu(false);
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
  };

  const handleToolClick = (tool: typeof activeTool) => {
    setActiveTool(tool);
    setShowBrushMenu(false);

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
          className={`w-9 h-9 flex items-center justify-center rounded transition-colors ${
            activeTool === 'cursor'
              ? 'bg-[#2a2e39] text-white'
              : 'text-[#787b86] hover:bg-[#1e222d]'
          }`}
          title="Cursor"
        >
          <MousePointer2 className="w-4 h-4" />
        </button>

        {/* Simple line segment */}
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

        {/* Brush Menu Button */}
        <div className="relative">
          <button
            onClick={() => setShowBrushMenu((prev) => !prev)}
            className={`w-9 h-9 flex items-center justify-center rounded transition-colors ${
              activeTool === 'brush' ||
              activeTool === 'rect' ||
              activeTool === 'rotRect'
                ? 'bg-[#2a2e39] text-white'
                : 'text-[#787b86] hover:bg-[#1e222d]'
            }`}
            title="Drawing Tools"
          >
            {/* Icon: small brush-like squiggle */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 20c2-3 4-4 6-4s4 1 6-2 3-5 4-6" />
            </svg>
          </button>

          {showBrushMenu && (
            <div className="absolute left-11 top-0 bg-[#1e222d] border border-[#2a2e39] rounded shadow-lg z-50 py-1 w-40">
              <button
                onClick={() => handleToolClick('brush')}
                className="w-full px-3 py-2 text-left text-xs hover:bg-[#2a2e39] text-white"
              >
                Free Brush
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
            </div>
          )}
        </div>

        {/* Horizontal levels placeholder (you can later map to horizontalStraightLine overlay) */}
        <button
          onClick={() => {}}
          className="w-9 h-9 flex items-center justify-center rounded transition-colors text-[#787b86] hover:bg-[#1e222d]"
          title="Levels (future)"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Text tool - you can later hook to custom text overlay */}
        <button
          onClick={() => {}}
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

          {/* Settings icon */}
          <button className="w-6 h-6 flex items-center justify-center rounded text-[#787b86] hover:bg-[#1e222d] transition-colors">
            <Settings className="w-4 h-4" />
          </button>

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
                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${
                      activeIndicators.includes(key)
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
                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${
                      activeIndicators.includes(key)
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
                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${
                      activeIndicators.includes(key)
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
                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${
                      activeIndicators.includes(key)
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
                    className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${
                      activeIndicators.includes(key)
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

          {/* Settings */}
          <button className="w-8 h-8 flex items-center justify-center rounded text-[#787b86] hover:bg-[#1e222d] transition-colors">
            <Settings className="w-4 h-4" />
          </button>

          {/* Screenshot placeholder */}
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
        </div>
      </div>

      {/* Chart Area */}
      <div className="absolute top-12 left-12 right-0 bottom-0">
        <div ref={chartRef} className="w-full h-full" />
      </div>

      {/* Bottom Time Info (static for now) */}
      <div className="absolute bottom-2 right-4 text-[#787b86] text-xs z-10">
        21:42:39 (UTC+5:30)
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
