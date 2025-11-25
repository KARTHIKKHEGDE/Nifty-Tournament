import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    subtitle?: string;
    headerAction?: React.ReactNode;
}

export default function Card({ children, className = '', title, subtitle, headerAction }: CardProps) {
    return (
        <div className={`bg-gray-800 border border-gray-700 rounded-lg ${className}`}>
            {(title || subtitle || headerAction) && (
                <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                    <div>
                        {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
                        {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
                    </div>
                    {headerAction && <div>{headerAction}</div>}
                </div>
            )}
            <div className="p-4">{children}</div>
        </div>
    );
}
