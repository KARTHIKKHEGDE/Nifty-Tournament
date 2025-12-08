import React, { useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useTradingStore } from '../stores/tradingStore';
import { formatCurrency } from '../utils/formatters';
import { TrendingUp, TrendingDown, X } from 'lucide-react';

export default function PositionsPage() {
    const { positions } = useTradingStore();

    const handleSquareOff = (positionId: number) => {
        // TODO: Implement square-off logic
        console.log('Square off position:', positionId);
    };

    const totalUnrealizedPnL = positions.reduce((sum, pos) => sum + (pos.unrealized_pnl || 0), 0);
    const totalRealizedPnL = positions.reduce((sum, pos) => sum + pos.realized_pnl, 0);

    return (
        <DashboardLayout title="Positions" showWatchlist={true}>
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1">Live Positions</h1>
                        <p className="text-sm text-gray-400">
                            View and manage your open positions
                        </p>
                    </div>

                    {/* Summary Cards */}
                    <div className="flex items-center gap-4">
                        <div className="bg-[#1a1d23] border border-gray-800 rounded-lg px-4 py-2">
                            <p className="text-xs text-gray-400 mb-0.5">Unrealized P&L</p>
                            <p
                                className={`text-lg font-bold ${totalUnrealizedPnL >= 0 ? 'text-green-500' : 'text-red-500'
                                    }`}
                            >
                                {formatCurrency(totalUnrealizedPnL)}
                            </p>
                        </div>
                        <div className="bg-[#1a1d23] border border-gray-800 rounded-lg px-4 py-2">
                            <p className="text-xs text-gray-400 mb-0.5">Realized P&L</p>
                            <p
                                className={`text-lg font-bold ${totalRealizedPnL >= 0 ? 'text-green-500' : 'text-red-500'
                                    }`}
                            >
                                {formatCurrency(totalRealizedPnL)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Positions Table */}
                <div className="bg-[#1a1d23] border border-gray-800 rounded-lg overflow-hidden">
                    {positions.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#131722] border-b border-gray-800">
                                    <tr>
                                        <th className="text-left text-xs font-semibold text-gray-400 px-6 py-4 uppercase tracking-wider">
                                            Symbol
                                        </th>
                                        <th className="text-left text-xs font-semibold text-gray-400 px-6 py-4 uppercase tracking-wider">
                                            Product
                                        </th>
                                        <th className="text-right text-xs font-semibold text-gray-400 px-6 py-4 uppercase tracking-wider">
                                            Qty
                                        </th>
                                        <th className="text-right text-xs font-semibold text-gray-400 px-6 py-4 uppercase tracking-wider">
                                            Avg Price
                                        </th>
                                        <th className="text-right text-xs font-semibold text-gray-400 px-6 py-4 uppercase tracking-wider">
                                            LTP
                                        </th>
                                        <th className="text-right text-xs font-semibold text-gray-400 px-6 py-4 uppercase tracking-wider">
                                            Unrealized P&L
                                        </th>
                                        <th className="text-right text-xs font-semibold text-gray-400 px-6 py-4 uppercase tracking-wider">
                                            Day Change
                                        </th>
                                        <th className="text-center text-xs font-semibold text-gray-400 px-6 py-4 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {positions.map((position) => {
                                        const unrealizedPnL = position.unrealized_pnl || 0;
                                        const dayChangePercent = position.day_change_percentage || 0;

                                        return (
                                            <tr
                                                key={position.id}
                                                className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-white">
                                                            {position.symbol}
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            {position.instrument_type} • {position.exchange}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-300">
                                                    {position.product}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-right">
                                                    <span
                                                        className={`font-medium ${position.quantity > 0
                                                            ? 'text-blue-400'
                                                            : 'text-red-400'
                                                            }`}
                                                    >
                                                        {position.quantity > 0 ? '+' : ''}
                                                        {position.quantity}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-300 text-right">
                                                    ₹{position.average_price.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-white font-medium text-right">
                                                    ₹{(position.ltp || position.current_price || 0).toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span
                                                            className={`font-bold ${unrealizedPnL >= 0
                                                                ? 'text-green-500'
                                                                : 'text-red-500'
                                                                }`}
                                                        >
                                                            {formatCurrency(unrealizedPnL)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {dayChangePercent >= 0 ? (
                                                            <TrendingUp className="w-3 h-3 text-green-500" />
                                                        ) : (
                                                            <TrendingDown className="w-3 h-3 text-red-500" />
                                                        )}
                                                        <span
                                                            className={`font-medium ${dayChangePercent >= 0
                                                                ? 'text-green-500'
                                                                : 'text-red-500'
                                                                }`}
                                                        >
                                                            {dayChangePercent >= 0 ? '+' : ''}
                                                            {dayChangePercent.toFixed(2)}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleSquareOff(position.id)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors"
                                                    >
                                                        <X className="w-3 h-3" />
                                                        Exit
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="mb-4">
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">No open positions</h3>
                            <p className="text-gray-400 mb-6">
                                You don't have any open positions at the moment
                            </p>
                            <button
                                onClick={() => window.location.href = '/dashboard'}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                Start Trading
                            </button>
                        </div>
                    )}
                </div>

                {/* Info Cards */}
                {positions.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="bg-[#1a1d23] border border-gray-800 rounded-lg p-4">
                            <p className="text-xs text-gray-400 mb-1">Total Positions</p>
                            <p className="text-2xl font-bold text-white">{positions.length}</p>
                        </div>
                        <div className="bg-[#1a1d23] border border-gray-800 rounded-lg p-4">
                            <p className="text-xs text-gray-400 mb-1">Long Positions</p>
                            <p className="text-2xl font-bold text-blue-500">
                                {positions.filter((p) => p.quantity > 0).length}
                            </p>
                        </div>
                        <div className="bg-[#1a1d23] border border-gray-800 rounded-lg p-4">
                            <p className="text-xs text-gray-400 mb-1">Short Positions</p>
                            <p className="text-2xl font-bold text-red-500">
                                {positions.filter((p) => p.quantity < 0).length}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
