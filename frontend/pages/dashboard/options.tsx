import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import OptionsChain from '../../components/options/OptionsChain';
import KlineChart from '../../components/charts/KlineChart';
import OrderPanel from '../../components/trading/OrderPanel';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import { OptionData, CandleData, OrderSide } from '../../types';
import { formatDate } from '../../utils/formatters';
import api from '../../services/api';

export default function OptionsPage() {
    const [spotPrice, setSpotPrice] = useState(0);
    const [selectedExpiry, setSelectedExpiry] = useState('');
    const [selectedOption, setSelectedOption] = useState<OptionData | null>(null);
    const [initialOrderSide, setInitialOrderSide] = useState<OrderSide>(OrderSide.BUY);
    const [candles, setCandles] = useState<CandleData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expiryDates, setExpiryDates] = useState<string[]>([]);
    const [optionsData, setOptionsData] = useState<{ calls: OptionData[]; puts: OptionData[] }>({
        calls: [],
        puts: [],
    });

    // Fetch options chain data from API
    const fetchOptionsChain = async (expiry?: string) => {
        setIsLoading(true);
        try {
            const expiryParam = expiry ? `?expiry_date=${expiry}` : '';
            const response = await api.get(`/api/candles/options-chain/NIFTY${expiryParam}`);
            const data = response.data;

            // Update spot price
            if (data.spot_price) {
                setSpotPrice(data.spot_price);
            }

            // Get all unique strikes and sort them
            const allStrikes = new Set<number>();
            data.ce_options?.forEach((opt: any) => allStrikes.add(opt.strike));
            data.pe_options?.forEach((opt: any) => allStrikes.add(opt.strike));
            const sortedStrikes = Array.from(allStrikes).sort((a, b) => a - b);

            // Find ATM strike index (closest to spot price)
            let atmIndex = 0;
            let minDiff = Number.MAX_VALUE;

            sortedStrikes.forEach((strike, index) => {
                const diff = Math.abs(strike - data.spot_price);
                if (diff < minDiff) {
                    minDiff = diff;
                    atmIndex = index;
                }
            });

            // Filter strikes (8 above and 8 below ATM)
            const startIdx = Math.max(0, atmIndex - 8);
            const endIdx = Math.min(sortedStrikes.length, atmIndex + 9);
            const allowedStrikes = new Set(sortedStrikes.slice(startIdx, endIdx));

            console.log(`Spot: ${data.spot_price}, ATM: ${sortedStrikes[atmIndex]}, Range: ${startIdx}-${endIdx}`);

            // Transform and filter API data
            const calls: OptionData[] = data.ce_options
                .filter((opt: any) => allowedStrikes.has(opt.strike))
                .map((opt: any) => ({
                    symbol: opt.tradingsymbol,
                    strike_price: opt.strike,
                    expiry_date: opt.expiry,
                    option_type: 'CE',
                    ltp: opt.ltp,
                    open_interest: opt.oi,
                    change_percent: opt.change,
                    volume: opt.volume,
                    bid: 0,
                    ask: 0,
                    iv: 0,
                    delta: 0,
                    gamma: 0,
                    theta: 0,
                    vega: 0,
                    instrument_token: opt.instrument_token,
                }));

            const puts: OptionData[] = data.pe_options
                .filter((opt: any) => allowedStrikes.has(opt.strike))
                .map((opt: any) => ({
                    symbol: opt.tradingsymbol,
                    strike_price: opt.strike,
                    expiry_date: opt.expiry,
                    option_type: 'PE',
                    ltp: opt.ltp,
                    open_interest: opt.oi,
                    change_percent: opt.change,
                    volume: opt.volume,
                    bid: 0,
                    ask: 0,
                    iv: 0,
                    delta: 0,
                    gamma: 0,
                    theta: 0,
                    vega: 0,
                    instrument_token: opt.instrument_token,
                }));

            setOptionsData({ calls, puts });
        } catch (error) {
            console.error('Error fetching options chain:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch candle data for selected option
    const fetchCandleData = async (instrumentToken: number, symbol: string) => {
        try {
            const response = await api.get(
                `/api/candles/?symbol=${symbol}&instrument_token=${instrumentToken}&timeframe=5minute&limit=400`
            );
            setCandles(response.data);
        } catch (error) {
            console.error('Error fetching candle data:', error);
            setCandles([]);
        }
    };

    // Fetch expiry dates on mount
    useEffect(() => {
        const fetchExpiryDates = async () => {
            try {
                const response = await api.get('/api/candles/instruments?exchange=NFO');
                const data = response.data;
                console.log('Fetched instruments:', data.instruments?.length || 0);

                const niftyInstruments = data.instruments.filter(
                    (inst: any) => inst.name === 'NIFTY' && inst.instrument_type === 'CE'
                );

                console.log('NIFTY CE instruments found:', niftyInstruments.length);

                const expirySet = new Set<string>();
                niftyInstruments.forEach((inst: any) => {
                    if (inst.expiry) {
                        let expiryDate: string;
                        if (typeof inst.expiry === 'string') {
                            expiryDate = inst.expiry.split('T')[0];
                        } else {
                            const date = new Date(inst.expiry);
                            expiryDate = date.toISOString().split('T')[0];
                        }
                        expirySet.add(expiryDate);
                    }
                });

                const uniqueExpiries = Array.from(expirySet).sort();
                console.log('Unique expiry dates found:', uniqueExpiries);

                if (uniqueExpiries.length > 0) {
                    setExpiryDates(uniqueExpiries);
                    setSelectedExpiry(uniqueExpiries[0]);
                    console.log('Selected first expiry:', uniqueExpiries[0]);
                } else {
                    throw new Error('No expiry dates found in instruments');
                }
            } catch (error) {
                console.error('Error fetching expiry dates:', error);

                try {
                    const response = await api.get('/api/candles/options-chain/NIFTY');
                    const data = response.data;

                    const expiries = new Set<string>();
                    data.ce_options?.forEach((opt: any) => {
                        if (opt.expiry) {
                            expiries.add(opt.expiry);
                        }
                    });

                    const expiryArray = Array.from(expiries).sort();

                    if (expiryArray.length > 0) {
                        setExpiryDates(expiryArray);
                        setSelectedExpiry(expiryArray[0]);
                        console.log('Expiries from options chain:', expiryArray);
                        return;
                    }
                } catch (chainError) {
                    console.error('Failed to fetch from options chain:', chainError);
                }

                console.error('Could not fetch expiry dates from Zerodha API');
                alert('Failed to fetch expiry dates. Please check if Zerodha access token is configured correctly.');
            }
        };

        fetchExpiryDates();
    }, []);

    // Fetch options chain when expiry changes
    useEffect(() => {
        if (selectedExpiry) {
            fetchOptionsChain(selectedExpiry);
        }
    }, [selectedExpiry]);

    const handleOptionSelect = (option: OptionData, action?: 'BUY' | 'SELL' | 'CHART') => {
        if (action === 'CHART') {
            // Open chart in new window with option data
            const params = new URLSearchParams({
                symbol: option.symbol,
                instrument_token: option.instrument_token?.toString() || '',
                strike: option.strike_price.toString(),
                ltp: option.ltp.toString(),
                type: option.option_type,
                oi: option.open_interest.toString(),
                volume: option.volume.toString(),
                change: option.change_percent.toString(),
            });

            const url = `/dashboard/chart?${params.toString()}`;
            window.open(url, '_blank', 'width=1400,height=900');
            return;
        }

        // For BUY/SELL actions, update the embedded view
        setSelectedOption(option);

        if (action === 'BUY') {
            setInitialOrderSide(OrderSide.BUY);
        } else if (action === 'SELL') {
            setInitialOrderSide(OrderSide.SELL);
        }

        // Fetch candle data for this option
        if (option.instrument_token) {
            fetchCandleData(option.instrument_token, option.symbol);
        }
    };

    return (
        <DashboardLayout title="Options Chain">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">NIFTY Options Chain</h1>
                        <p className="text-gray-400">
                            View and trade NIFTY options (CE/PE) • Paper Trading Mode
                        </p>
                    </div>

                    {/* Expiry Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Select Expiry
                        </label>
                        <select
                            value={selectedExpiry}
                            onChange={(e) => setSelectedExpiry(e.target.value)}
                            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 min-w-[200px]"
                        >
                            {expiryDates.map((date) => (
                                <option key={date} value={date}>
                                    {formatDate(date)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Options Chain */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader text="Loading options chain..." />
                    </div>
                ) : (
                    <OptionsChain
                        spotPrice={spotPrice}
                        calls={optionsData.calls}
                        puts={optionsData.puts}
                        onOptionSelect={handleOptionSelect}
                    />
                )}

                {/* Selected Option Details */}
                {selectedOption && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Chart (3 columns) */}
                        <div className="lg:col-span-3">
                            <Card title={`${selectedOption.symbol} Chart`}>
                                <KlineChart
                                    data={candles.length > 0 ? candles : [
                                        {
                                            timestamp: Date.now() - 3600000,
                                            open: selectedOption.ltp * 0.98,
                                            high: selectedOption.ltp * 1.02,
                                            low: selectedOption.ltp * 0.96,
                                            close: selectedOption.ltp,
                                            volume: selectedOption.volume,
                                        },
                                    ]}
                                    symbol={selectedOption.symbol}
                                    showVolume={true}
                                    height={400}
                                />
                            </Card>

                            {/* Greeks Display */}
                            <Card title="Greeks" className="mt-6">
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-400 mb-1">Delta</p>
                                        <p className="text-2xl font-bold text-white">
                                            {selectedOption.delta?.toFixed(4) || '-'}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm text-gray-400 mb-1">Gamma</p>
                                        <p className="text-2xl font-bold text-white">
                                            {selectedOption.gamma?.toFixed(4) || '-'}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm text-gray-400 mb-1">Theta</p>
                                        <p className="text-2xl font-bold text-red-500">
                                            {selectedOption.theta?.toFixed(4) || '-'}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm text-gray-400 mb-1">Vega</p>
                                        <p className="text-2xl font-bold text-white">
                                            {selectedOption.vega?.toFixed(4) || '-'}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm text-gray-400 mb-1">IV</p>
                                        <p className="text-2xl font-bold text-blue-500">
                                            {selectedOption.iv?.toFixed(2)}%
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Order Panel (1 column) */}
                        <div className="lg:col-span-1">
                            <OrderPanel
                                symbol={selectedOption.symbol}
                                currentPrice={selectedOption.ltp}
                                instrumentType={selectedOption.option_type}
                                initialSide={initialOrderSide}
                            />
                        </div>
                    </div>
                )}

                {/* Options Trading Tips */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                        <h3 className="text-green-400 font-semibold mb-2">📈 Call Options (CE)</h3>
                        <p className="text-sm text-gray-400">
                            Buy calls when you expect the price to go up. Profit from upward movement.
                        </p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                        <h3 className="text-red-400 font-semibold mb-2">📉 Put Options (PE)</h3>
                        <p className="text-sm text-gray-400">
                            Buy puts when you expect the price to go down. Profit from downward movement.
                        </p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <h3 className="text-blue-400 font-semibold mb-2">🎯 Greeks</h3>
                        <p className="text-sm text-gray-400">
                            Delta, Gamma, Theta, and Vega help measure option price sensitivity and risk.
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
