/**
 * Tournament Details Page - View and manage tournament participants
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import RemoveParticipantModal from '../../../components/admin/RemoveParticipantModal';
import { useAdminStore } from '../../../stores/adminStore';

const TournamentDetailsPage = () => {
    const router = useRouter();
    const { id } = router.query;
    const tournamentId = parseInt(id as string);

    const {
        selectedTournament,
        tournamentParticipants,
        tournamentAnalytics,
        loading,
        fetchTournamentDetails,
        fetchTournamentParticipants,
        fetchTournamentAnalytics,
        removeParticipant,
        startTournament,
        endTournament,
    } = useAdminStore();

    const [removeModal, setRemoveModal] = useState<{
        isOpen: boolean;
        participant: any | null;
    }>({
        isOpen: false,
        participant: null,
    });
    const [isRemoving, setIsRemoving] = useState(false);

    useEffect(() => {
        if (tournamentId) {
            fetchTournamentDetails(tournamentId);
            fetchTournamentParticipants(tournamentId);
            fetchTournamentAnalytics(tournamentId);
        }
    }, [tournamentId]);

    const handleRemoveClick = (participant: any) => {
        setRemoveModal({
            isOpen: true,
            participant,
        });
    };

    const handleRemoveConfirm = async (reason?: string) => {
        if (!removeModal.participant) return;

        setIsRemoving(true);
        const success = await removeParticipant(
            tournamentId,
            removeModal.participant.user_id,
            reason
        );

        setIsRemoving(false);
        if (success) {
            setRemoveModal({ isOpen: false, participant: null });
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { bg: string; text: string }> = {
            REGISTRATION_OPEN: { bg: 'bg-blue-500', text: 'Registration Open' },
            ACTIVE: { bg: 'bg-green-500', text: 'Active' },
            COMPLETED: { bg: 'bg-gray-500', text: 'Completed' },
            CANCELLED: { bg: 'bg-red-500', text: 'Cancelled' },
        };
        const badge = badges[status] || { bg: 'bg-gray-500', text: status };
        return (
            <span className={`px-3 py-1 text-xs font-semibold text-white rounded-full ${badge.bg}`}>
                {badge.text}
            </span>
        );
    };

    if (!selectedTournament) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <p className="mt-4 text-gray-400">Loading tournament...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <button
                            onClick={() => router.push('/admin/tournaments')}
                            className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Tournaments
                        </button>
                        <h1 className="text-3xl font-bold text-white">{selectedTournament.name}</h1>
                        <div className="flex items-center space-x-3 mt-2">
                            {getStatusBadge(selectedTournament.status)}
                            <span className="text-gray-400">
                                {selectedTournament.current_participants} participants
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        {selectedTournament.status === 'REGISTRATION_OPEN' && (
                            <button
                                onClick={() => startTournament(tournamentId)}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                            >
                                Start Tournament
                            </button>
                        )}
                        {selectedTournament.status === 'ACTIVE' && (
                            <button
                                onClick={() => endTournament(tournamentId)}
                                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
                            >
                                End Tournament
                            </button>
                        )}
                    </div>
                </div>

                {/* Tournament Info Cards */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                        <p className="text-sm text-gray-400 uppercase tracking-wide">Prize Pool</p>
                        <p className="mt-2 text-2xl font-bold text-green-400">
                            ₹{selectedTournament.prize_pool.toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                        <p className="text-sm text-gray-400 uppercase tracking-wide">Entry Fee</p>
                        <p className="mt-2 text-2xl font-bold text-white">
                            ₹{selectedTournament.entry_fee.toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                        <p className="text-sm text-gray-400 uppercase tracking-wide">Starting Balance</p>
                        <p className="mt-2 text-2xl font-bold text-white">
                            ₹{selectedTournament.starting_balance.toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                        <p className="text-sm text-gray-400 uppercase tracking-wide">Participants</p>
                        <p className="mt-2 text-2xl font-bold text-white">
                            {selectedTournament.current_participants}
                            {selectedTournament.max_participants && (
                                <span className="text-lg text-gray-400"> / {selectedTournament.max_participants}</span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Analytics */}
                {tournamentAnalytics && (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                            <p className="text-sm text-gray-400 uppercase tracking-wide">Total Trades</p>
                            <p className="mt-2 text-2xl font-bold text-white">
                                {tournamentAnalytics.total_trades.toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                            <p className="text-sm text-gray-400 uppercase tracking-wide">Total Volume</p>
                            <p className="mt-2 text-2xl font-bold text-white">
                                ₹{tournamentAnalytics.total_volume.toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                            <p className="text-sm text-gray-400 uppercase tracking-wide">Avg P&L</p>
                            <p className={`mt-2 text-2xl font-bold ${tournamentAnalytics.avg_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                ₹{tournamentAnalytics.avg_pnl.toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                            <p className="text-sm text-gray-400 uppercase tracking-wide">Profitable</p>
                            <p className="mt-2 text-2xl font-bold text-green-400">
                                {tournamentAnalytics.profitable_participants}
                                <span className="text-lg text-gray-400"> / {tournamentAnalytics.total_participants}</span>
                            </p>
                        </div>
                    </div>
                )}

                {/* Participants Table */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">Participants</h2>
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                            Add Participant
                        </button>
                    </div>

                    {loading.participants ? (
                        <div className="p-8 text-center">
                            <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <p className="mt-4 text-gray-400">Loading participants...</p>
                        </div>
                    ) : tournamentParticipants.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-gray-400">No participants yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                            Rank
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                            Participant
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                            Balance
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                            P&L
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                            ROI
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                            Trades
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                            Win Rate
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {tournamentParticipants.map((participant) => (
                                        <tr key={participant.id} className="hover:bg-gray-700 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm">
                                                    {participant.rank || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-white">{participant.username}</p>
                                                    <p className="text-sm text-gray-400">{participant.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-white">₹{participant.current_balance.toLocaleString()}</p>
                                                <p className="text-sm text-gray-400">Start: ₹{participant.starting_balance.toLocaleString()}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className={`font-bold ${participant.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {participant.total_pnl >= 0 ? '+' : ''}₹{participant.total_pnl.toLocaleString()}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className={`font-medium ${participant.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {participant.roi >= 0 ? '+' : ''}{participant.roi.toFixed(2)}%
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-white">
                                                    <p className="font-medium">{participant.total_trades}</p>
                                                    <p className="text-sm text-gray-400">
                                                        W: {participant.winning_trades} / L: {participant.losing_trades}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-white">{participant.win_rate.toFixed(1)}%</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleRemoveClick(participant)}
                                                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors flex items-center"
                                                    >
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        Remove
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Remove Participant Modal */}
            <RemoveParticipantModal
                isOpen={removeModal.isOpen}
                onClose={() => setRemoveModal({ isOpen: false, participant: null })}
                onConfirm={handleRemoveConfirm}
                participant={removeModal.participant}
                isLoading={isRemoving}
            />
        </AdminLayout>
    );
};

export default TournamentDetailsPage;
