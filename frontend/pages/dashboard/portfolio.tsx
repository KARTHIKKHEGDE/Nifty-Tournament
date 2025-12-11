import React, { useEffect, useState, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import PositionsTable from '../../components/trading/PositionsTable';
import Card from '../../components/common/Card';
import { Wallet, TrendingUp, TrendingDown, Activity, PieChart } from 'lucide-react';
import { formatCurrency, formatPercentage, getPriceColor } from '../../utils/formatters';
import tradingService from '../../services/tradingService';
import { useUserStore } from '../../stores/userStore';
import Loader from '../../components/common/Loader';
import { throttle } from '../../utils/throttle';

export default function PortfolioPage() {
    const { wallet } = useUserStore();
    const [portfolio, setPortfolio] = useState({
        total_value: 0,
        cash_balance: 0,
        positions_value: 0,
        total_pnl: 0,
        day_pnl: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    const loadPortfolio = async () => {
        setIsLoading(true);
        try {
            const data = await tradingService.getPortfolio();
            setPortfolio(data);
        } catch (error) {
            console.error('Failed to load portfolio:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Throttle to prevent overlapping requests
    const throttledLoad = useRef(throttle(loadPortfolio, 10000));

    useEffect(() => {
        loadPortfolio();

        // Refresh every 10 seconds with throttling
        const interval = setInterval(() => throttledLoad.current(), 10000);
        return () => clearInterval(interval);
    }, []);

    const calculateROI = () => {
        const initialBalance = 100000; // Starting balance
        return ((portfolio.total_value - initialBalance) / initialBalance) * 100;
    };

    if (isLoading) {
        return (
            <DashboardLayout title="Portfolio">
                <div className="flex items-center justify-center h-screen">
                    <Loader text="Loading portfolio..." size="lg" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Portfolio">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Portfolio</h1>
                    <p className="text-gray-400">Track your trading performance and positions</p>
                </div>

                {/* Portfolio Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Portfolio Value */}
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <PieChart className="w-8 h-8 text-blue-500" />
                            <span className="text-xs text-gray-400">Total Value</span>
                        </div>
                        <p className="text-2xl font-bold text-white mb-1">
                            {formatCurrency(portfolio.total_value)}
                        </p>
                        <p className={`text-sm font-medium ${getPriceColor(calculateROI())}`}>
                            {formatPercentage(calculateROI())} ROI
                        </p>
                    </Card>

                    {/* Cash Balance */}
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <Wallet className="w-8 h-8 text-green-500" />
                            <span className="text-xs text-gray-400">Cash Balance</span>
                        </div>
                        <p className="text-2xl font-bold text-white mb-1">
                            {formatCurrency(wallet?.balance || portfolio.cash_balance)}
                        </p>
                        <p className="text-sm text-gray-400">Available to trade</p>
                    </Card>

                    {/* Positions Value */}
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <Activity className="w-8 h-8 text-purple-500" />
                            <span className="text-xs text-gray-400">Positions Value</span>
                        </div>
                        <p className="text-2xl font-bold text-white mb-1">
                            {formatCurrency(portfolio.positions_value)}
                        </p>
                        <p className="text-sm text-gray-400">Open positions</p>
                    </Card>

                    {/* Total P&L */}
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            {portfolio.total_pnl >= 0 ? (
                                <TrendingUp className="w-8 h-8 text-green-500" />
                            ) : (
                                <TrendingDown className="w-8 h-8 text-red-500" />
                            )}
                            <span className="text-xs text-gray-400">Total P&L</span>
                        </div>
                        <p className={`text-2xl font-bold mb-1 ${getPriceColor(portfolio.total_pnl)}`}>
                            {formatCurrency(portfolio.total_pnl)}
                        </p>
                        <p className="text-sm text-gray-400">All time</p>
                    </Card>
                </div>

                {/* Performance Chart Placeholder */}
                <Card title="Performance Overview">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-6 bg-gray-700 rounded-lg">
                            <p className="text-sm text-gray-400 mb-2">Today's P&L</p>
                            <p className={`text-3xl font-bold ${getPriceColor(portfolio.day_pnl)}`}>
                                {formatCurrency(portfolio.day_pnl)}
                            </p>
                        </div>
                        <div className="text-center p-6 bg-gray-700 rounded-lg">
                            <p className="text-sm text-gray-400 mb-2">Total Invested</p>
                            <p className="text-3xl font-bold text-white">
                                {formatCurrency(100000)} {/* Initial balance */}
                            </p>
                        </div>
                        <div className="text-center p-6 bg-gray-700 rounded-lg">
                            <p className="text-sm text-gray-400 mb-2">Current Value</p>
                            <p className="text-3xl font-bold text-white">
                                {formatCurrency(portfolio.total_value)}
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Open Positions */}
                <PositionsTable />

                {/* Portfolio Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card title="Asset Allocation">
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-400">Cash</span>
                                    <span className="text-white font-medium">
                                        {((portfolio.cash_balance / portfolio.total_value) * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-green-500 h-2 rounded-full"
                                        style={{
                                            width: `${(portfolio.cash_balance / portfolio.total_value) * 100}%`,
                                        }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-400">Positions</span>
                                    <span className="text-white font-medium">
                                        {((portfolio.positions_value / portfolio.total_value) * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full"
                                        style={{
                                            width: `${(portfolio.positions_value / portfolio.total_value) * 100}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card title="Trading Stats">
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Starting Balance</span>
                                <span className="text-white font-medium">{formatCurrency(100000)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Current Balance</span>
                                <span className="text-white font-medium">
                                    {formatCurrency(portfolio.total_value)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Total P&L</span>
                                <span className={`font-medium ${getPriceColor(portfolio.total_pnl)}`}>
                                    {formatCurrency(portfolio.total_pnl)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">ROI</span>
                                <span className={`font-medium ${getPriceColor(calculateROI())}`}>
                                    {formatPercentage(calculateROI())}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Paper Trading Notice */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
                    <h3 className="text-blue-400 font-semibold mb-2">📊 Paper Trading Portfolio</h3>
                    <p className="text-sm text-gray-400">
                        This portfolio uses virtual money for practice trading. All P&L calculations are simulated.
                        Join tournaments to compete for real money prizes based on your trading performance!
                    </p>
                </div>
            </div>
        </DashboardLayout>
    );
}
