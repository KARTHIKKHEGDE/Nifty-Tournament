/**
 * User Details Page - View detailed user information
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import DashboardCard from '../../../components/admin/DashboardCard';
import { useAdminStore } from '../../../stores/adminStore';

const UserDetailsPage = () => {
    const router = useRouter();
    const { id } = router.query;
    const userId = parseInt(id as string);

    const { selectedUser, fetchUserDetails, activateUser, deactivateUser, makeAdmin, revokeAdmin, deleteUser } = useAdminStore();

    useEffect(() => {
        if (userId) {
            fetchUserDetails(userId);
        }
    }, [userId]);

    const handleDelete = async () => {
        if (confirm(`Are you sure you want to delete this user? This action cannot be undone.`)) {
            const success = await deleteUser(userId);
            if (success) {
                router.push('/admin/users');
            }
        }
    };

    if (!selectedUser) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <p className="mt-4 text-gray-400">Loading user...</p>
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
                            onClick={() => router.push('/admin/users')}
                            className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Users
                        </button>
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                                {selectedUser.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white">{selectedUser.username}</h1>
                                <p className="text-gray-400">{selectedUser.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 mt-4">
                            {selectedUser.is_active ? (
                                <span className="px-3 py-1 text-xs font-semibold text-white bg-green-500 rounded-full">
                                    Active
                                </span>
                            ) : (
                                <span className="px-3 py-1 text-xs font-semibold text-white bg-red-500 rounded-full">
                                    Inactive
                                </span>
                            )}
                            {selectedUser.is_admin && (
                                <span className="px-3 py-1 text-xs font-semibold text-white bg-purple-500 rounded-full">
                                    Admin
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        {selectedUser.is_active ? (
                            <button
                                onClick={() => deactivateUser(userId)}
                                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
                            >
                                Deactivate
                            </button>
                        ) : (
                            <button
                                onClick={() => activateUser(userId)}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                            >
                                Activate
                            </button>
                        )}
                        {!selectedUser.is_admin ? (
                            <button
                                onClick={() => makeAdmin(userId)}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                            >
                                Make Admin
                            </button>
                        ) : (
                            <button
                                onClick={() => revokeAdmin(userId)}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors"
                            >
                                Revoke Admin
                            </button>
                        )}
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                        >
                            Delete User
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <DashboardCard
                        title="Current Balance"
                        value={`₹${selectedUser.current_balance.toLocaleString()}`}
                        color="green"
                        icon={
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                    />

                    <DashboardCard
                        title="Total P&L"
                        value={`₹${selectedUser.total_pnl.toLocaleString()}`}
                        color={selectedUser.total_pnl >= 0 ? 'green' : 'red'}
                        icon={
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        }
                    />

                    <DashboardCard
                        title="Tournaments"
                        value={selectedUser.tournaments_joined}
                        subtitle={`${selectedUser.tournaments_completed} completed`}
                        color="purple"
                        icon={
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                        }
                    />

                    <DashboardCard
                        title="Total Trades"
                        value={selectedUser.total_trades}
                        subtitle={`${selectedUser.win_rate.toFixed(1)}% win rate`}
                        color="blue"
                        icon={
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        }
                    />
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Performance Metrics</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Trading Volume</span>
                                <span className="font-medium text-white">₹{selectedUser.total_volume.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Avg P&L per Trade</span>
                                <span className={`font-medium ${selectedUser.avg_pnl_per_trade >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    ₹{selectedUser.avg_pnl_per_trade.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Best Rank</span>
                                <span className="font-medium text-white">
                                    {selectedUser.best_rank ? `#${selectedUser.best_rank}` : 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Average Rank</span>
                                <span className="font-medium text-white">
                                    {selectedUser.avg_rank ? `#${selectedUser.avg_rank.toFixed(0)}` : 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Total Winnings</span>
                                <span className="font-medium text-green-400">₹{selectedUser.total_winnings.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Entry Fees Paid</span>
                                <span className="font-medium text-white">₹{selectedUser.total_entry_fees_paid.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Account Information</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">User ID</span>
                                <span className="font-medium text-white">{selectedUser.user_id}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Email</span>
                                <span className="font-medium text-white">{selectedUser.email}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Status</span>
                                {selectedUser.is_active ? (
                                    <span className="px-3 py-1 text-xs font-semibold text-white bg-green-500 rounded-full">
                                        Active
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 text-xs font-semibold text-white bg-red-500 rounded-full">
                                        Inactive
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Role</span>
                                {selectedUser.is_admin ? (
                                    <span className="px-3 py-1 text-xs font-semibold text-white bg-purple-500 rounded-full">
                                        Admin
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 text-xs font-semibold text-white bg-gray-600 rounded-full">
                                        User
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Member Since</span>
                                <span className="font-medium text-white">
                                    {new Date(selectedUser.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Active Tournaments</span>
                                <span className="font-medium text-white">{selectedUser.active_tournaments}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default UserDetailsPage;
