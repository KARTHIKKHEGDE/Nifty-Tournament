import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { TrendingUp, Wallet, Trophy, BarChart3, ArrowRight } from 'lucide-react';
import { useUserStore } from '../../stores/userStore';
import { useTradingStore } from '../../stores/tradingStore';
import { formatCurrency, getPriceColor } from '../../utils/formatters';
import Link from 'next/link';

export default function DashboardHome() {
    const router = useRouter();
    const { user, wallet } = useUserStore();
    const { totalPnL, dayPnL, portfolioValue } = useTradingStore();

    return (
        <DashboardLayout title="Dashboard">
            <div className="p-6 space-y-6">
                {/* Welcome Section */}
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Welcome back, {user?.username}! 👋
                    </h1>
                    <p className="text-gray-400">
                        Here's your trading overview and quick actions
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Virtual Balance */}
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <Wallet className="w-8 h-8 opacity-80" />
                            <span className="text-sm opacity-80">Virtual Balance</span>
                        </div>
                        <p className="text-3xl font-bold mb-1">
                            {formatCurrency(wallet?.balance || 0)}
                        </p>
                        <p className="text-sm opacity-80">Available for trading</p>
                    </div>

                    {/* Portfolio Value */}
                    <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <BarChart3 className="w-8 h-8 opacity-80" />
                            <span className="text-sm opacity-80">Portfolio Value</span>
                        </div>
                        <p className="text-3xl font-bold mb-1">
                            {formatCurrency(portfolioValue || 0)}
                        </p>
                        <p className="text-sm opacity-80">Total holdings</p>
                    </div>

                    {/* Total P&L */}
                    <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <TrendingUp className="w-8 h-8 opacity-80" />
                            <span className="text-sm opacity-80">Total P&L</span>
                        </div>
                        <p className={`text-3xl font-bold mb-1 ${getPriceColor(totalPnL || 0)}`}>
                            {formatCurrency(totalPnL || 0)}
                        </p>
                        <p className="text-sm opacity-80">All time</p>
                    </div>

                    {/* Day P&L */}
                    <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <Trophy className="w-8 h-8 opacity-80" />
                            <span className="text-sm opacity-80">Today's P&L</span>
                        </div>
                        <p className={`text-3xl font-bold mb-1 ${getPriceColor(dayPnL || 0)}`}>
                            {formatCurrency(dayPnL || 0)}
                        </p>
                        <p className="text-sm opacity-80">Today's performance</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Link
                            href="/dashboard/nifty"
                            className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-blue-500 transition-all duration-200 hover-lift group"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <TrendingUp className="w-8 h-8 text-blue-500" />
                                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Trade NIFTY</h3>
                            <p className="text-sm text-gray-400">
                                Start trading NIFTY 50 with real-time data
                            </p>
                        </Link>

                        <Link
                            href="/dashboard/options"
                            className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-green-500 transition-all duration-200 hover-lift group"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <BarChart3 className="w-8 h-8 text-green-500" />
                                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Options Chain</h3>
                            <p className="text-sm text-gray-400">
                                View and trade NIFTY options (CE/PE)
                            </p>
                        </Link>

                        <Link
                            href="/dashboard/tournaments"
                            className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-purple-500 transition-all duration-200 hover-lift group"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <Trophy className="w-8 h-8 text-purple-500" />
                                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Tournaments</h3>
                            <p className="text-sm text-gray-400">
                                Compete for real money prizes
                            </p>
                        </Link>
                    </div>
                </div>

                {/* Getting Started Guide */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-white mb-4">Getting Started</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-3">
                                <span className="text-2xl font-bold text-white">1</span>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Learn the Basics</h3>
                            <p className="text-sm text-gray-400">
                                Familiarize yourself with the trading interface and paper trading concept
                            </p>
                        </div>
                        <div>
                            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-3">
                                <span className="text-2xl font-bold text-white">2</span>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Practice Trading</h3>
                            <p className="text-sm text-gray-400">
                                Use your ₹1,00,000 virtual balance to practice trading strategies
                            </p>
                        </div>
                        <div>
                            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-3">
                                <span className="text-2xl font-bold text-white">3</span>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Join Tournaments</h3>
                            <p className="text-sm text-gray-400">
                                Compete with others and win real money prizes based on performance
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
