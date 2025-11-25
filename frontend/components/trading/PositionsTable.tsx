import React, { useEffect, useState } from 'react';
import { PaperPosition } from '../../types';
import { formatCurrency, formatPercentage, getPriceColor } from '../../utils/formatters';
import tradingService from '../../services/tradingService';
import Button from '../common/Button';
import Card from '../common/Card';
import Loader from '../common/Loader';

export default function PositionsTable() {
    const [positions, setPositions] = useState<PaperPosition[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadPositions = async () => {
        setIsLoading(true);
        try {
            const data = await tradingService.getPositions();
            setPositions(data);
        } catch (error) {
            console.error('Failed to load positions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadPositions();

        // Refresh positions every 5 seconds
        const interval = setInterval(loadPositions, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleClosePosition = async (positionId: number) => {
        try {
            await tradingService.closePosition(positionId);
            loadPositions();
        } catch (error) {
            console.error('Failed to close position:', error);
        }
    };

    const calculatePnLPercentage = (position: PaperPosition) => {
        if (!position.current_price) return 0;
        const pnl = (position.current_price - position.average_price) * position.quantity;
        const investment = position.average_price * Math.abs(position.quantity);
        return (pnl / investment) * 100;
    };

    if (isLoading) {
        return (
            <Card title="Open Positions">
                <div className="flex justify-center py-8">
                    <Loader text="Loading positions..." />
                </div>
            </Card>
        );
    }

    if (positions.length === 0) {
        return (
            <Card title="Open Positions">
                <div className="text-center py-8">
                    <p className="text-gray-400">No open positions</p>
                </div>
            </Card>
        );
    }

    return (
        <Card title="Open Positions" subtitle={`${positions.length} position(s)`}>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-700">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                                Symbol
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                                Type
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">
                                Quantity
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">
                                Avg Price
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">
                                Current Price
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">
                                Unrealized P&L
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">
                                P&L %
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {positions.map((position) => {
                            const pnlPercent = calculatePnLPercentage(position);
                            return (
                                <tr
                                    key={position.id}
                                    className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                                >
                                    <td className="py-3 px-4 text-sm text-white font-medium">
                                        {position.symbol}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-300">
                                        {position.instrument_type}
                                    </td>
                                    <td className={`py-3 px-4 text-sm text-right font-semibold ${position.quantity > 0 ? 'text-green-500' : 'text-red-500'
                                        }`}>
                                        {position.quantity > 0 ? '+' : ''}{position.quantity}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-right text-gray-300">
                                        {formatCurrency(position.average_price)}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-right text-white font-medium">
                                        {position.current_price ? formatCurrency(position.current_price) : '-'}
                                    </td>
                                    <td className={`py-3 px-4 text-sm text-right font-semibold ${getPriceColor(position.unrealized_pnl || 0)
                                        }`}>
                                        {position.unrealized_pnl ? formatCurrency(position.unrealized_pnl) : '-'}
                                    </td>
                                    <td className={`py-3 px-4 text-sm text-right font-semibold ${getPriceColor(pnlPercent)
                                        }`}>
                                        {formatPercentage(pnlPercent)}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <Button
                                            onClick={() => handleClosePosition(position.id)}
                                            variant="danger"
                                            size="sm"
                                        >
                                            Close
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-2 gap-4">
                <div>
                    <p className="text-sm text-gray-400">Total Unrealized P&L</p>
                    <p className={`text-lg font-bold ${getPriceColor(
                        positions.reduce((sum, p) => sum + (p.unrealized_pnl || 0), 0)
                    )}`}>
                        {formatCurrency(positions.reduce((sum, p) => sum + (p.unrealized_pnl || 0), 0))}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-gray-400">Total Realized P&L</p>
                    <p className={`text-lg font-bold ${getPriceColor(
                        positions.reduce((sum, p) => sum + p.realized_pnl, 0)
                    )}`}>
                        {formatCurrency(positions.reduce((sum, p) => sum + p.realized_pnl, 0))}
                    </p>
                </div>
            </div>
        </Card>
    );
}
