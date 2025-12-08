import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useTradingStore } from '../stores/tradingStore';
import { formatCurrency } from '../utils/formatters';
import { Filter, Download } from 'lucide-react';
import api from '../services/api';

export default function OrdersPage() {
    const { orders } = useTradingStore();
    const [filter, setFilter] = useState<'ALL' | 'COMPLETE' | 'PENDING' | 'CANCELLED'>('ALL');

    const filteredOrders = orders.filter((order) => {
        if (filter === 'ALL') return true;
        return order.status === filter;
    });

    return (
        <DashboardLayout title="Orders" showWatchlist={true}>
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1">Order History</h1>
                        <p className="text-sm text-gray-400">
                            View all your trading orders
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Filter */}
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as any)}
                            className="bg-[#1a1d23] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="ALL">All Orders</option>
                            <option value="COMPLETE">Completed</option>
                            <option value="PENDING">Pending</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>

                        {/* Export Button */}
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="bg-[#1a1d23] border border-gray-800 rounded-lg overflow-hidden">
                    {filteredOrders.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#131722] border-b border-gray-800">
                                    <tr>
                                        <th className="text-left text-xs font-semibold text-gray-400 px-6 py-4 uppercase tracking-wider">
                                            Order ID
                                        </th>
                                        <th className="text-left text-xs font-semibold text-gray-400 px-6 py-4 uppercase tracking-wider">
                                            Time
                                        </th>
                                        <th className="text-left text-xs font-semibold text-gray-400 px-6 py-4 uppercase tracking-wider">
                                            Symbol
                                        </th>
                                        <th className="text-left text-xs font-semibold text-gray-400 px-6 py-4 uppercase tracking-wider">
                                            Side
                                        </th>
                                        <th className="text-left text-xs font-semibold text-gray-400 px-6 py-4 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="text-right text-xs font-semibold text-gray-400 px-6 py-4 uppercase tracking-wider">
                                            Qty
                                        </th>
                                        <th className="text-right text-xs font-semibold text-gray-400 px-6 py-4 uppercase tracking-wider">
                                            Price
                                        </th>
                                        <th className="text-left text-xs font-semibold text-gray-400 px-6 py-4 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="text-right text-xs font-semibold text-gray-400 px-6 py-4 uppercase tracking-wider">
                                            P&L
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map((order) => (
                                        <tr
                                            key={order.id}
                                            className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors"
                                        >
                                            <td className="px-6 py-4 text-sm text-gray-300">
                                                #{order.id}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-300">
                                                {order.timestamp
                                                    ? new Date(order.timestamp).toLocaleString()
                                                    : new Date(order.created_at).toLocaleString()
                                                }
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-medium text-white">
                                                        {order.symbol}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {order.instrument_type}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${order.order_side === 'BUY'
                                                        ? 'bg-blue-900/30 text-blue-400'
                                                        : 'bg-red-900/30 text-red-400'
                                                        }`}
                                                >
                                                    {order.order_side}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-300">
                                                {order.order_type}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-300 text-right">
                                                {order.quantity}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-300 text-right">
                                                {order.price ? `₹${order.price.toFixed(2)}` : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${order.status === 'COMPLETE' || order.status === 'FILLED'
                                                        ? 'bg-green-900/30 text-green-400'
                                                        : order.status === 'PENDING' || order.status === 'OPEN'
                                                            ? 'bg-yellow-900/30 text-yellow-400'
                                                            : order.status === 'CANCELLED'
                                                                ? 'bg-gray-700 text-gray-400'
                                                                : 'bg-red-900/30 text-red-400'
                                                        }`}
                                                >
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right">
                                                {order.pnl ? (
                                                    <span
                                                        className={
                                                            order.pnl > 0
                                                                ? 'text-green-500 font-medium'
                                                                : 'text-red-500 font-medium'
                                                        }
                                                    >
                                                        {formatCurrency(order.pnl)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-500">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
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
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">No orders found</h3>
                            <p className="text-gray-400 mb-6">
                                {filter === 'ALL'
                                    ? "You haven't placed any orders yet"
                                    : `No ${filter.toLowerCase()} orders found`}
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

                {/* Summary Stats */}
                {filteredOrders.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                        <div className="bg-[#1a1d23] border border-gray-800 rounded-lg p-4">
                            <p className="text-xs text-gray-400 mb-1">Total Orders</p>
                            <p className="text-2xl font-bold text-white">{filteredOrders.length}</p>
                        </div>
                        <div className="bg-[#1a1d23] border border-gray-800 rounded-lg p-4">
                            <p className="text-xs text-gray-400 mb-1">Completed</p>
                            <p className="text-2xl font-bold text-green-500">
                                {filteredOrders.filter((o) => o.status === 'COMPLETE' || o.status === 'FILLED').length}
                            </p>
                        </div>
                        <div className="bg-[#1a1d23] border border-gray-800 rounded-lg p-4">
                            <p className="text-xs text-gray-400 mb-1">Pending</p>
                            <p className="text-2xl font-bold text-yellow-500">
                                {filteredOrders.filter((o) => o.status === 'PENDING' || o.status === 'OPEN').length}
                            </p>
                        </div>
                        <div className="bg-[#1a1d23] border border-gray-800 rounded-lg p-4">
                            <p className="text-xs text-gray-400 mb-1">Total P&L</p>
                            <p
                                className={`text-2xl font-bold ${filteredOrders.reduce((sum, o) => sum + (o.pnl || 0), 0) >= 0
                                    ? 'text-green-500'
                                    : 'text-red-500'
                                    }`}
                            >
                                {formatCurrency(filteredOrders.reduce((sum, o) => sum + (o.pnl || 0), 0))}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
