/**
 * Admin Dashboard Home - Main overview page
 */

import React, { useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import DashboardCard from '../../components/admin/DashboardCard';
import { useAdminStore } from '../../stores/adminStore';

const AdminDashboard = () => {
    const {
        dashboardData,
        recentActivity,
        topPerformers,
        loading,
        fetchDashboardData,
        fetchRecentActivity,
        fetchTopPerformers,
    } = useAdminStore();

    useEffect(() => {
        fetchDashboardData();
        fetchRecentActivity(10);
        fetchTopPerformers('pnl', 5);
    }, []);

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
                    <p className="mt-2 text-gray-400">
                        Welcome to the admin dashboard. Monitor platform performance and manage operations.
                    </p>
                </div>

                {/* Stats Grid */}
                {loading.dashboard ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-32 bg-gray-800 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : dashboardData ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <DashboardCard
                            title="Total Users"
                            value={dashboardData.total_users}
                            subtitle={`${dashboardData.active_users} active`}
                            color="blue"
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            }
                        />

                        <DashboardCard
                            title="Total Tournaments"
                            value={dashboardData.total_tournaments}
                            subtitle={`${dashboardData.active_tournaments} active`}
                            color="purple"
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                            }
                        />

                        <DashboardCard
                            title="Total Revenue"
                            value={`₹${dashboardData.total_revenue.toLocaleString()}`}
                            subtitle="Entry fees collected"
                            color="green"
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            }
                        />

                        <DashboardCard
                            title="Total Participants"
                            value={dashboardData.total_participants}
                            subtitle="Across all tournaments"
                            color="orange"
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            }
                        />

                        <DashboardCard
                            title="Total Orders"
                            value={dashboardData.total_orders}
                            subtitle={`${dashboardData.executed_orders} executed`}
                            color="blue"
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            }
                        />

                        <DashboardCard
                            title="Completed Tournaments"
                            value={dashboardData.completed_tournaments}
                            subtitle={`${((dashboardData.completed_tournaments / dashboardData.total_tournaments) * 100).toFixed(1)}% completion rate`}
                            color="purple"
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            }
                        />

                        <DashboardCard
                            title="Platform Balance"
                            value={`₹${dashboardData.platform_balance.toLocaleString()}`}
                            subtitle="Total user balances"
                            color="green"
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                </svg>
                            }
                        />

                        <DashboardCard
                            title="Active Users"
                            value={dashboardData.active_users}
                            subtitle={`${((dashboardData.active_users / dashboardData.total_users) * 100).toFixed(1)}% of total`}
                            color="orange"
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            }
                        />
                    </div>
                ) : null}

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Top Performers */}
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Top Performers</h2>
                        {topPerformers.length > 0 ? (
                            <div className="space-y-3">
                                {topPerformers.map((performer, index) => (
                                    <div
                                        key={performer.user_id}
                                        className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm">
                                                #{index + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{performer.username}</p>
                                                <p className="text-sm text-gray-400">{performer.tournaments_joined} tournaments</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold ${performer.metric_value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                ₹{performer.metric_value.toLocaleString()}
                                            </p>
                                            <p className="text-sm text-gray-400">{performer.total_trades} trades</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center py-8">No data available</p>
                        )}
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
                        {recentActivity.length > 0 ? (
                            <div className="space-y-3">
                                {recentActivity.map((activity) => (
                                    <div
                                        key={activity.id}
                                        className="flex items-start space-x-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                                    >
                                        <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white">{activity.description}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {activity.username} • {new Date(activity.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center py-8">No recent activity</p>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <button
                            onClick={() => window.location.href = '/admin/tournaments'}
                            className="flex items-center justify-center px-6 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span className="font-medium text-white">New Tournament</span>
                        </button>

                        <button
                            onClick={() => window.location.href = '/admin/users'}
                            className="flex items-center justify-center px-6 py-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span className="font-medium text-white">View Users</span>
                        </button>

                        <button
                            onClick={() => window.location.href = '/admin/analytics'}
                            className="flex items-center justify-center px-6 py-4 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span className="font-medium text-white">Analytics</span>
                        </button>

                        <button
                            onClick={() => window.location.href = '/admin/audit'}
                            className="flex items-center justify-center px-6 py-4 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="font-medium text-white">Audit Log</span>
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
