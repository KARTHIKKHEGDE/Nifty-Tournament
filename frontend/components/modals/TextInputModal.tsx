'use client';

import React, { useState, useEffect, useRef } from 'react';

interface TextInputModalProps {
    isOpen: boolean;
    initialValue: string;
    onConfirm: (text: string) => void;
    onCancel: () => void;
}

export default function TextInputModal({
    isOpen,
    initialValue,
    onConfirm,
    onCancel,
}: TextInputModalProps) {
    const [text, setText] = useState(initialValue);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setText(initialValue);
    }, [initialValue]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            // Focus and select all text when modal opens
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 100);
        }
    }, [isOpen]);

    const handleConfirm = () => {
        onConfirm(text);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleConfirm();
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className="relative bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg shadow-2xl w-[500px] max-w-[90vw] p-6">
                {/* Header */}
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white">Enter text:</h3>
                </div>

                {/* Input */}
                <input
                    ref={inputRef}
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your text here..."
                />

                {/* Buttons */}
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2.5 bg-transparent border border-[#3a3a3a] text-gray-300 rounded-md hover:bg-[#2a2a2a] hover:border-gray-500 transition-all font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all font-medium shadow-lg shadow-blue-500/20"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}
