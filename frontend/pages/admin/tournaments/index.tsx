/**
 * Admin Tournaments List - View and manage all tournaments
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import { useAdminStore } from '../../../stores/adminStore';

const TournamentsPage = () => {
    const router = useRouter();
    const { tournaments, loading, fetchTournaments, startTournament, endTournament, deleteTournament } = useAdminStore();
    const [statusFilter, setStatusFilter] = useState<string>('');

    useEffect(() => {
        fetchTournaments({ status: statusFilter || undefined });
    }, [statusFilter]);

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

    const handleViewDetails = (tournamentId: number) => {
        router.push(`/admin/tournaments/${tournamentId}`);
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Tournaments</h1>
                        <p className="mt-2 text-gray-400">Manage all platform tournaments</p>
                    </div>
                    <button
                        onClick={() => router.push('/admin/tournaments/create')}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create Tournament
                    </button>
                </div>

                {/* Filters */}
                <div className="flex items-center space-x-4">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                        <option value="">All Statuses</option>
                        <option value="REGISTRATION_OPEN">Registration Open</option>
                        <option value="ACTIVE">Active</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>

                {/* Tournaments Table */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                    {loading.tournaments ? (
                        <div className="p-8 text-center">
                            <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <p className="mt-4 text-gray-400">Loading tournaments...</p>
                        </div>
                    ) : tournaments.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-gray-400">No tournaments found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                            Tournament
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                            Participants
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                            Prize Pool
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                            Dates
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {tournaments.map((tournament) => (
                                        <tr key={tournament.id} className="hover:bg-gray-700 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-white">{tournament.name}</p>
                                                    <p className="text-sm text-gray-400">Entry: ₹{tournament.entry_fee.toLocaleString()}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(tournament.status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-white">
                                                    <span className="font-medium">{tournament.current_participants}</span>
                                                    {tournament.max_participants && (
                                                        <span className="text-gray-400"> / {tournament.max_participants}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-green-400">₹{tournament.prize_pool.toLocaleString()}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-400">
                                                    <p>{new Date(tournament.start_date).toLocaleDateString()}</p>
                                                    <p>to {new Date(tournament.end_date).toLocaleDateString()}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleViewDetails(tournament.id)}
                                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
                                                    >
                                                        View Details
                                                    </button>
                                                    {tournament.status === 'REGISTRATION_OPEN' && (
                                                        <button
                                                            onClick={() => startTournament(tournament.id)}
                                                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors"
                                                        >
                                                            Start
                                                        </button>
                                                    )}
                                                    {tournament.status === 'ACTIVE' && (
                                                        <button
                                                            onClick={() => endTournament(tournament.id)}
                                                            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded transition-colors"
                                                        >
                                                            End
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to delete this tournament?')) {
                                                                deleteTournament(tournament.id);
                                                            }
                                                        }}
                                                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
                                                    >
                                                        Delete
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
        </AdminLayout>
    );
};

export default TournamentsPage;
