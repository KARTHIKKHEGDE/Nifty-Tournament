import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
    TrendingUp,
    Wallet,
    LogOut,
    User,
    Settings,
    ChevronDown,
} from 'lucide-react';
import { useUserStore } from '../../stores/userStore';
import { useTradingStore } from '../../stores/tradingStore';
import { formatCurrency, getMarketStatus } from '../../utils/formatters';

export default function Navbar() {
    const router = useRouter();
    const { user, wallet, logout } = useUserStore();
    const { cashBalance } = useTradingStore();
    const [showUserMenu, setShowUserMenu] = React.useState(false);
    const marketStatus = getMarketStatus();

    const handleLogout = () => {
        logout();
        router.push('/auth/login');
    };

    return (
        <nav className="bg-gray-800 border-b border-gray-700 h-16 flex items-center px-6 sticky top-0 z-40">
            <div className="flex items-center justify-between w-full">
                {/* Logo */}
                <Link href="/dashboard/nifty" className="flex items-center gap-2">
                    <TrendingUp className="w-8 h-8 text-blue-500" />
                    <span className="text-xl font-bold text-white">OptionsLeague</span>
                </Link>

                {/* Market Status */}
                <div className="flex items-center gap-2">
                    <div
                        className={`w-2 h-2 rounded-full ${marketStatus.status === 'open' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                            }`}
                    />
                    <span className="text-sm text-gray-400">{marketStatus.message}</span>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-6">
                    {/* Virtual Wallet */}
                    <div className="flex items-center gap-2 bg-gray-700 px-4 py-2 rounded-lg">
                        <Wallet className="w-5 h-5 text-green-500" />
                        <div>
                            <p className="text-xs text-gray-400">Virtual Balance</p>
                            <p className="text-sm font-semibold text-white">
                                {formatCurrency(wallet?.balance || cashBalance || 0)}
                            </p>
                        </div>
                    </div>

                    {/* User Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-2 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
                        >
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm text-white">{user?.username || 'User'}</span>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>

                        {showUserMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowUserMenu(false)}
                                />
                                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20">
                                    <div className="p-3 border-b border-gray-700">
                                        <p className="text-sm font-medium text-white">{user?.username}</p>
                                        <p className="text-xs text-gray-400">{user?.email}</p>
                                    </div>
                                    <div className="p-2">
                                        <button
                                            onClick={() => {
                                                setShowUserMenu(false);
                                                router.push('/dashboard/settings');
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
                                        >
                                            <Settings className="w-4 h-4" />
                                            Settings
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded-lg text-sm text-red-400 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
