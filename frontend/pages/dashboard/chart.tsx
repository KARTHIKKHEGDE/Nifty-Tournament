import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { X } from 'lucide-react';
import KlineChart from '../../components/charts/KlineChart';
import OrderPanel from '../../components/trading/OrderPanel';
import { CandleData, OrderSide } from '../../types';
import api from '../../services/api';

export default function ChartPage() {
    const router = useRouter();
    const { symbol, instrument_token, strike, ltp, type, oi, volume, change } = router.query;
    const [candles, setCandles] = useState<CandleData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [windowHeight, setWindowHeight] = useState(800);

    useEffect(() => {
        // Set window height on client side
        setWindowHeight(window.innerHeight);

        const handleResize = () => {
            setWindowHeight(window.innerHeight);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchCandles = async () => {
            if (!symbol || !instrument_token) return;

            setIsLoading(true);
            try {
                const response = await api.get(
                    `/api/candles/?symbol=${symbol}&instrument_token=${instrument_token}&timeframe=5minute&limit=400`
                );
                setCandles(response.data);
            } catch (error) {
                console.error('Error fetching candles:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (router.isReady) {
            fetchCandles();
        }
    }, [router.isReady, symbol, instrument_token]);

    if (!router.isReady) {
        return null;
    }

    const currentPrice = parseFloat(ltp as string) || 0;
    const strikePrice = parseFloat(strike as string) || 0;
    const openInterest = parseFloat(oi as string) || 0;
    const volumeValue = parseFloat(volume as string) || 0;
    const changePercent = parseFloat(change as string) || 0;

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white">{symbol}</h2>
                    <p className="text-sm text-gray-400">
                        Strike: ₹{strikePrice.toLocaleString('en-IN')} •
                        LTP: ₹{currentPrice.toFixed(2)} •
                        {type === 'CE' ? 'Call' : 'Put'} Option
                    </p>
                </div>
                <button
                    onClick={() => window.close()}
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
                                        open: currentPrice * 0.98,
                                        high: currentPrice * 1.02,
                                        low: currentPrice * 0.96,
                                        close: currentPrice,
                                        volume: volumeValue,
                                    },
                                ]}
                                symbol={symbol as string}
                                showVolume={true}
                                height={windowHeight - 100}
                            />
                        </div>
                    )}
                </div>

                {/* Order Panel Section - 30% width */}
                <div className="w-[400px] bg-gray-800 border-l border-gray-700 overflow-auto">
                    <div className="p-4">
                        <OrderPanel
                            symbol={symbol as string}
                            currentPrice={currentPrice}
                            instrumentType={type as 'CE' | 'PE'}
                            initialSide={OrderSide.BUY}
                        />

                        {/* Option Details */}
                        <div className="mt-6 bg-gray-900 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-white mb-4">Option Details</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-400">Strike Price</span>
                                    <span className="text-sm font-semibold text-white">
                                        ₹{strikePrice.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-400">Option Type</span>
                                    <span className={`text-sm font-semibold ${type === 'CE' ? 'text-green-500' : 'text-red-500'
                                        }`}>
                                        {type === 'CE' ? 'Call (CE)' : 'Put (PE)'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-400">Open Interest</span>
                                    <span className="text-sm font-semibold text-white">
                                        {openInterest.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-400">Volume</span>
                                    <span className="text-sm font-semibold text-white">
                                        {volumeValue.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-400">Change %</span>
                                    <span className={`text-sm font-semibold ${changePercent > 0 ? 'text-green-500' :
                                        changePercent < 0 ? 'text-red-500' : 'text-gray-400'
                                        }`}>
                                        {changePercent > 0 ? '+' : ''}{changePercent.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Trading Tips */}
                        <div className="mt-6 bg-gray-900 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-white mb-3">Quick Tips</h3>
                            <div className="space-y-2 text-xs text-gray-400">
                                <p>• Use indicators to analyze price trends</p>
                                <p>• Set stop loss to manage risk</p>
                                <p>• Monitor volume for trade confirmation</p>
                                <p>• Check Greeks before trading</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
