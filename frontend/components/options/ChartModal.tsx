import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import KlineChart from '../charts/KlineChart';
import OrderPanel from '../trading/OrderPanel';
import { OptionData, CandleData, OrderSide } from '../../types';
import api from '../../services/api';

interface ChartModalProps {
    option: OptionData;
    initialSide: OrderSide;
    onClose: () => void;
}

export default function ChartModal({ option, initialSide, onClose }: ChartModalProps) {
    const [candles, setCandles] = useState<CandleData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCandles = async () => {
            if (!option.instrument_token) return;

            setIsLoading(true);
            try {
                const response = await api.get(
                    `/api/candles/?symbol=${option.symbol}&instrument_token=${option.instrument_token}&timeframe=5minute&limit=400`
                );
                setCandles(response.data);
            } catch (error) {
                console.error('Error fetching candles:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCandles();
    }, [option.instrument_token, option.symbol]);

    return (
        <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white">{option.symbol}</h2>
                    <p className="text-sm text-gray-400">
                        Strike: ₹{option.strike_price.toLocaleString('en-IN')} •
                        LTP: ₹{option.ltp.toFixed(2)} •
                        {option.option_type === 'CE' ? 'Call' : 'Put'} Option
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Close"
                >
                    <X className="w-6 h-6 text-gray-400 hover:text-white" />
                </button>
            </div>

            {/* Content - Chart + Order Panel Side by Side */}
            <div className="flex-1 flex overflow-hidden">
                {/* Chart Section - 70% width */}
                <div className="flex-1 bg-gray-900 p-4 overflow-auto">
                    {isLoading ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                <p className="text-gray-400">Loading chart...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full">
                            <KlineChart
                                data={candles.length > 0 ? candles : [
                                    {
                                        timestamp: Date.now() - 3600000,
                                        open: option.ltp * 0.98,
                                        high: option.ltp * 1.02,
                                        low: option.ltp * 0.96,
                                        close: option.ltp,
                                        volume: option.volume,
                                    },
                                ]}
                                symbol={option.symbol}
                                showVolume={true}
                                height={window.innerHeight - 100}
                            />
                        </div>
                    )}
                </div>

                {/* Order Panel Section - 30% width */}
                <div className="w-[400px] bg-gray-800 border-l border-gray-700 overflow-auto">
                    <div className="p-4">
                        <OrderPanel
                            symbol={option.symbol}
                            currentPrice={option.ltp}
                            instrumentType={option.option_type}
                            initialSide={initialSide}
                        />

                        {/* Greeks Display */}
                        <div className="mt-6 bg-gray-900 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-white mb-4">Greeks</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-400">Delta</span>
                                    <span className="text-sm font-semibold text-white">
                                        {option.delta?.toFixed(4) || '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-400">Gamma</span>
                                    <span className="text-sm font-semibold text-white">
                                        {option.gamma?.toFixed(4) || '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-400">Theta</span>
                                    <span className="text-sm font-semibold text-red-500">
                                        {option.theta?.toFixed(4) || '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-400">Vega</span>
                                    <span className="text-sm font-semibold text-white">
                                        {option.vega?.toFixed(4) || '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-400">IV</span>
                                    <span className="text-sm font-semibold text-blue-500">
                                        {option.iv?.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Option Details */}
                        <div className="mt-6 bg-gray-900 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-white mb-4">Option Details</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-400">Open Interest</span>
                                    <span className="text-sm font-semibold text-white">
                                        {option.open_interest.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-400">Volume</span>
                                    <span className="text-sm font-semibold text-white">
                                        {option.volume.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-400">Change %</span>
                                    <span className={`text-sm font-semibold ${option.change_percent > 0 ? 'text-green-500' :
                                            option.change_percent < 0 ? 'text-red-500' : 'text-gray-400'
                                        }`}>
                                        {option.change_percent > 0 ? '+' : ''}{option.change_percent.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
