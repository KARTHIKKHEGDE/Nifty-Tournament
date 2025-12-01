import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
    LayoutDashboard,
    TrendingUp,
    Briefcase,
    Trophy,
    Settings,
    Shield,
} from 'lucide-react';
import { useUserStore } from '../../stores/userStore';

interface NavItem {
    name: string;
    href: string;
    icon: React.ReactNode;
    adminOnly?: boolean;
}

const navItems: NavItem[] = [
    {
        name: 'Dashboard',
        href: '/dashboard',
        icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
        name: 'Tournaments',
        href: '/dashboard/tournaments',
        icon: <Trophy className="w-5 h-5" />,
    },
    {
        name: 'Portfolio',
        href: '/dashboard/portfolio',
        icon: <Briefcase className="w-5 h-5" />,
    },
    {
        name: 'Settings',
        href: '/dashboard/settings',
        icon: <Settings className="w-5 h-5" />,
    },
    {
        name: 'Admin',
        href: '/admin',
        icon: <Shield className="w-5 h-5" />,
        adminOnly: true,
    },
];

export default function Sidebar() {
    const router = useRouter();
    const { user } = useUserStore();

    const isActive = (href: string) => {
        return router.pathname === href || router.pathname.startsWith(href + '/');
    };

    const filteredNavItems = navItems.filter(
        (item) => !item.adminOnly || user?.is_admin
    );

    return (
        <aside className="w-64 bg-gray-800 border-r border-gray-700 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
            <nav className="p-4 space-y-2">
                {filteredNavItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive(item.href)
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                            }`}
                    >
                        {item.icon}
                        <span className="font-medium">{item.name}</span>
                    </Link>
                ))}
            </nav>

            {/* Paper Trading Notice */}
            <div className="p-4 m-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-xs text-green-400 font-medium mb-1">Paper Trading Mode</p>
                <p className="text-xs text-gray-400">
                    All trades are simulated with virtual money. No real capital at risk.
                </p>
            </div>
        </aside>
    );
}
