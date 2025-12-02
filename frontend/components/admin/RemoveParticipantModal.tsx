/**
 * Remove Participant Modal - Confirmation dialog for removing participants
 */

import React, { useState } from 'react';

interface RemoveParticipantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason?: string) => void;
    participant: {
        username: string;
        email: string;
    } | null;
    isLoading?: boolean;
}

const RemoveParticipantModal: React.FC<RemoveParticipantModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    participant,
    isLoading = false,
}) => {
    const [reason, setReason] = useState('');

    if (!isOpen || !participant) return null;

    const handleConfirm = () => {
        onConfirm(reason || undefined);
        setReason('');
    };

    const handleClose = () => {
        setReason('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-700">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-700">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white">Remove Participant</h3>
                            <button
                                onClick={handleClose}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-4">
                        <div className="mb-4">
                            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-500 bg-opacity-20 rounded-full">
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                        </div>

                        <p className="text-center text-gray-300 mb-4">
                            Are you sure you want to remove <span className="font-bold text-white">{participant.username}</span> from this tournament?
                        </p>

                        <div className="bg-gray-700 rounded-lg p-3 mb-4">
                            <p className="text-sm text-gray-400">Email: <span className="text-white">{participant.email}</span></p>
                        </div>

                        <p className="text-sm text-gray-400 mb-4">
                            This action cannot be undone. The participant will be notified of their removal.
                        </p>

                        {/* Reason Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Reason (Optional)
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Enter reason for removal..."
                                rows={3}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-700 bg-opacity-50 rounded-b-xl flex items-center justify-end space-x-3">
                        <button
                            onClick={handleClose}
                            disabled={isLoading}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isLoading}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Removing...
                                </>
                            ) : (
                                'Remove Participant'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RemoveParticipantModal;
