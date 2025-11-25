import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { PaperOrder } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import tradingService from '../../services/tradingService';
import Button from '../common/Button';
import Loader from '../common/Loader';

interface OrdersHistoryProps {
    refreshTrigger?: number;
}

export default function OrdersHistory({ refreshTrigger }: OrdersHistoryProps) {
    const [orders, setOrders] = useState<PaperOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    const loadOrders = async () => {
        setIsLoading(true);
        try {
            const data = await tradingService.getOrders();
            setOrders(data);
        } catch (error) {
            console.error('Failed to load orders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadOrders();
        }
    }, [isOpen, refreshTrigger]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'FILLED':
                return 'text-green-500 bg-green-500/10';
            case 'CANCELLED':
                return 'text-red-500 bg-red-500/10';
            case 'PENDING':
            case 'OPEN':
                return 'text-yellow-500 bg-yellow-500/10';
            case 'REJECTED':
                return 'text-red-500 bg-red-500/10';
            default:
                return 'text-gray-500 bg-gray-500/10';
        }
    };

    const getSideColor = (side: string) => {
        return side === 'BUY' ? 'text-green-500' : 'text-red-500';
    };

    const handleCancel = async (orderId: number) => {
        try {
            await tradingService.cancelOrder(orderId);
            loadOrders();
        } catch (error) {
            console.error('Failed to cancel order:', error);
        }
    };

    return (
        <>
            {/* Trigger Button */}
            <Button onClick={() => setIsOpen(true)} variant="secondary">
                View Orders History
            </Button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-700">
                            <h2 className="text-2xl font-bold text-white">Orders History</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {isLoading ? (
                                <div className="flex justify-center py-12">
                                    <Loader text="Loading orders..." />
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-400">No orders yet</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-700">
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                                                    Time
                                                </th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                                                    Symbol
                                                </th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                                                    Type
                                                </th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                                                    Side
                                                </th>
                                                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">
                                                    Quantity
                                                </th>
                                                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">
                                                    Price
                                                </th>
                                                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">
                                                    Avg Price
                                                </th>
                                                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">
                                                    Status
                                                </th>
                                                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.map((order) => (
                                                <tr
                                                    key={order.id}
                                                    className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                                                >
                                                    <td className="py-3 px-4 text-sm text-gray-300">
                                                        {formatDateTime(order.created_at)}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-white font-medium">
                                                        {order.symbol}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-300">
                                                        {order.order_type}
                                                    </td>
                                                    <td className={`py-3 px-4 text-sm font-semibold ${getSideColor(order.side)}`}>
                                                        {order.side}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-right text-gray-300">
                                                        {order.quantity}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-right text-gray-300">
                                                        {order.price ? formatCurrency(order.price) : '-'}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-right text-gray-300">
                                                        {order.average_price ? formatCurrency(order.average_price) : '-'}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <span
                                                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                                                order.status
                                                            )}`}
                                                        >
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        {(order.status === 'PENDING' || order.status === 'OPEN') && (
                                                            <button
                                                                onClick={() => handleCancel(order.id)}
                                                                className="text-red-500 hover:text-red-400 text-sm font-medium"
                                                            >
                                                                Cancel
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-700 flex justify-end">
                            <Button onClick={() => setIsOpen(false)} variant="secondary">
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
