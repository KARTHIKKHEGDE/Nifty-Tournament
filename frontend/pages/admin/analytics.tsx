/**
 * Analytics Dashboard - Platform analytics and insights
 */

import React, { useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import DashboardCard from '../../components/admin/DashboardCard';
import { useAdminStore } from '../../stores/adminStore';

const AnalyticsPage = () => {
    const {
        revenueAnalytics,
        userGrowth,
        tournamentPerformance,
        loading,
        fetchRevenueAnalytics,
        fetchUserGrowth,
        fetchTournamentPerformance,
    } = useAdminStore();

    useEffect(() => {
        fetchRevenueAnalytics();
        fetchUserGrowth();
        fetchTournamentPerformance();
    }, []);

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
                    <p className="mt-2 text-gray-400">
                        Comprehensive platform analytics and performance metrics
                    </p>
                </div>

                {/* Revenue Analytics */}
                {loading.analytics ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-32 bg-gray-800 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Revenue Section */}
                        {revenueAnalytics && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-white">Revenue Analytics</h2>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                    <DashboardCard
                                        title="Total Revenue"
                                        value={`₹${revenueAnalytics.total_revenue.toLocaleString()}`}
                                        color="green"
                                        icon={
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        }
                                    />
                                    <DashboardCard
                                        title="Net Revenue"
                                        value={`₹${revenueAnalytics.net_revenue.toLocaleString()}`}
                                        subtitle="After prizes"
                                        color="blue"
                                        icon={
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                            </svg>
                                        }
                                    />
                                    <DashboardCard
                                        title="Revenue This Month"
                                        value={`₹${revenueAnalytics.revenue_this_month.toLocaleString()}`}
                                        trend={{
                                            value: revenueAnalytics.revenue_growth_rate,
                                            isPositive: revenueAnalytics.revenue_growth_rate >= 0,
                                        }}
                                        color="purple"
                                        icon={
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                        }
                                    />
                                    <DashboardCard
                                        title="Prizes Distributed"
                                        value={`₹${revenueAnalytics.total_prizes_distributed.toLocaleString()}`}
                                        color="orange"
                                        icon={
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                            </svg>
                                        }
                                    />
                                </div>

                                {/* Revenue by Tournament */}
                                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                                    <h3 className="text-xl font-bold text-white mb-4">Top Revenue Tournaments</h3>
                                    {revenueAnalytics.revenue_by_tournament.length > 0 ? (
                                        <div className="space-y-3">
                                            {revenueAnalytics.revenue_by_tournament.map((tournament: any, index: number) => (
                                                <div
                                                    key={tournament.tournament_id}
                                                    className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white font-bold text-sm">
                                                            #{index + 1}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-white">{tournament.tournament_name}</p>
                                                            <p className="text-sm text-gray-400">{tournament.participants} participants</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-green-400">₹{tournament.revenue.toLocaleString()}</p>
                                                        <p className="text-sm text-gray-400">Entry: ₹{tournament.entry_fee.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 text-center py-8">No data available</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* User Growth Section */}
                        {userGrowth && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-white">User Growth</h2>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                    <DashboardCard
                                        title="Total Users"
                                        value={userGrowth.total_users}
                                        color="blue"
                                        icon={
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        }
                                    />
                                    <DashboardCard
                                        title="New This Month"
                                        value={userGrowth.new_users_this_month}
                                        trend={{
                                            value: userGrowth.growth_rate,
                                            isPositive: userGrowth.growth_rate >= 0,
                                        }}
                                        color="green"
                                        icon={
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                            </svg>
                                        }
                                    />
                                    <DashboardCard
                                        title="Active This Month"
                                        value={userGrowth.active_users_this_month}
                                        subtitle={`${((userGrowth.active_users_this_month / userGrowth.total_users) * 100).toFixed(1)}% of total`}
                                        color="purple"
                                        icon={
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        }
                                    />
                                    <DashboardCard
                                        title="Retention Rate"
                                        value={`${userGrowth.retention_rate.toFixed(1)}%`}
                                        color="orange"
                                        icon={
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        }
                                    />
                                </div>

                                {/* Daily Signups Chart */}
                                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                                    <h3 className="text-xl font-bold text-white mb-4">Daily Signups (Last 30 Days)</h3>
                                    <div className="h-64 flex items-end justify-between space-x-1">
                                        {userGrowth.daily_signups.map((day: any, index: number) => {
                                            const maxSignups = Math.max(...userGrowth.daily_signups.map((d: any) => d.signups));
                                            const height = maxSignups > 0 ? (day.signups / maxSignups) * 100 : 0;
                                            return (
                                                <div
                                                    key={index}
                                                    className="flex-1 bg-blue-600 rounded-t hover:bg-blue-500 transition-colors cursor-pointer group relative"
                                                    style={{ height: `${height}%`, minHeight: day.signups > 0 ? '4px' : '0' }}
                                                    title={`${day.date}: ${day.signups} signups`}
                                                >
                                                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                        {day.date}: {day.signups}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
                                        <span>30 days ago</span>
                                        <span>Today</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tournament Performance Section */}
                        {tournamentPerformance && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-white">Tournament Performance</h2>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                    <DashboardCard
                                        title="Total Tournaments"
                                        value={tournamentPerformance.total_tournaments}
                                        subtitle={`${tournamentPerformance.active_tournaments} active`}
                                        color="purple"
                                        icon={
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                            </svg>
                                        }
                                    />
                                    <DashboardCard
                                        title="Completion Rate"
                                        value={`${tournamentPerformance.completion_rate.toFixed(1)}%`}
                                        color="green"
                                        icon={
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        }
                                    />
                                    <DashboardCard
                                        title="Avg Participants"
                                        value={tournamentPerformance.avg_participants_per_tournament.toFixed(1)}
                                        color="blue"
                                        icon={
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        }
                                    />
                                    <DashboardCard
                                        title="Avg Trades"
                                        value={tournamentPerformance.avg_trades_per_tournament.toFixed(0)}
                                        color="orange"
                                        icon={
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                        }
                                    />
                                </div>

                                {/* Most Popular Tournaments */}
                                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                                    <h3 className="text-xl font-bold text-white mb-4">Most Popular Tournaments</h3>
                                    {tournamentPerformance.most_popular_tournaments.length > 0 ? (
                                        <div className="space-y-3">
                                            {tournamentPerformance.most_popular_tournaments.map((tournament: any, index: number) => (
                                                <div
                                                    key={tournament.tournament_id}
                                                    className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-sm">
                                                            #{index + 1}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-white">{tournament.tournament_name}</p>
                                                            <p className="text-sm text-gray-400">
                                                                Prize: ₹{tournament.prize_pool.toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-white">{tournament.participants} participants</p>
                                                        <p className="text-sm text-gray-400">{tournament.status}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 text-center py-8">No data available</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AdminLayout>
    );
};

export default AnalyticsPage;
