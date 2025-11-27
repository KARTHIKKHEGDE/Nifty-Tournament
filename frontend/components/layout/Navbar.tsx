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
    ShoppingBag,
    Briefcase,
    LayoutDashboard,
    List,
    PieChart,
    Grid
} from 'lucide-react';
import { useUserStore } from '../../stores/userStore';
import { useTradingStore } from '../../stores/tradingStore';
import { useCartStore } from '../../stores/cartStore';
import { formatCurrency, getMarketStatus } from '../../utils/formatters';
import CartModal from '../trading/CartModal';

export default function Navbar() {
    const router = useRouter();
    const { user, wallet, logout } = useUserStore();
    const { cashBalance } = useTradingStore();
    const { items } = useCartStore();
    const [showUserMenu, setShowUserMenu] = React.useState(false);
    const [showCart, setShowCart] = React.useState(false);
    const marketStatus = getMarketStatus();

    const handleLogout = () => {
        logout();
        router.push('/auth/login');
    };

    const navLinks = [
        { name: 'Dashboard', href: '/dashboard/nifty', icon: LayoutDashboard },
        { name: 'Orders', href: '/dashboard/orders', icon: List },
        { name: 'Positions', href: '/dashboard/positions', icon: PieChart },
    ];

    return (
        <>
            <nav className="bg-white dark:bg-[#1e2329] border-b border-gray-200 dark:border-gray-800 h-16 flex items-center px-4 lg:px-6 sticky top-0 z-40 shadow-sm">
                <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
                    {/* Left: Logo & Market Status */}
                    <div className="flex items-center gap-6">
                        <Link href="/dashboard/nifty" className="flex items-center gap-2 group">
                            <div className="bg-blue-600 p-1.5 rounded-lg group-hover:bg-blue-700 transition-colors">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                                Scalar<span className="font-light text-blue-500">Verse</span>
                            </span>
                        </Link>

                        {/* Market Status (Hidden on mobile) */}
                        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
                            <div
                                className={`w-2 h-2 rounded-full ${marketStatus.status === 'open' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                                    }`}
                            />
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                {marketStatus.status === 'open' ? 'Market Open' : 'Market Closed'}
                            </span>
                        </div>
                    </div>

                    {/* Center: Navigation Links (Zerodha Style) */}
                    <div className="hidden lg:flex items-center gap-1">
                        {navLinks.map((link) => {
                            const isActive = router.pathname === link.href;
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2 ${isActive
                                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <span>{link.name}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right: Wallet, Cart, User */}
                    <div className="flex items-center gap-4">
                        {/* Virtual Wallet */}
                        <div className="hidden md:flex flex-col items-end mr-2">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Available Margin</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                                {formatCurrency(wallet?.balance || cashBalance || 0)}
                            </span>
                        </div>

                        {/* Cart / Basket */}
                        <button
                            onClick={() => setShowCart(true)}
                            className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <ShoppingBag className="w-5 h-5" />
                            {items.length > 0 && (
                                <span className="absolute top-0 right-0 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-[#1e2329]">
                                    {items.length}
                                </span>
                            )}
                        </button>

                        {/* User Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700"
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <span className="text-xs font-bold text-white">
                                        {user?.username?.substring(0, 2).toUpperCase() || 'US'}
                                    </span>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                            </button>

                            {showUserMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowUserMenu(false)}
                                    />
                                    <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-20 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.username}</p>
                                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                        </div>
                                        <div className="p-1">
                                            <button
                                                onClick={() => {
                                                    setShowUserMenu(false);
                                                    router.push('/dashboard/profile');
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"
                                            >
                                                <User className="w-4 h-4" />
                                                My Profile
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowUserMenu(false);
                                                    router.push('/dashboard/settings');
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"
                                            >
                                                <Settings className="w-4 h-4" />
                                                Settings
                                            </button>
                                            <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm text-red-600 dark:text-red-400 transition-colors"
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

            {/* Cart Modal */}
            <CartModal isOpen={showCart} onClose={() => setShowCart(false)} />
        </>
    );
}
