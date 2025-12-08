import React, { useState, useEffect, useRef } from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { OrderSide, OrderType } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import tradingService from '../../services/tradingService';
import { useTradingStore } from '../../stores/tradingStore';

interface SimpleOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    symbol: string;
    currentPrice: number;
    instrumentType?: 'CE' | 'PE' | 'INDEX';
    initialSide?: OrderSide;
    lotSize?: number;
    clickPosition?: { x: number; y: number } | null;
}

export default function SimpleOrderModal({
    isOpen,
    onClose,
    symbol,
    currentPrice,
    instrumentType = 'CE',
    initialSide = OrderSide.BUY,
    lotSize = 75,
    clickPosition,
}: SimpleOrderModalProps) {
    const { addOrder, triggerOrderRefresh } = useTradingStore();

    // State - side is fixed based on initialSide
    const side = initialSide; // No toggle - fixed BUY or SELL
    const [orderType, setOrderType] = useState<'MIS' | 'NRML'>('MIS');
    const [lots, setLots] = useState<number>(1);
    const [quantity, setQuantity] = useState<number>(lotSize);
    const [stoploss, setStoploss] = useState<string>('');
    const [target, setTarget] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Draggable state
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [showChargesDetail, setShowChargesDetail] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    // Position modal near click point when it opens
    useEffect(() => {
        if (isOpen && modalRef.current && clickPosition) {
            // Position modal near the click point
            const modalWidth = 400; // max-w-sm is about 384px
            const modalHeight = 450;
            
            let x = clickPosition.x - modalWidth / 2;
            let y = clickPosition.y - 100; // Slightly above click point

            // Keep modal within viewport bounds
            x = Math.max(20, Math.min(x, window.innerWidth - modalWidth - 20));
            y = Math.max(20, Math.min(y, window.innerHeight - modalHeight - 20));

            setPosition({ x, y });
        }
    }, [isOpen, clickPosition]);

    // Sync quantity when lots change
    useEffect(() => {
        setQuantity(lots * lotSize);
    }, [lots, lotSize]);

    // Drag handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).tagName === 'INPUT' || 
            (e.target as HTMLElement).tagName === 'BUTTON') {
            return; // Don't start drag on inputs or buttons
        }
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart]);

    const calculateTotal = () => {
        return currentPrice * quantity;
    };

    // Calculate all charges based on Indian stock market regulations
    const calculateCharges = () => {
        const orderValue = calculateTotal();
        const isBuy = side === OrderSide.BUY;
        
        // Brokerage: ₹20 per executed order (flat)
        const brokerage = 20;
        
        // STT (Securities Transaction Tax): 0.05% on sell side for F&O
        const stt = !isBuy ? orderValue * 0.0005 : 0;
        
        // Exchange Transaction Charges: 0.05% (NSE F&O)
        const exchangeCharges = orderValue * 0.0005;
        
        // GST: 18% on (brokerage + exchange charges)
        const gst = (brokerage + exchangeCharges) * 0.18;
        
        // SEBI Charges: ₹10 per crore
        const sebiCharges = (orderValue / 10000000) * 10;
        
        // Stamp Duty: 0.003% on buy side
        const stampDuty = isBuy ? orderValue * 0.00003 : 0;
        
        const totalCharges = brokerage + stt + exchangeCharges + gst + sebiCharges + stampDuty;
        
        return {
            brokerage,
            stt,
            exchangeCharges,
            gst,
            sebiCharges,
            stampDuty,
            total: totalCharges
        };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (quantity <= 0) {
            setError('Quantity must be greater than 0');
            return;
        }

        setIsLoading(true);

        try {
            const orderData = {
                symbol,
                instrument_type: instrumentType,
                order_type: OrderType.MARKET, // Always market for simplicity
                order_side: side,
                quantity,
                product: orderType, // MIS or NRML
                stop_loss: stoploss ? parseFloat(stoploss) : undefined,
                take_profit: target ? parseFloat(target) : undefined,
            };

            const order = await tradingService.placeOrder(orderData);
            addOrder(order);
            triggerOrderRefresh();

            // Success - close modal
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to place order');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 pointer-events-none">
            <div 
                ref={modalRef}
                className="bg-[#1a1d23] rounded-lg w-full max-w-sm border border-gray-700 shadow-2xl pointer-events-auto absolute"
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    cursor: isDragging ? 'grabbing' : 'default',
                }}
            >
                {/* Header - Draggable */}
                <div 
                    className="flex items-center justify-between p-3 border-b border-gray-700 select-none"
                    onMouseDown={handleMouseDown}
                    style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                >
                    <div>
                        <h2 className="text-sm font-semibold text-white">{symbol}</h2>
                        <p className="text-xs text-gray-400">
                            ₹{currentPrice.toFixed(2)}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                        style={{ cursor: 'pointer' }}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-3 space-y-2.5">
                    {/* Quantity */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Qty (Lot: {lotSize})</label>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setLots(Math.max(1, lots - 1))}
                                className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors text-sm"
                            >
                                −
                            </button>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(lotSize, parseInt(e.target.value) || lotSize))}
                                className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-white text-center text-sm focus:outline-none focus:border-blue-500"
                            />
                            <button
                                type="button"
                                onClick={() => setLots(lots + 1)}
                                className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors text-sm"
                            >
                                +
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{lots} lot(s)</p>
                    </div>

                    {/* Product Type - Compact */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-gray-400 min-w-[60px]">Product</label>
                        <div className="flex gap-1 flex-1">
                            <button
                                type="button"
                                onClick={() => setOrderType('MIS')}
                                className={`py-1.5 px-3 rounded text-xs font-medium transition-colors flex-1 ${
                                    orderType === 'MIS'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                MIS
                            </button>
                            <button
                                type="button"
                                onClick={() => setOrderType('NRML')}
                                className={`py-1.5 px-3 rounded text-xs font-medium transition-colors flex-1 ${
                                    orderType === 'NRML'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                NRML
                            </button>
                        </div>
                    </div>

                    {/* Stoploss & Target - Single Row */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-[10px] font-medium text-gray-400 mb-1">
                                SL <span className="text-gray-600">(Opt)</span>
                            </label>
                            <input
                                type="number"
                                step="0.05"
                                value={stoploss}
                                onChange={(e) => setStoploss(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-medium text-gray-400 mb-1">
                                Target <span className="text-gray-600">(Opt)</span>
                            </label>
                            <input
                                type="number"
                                step="0.05"
                                value={target}
                                onChange={(e) => setTarget(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Margin Summary - Compact */}
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-2.5">
                        {/* Main Summary - Always Visible */}
                        <div 
                            className="flex items-center justify-between cursor-pointer hover:bg-gray-700/30 rounded px-1 py-0.5 transition-colors"
                            onClick={() => setShowChargesDetail(!showChargesDetail)}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-300 font-medium">Total Required</span>
                                <span className="text-[9px] text-gray-500 bg-gray-700 px-1.5 py-0.5 rounded">
                                    {orderType === 'MIS' ? 'MIS' : 'NRML'}
                                </span>
                            </div>
                            <span className="text-sm text-white font-bold">
                                {formatCurrency(calculateTotal() + calculateCharges().total)}
                            </span>
                        </div>

                        {/* Detailed Breakdown - Collapsible */}
                        {showChargesDetail && (
                            <div className="mt-2 pt-2 border-t border-gray-700 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-gray-500">Order Value</span>
                                    <span className="text-[10px] text-gray-400">{formatCurrency(calculateTotal())}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-gray-500">Margin</span>
                                    <span className="text-[10px] text-blue-400">{formatCurrency(calculateTotal())}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-gray-500">Brokerage</span>
                                    <span className="text-[10px] text-gray-400">₹{calculateCharges().brokerage.toFixed(2)}</span>
                                </div>
                                {calculateCharges().stt > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-gray-500">STT</span>
                                        <span className="text-[10px] text-gray-400">₹{calculateCharges().stt.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-gray-500">Exch + GST</span>
                                    <span className="text-[10px] text-gray-400">₹{(calculateCharges().exchangeCharges + calculateCharges().gst).toFixed(2)}</span>
                                </div>
                                {calculateCharges().stampDuty > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-gray-500">Stamp</span>
                                        <span className="text-[10px] text-gray-400">₹{calculateCharges().stampDuty.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500 rounded px-3 py-2">
                            <p className="text-red-500 text-xs">{error}</p>
                        </div>
                    )}

                    {/* Submit Button - Only BUY or only SELL based on initialSide */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-2.5 rounded-lg font-bold text-white text-sm transition-all flex items-center justify-center gap-2 ${
                            side === OrderSide.BUY
                                ? 'bg-blue-600 hover:bg-blue-700'
                                : 'bg-red-600 hover:bg-red-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {side === OrderSide.BUY ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {isLoading ? 'Placing...' : side === OrderSide.BUY ? 'BUY' : 'SELL'}
                    </button>
                </form>
            </div>
        </div>
    );
}
