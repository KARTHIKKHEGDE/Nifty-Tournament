import React from 'react';

interface SymbolTabsProps {
    selected: string;
    onChange: (symbol: string) => void;
}

const symbols = [
    { value: 'NIFTY 50', label: 'NIFTY 50' },
    { value: 'BANKNIFTY', label: 'BANKNIFTY' },
];

export default function SymbolTabs({ selected, onChange }: SymbolTabsProps) {
    return (
        <div className="flex items-center gap-2">
            {symbols.map((symbol) => (
                <button
                    key={symbol.value}
                    onClick={() => onChange(symbol.value)}
                    className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${selected === symbol.value
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                        }`}
                >
                    {symbol.label}
                </button>
            ))}
        </div>
    );
}
