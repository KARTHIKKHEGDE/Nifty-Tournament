import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
    Sparkles,
    LogOut,
    User,
    ChevronDown,
    LayoutDashboard,
    List,
    PieChart,
    Trophy,
    BarChart2,
} from 'lucide-react';
import { useUserStore } from '../../stores/userStore';

export default function MainNavbar() {
    const router = useRouter();
    const { user, logout } = useUserStore();
    const [showUserMenu, setShowUserMenu] = React.useState(false);

    const handleLogout = () => {
        logout();
        router.push('/auth/login');
    };

    const navLinks = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Orders', href: '/orders', icon: List },
        { name: 'Positions', href: '/positions', icon: PieChart },
        { name: 'Tournaments', href: '/tournaments', icon: Trophy },
    ];

    return (
        <nav className="bg-[#1a1d23] border-b border-gray-800 h-14 flex items-center px-6 sticky top-0 z-50">
            <div className="flex items-center justify-between w-full">
                {/* Left: Logo */}
                <Link href="/dashboard" className="flex items-center gap-2.5 group">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg blur-sm opacity-75 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-600 p-1.5 rounded-lg">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <span className="text-xl font-black bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300 bg-clip-text text-transparent tracking-tight" style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.05em' }}>
                        ScalarVerse
                    </span>
                </Link>

                {/* Center: Navigation Links */}
                <div className="flex items-center gap-1">
                    {navLinks.map((link) => {
                        const isActive = router.pathname === link.href;
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={`px-4 py-2 text-sm font-medium rounded transition-colors flex items-center gap-2 ${isActive
                                    ? 'text-blue-400 bg-blue-900/20'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{link.name}</span>
                            </Link>
                        );
                    })}
                </div>

                {/* Right: User Menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2 hover:bg-gray-800 px-3 py-2 rounded transition-colors"
                    >
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-white">
                                {user?.username?.substring(0, 2).toUpperCase() || 'US'}
                            </span>
                        </div>
                        <span className="text-sm text-gray-300">{user?.username}</span>
                        <ChevronDown
                            className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''
                                }`}
                        />
                    </button>

                    {showUserMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowUserMenu(false)}
                            />
                            <div className="absolute right-0 mt-2 w-56 bg-[#1e2329] border border-gray-700 rounded-lg shadow-2xl z-20 py-2 overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-700">
                                    <p className="text-sm font-semibold text-white">{user?.username}</p>
                                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                                </div>
                                <div className="p-1">
                                    <button
                                        onClick={() => {
                                            setShowUserMenu(false);
                                            router.push('/dashboard/profile');
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-800 rounded text-sm text-gray-300 transition-colors"
                                    >
                                        <User className="w-4 h-4" />
                                        My Profile
                                    </button>
                                    <div className="h-px bg-gray-700 my-1" />
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-red-900/20 rounded text-sm text-red-400 transition-colors"
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
        </nav>
    );
}
