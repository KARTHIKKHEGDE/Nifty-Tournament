/**
 * Dashboard Card - Stat card component for admin dashboard
 */

import React from 'react';

interface DashboardCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: React.ReactNode;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

const DashboardCard: React.FC<DashboardCardProps> = ({
    title,
    value,
    subtitle,
    icon,
    trend,
    color = 'blue',
}) => {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        purple: 'from-purple-500 to-purple-600',
        orange: 'from-orange-500 to-orange-600',
        red: 'from-red-500 to-red-600',
    };

    return (
        <div className="relative overflow-hidden bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-lg">
            {/* Gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-5`} />

            <div className="relative p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                            {title}
                        </p>
                        <p className="mt-2 text-3xl font-bold text-white">
                            {typeof value === 'number' ? value.toLocaleString() : value}
                        </p>
                        {subtitle && (
                            <p className="mt-1 text-sm text-gray-500">
                                {subtitle}
                            </p>
                        )}
                        {trend && (
                            <div className="flex items-center mt-2">
                                <span
                                    className={`flex items-center text-sm font-medium ${trend.isPositive ? 'text-green-400' : 'text-red-400'
                                        }`}
                                >
                                    {trend.isPositive ? (
                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                    {Math.abs(trend.value)}%
                                </span>
                                <span className="ml-2 text-sm text-gray-500">vs last period</span>
                            </div>
                        )}
                    </div>
                    {icon && (
                        <div className={`flex-shrink-0 p-3 rounded-lg bg-gradient-to-br ${colorClasses[color]}`}>
                            <div className="text-white">
                                {icon}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardCard;
