import React, { useState } from 'react';
import { X, Wallet as WalletIcon, Plus, Minus } from 'lucide-react';
import { useUserStore } from '../../stores/userStore';
import toast from 'react-hot-toast';

interface WalletModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
    const { wallet, setWallet } = useUserStore();
    const [amount, setAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen) return null;

    const handleDeposit = async () => {
        const depositAmount = parseFloat(amount);
        if (isNaN(depositAmount) || depositAmount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        setIsProcessing(true);
        try {
            // Simulate API call for demo
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (wallet) {
                const newBalance = wallet.balance + depositAmount;
                setWallet({
                    ...wallet,
                    balance: newBalance,
                });
                toast.success(`₹${depositAmount.toLocaleString()} added to wallet`);
                setAmount('');
            }
        } catch (error) {
            toast.error('Failed to add funds');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleWithdraw = async () => {
        const withdrawAmount = parseFloat(amount);
        if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        if (wallet && withdrawAmount > wallet.balance) {
            toast.error('Insufficient balance');
            return;
        }

        setIsProcessing(true);
        try {
            // Simulate API call for demo
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (wallet) {
                const newBalance = wallet.balance - withdrawAmount;
                setWallet({
                    ...wallet,
                    balance: newBalance,
                });
                toast.success(`₹${withdrawAmount.toLocaleString()} withdrawn from wallet`);
                setAmount('');
            }
        } catch (error) {
            toast.error('Failed to withdraw funds');
        } finally {
            setIsProcessing(false);
        }
    };

    const quickAmounts = [1000, 5000, 10000, 50000, 100000, 500000];

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <div className="bg-[#1e2329] rounded-xl border border-gray-700 w-full max-w-md shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                <WalletIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Virtual Wallet</h2>
                                <p className="text-xs text-gray-400">Demo Trading Balance</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Current Balance */}
                    <div className="p-6 bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-b border-gray-700">
                        <p className="text-sm text-gray-400 mb-1">Current Balance</p>
                        <p className="text-3xl font-bold text-white">
                            ₹{wallet?.balance.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0.00'}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                            Virtual money for paper trading
                        </p>
                    </div>

                    {/* Amount Input */}
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block">Enter Amount</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-8 pr-4 py-3 bg-[#131722] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Quick Amount Buttons */}
                        <div>
                            <p className="text-sm text-gray-400 mb-2">Quick Add</p>
                            <div className="grid grid-cols-3 gap-2">
                                {quickAmounts.map((amt) => (
                                    <button
                                        key={amt}
                                        onClick={() => setAmount(amt.toString())}
                                        className="px-3 py-2 bg-[#131722] hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                                    >
                                        ₹{amt >= 100000 ? `${amt / 100000}L` : `${amt / 1000}K`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                                onClick={handleDeposit}
                                disabled={isProcessing || !amount}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Funds
                            </button>
                            <button
                                onClick={handleWithdraw}
                                disabled={isProcessing || !amount}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-lg transition-colors"
                            >
                                <Minus className="w-4 h-4" />
                                Withdraw
                            </button>
                        </div>

                        <p className="text-xs text-center text-gray-500">
                            💡 This is virtual money for demo trading only. No real funds are involved.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
