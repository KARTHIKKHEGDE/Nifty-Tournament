/**
 * Admin Layout - Main layout for admin dashboard pages
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useUserStore } from '../../stores/userStore';
import toast from 'react-hot-toast';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const router = useRouter();
    const { user, logout } = useUserStore();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Check if user is admin
    useEffect(() => {
        if (!user) {
            router.push('/auth/login');
            return;
        }

        if (!user.is_admin) {
            toast.error('Access denied. Admin privileges required.');
            router.push('/dashboard');
        }
    }, [user, router]);

    const handleLogout = () => {
        logout();
        router.push('/auth/login');
    };

    if (!user || !user.is_admin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    const navigation = [
        {
            name: 'Dashboard',
            href: '/admin',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
        },
        {
            name: 'Tournaments',
            href: '/admin/tournaments',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
            ),
        },
        {
            name: 'Users',
            href: '/admin/users',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
        },
        {
            name: 'Analytics',
            href: '/admin/analytics',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
        },
        {
            name: 'Audit Log',
            href: '/admin/audit',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-gray-900">
            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between h-16 px-6 bg-gray-900">
                        <Link href="/admin">
                            <span className="text-xl font-bold text-white cursor-pointer">
                                Admin Panel
                            </span>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-gray-400 hover:text-white"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                        {navigation.map((item) => {
                            const isActive = router.pathname === item.href ||
                                (item.href !== '/admin' && router.pathname.startsWith(item.href));

                            return (
                                <Link key={item.name} href={item.href}>
                                    <div
                                        className={`flex items-center px-4 py-3 rounded-lg cursor-pointer transition-colors ${isActive
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                            }`}
                                    >
                                        {item.icon}
                                        <span className="ml-3 font-medium">{item.name}</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User info & logout */}
                    <div className="p-4 border-t border-gray-700">
                        <div className="flex items-center mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-white">{user.username}</p>
                                <p className="text-xs text-gray-400">Administrator</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                {/* Top bar */}
                <div className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 bg-gray-800 border-b border-gray-700">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="text-gray-400 hover:text-white"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <div className="flex items-center space-x-4">
                        <Link href="/dashboard">
                            <button className="px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                                User Dashboard
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Page content */}
                <main className="p-6">
                    {children}
                </main>
            </div>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default AdminLayout;
