import React from 'react';
import { X, Trash2, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import { formatCurrency } from '../../utils/formatters';

interface CartModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CartModal({ isOpen, onClose }: CartModalProps) {
    const { items, removeFromCart, updateQuantity, clearCart, getTotalValue } = useCartStore();

    if (!isOpen) return null;

    const handlePlaceOrders = () => {
        // TODO: Integrate with backend API to place orders
        console.log('Placing orders:', items);
        alert(`Placing ${items.length} orders...`);
        clearCart();
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            Order Basket
                        </h2>
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-full">
                            {items.length}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <ShoppingBag className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                Your basket is empty
                            </p>
                            <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
                                Add options from the option chain to get started
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                                    {item.symbol} {item.strike} {item.type}
                                                </span>
                                                <span
                                                    className={`px-2 py-0.5 text-xs font-bold rounded ${item.action === 'BUY'
                                                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                                                            : 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
                                                        }`}
                                                >
                                                    {item.action}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {item.exchange} • LTP: {formatCurrency(item.ltp)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                                            title="Remove"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500 dark:text-gray-400">Qty:</span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 50))}
                                                    className="w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded text-xs font-bold transition-colors"
                                                >
                                                    −
                                                </button>
                                                <span className="w-12 text-center text-sm font-semibold text-gray-900 dark:text-white">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 50)}
                                                    className="w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded text-xs font-bold transition-colors"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Value</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                {formatCurrency(item.ltp * item.quantity)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Total Value
                            </span>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                                {formatCurrency(Math.abs(getTotalValue()))}
                            </span>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={clearCart}
                                className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors"
                            >
                                Clear All
                            </button>
                            <button
                                onClick={handlePlaceOrders}
                                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                            >
                                Place Orders
                            </button>
                        </div>

                        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                            Paper trading • No real money involved
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
