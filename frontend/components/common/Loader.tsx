import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    fullScreen?: boolean;
}

export default function Loader({ size = 'md', text, fullScreen = false }: LoaderProps) {
    const sizes = {
        sm: 'w-6 h-6',
        md: 'w-10 h-10',
        lg: 'w-16 h-16',
    };

    const content = (
        <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className={`${sizes[size]} text-blue-500 animate-spin`} />
            {text && <p className="text-gray-400 text-sm">{text}</p>}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
                {content}
            </div>
        );
    }

    return content;
}
