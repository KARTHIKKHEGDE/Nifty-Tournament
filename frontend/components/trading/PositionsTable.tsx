import React, { useEffect, useState, useRef } from 'react';
import { PaperPosition, TickData } from '../../types';
import { formatCurrency, getPriceColor } from '../../utils/formatters';
import tradingService from '../../services/tradingService';
import tournamentService from '../../services/tournamentService';
import Card from '../common/Card';
import Loader from '../common/Loader';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { TradingMode } from '../../types/tournament-trading';
import wsService from '../../services/websocket';

interface PositionsTableProps {
    mode?: TradingMode;
    contextId?: string | null;
}

export default function PositionsTable({ mode = 'demo', contextId = null }: PositionsTableProps) {
    const [positions, setPositions] = useState<PaperPosition[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showMode, setShowMode] = useState<'day' | 'net'>('day');
    const [pnlMode, setPnlMode] = useState<'amount' | 'percent'>('amount');
    const positionsRef = useRef<PaperPosition[]>([]);
    // Safety: Track if component is mounted
    const isMounted = useRef(true);

    const loadPositions = async (showLoading = false) => {
        if (showLoading) {
            setIsLoading(true);
        }
        try {
            const data = mode === 'tournament' && contextId
                ? await tournamentService.getTournamentPositions(contextId)
                : await tradingService.getPositions();
            setPositions(data);
            positionsRef.current = data;
        } catch (error) {
            console.error('Failed to load positions:', error);
        } finally {
            if (showLoading) {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        // Initial load with loading indicator
        loadPositions(true);

        // Refresh positions every 5 seconds silently (no loading indicator)
        const interval = setInterval(() => loadPositions(false), 5000);
        return () => clearInterval(interval);
    }, [mode, contextId]);

    // Subscribe to WebSocket ticks for real-time price updates
    // Direct DOM updates - ZERO re-renders like professional platforms
    useEffect(() => {
        console.log('📡 [PositionsTable] Setting up WebSocket tick listener for live prices');
        
        const unsubscribe = wsService.on('tick', (tickData: TickData) => {
            // Safety: Check if component is still mounted
            if (!isMounted.current) return;
            
            // Update ref data immediately (no re-render)
            let positionIndex = -1;
            positionsRef.current = positionsRef.current.map((pos, idx) => {
                // Match by symbol or tradingsymbol
                if (pos.symbol === tickData.symbol || pos.tradingsymbol === tickData.symbol) {
                    positionIndex = idx;
                    return {
                        ...pos,
                        ltp: tickData.price,
                        current_price: tickData.price,
                    };
                }
                return pos;
            });
            
            // Direct DOM update - NO React re-render
            if (positionIndex !== -1) {
                const position = positionsRef.current[positionIndex];
                const ltp = position.ltp || position.current_price || position.average_price;
                const pnl = (ltp - position.average_price) * position.quantity;
                const pnlPercent = ((ltp - position.average_price) / position.average_price) * 100;
                const isProfitable = pnl >= 0;
                
                // Update LTP in DOM
                const ltpElement = document.querySelector(`[data-position-ltp="${position.id}"]`);
                if (ltpElement) {
                    ltpElement.textContent = `₹${ltp.toFixed(2)}`;
                }
                
                // Update P&L in DOM
                const pnlElement = document.querySelector(`[data-position-pnl="${position.id}"]`);
                if (pnlElement) {
                    pnlElement.textContent = pnlMode === 'amount' 
                        ? `${isProfitable ? '+' : ''}₹${Math.abs(pnl).toFixed(2)}`
                        : `${isProfitable ? '+' : ''}${pnlPercent.toFixed(2)}%`;
                    pnlElement.className = `text-sm font-bold ${isProfitable ? 'text-green-400' : 'text-red-400'}`;
                }
            }
        });

        return () => {
            console.log('🧹 [PositionsTable] Cleaning up WebSocket tick listener');
            isMounted.current = false;
            unsubscribe();
        };
    }, [pnlMode]);

    const handleClosePosition = async (positionId: number) => {
        try {
            if (mode === 'tournament' && contextId) {
                await tournamentService.closeTournamentPosition(contextId, positionId);
            } else {
                await tradingService.closePosition(positionId);
            }
            loadPositions(true);
        } catch (error) {
            console.error('Failed to close position:', error);
        }
    };

    // Calculate P&L based on current market price
    const calculatePnL = (position: PaperPosition): number => {
        const ltp = position.ltp || position.current_price || position.average_price;

        // For Options/Futures: P&L = (LTP - AvgPrice) × LotSize
        if (position.instrument_type === 'CE' || position.instrument_type === 'PE' || position.instrument_type === 'FUT') {
            return (ltp - position.average_price) * position.multiplier * Math.sign(position.quantity);
        }

        // For Equity: P&L = (LTP - AvgPrice) × Quantity
        return (ltp - position.average_price) * position.quantity;
    };

    const calculatePnLPercentage = (position: PaperPosition): number => {
        const ltp = position.ltp || position.current_price || position.average_price;
        return ((ltp - position.average_price) / position.average_price) * 100;
    };

    const totalPnL = positions.reduce((sum, p) => sum + calculatePnL(p), 0);

    if (isLoading) {
        return (
            <Card title="Positions">
                <div className="flex justify-center py-8">
                    <Loader text="Loading positions..." />
                </div>
            </Card>
        );
    }

    if (positions.length === 0) {
        return (
            <Card title="Positions">
                <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">No open positions</p>
                    <p className="text-gray-500 text-xs mt-2">Your active positions will appear here</p>
                </div>
            </Card>
        );
    }

    return (
        <Card title="Positions" subtitle={`${positions.length} position(s)`}>
            {/* Header Controls */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700">
                {/* Day / Net Toggle */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowMode('day')}
                        className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${showMode === 'day'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                    >
                        Day
                    </button>
                    <button
                        onClick={() => setShowMode('net')}
                        className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${showMode === 'net'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                    >
                        Net
                    </button>
                </div>

                {/* ₹ / % Toggle - Controlled re-render for button state */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            setPnlMode('amount'); // Single re-render for UI state
                            // Update all P&L displays in DOM immediately
                            positionsRef.current.forEach(pos => {
                                const ltp = pos.ltp || pos.current_price || pos.average_price;
                                const pnl = (ltp - pos.average_price) * pos.quantity;
                                const isProfitable = pnl >= 0;
                                const pnlElement = document.querySelector(`[data-position-pnl="${pos.id}"]`);
                                if (pnlElement) {
                                    pnlElement.textContent = `${isProfitable ? '+' : ''}₹${Math.abs(pnl).toFixed(2)}`;
                                }
                            });
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${pnlMode === 'amount'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                    >
                        ₹
                    </button>
                    <button
                        onClick={() => {
                            setPnlMode('percent');
                            // Update all P&L displays in DOM immediately
                            positionsRef.current.forEach(pos => {
                                const ltp = pos.ltp || pos.current_price || pos.average_price;
                                const pnlPercent = ((ltp - pos.average_price) / pos.average_price) * 100;
                                const isProfitable = pnlPercent >= 0;
                                const pnlElement = document.querySelector(`[data-position-pnl="${pos.id}"]`);
                                if (pnlElement) {
                                    pnlElement.textContent = `${isProfitable ? '+' : ''}${pnlPercent.toFixed(2)}%`;
                                }
                            });
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${pnlMode === 'percent'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                    >
                        %
                    </button>
                </div>
            </div>

            {/* Positions List */}
            <div className="space-y-3">
                {positions.map((position) => {
                    const pnl = calculatePnL(position);
                    const pnlPercent = calculatePnLPercentage(position);
                    const ltp = position.ltp || position.current_price || position.average_price;
                    const isProfitable = pnl >= 0;

                    return (
                        <div
                            key={position.id}
                            className="bg-gray-700/30 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all"
                        >
                            {/* Row 1: Symbol & Product */}
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-white font-semibold text-sm">
                                            {position.tradingsymbol || position.symbol}
                                        </h4>
                                        <span className="text-xs text-gray-400">
                                            ({position.exchange || 'NFO'})
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300">
                                            {position.product || 'MIS'}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            Qty: <span className={position.quantity > 0 ? 'text-green-400' : 'text-red-400'}>
                                                {position.quantity > 0 ? '+' : ''}{position.quantity}
                                            </span>
                                        </span>
                                    </div>
                                </div>

                                {/* Close Button */}
                                <button
                                    onClick={() => handleClosePosition(position.id)}
                                    className="p-1.5 rounded hover:bg-gray-600 transition-colors"
                                    title="Close Position"
                                >
                                    <X className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>

                            {/* Row 2: Avg & LTP */}
                            <div className="flex items-center gap-4 mb-2 text-xs">
                                <div>
                                    <span className="text-gray-400">Avg: </span>
                                    <span className="text-white font-medium">
                                        {formatCurrency(position.average_price)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400">LTP: </span>
                                    <span className="text-white font-medium" data-position-ltp={position.id}>
                                        {formatCurrency(ltp)}
                                    </span>
                                </div>
                                {position.day_change_percentage !== undefined && (
                                    <div className={`flex items-center gap-1 ${getPriceColor(position.day_change_percentage)}`}>
                                        {position.day_change_percentage > 0 ? (
                                            <TrendingUp className="w-3 h-3" />
                                        ) : (
                                            <TrendingDown className="w-3 h-3" />
                                        )}
                                        <span className="font-medium">
                                            {position.day_change_percentage > 0 ? '+' : ''}
                                            {position.day_change_percentage.toFixed(2)}%
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Row 3: P&L */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-gray-400 text-sm">P&L: </span>
                                    <span 
                                        className={`text-sm font-bold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}
                                        data-position-pnl={position.id}
                                    >
                                        {pnlMode === 'amount' ? (
                                            <>{isProfitable ? '+' : ''}{formatCurrency(pnl)}</>
                                        ) : (
                                            <>{isProfitable ? '+' : ''}{pnlPercent.toFixed(2)}%</>
                                        )}
                                    </span>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleClosePosition(position.id)}
                                        className="px-3 py-1 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                                    >
                                        EXIT
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer: Total P&L */}
            <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-300">Total P&L</span>
                    <span className={`text-lg font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
                    </span>
                </div>
            </div>
        </Card>
    );
}
