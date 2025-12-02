import React, { useState } from 'react';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import { OrderType, OrderSide } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import tradingService from '../../services/tradingService';
import { useTradingStore } from '../../stores/tradingStore';
import { useUserStore } from '../../stores/userStore';

interface OrderPanelProps {
    symbol: string;
    currentPrice: number;
    instrumentType?: 'INDEX' | 'CE' | 'PE';
    initialSide?: OrderSide;
}

export default function OrderPanel({ symbol, currentPrice, instrumentType = 'INDEX', initialSide = OrderSide.BUY }: OrderPanelProps) {
    const { wallet } = useUserStore();
    const { addOrder, triggerOrderRefresh } = useTradingStore();

    const [side, setSide] = useState<OrderSide>(initialSide);
    const [orderType, setOrderType] = useState<OrderType>(OrderType.MARKET);
    const [quantity, setQuantity] = useState<number>(1);
    const [price, setPrice] = useState<number>(currentPrice);
    const [stopLoss, setStopLoss] = useState<number>(0);
    const [takeProfit, setTakeProfit] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    React.useEffect(() => {
        setPrice(currentPrice);
    }, [currentPrice]);

    React.useEffect(() => {
        setSide(initialSide);
    }, [initialSide]);

    const calculateTotal = () => {
        const orderPrice = orderType === OrderType.MARKET ? currentPrice : price;
        return orderPrice * quantity;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (quantity <= 0) {
            setError('Quantity must be greater than 0');
            return;
        }

        const total = calculateTotal();
        const availableBalance = wallet?.balance || 0;

        if (side === OrderSide.BUY && total > availableBalance) {
            setError('Insufficient balance');
            return;
        }

        setIsLoading(true);

        try {
            const orderData = {
                symbol,
                instrument_type: instrumentType,
                order_type: orderType,
                order_side: side,
                quantity,
                price: orderType !== OrderType.MARKET ? price : undefined,
                stop_loss: stopLoss > 0 ? stopLoss : undefined,
                take_profit: takeProfit > 0 ? takeProfit : undefined,
            };

            const order = await tradingService.placeOrder(orderData);
            addOrder(order);
            triggerOrderRefresh();

            setSuccess(`${side} order placed successfully!`);

            // Reset form
            setQuantity(1);
            setStopLoss(0);
            setTakeProfit(0);

            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to place order');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card title="Place Order" className="sticky top-20">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Buy/Sell Toggle */}
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setSide(OrderSide.BUY)}
                        className={`py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${side === OrderSide.BUY
                            ? 'bg-green-600 text-white shadow-lg'
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                            }`}
                    >
                        <TrendingUp className="w-5 h-5" />
                        BUY
                    </button>
                    <button
                        type="button"
                        onClick={() => setSide(OrderSide.SELL)}
                        className={`py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${side === OrderSide.SELL
                            ? 'bg-red-600 text-white shadow-lg'
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                            }`}
                    >
                        <TrendingDown className="w-5 h-5" />
                        SELL
                    </button>
                </div>

                {/* Order Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Order Type</label>
                    <select
                        value={orderType}
                        onChange={(e) => setOrderType(e.target.value as OrderType)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                    >
                        <option value={OrderType.MARKET}>Market</option>
                        <option value={OrderType.LIMIT}>Limit</option>
                        <option value={OrderType.STOP_LOSS}>Stop Loss</option>
                    </select>
                </div>

                {/* Quantity */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Quantity</label>
                    <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                    />
                </div>

                {/* Price (for Limit orders) */}
                {orderType !== OrderType.MARKET && (
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Price</label>
                        <input
                            type="number"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                )}

                {/* Stop Loss */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Stop Loss (Optional)
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                    />
                </div>

                {/* Take Profit */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Take Profit (Optional)
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        value={takeProfit}
                        onChange={(e) => setTakeProfit(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                    />
                </div>

                {/* Order Summary */}
                <div className="bg-gray-700 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Current Price:</span>
                        <span className="text-white font-semibold">{formatCurrency(currentPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Total:</span>
                        <span className="text-white font-semibold">{formatCurrency(calculateTotal())}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Available Balance:</span>
                        <span className="text-white font-semibold">
                            {formatCurrency(wallet?.balance || 0)}
                        </span>
                    </div>
                </div>

                {/* Error/Success Messages */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-red-500 text-sm">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="bg-green-500/10 border border-green-500 rounded-lg p-3">
                        <p className="text-green-500 text-sm">{success}</p>
                    </div>
                )}

                {/* Submit Button */}
                <Button
                    type="submit"
                    variant={side === OrderSide.BUY ? 'success' : 'danger'}
                    className="w-full"
                    isLoading={isLoading}
                >
                    {side === OrderSide.BUY ? 'Place Buy Order' : 'Place Sell Order'}
                </Button>

                {/* Paper Trading Notice */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <p className="text-xs text-blue-400 text-center">
                        <strong>Paper Trading:</strong> This is a simulated order with virtual money
                    </p>
                </div>
            </form>
        </Card>
    );
}


