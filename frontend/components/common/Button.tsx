import React from 'react';

interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    className?: string;
    isLoading?: boolean;
}

export default function Button({
    children,
    onClick,
    variant = 'primary',
    disabled = false,
    type = 'button',
    className = '',
    isLoading = false,
}: ButtonProps) {
    const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
        secondary: 'bg-gray-700 hover:bg-gray-600 text-white focus:ring-gray-500',
        danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
        success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || isLoading}
            className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        >
            {isLoading ? 'Loading...' : children}
        </button>
    );
}
