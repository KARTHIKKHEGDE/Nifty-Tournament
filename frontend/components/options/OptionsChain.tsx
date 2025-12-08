import React, { useState } from 'react';
import { BarChart2, Plus } from 'lucide-react';
import { OptionData, OrderSide } from '../../types';
import { formatCurrency, formatLargeNumber, formatPercentage, isATM, isITM } from '../../utils/formatters';
import SimpleOrderModal from '../trading/SimpleOrderModal';

interface OptionsChainProps {
    spotPrice: number;
    calls: OptionData[];
    puts: OptionData[];
    symbol?: string;
    onOptionSelect?: (option: OptionData, action?: 'BUY' | 'SELL' | 'CHART' | 'WATCHLIST') => void;
}

export default function OptionsChain({ spotPrice, calls, puts, symbol = 'NIFTY', onOptionSelect }: OptionsChainProps) {
    const [selectedStrike, setSelectedStrike] = useState<number | null>(null);
    const [orderModalOpen, setOrderModalOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState<OptionData | null>(null);
    const [orderSide, setOrderSide] = useState<OrderSide>(OrderSide.BUY);
    const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);
    const tableBodyRef = React.useRef<HTMLTableSectionElement>(null);

    // Get unique strike prices
    const strikes = Array.from(
        new Set([...calls.map((c) => c.strike_price), ...puts.map((p) => p.strike_price)])
    )
        .filter((strike) => strike != null && !isNaN(strike))
        .sort((a, b) => a - b);

    // Find the two nearest ATM strikes
    const getATMStrikes = () => {
        if (strikes.length === 0) return [];

        // Find strikes closest to spot price
        const sorted = [...strikes].sort((a, b) =>
            Math.abs(a - spotPrice) - Math.abs(b - spotPrice)
        );

        // Return the 2 closest strikes
        return sorted.slice(0, 2).sort((a, b) => a - b);
    };

    const atmStrikes = getATMStrikes();

    // Scroll to ATM strikes when component mounts or spotPrice changes
    React.useEffect(() => {
        if (tableBodyRef.current && atmStrikes.length > 0) {
            // Find the first ATM strike row
            const firstATMStrike = atmStrikes[0];
            const rowIndex = strikes.indexOf(firstATMStrike);

            if (rowIndex !== -1) {
                // Slight delay to ensure DOM is ready
                setTimeout(() => {
                    const rows = tableBodyRef.current?.getElementsByTagName('tr');
                    if (rows && rows[rowIndex]) {
                        rows[rowIndex].scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                    }
                }, 100);
            }
        }
    }, [spotPrice, strikes.length]);

    const getCallForStrike = (strike: number) => calls.find((c) => c.strike_price === strike);
    const getPutForStrike = (strike: number) => puts.find((p) => p.strike_price === strike);

    const handleAction = (option: OptionData, action: 'BUY' | 'SELL' | 'CHART' | 'WATCHLIST', event?: React.MouseEvent) => {
        setSelectedStrike(option.strike_price);

        if (action === 'BUY' || action === 'SELL') {
            // Capture click position
            if (event) {
                setClickPosition({ x: event.clientX, y: event.clientY });
            }
            // Open the simple order modal
            setSelectedOption(option);
            setOrderSide(action === 'BUY' ? OrderSide.BUY : OrderSide.SELL);
            setOrderModalOpen(true);
        } else {
            // For CHART and WATCHLIST, use the existing handler
            onOptionSelect?.(option, action);
        }
    };

    const getChangeColor = (change: number) => {
        if (change > 0) return 'text-green-500';
        if (change < 0) return 'text-red-500';
        return 'text-gray-400';
    };

    const ActionButtons = ({ option }: { option: OptionData }) => (
        <div className="flex items-center gap-1 justify-end">
            <button
                onClick={(e) => { e.stopPropagation(); handleAction(option, 'WATCHLIST'); }}
                className="w-6 h-6 rounded bg-yellow-500/20 hover:bg-yellow-500 text-yellow-500 hover:text-white flex items-center justify-center transition-colors"
                title="Add to Watchlist"
            >
                <Plus className="w-3 h-3" />
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); handleAction(option, 'BUY', e); }}
                className="w-6 h-6 rounded bg-green-500/20 hover:bg-green-500 text-green-500 hover:text-white flex items-center justify-center text-xs font-bold transition-colors"
                title="Buy"
            >
                B
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); handleAction(option, 'SELL', e); }}
                className="w-6 h-6 rounded bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center text-xs font-bold transition-colors"
                title="Sell"
            >
                S
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); handleAction(option, 'CHART'); }}
                className="w-6 h-6 rounded bg-blue-500/20 hover:bg-blue-500 text-blue-500 hover:text-white flex items-center justify-center transition-colors"
                title="Chart"
            >
                <BarChart2 className="w-3 h-3" />
            </button>
        </div>
    );

    // Determine lot size dynamically
    // NIFTY lot size = 75, BANKNIFTY lot size = 35
    const symbolUpper = symbol?.toUpperCase() || 'NIFTY';
    const isBankNifty = symbolUpper.includes('BANK') || symbolUpper === 'BANKNIFTY';
    const currentLotSize = isBankNifty ? 35 : 75;

    return (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gray-900 p-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Options Chain ({symbol})</h3>
                    <div className="text-right">
                        <p className="text-sm text-gray-400">Spot Price</p>
                        <p className="text-xl font-bold text-white">{formatCurrency(spotPrice)}</p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-900 sticky top-0 z-10">
                        <tr>
                            {/* Call Options Headers */}
                            <th className="text-right py-3 px-3 text-xs font-semibold text-gray-400 border-r border-gray-700">
                                OI
                            </th>
                            <th className="text-right py-3 px-3 text-xs font-semibold text-gray-400 border-r border-gray-700">
                                Chg %
                            </th>
                            <th className="text-right py-3 px-3 text-xs font-semibold text-gray-400 border-r border-gray-700">
                                Actions
                            </th>
                            <th className="text-right py-3 px-3 text-xs font-semibold text-gray-400 border-r border-gray-700">
                                LTP
                            </th>

                            {/* Strike Price */}
                            <th className="text-center py-3 px-4 text-xs font-semibold text-white bg-gray-800 border-x border-gray-700">
                                STRIKE
                            </th>

                            {/* Put Options Headers */}
                            <th className="text-left py-3 px-3 text-xs font-semibold text-gray-400 border-l border-gray-700">
                                LTP
                            </th>
                            <th className="text-left py-3 px-3 text-xs font-semibold text-gray-400 border-l border-gray-700">
                                Actions
                            </th>
                            <th className="text-left py-3 px-3 text-xs font-semibold text-gray-400 border-l border-gray-700">
                                Chg %
                            </th>
                            <th className="text-left py-3 px-3 text-xs font-semibold text-gray-400 border-l border-gray-700">
                                OI
                            </th>
                        </tr>
                    </thead>
                    <tbody ref={tableBodyRef}>
                        {strikes.map((strike) => {
                            const call = getCallForStrike(strike);
                            const put = getPutForStrike(strike);
                            const isATMStrike = atmStrikes.includes(strike);
                            const isCallITM = call && isITM(strike, spotPrice, 'CE');
                            const isPutITM = put && isITM(strike, spotPrice, 'PE');

                            return (
                                <tr
                                    key={strike}
                                    className={`border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors ${isATMStrike ? 'bg-blue-500/5' : ''
                                        } ${selectedStrike === strike ? 'bg-blue-500/10' : ''}`}
                                >
                                    {/* Call Option Data */}
                                    {call ? (
                                        <>
                                            <td className={`text-right py-3 px-3 text-sm text-gray-300 border-r border-gray-700/50 ${isCallITM ? 'bg-green-500/10' : ''}`}>
                                                {formatLargeNumber(call.open_interest)}
                                            </td>
                                            <td
                                                className={`text-right py-3 px-3 text-sm font-medium border-r border-gray-700/50 ${getChangeColor(
                                                    call.change_percent
                                                )} ${isCallITM ? 'bg-green-500/10' : ''}`}
                                            >
                                                {formatPercentage(call.change_percent)}
                                            </td>
                                            <td className={`text-right py-2 px-3 border-r border-gray-700/50 ${isCallITM ? 'bg-green-500/10' : ''}`}>
                                                <ActionButtons option={call} />
                                            </td>
                                            <td className={`text-right py-3 px-3 border-r border-gray-700/50 ${isCallITM ? 'bg-green-500/10' : ''}`}>
                                                <button
                                                    onClick={() => handleAction(call, 'CHART')}
                                                    className="text-sm font-semibold text-green-500 hover:text-green-400 transition-colors"
                                                >
                                                    {formatCurrency(call.ltp)}
                                                </button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="border-r border-gray-700/50"></td>
                                            <td className="border-r border-gray-700/50"></td>
                                            <td className="border-r border-gray-700/50"></td>
                                            <td className="border-r border-gray-700/50"></td>
                                        </>
                                    )}

                                    {/* Strike Price */}
                                    <td
                                        className={`text-center py-3 px-4 text-sm font-bold border-x border-gray-700 ${isATMStrike ? 'text-blue-400 bg-blue-500/10' : 'text-white bg-gray-800'
                                            }`}
                                    >
                                        {strike ? strike.toLocaleString('en-IN') : '-'}
                                        {isATMStrike && (
                                            <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                                                ATM
                                            </span>
                                        )}
                                    </td>

                                    {/* Put Option Data */}
                                    {put ? (
                                        <>
                                            <td className={`text-left py-3 px-3 border-l border-gray-700/50 ${isPutITM ? 'bg-red-500/10' : ''}`}>
                                                <button
                                                    onClick={() => handleAction(put, 'CHART')}
                                                    className="text-sm font-semibold text-red-500 hover:text-red-400 transition-colors"
                                                >
                                                    {formatCurrency(put.ltp)}
                                                </button>
                                            </td>
                                            <td className={`text-left py-2 px-3 border-l border-gray-700/50 ${isPutITM ? 'bg-red-500/10' : ''}`}>
                                                <div className="flex justify-start">
                                                    <ActionButtons option={put} />
                                                </div>
                                            </td>
                                            <td
                                                className={`text-left py-3 px-3 text-sm font-medium border-l border-gray-700/50 ${getChangeColor(
                                                    put.change_percent
                                                )} ${isPutITM ? 'bg-red-500/10' : ''}`}
                                            >
                                                {formatPercentage(put.change_percent)}
                                            </td>
                                            <td className={`text-left py-3 px-3 text-sm text-gray-300 border-l border-gray-700/50 ${isPutITM ? 'bg-red-500/10' : ''}`}>
                                                {formatLargeNumber(put.open_interest)}
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="border-l border-gray-700/50"></td>
                                            <td className="border-l border-gray-700/50"></td>
                                            <td className="border-l border-gray-700/50"></td>
                                            <td className="border-l border-gray-700/50"></td>
                                        </>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="bg-gray-900 p-4 border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span>Call Options (CE)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span>Put Options (PE)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span>At The Money (ATM)</span>
                    </div>
                </div>
                <div>
                    <span>OI = Open Interest • LTP = Last Traded Price • Chg % = Change %</span>
                </div>
            </div>

            {/* Simple Order Modal */}
            {selectedOption && (
                <SimpleOrderModal
                    key={`${selectedOption.symbol}-${currentLotSize}`}
                    isOpen={orderModalOpen}
                    onClose={() => {
                        setOrderModalOpen(false);
                        setSelectedOption(null);
                        setClickPosition(null);
                    }}
                    symbol={selectedOption.symbol}
                    currentPrice={selectedOption.ltp}
                    instrumentType={selectedOption.option_type as 'CE' | 'PE'}
                    initialSide={orderSide}
                    lotSize={currentLotSize}
                    clickPosition={clickPosition}
                />
            )}
        </div>
    );
}
