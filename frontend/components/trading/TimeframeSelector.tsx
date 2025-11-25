import React from 'react';
import { Timeframe } from '../../types';

interface TimeframeSelectorProps {
    selected: Timeframe;
    onChange: (timeframe: Timeframe) => void;
}

const timeframes: { value: Timeframe; label: string }[] = [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '30m', label: '30m' },
    { value: '1h', label: '1h' },
    { value: '4h', label: '4h' },
    { value: '1d', label: '1D' },
];

export default function TimeframeSelector({ selected, onChange }: TimeframeSelectorProps) {
    return (
        <div className="flex items-center gap-1 bg-gray-800 p-1 rounded-lg">
            {timeframes.map((tf) => (
                <button
                    key={tf.value}
                    onClick={() => onChange(tf.value)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${selected === tf.value
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white hover:bg-gray-700'
                        }`}
                >
                    {tf.label}
                </button>
            ))}
        </div>
    );
}
