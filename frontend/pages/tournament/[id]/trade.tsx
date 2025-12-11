/**
 * Tournament Trading Page
 * Isolated trading environment for tournament participants
 * Features:
 * - Separate virtual balance per tournament
 * - Real-time P&L tracking
 * - Tournament-specific orders and positions
 * - Leaderboard integration
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Trophy, ArrowLeft, Users, TrendingUp, AlertCircle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PnLWidget from '@/components/trading/PnLWidget';
import PositionsTable from '@/components/trading/PositionsTable';
import OrdersHistory from '@/components/trading/OrdersHistory';
import OrderPanel from '@/components/trading/OrderPanel';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Loader from '@/components/common/Loader';
import tournamentService from '@/services/tournamentService';
import ws from '@/services/websocket';
import { Tournament, TournamentParticipant } from '@/types';
import { formatCurrency, formatDateTime } from '@/utils/formatters';

export default function TournamentTrade() {
    const router = useRouter();
    const { id } = router.query;
    const contextId = id as string;
    const mode = 'tournament';

    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [participant, setParticipant] = useState<TournamentParticipant | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentSymbol] = useState('NIFTY');
    const [currentPrice] = useState(19500); // This should come from market data

    useEffect(() => {
        if (!contextId) return;

        const initializeTournament = async () => {
            try {
                // Check participation status
                const participantData = await tournamentService.getParticipant(contextId);
                
                if (!participantData.joined) {
                    // Redirect to tournament detail page if not joined
                    router.push(`/tournaments`);
                    return;
                }

                // Fetch tournament details
                const tournamentData = await tournamentService.getTournament(Number(contextId));
                setTournament(tournamentData);
                setParticipant(participantData.participant || null);

                // Connect to websocket and join tournament rooms
                if (!ws.isConnected()) {
                    ws.connect();
                }
                
                ws.joinRoom(`tournament:${contextId}`);
                if (participantData.userId) {
                    ws.joinRoom(`tournament:${contextId}:user:${participantData.userId}`);
                }

                setIsLoading(false);
            } catch (err: any) {
                console.error('Failed to initialize tournament:', err);
                setError(err.message || 'Failed to load tournament');
                setIsLoading(false);
            }
        };

        initializeTournament();

        return () => {
            // Cleanup: leave rooms on unmount
            if (contextId) {
                ws.leaveRoom(`tournament:${contextId}`);
            }
        };
    }, [contextId, router]);

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-screen">
                    <Loader text="Loading tournament..." />
                </div>
            </DashboardLayout>
        );
    }

    if (error || !tournament || !participant) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-screen">
                    <Card className="max-w-md">
                        <div className="text-center py-8">
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-white mb-2">Error</h2>
                            <p className="text-gray-400 mb-4">{error || 'Tournament not found'}</p>
                            <Button onClick={() => router.push('/tournaments')}>
                                Back to Tournaments
                            </Button>
                        </div>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-[#0f1115] p-4 sm:p-6">
                {/* Tournament Header Banner */}
                <div className="bg-gradient-to-r from-purple-900/30 via-purple-800/20 to-pink-900/30 border border-purple-700/30 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/tournaments')}
                                className="p-2 rounded hover:bg-white/10 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-purple-400" />
                            </button>
                            <Trophy className="w-8 h-8 text-purple-400" />
                            <div>
                                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                                    {tournament.name}
                                    <span className="text-xs bg-purple-600 px-2 py-1 rounded">ACTIVE</span>
                                </h1>
                                <p className="text-sm text-gray-400 mt-1">
                                    Virtual Capital: <span className="text-purple-400 font-semibold">{formatCurrency(participant.initial_balance)}</span>
                                    {' • '}
                                    <span className="text-xs">Ends: {formatDateTime(tournament.end_date)}</span>
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg px-4 py-2">
                                <div className="text-xs text-purple-400">Your Rank</div>
                                <div className="text-lg font-bold text-white">
                                    #{participant.rank || '-'}
                                </div>
                            </div>
                            <Button
                                onClick={() => router.push(`/tournaments/${contextId}`)}
                                variant="secondary"
                                className="flex items-center gap-2"
                            >
                                <Users className="w-4 h-4" />
                                Leaderboard
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Trading Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Order Panel */}
                    <div className="lg:col-span-3">
                        <OrderPanel
                            symbol={currentSymbol}
                            currentPrice={currentPrice}
                            mode={mode}
                            contextId={contextId}
                            tournamentBalance={participant.current_balance}
                        />
                    </div>

                    {/* Center Column: Positions & P&L */}
                    <div className="lg:col-span-6 space-y-6">
                        {/* P&L Widget */}
                        <PnLWidget mode={mode} contextId={contextId} />

                        {/* Positions */}
                        <PositionsTable mode={mode} contextId={contextId} />

                        {/* Tournament Info */}
                        <Card title="Tournament Rules">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Entry Fee:</span>
                                    <span className="text-white font-semibold">{formatCurrency(tournament.entry_fee)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Prize Pool:</span>
                                    <span className="text-green-400 font-semibold">{formatCurrency(tournament.prize_pool)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Max Participants:</span>
                                    <span className="text-white">{tournament.max_participants}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Start Time:</span>
                                    <span className="text-white">{formatDateTime(tournament.start_date)}</span>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column: Orders History */}
                    <div className="lg:col-span-3">
                        <Card title="Orders" className="h-full">
                            <OrdersHistory mode={mode} contextId={contextId} />
                        </Card>
                    </div>
                </div>

                {/* Warning Notice */}
                <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-semibold text-yellow-500">Tournament Trading Notice</h4>
                            <p className="text-xs text-yellow-400/80 mt-1">
                                This is tournament mode with isolated virtual capital. Your trades here do not affect your demo wallet. 
                                P&L is calculated for tournament ranking only.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
