/**
 * PnL Widget Component
 * Displays real-time P&L for demo or tournament trading
 * Supports websocket updates for live tracking
 */

import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import api from '@/services/api';
import ws from '@/services/websocket';
import { formatCurrency } from '@/utils/formatters';
import { TradingMode } from '@/types/tournament-trading';
import Card from '../common/Card';

interface PnLData {
    unrealised: number;
    realised: number;
    total: number;
}

interface PnLWidgetProps {
    mode?: TradingMode;
    contextId?: string | null;
}

export default function PnLWidget({ mode = 'demo', contextId = null }: PnLWidgetProps) {
    const [pnl, setPnl] = useState<PnLData>({ unrealised: 0, realised: 0, total: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const fetchPnl = async () => {
            try {
                const endpoint = mode === 'tournament' && contextId
                    ? `/api/tournaments/${contextId}/pnl`
                    : `/api/paper/pnl`;
                
                const response = await api.get(endpoint);
                if (mounted) {
                    setPnl(response.data);
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('Failed to fetch P&L:', error);
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchPnl();

        // Setup websocket for real-time updates
        const room = mode === 'tournament' && contextId 
            ? `tournament:${contextId}` 
            : 'paper:default';
        
        const event = mode === 'tournament' && contextId
            ? `tournament:${contextId}:pnl`
            : 'paper:pnl:update';

        if (ws.isConnected()) {
            ws.joinRoom(room);
        }

        ws.on(event, (data: any) => {
            if (!mounted) return;
            setPnl(data);
        });

        return () => {
            mounted = false;
            ws.off(event);
            if (ws.isConnected()) {
                ws.leaveRoom(room);
            }
        };
    }, [mode, contextId]);

    if (isLoading) {
        return (
            <Card title="P&L Summary">
                <div className="flex justify-center py-4">
                    <div className="text-gray-400 text-sm">Loading...</div>
                </div>
            </Card>
        );
    }

    return (
        <Card title="P&L Summary" className="bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="space-y-4">
                {/* Total P&L - Main Display */}
                <div className="text-center pb-4 border-b border-gray-700">
                    <div className="text-xs text-gray-400 mb-1">Total P&L</div>
                    <div className={`text-3xl font-bold flex items-center justify-center gap-2 ${
                        pnl.total >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                        {pnl.total >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                        <span>{pnl.total >= 0 ? '+' : ''}{formatCurrency(pnl.total)}</span>
                    </div>
                </div>

                {/* Unrealised & Realised */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-700/30 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">Unrealised</div>
                        <div className={`text-lg font-bold ${
                            pnl.unrealised >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                            {pnl.unrealised >= 0 ? '+' : ''}{formatCurrency(pnl.unrealised)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Open Positions</div>
                    </div>

                    <div className="bg-gray-700/30 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">Realised</div>
                        <div className={`text-lg font-bold ${
                            pnl.realised >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                            {pnl.realised >= 0 ? '+' : ''}{formatCurrency(pnl.realised)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Closed Positions</div>
                    </div>
                </div>

                {/* Mode Indicator */}
                <div className={`text-center text-xs py-2 rounded ${
                    mode === 'tournament' 
                        ? 'bg-purple-500/10 text-purple-400' 
                        : 'bg-blue-500/10 text-blue-400'
                }`}>
                    {mode === 'tournament' ? '🏆 Tournament Mode' : '📊 Demo Trading'}
                </div>
            </div>
        </Card>
    );
}
