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
import TextInputModal from '../modals/TextInputModal';

interface KlineChartProps {
  data: CandleData[];
  symbol: string;
  showVolume?: boolean;
  height?: number | string;
  onLoadMore?: () => void;
  isNiftyChart?: boolean;
  onTimeframeChange?: (timeframe: string) => void;
  currentTimeframe?: string;
  instrumentToken?: number;
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
  instrumentToken,
}: KlineChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);
  const timeframeMenuRef = useRef<HTMLDivElement>(null);
  const indicatorMenuRef = useRef<HTMLDivElement>(null);
  const moreToolsMenuRef = useRef<HTMLDivElement>(null);
  const advancedToolsMenuRef = useRef<HTMLDivElement>(null);
  const screenshotMenuRef = useRef<HTMLDivElement>(null);

  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);
  const [activeIndicators, setActiveIndicators] = useState<string[]>([]);
  const [chartReady, setChartReady] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('5m');
  const [activeTool, setActiveTool] = useState<
    'cursor' | 'line' | 'rect' | 'rotRect' | 'trendLine' | 'fibonacci' | 'longPosition' | 'shortPosition' | 'datePriceRange' | 'text'
  >('cursor');
  const [showIndicatorMenu, setShowIndicatorMenu] = useState(false);
  const [showTimeframeMenu, setShowTimeframeMenu] = useState(false);
  const [showMoreToolsMenu, setShowMoreToolsMenu] = useState(false);
  const [showAdvancedToolsMenu, setShowAdvancedToolsMenu] = useState(false);
  const [showScreenshotMenu, setShowScreenshotMenu] = useState(false);

  // Text input modal state
  const [showTextModal, setShowTextModal] = useState(false);
  const [textModalValue, setTextModalValue] = useState('');
  const textModalCallbackRef = useRef<((text: string | null) => void) | null>(null);

  const [selectedOverlay, setSelectedOverlay] = useState<any>(null);
  const [overlayHistory, setOverlayHistory] = useState<string[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const overlayDataRef = useRef<Map<string, any>>(new Map()); // Current overlays on chart
  const overlayDataStore = useRef<Map<string, any>>(new Map()); // Permanent storage for all overlay data

  // Y-axis mode state
  const [yAxisMode, setYAxisMode] = useState<'normal' | 'percent' | 'log'>('normal');
  const [isAutoActive, setIsAutoActive] = useState(true); // Track if auto is manually activated
  const refPriceRef = useRef<number>(0); // Reference price for percent mode

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

  // Click outside handler to close all menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside timeframe menu
      if (timeframeMenuRef.current && !timeframeMenuRef.current.contains(event.target as Node)) {
        setShowTimeframeMenu(false);
      }
      // Check if click is outside indicator menu
      if (indicatorMenuRef.current && !indicatorMenuRef.current.contains(event.target as Node)) {
        setShowIndicatorMenu(false);
      }
      // Check if click is outside more tools menu
      if (moreToolsMenuRef.current && !moreToolsMenuRef.current.contains(event.target as Node)) {
        setShowMoreToolsMenu(false);
      }
      // Check if click is outside advanced tools menu
      if (advancedToolsMenuRef.current && !advancedToolsMenuRef.current.contains(event.target as Node)) {
        setShowAdvancedToolsMenu(false);
      }
      // Check if click is outside screenshot menu
      if (screenshotMenuRef.current && !screenshotMenuRef.current.contains(event.target as Node)) {
        setShowScreenshotMenu(false);
      }
    };

    // Add event listener when any menu is open
    if (showTimeframeMenu || showIndicatorMenu || showMoreToolsMenu || showAdvancedToolsMenu || showScreenshotMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTimeframeMenu, showIndicatorMenu, showMoreToolsMenu, showAdvancedToolsMenu, showScreenshotMenu]);

  // Custom prompt function to replace window.prompt
  const customPrompt = (message: string, defaultValue: string = ''): Promise<string | null> => {
    return new Promise((resolve) => {
      setTextModalValue(defaultValue);
      setShowTextModal(true);
      textModalCallbackRef.current = resolve;
    });
  };

  // Expose custom prompt globally for overlay use
  useEffect(() => {
    (window as any).customPrompt = customPrompt;
    return () => {
      delete (window as any).customPrompt;
    };
  }, []);

  // Modal handlers
  const handleTextModalConfirm = (text: string) => {
    if (textModalCallbackRef.current) {
      textModalCallbackRef.current(text);
      textModalCallbackRef.current = null;
    }
    setShowTextModal(false);
  };

  const handleTextModalCancel = () => {
    if (textModalCallbackRef.current) {
      textModalCallbackRef.current(null);
      textModalCallbackRef.current = null;
    }
    setShowTextModal(false);
  };

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

          // Listen for zoom events to deactivate auto button
          chartInstance.current.subscribeAction('onZoom', () => {
            if (yAxisMode === 'normal' && isAutoActive) {
              setIsAutoActive(false);
            }
          });

          // Listen for scroll/pan events to deactivate auto button
          chartInstance.current.subscribeAction('onScroll', () => {
            if (yAxisMode === 'normal' && isAutoActive) {
              setIsAutoActive(false);
            }
          });

          if (showVolume) {
            chartInstance.current.createIndicator('VOL', false, {
              id: 'volume_pane',
              height: 80,
            });
          }

          setChartReady(true);

          // Initialize overlay history with empty state
          setOverlayHistory([[]]);
          setHistoryIndex(0);

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

  // Y-axis mode change handler
  const handleYAxisModeChange = (mode: 'normal' | 'percent' | 'log') => {
    if (!chartInstance.current) return;

    setYAxisMode(mode);
    // Mark auto as active when user clicks it
    if (mode === 'normal') {
      setIsAutoActive(true);
    } else {
      setIsAutoActive(false);
    }

    // Set reference price for percent mode (first visible candle's close)
    if (mode === 'percent') {
      const visibleData = chartInstance.current.getDataList();
      if (visibleData && visibleData.length > 0) {
        refPriceRef.current = visibleData[0].close;
      }
    }

    // Apply Y-axis type to chart
    try {
      const currentStyles = chartInstance.current.getStyles();

      chartInstance.current.setStyles({
        ...currentStyles,
        yAxis: {
          ...currentStyles.yAxis,
          type: mode === 'log' ? 'log' : mode === 'percent' ? 'percentage' : 'normal',
        },
      });

      console.log(`Y-axis mode changed to: ${mode}`);
    } catch (error) {
      console.error('Error changing Y-axis mode:', error);
    }
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
          if (event?.overlay?.id) {
            setSelectedOverlay(event.overlay);
            const overlayData = {
              name: 'segment',
              groupId: 'drawing',
              points: event.overlay.points,
              styles: { line: { color: '#03a9f4', size: 1.4 } },
            };
            overlayDataRef.current.set(event.overlay.id, overlayData);
            overlayDataStore.current.set(event.overlay.id, overlayData);
          }
          setActiveTool('cursor');
          saveOverlayState();
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
          if (event?.overlay?.id) {
            setSelectedOverlay(event.overlay);
            const overlayData = {
              name: 'rectBox',
              groupId: 'drawing',
              points: event.overlay.points,
            };
            overlayDataRef.current.set(event.overlay.id, overlayData);
            overlayDataStore.current.set(event.overlay.id, overlayData);
          }
          setActiveTool('cursor');
          saveOverlayState();
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
          if (event?.overlay?.id) {
            setSelectedOverlay(event.overlay);
            const overlayData = {
              name: 'rotatedRect',
              groupId: 'drawing',
              points: event.overlay.points,
            };
            overlayDataRef.current.set(event.overlay.id, overlayData);
            overlayDataStore.current.set(event.overlay.id, overlayData);
          }
          setActiveTool('cursor');
          saveOverlayState();
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
          if (event?.overlay?.id) {
            setSelectedOverlay(event.overlay);
            const overlayData = {
              name: 'trendLine',
              groupId: 'drawing',
              points: event.overlay.points,
            };
            overlayDataRef.current.set(event.overlay.id, overlayData);
            overlayDataStore.current.set(event.overlay.id, overlayData);
          }
          setActiveTool('cursor');
          saveOverlayState();
        },
        onSelected: (event: any) => {
          if (event?.overlay) setSelectedOverlay(event.overlay);
        },
        onDeselected: () => {
          setSelectedOverlay(null);
        },
      });
    }

    if (tool === 'fibonacci') {
      chartInstance.current.createOverlay({
        name: 'fibonacciRetracement',
        groupId: 'drawing',
        mode: 'normal',
        styles: {
          line: {
            color: '#00baff',
            size: 1,
            style: 'dashed',
          },
        },
        onDrawEnd: (event: any) => {
          if (event?.overlay?.id) {
            setSelectedOverlay(event.overlay);
            const overlayData = {
              name: 'fibonacciRetracement',
              groupId: 'drawing',
              points: event.overlay.points,
              styles: { line: { color: '#00baff', size: 1, style: 'dashed' } },
            };
            overlayDataRef.current.set(event.overlay.id, overlayData);
            overlayDataStore.current.set(event.overlay.id, overlayData);
          }
          setActiveTool('cursor');
          saveOverlayState();
        },
        onSelected: (event: any) => {
          if (event?.overlay) setSelectedOverlay(event.overlay);
        },
        onDeselected: () => {
          setSelectedOverlay(null);
        },
      });
    }

    if (tool === 'longPosition') {
      chartInstance.current.createOverlay({
        name: 'longPosition',
        groupId: 'drawing',
        mode: 'normal',
        onDrawEnd: (event: any) => {
          if (event?.overlay?.id) {
            setSelectedOverlay(event.overlay);
            const overlayData = {
              name: 'longPosition',
              groupId: 'drawing',
              points: event.overlay.points,
            };
            overlayDataRef.current.set(event.overlay.id, overlayData);
            overlayDataStore.current.set(event.overlay.id, overlayData);
          }
          setActiveTool('cursor');
          saveOverlayState();
        },
        onSelected: (event: any) => {
          if (event?.overlay) setSelectedOverlay(event.overlay);
        },
        onDeselected: () => {
          setSelectedOverlay(null);
        },
      });
    }

    if (tool === 'shortPosition') {
      chartInstance.current.createOverlay({
        name: 'shortPosition',
        groupId: 'drawing',
        mode: 'normal',
        onDrawEnd: (event: any) => {
          if (event?.overlay?.id) {
            setSelectedOverlay(event.overlay);
            const overlayData = {
              name: 'shortPosition',
              groupId: 'drawing',
              points: event.overlay.points,
            };
            overlayDataRef.current.set(event.overlay.id, overlayData);
            overlayDataStore.current.set(event.overlay.id, overlayData);
          }
          setActiveTool('cursor');
          saveOverlayState();
        },
        onSelected: (event: any) => {
          if (event?.overlay) setSelectedOverlay(event.overlay);
        },
        onDeselected: () => {
          setSelectedOverlay(null);
        },
      });
    }





    if (tool === 'datePriceRange') {
      chartInstance.current.createOverlay({
        name: 'datePriceRange',
        groupId: 'drawing',
        mode: 'normal',
        onDrawEnd: (event: any) => {
          if (event?.overlay?.id) {
            setSelectedOverlay(event.overlay);
            const overlayData = {
              name: 'datePriceRange',
              groupId: 'drawing',
              points: event.overlay.points,
            };
            overlayDataRef.current.set(event.overlay.id, overlayData);
            overlayDataStore.current.set(event.overlay.id, overlayData);
          }
          setActiveTool('cursor');
          saveOverlayState();
        },
        onSelected: (event: any) => {
          if (event?.overlay) setSelectedOverlay(event.overlay);
        },
        onDeselected: () => {
          setSelectedOverlay(null);
        },
      });
    }

    if (tool === 'text') {
      chartInstance.current.createOverlay({
        name: 'customText',
        groupId: 'drawing',
        mode: 'normal',
        onDrawEnd: async (event: any) => {
          if (event?.overlay?.id) {
            // Prompt for text immediately upon placement using custom modal
            const initialText = await customPrompt("Enter text:", "Text");
            if (initialText !== null) {
              event.overlay.extendData = initialText;
            }

            setSelectedOverlay(event.overlay);
            const overlayData = {
              name: 'customText',
              groupId: 'drawing',
              points: event.overlay.points,
              extendData: initialText || "Text"
            };
            overlayDataRef.current.set(event.overlay.id, overlayData);
            overlayDataStore.current.set(event.overlay.id, overlayData);
          }
          setActiveTool('cursor');
          saveOverlayState();
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
    setShowAdvancedToolsMenu(false);

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
      saveOverlayState();
    }
  };

  const handleDeleteSelectedOverlay = () => {
    if (selectedOverlay && chartInstance.current && selectedOverlay.id) {
      chartInstance.current.removeOverlay({ id: selectedOverlay.id });
      // Remove from our tracking (but keep in tempDataStore for potential redo)
      overlayDataRef.current.delete(selectedOverlay.id);
      setSelectedOverlay(null);
      saveOverlayState();
    }
  };

  const saveOverlayState = () => {
    if (!chartInstance.current) return;

    setTimeout(() => {
      try {
        // Get current overlay IDs from our ref
        const currentOverlayIds = Array.from(overlayDataRef.current.keys());

        // Remove any future states (when adding after undo)
        const newHistory = overlayHistory.slice(0, historyIndex + 1);
        newHistory.push([...currentOverlayIds]);

        setOverlayHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);

        console.log('📝 Saved state. Overlays:', currentOverlayIds, 'History length:', newHistory.length, 'Index:', newHistory.length - 1);
      } catch (error) {
        console.error('Error saving overlay state:', error);
      }
    }, 100);
  };

  const applyOverlayState = (targetIds: string[]) => {
    if (!chartInstance.current) return;

    const currentIds = Array.from(overlayDataRef.current.keys());

    console.log('🔄 Applying state. Current IDs:', currentIds, 'Target IDs:', targetIds);

    // First, remove all overlays from chart
    try {
      chartInstance.current.removeOverlay();
    } catch (e) {
      console.warn('Error removing overlays:', e);
    }

    // Clear our tracking of what's currently on the chart
    overlayDataRef.current.clear();

    // Then, recreate only the overlays that should exist in target state
    targetIds.forEach((overlayId: string) => {
      const overlayData = overlayDataStore.current.get(overlayId);
      if (overlayData) {
        try {
          chartInstance.current.createOverlay(overlayData);
          overlayDataRef.current.set(overlayId, overlayData);
          console.log('✅ Recreated overlay:', overlayId);
        } catch (e) {
          console.warn('❌ Failed to recreate overlay:', overlayId, e);
        }
      } else {
        console.warn('⚠️ No data found for overlay:', overlayId);
      }
    });
  };

  const handleUndo = () => {
    if (historyIndex <= 0 || !chartInstance.current) {
      console.log('⚠️ Cannot undo: historyIndex =', historyIndex);
      return;
    }

    const newIndex = historyIndex - 1;
    const targetState = overlayHistory[newIndex];

    console.log('⬅️ UNDO: index', historyIndex, '→', newIndex);

    applyOverlayState(targetState);
    setHistoryIndex(newIndex);
    setSelectedOverlay(null);
  };

  const handleRedo = () => {
    if (historyIndex >= overlayHistory.length - 1 || !chartInstance.current) {
      console.log('⚠️ Cannot redo: historyIndex =', historyIndex, 'history length =', overlayHistory.length);
      return;
    }

    const newIndex = historyIndex + 1;
    const targetState = overlayHistory[newIndex];

    console.log('➡️ REDO: index', historyIndex, '→', newIndex);

    applyOverlayState(targetState);
    setHistoryIndex(newIndex);
    setSelectedOverlay(null);
  };

  const handleOpenInNewTab = () => {
    if (!instrumentToken) {
      console.warn('⚠️ Cannot open chart: instrument token not provided');
      return;
    }

    const params = new URLSearchParams({
      symbol: symbol,
      instrument_token: instrumentToken.toString(),
      timeframe: selectedTimeframe,
    });

    const encodedSymbol = symbol.replace(/\s+/g, '-');
    const url = `/chart/${encodedSymbol}?${params.toString()}`;
    console.log('📊 Opening chart in new tab:', url);

    const newWindow = window.open(url, '_blank', 'width=1400,height=900');

    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      console.warn('⚠️ Popup blocked! Opening in same tab instead');
      window.location.href = url;
    } else {
      console.log('✅ Chart window opened successfully');
    }
  };

  const handleSaveChartImage = () => {
    if (!chartInstance.current) return;

    try {
      // Get the chart image as a data URL
      const imageUrl = chartInstance.current.getConvertPictureUrl(true, 'png', '#131722');

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `${symbol}_chart_${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowScreenshotMenu(false);
    } catch (error) {
      console.error('Error saving chart image:', error);
    }
  };

  const handleCopyChartImage = async () => {
    if (!chartInstance.current) return;

    try {
      // Get the chart image as a data URL
      const imageUrl = chartInstance.current.getConvertPictureUrl(true, 'png', '#131722');

      // Convert data URL to blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob
        })
      ]);

      setShowScreenshotMenu(false);

      // Optional: Show success message
      console.log('Chart image copied to clipboard');
    } catch (error) {
      console.error('Error copying chart image:', error);
      // Fallback: try to copy the data URL as text
      try {
        const imageUrl = chartInstance.current.getConvertPictureUrl(true, 'png', '#131722');
        await navigator.clipboard.writeText(imageUrl);
        console.log('Chart image URL copied to clipboard');
        setShowScreenshotMenu(false);
      } catch (fallbackError) {
        console.error('Fallback copy also failed:', fallbackError);
      }
    }
  };

  // ESC / Delete / Undo / Redo
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

      // Ctrl+Z for Undo
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      // Ctrl+Y or Ctrl+Shift+Z for Redo
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOverlay, historyIndex, overlayHistory]);

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
          className={`w-9 h-9 flex items-center justify-center rounded transition-colors ${activeTool === 'line'
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
        <div className="relative" ref={moreToolsMenuRef}>
          <button
            onClick={() => setShowMoreToolsMenu((prev) => !prev)}
            className={`w-9 h-9 flex items-center justify-center rounded transition-colors ${activeTool === 'rect' ||
              activeTool === 'rotRect' ||
              activeTool === 'trendLine'
              ? 'bg-[#2a2e39] text-white'
              : 'text-[#787b86] hover:bg-[#1e222d]'
              }`}
            title="More Tools"
          >
            {/* Icon: brush icon */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" />
              <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z" />
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

            </div>
          )}
        </div>

        {/* Advanced Tools Menu Button (Fibonacci, etc.) */}
        <div className="relative" ref={advancedToolsMenuRef}>
          <button
            onClick={() => setShowAdvancedToolsMenu((prev) => !prev)}
            className={`w-9 h-9 flex items-center justify-center rounded transition-colors ${activeTool === 'fibonacci' ||
              activeTool === 'longPosition' ||
              activeTool === 'shortPosition' ||
              activeTool === 'datePriceRange'
              ? 'bg-[#2a2e39] text-white'
              : 'text-[#787b86] hover:bg-[#1e222d]'
              }`}
            title="Advanced Tools"
          >
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

          {showAdvancedToolsMenu && (
            <div className="absolute left-11 top-0 bg-[#1e222d] border border-[#2a2e39] rounded shadow-lg z-50 py-1 w-56">
              <button
                onClick={() => handleToolClick('fibonacci')}
                className="w-full px-3 py-2 text-left text-xs hover:bg-[#2a2e39] text-white flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="20" x2="21" y2="20" />
                  <line x1="3" y1="16" x2="21" y2="16" opacity="0.7" />
                  <line x1="3" y1="12" x2="21" y2="12" opacity="0.7" />
                  <line x1="3" y1="8" x2="21" y2="8" opacity="0.7" />
                  <line x1="3" y1="4" x2="21" y2="4" />
                  <line x1="3" y1="4" x2="3" y2="20" strokeWidth="2.5" />
                </svg>
                <span>Fibonacci Retracement</span>
              </button>
              <button
                onClick={() => handleToolClick('longPosition')}
                className="w-full px-3 py-2 text-left text-xs hover:bg-[#2a2e39] text-white flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12h5" />
                  <circle cx="10" cy="12" r="2" fill="currentColor" />
                  <path d="M12 12h9" />
                  <path d="M3 18h5" />
                  <circle cx="10" cy="18" r="2" fill="currentColor" />
                  <path d="M12 18h9" />
                </svg>
                <span>Long Position</span>
              </button>
              <button
                onClick={() => handleToolClick('shortPosition')}
                className="w-full px-3 py-2 text-left text-xs hover:bg-[#2a2e39] text-white flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h5" />
                  <circle cx="10" cy="6" r="2" fill="currentColor" />
                  <path d="M12 6h9" />
                  <path d="M3 12h5" />
                  <circle cx="10" cy="12" r="2" fill="currentColor" />
                  <path d="M12 12h9" />
                </svg>
                <span>Short Position</span>
              </button>


              <button
                onClick={() => handleToolClick('datePriceRange')}
                className="w-full px-3 py-2 text-left text-xs hover:bg-[#2a2e39] text-white flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 3v18" />
                  <path d="M15 3v18" />
                  <path d="M3 9h18" />
                  <path d="M3 15h18" />
                </svg>
                <span>Date and Price Range</span>
              </button>
            </div>
          )}
        </div>

        {/* Text tool */}
        <button
          onClick={() => handleToolClick('text')}
          className={`w-9 h-9 flex items-center justify-center rounded transition-colors ${activeTool === 'text'
            ? 'bg-[#2a2e39] text-white'
            : 'text-[#787b86] hover:bg-[#1e222d]'
            }`}
          title="Text Overlay"
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
          <div className="relative" ref={timeframeMenuRef}>
            <button
              onClick={() => setShowTimeframeMenu(!showTimeframeMenu)}
              className="px-3 py-1 text-xs font-medium rounded bg-[#2a2e39] text-white hover:bg-[#363a45] transition-colors flex items-center gap-1"
            >
              {selectedTimeframe}
              <ChevronDown className="w-3 h-3" />
            </button>

            {showTimeframeMenu && (
              <div className="absolute top-full left-0 mt-1 w-40 bg-[#1e222d] border border-[#2a2e39] rounded shadow-lg py-1 z-50 max-h-96 overflow-y-auto">
                {/* Intraday (Minute-based) Section */}
                <div className="px-3 py-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide border-b border-[#2a2e39]">
                  Intraday
                </div>
                {['1m', '3m', '5m', '10m', '15m', '30m'].map(
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
                      {tf === '1m' ? '1 minute' :
                        tf === '3m' ? '3 minutes' :
                          tf === '5m' ? '5 minutes' :
                            tf === '10m' ? '10 minutes' :
                              tf === '15m' ? '15 minutes' :
                                '30 minutes'}
                    </button>
                  )
                )}

                {/* Hourly Section */}
                <div className="px-3 py-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide border-t border-b border-[#2a2e39] mt-1">
                  Hourly
                </div>
                <button
                  onClick={() => {
                    setSelectedTimeframe('1h');
                    setShowTimeframeMenu(false);
                    if (onTimeframeChange) {
                      onTimeframeChange('1h');
                    }
                  }}
                  className={`w-full px-4 py-2 text-left text-xs hover:bg-[#2a2e39] transition-colors ${selectedTimeframe === '1h'
                    ? 'text-[#2962ff] bg-[#2a2e39]'
                    : 'text-white'
                    }`}
                >
                  1 hour
                </button>

                {/* Daily/Weekly/Monthly Section */}
                <div className="px-3 py-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide border-t border-b border-[#2a2e39] mt-1">
                  Daily & Above
                </div>
                {['1d', '1w', '1M'].map(
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
                      {tf === '1d' ? 'Daily' :
                        tf === '1w' ? 'Weekly' :
                          'Monthly'}
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {/* Indicators */}
          <div className="relative" ref={indicatorMenuRef}>
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

          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="w-6 h-6 flex items-center justify-center rounded text-[#787b86] hover:bg-[#1e222d] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= overlayHistory.length - 1}
            className="w-6 h-6 flex items-center justify-center rounded text-[#787b86] hover:bg-[#1e222d] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Fullscreen / Open in New Tab */}
          <button
            onClick={handleOpenInNewTab}
            className="w-8 h-8 flex items-center justify-center rounded text-[#787b86] hover:bg-[#1e222d] transition-colors"
            title="Open in new tab"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <rect x="5" y="5" width="14" height="14" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 5 L19 5 L19 12" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="19" y1="5" x2="13" y2="11" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Screenshot Menu */}
          <div className="relative" ref={screenshotMenuRef}>
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
                  onClick={handleSaveChartImage}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-[#2a2e39] text-white flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Save chart image
                </button>
                <button
                  onClick={handleCopyChartImage}
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
            <button
              onClick={() => handleYAxisModeChange('percent')}
              className={`px-2 py-0.5 text-[11px] font-medium transition-colors ${yAxisMode === 'percent' ? 'text-[#2962ff]' : 'text-[#787b86] hover:text-white'
                }`}
            >
              %
            </button>
            <button
              onClick={() => handleYAxisModeChange('log')}
              className={`px-2 py-0.5 text-[11px] font-medium transition-colors ${yAxisMode === 'log' ? 'text-[#2962ff]' : 'text-[#787b86] hover:text-white'
                }`}
            >
              log
            </button>
            <button
              onClick={() => handleYAxisModeChange('normal')}
              className={`px-2 py-0.5 text-[11px] font-medium transition-colors ${yAxisMode === 'normal' && isAutoActive ? 'text-[#2962ff]' : 'text-[#787b86] hover:text-white'
                }`}
            >
              auto
            </button>
          </div>
        </div>
      </div>

      {/* Text Input Modal */}
      <TextInputModal
        isOpen={showTextModal}
        initialValue={textModalValue}
        onConfirm={handleTextModalConfirm}
        onCancel={handleTextModalCancel}
      />
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
