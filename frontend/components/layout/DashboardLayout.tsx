import React from 'react';
import Head from 'next/head';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
    children: React.ReactNode;
    title?: string;
}

export default function DashboardLayout({ children, title = 'Dashboard' }: DashboardLayoutProps) {
    return (
        <>
            <Head>
                <title>{title} - OptionsLeague</title>
            </Head>

            <div className="min-h-screen bg-gray-900">
                <Navbar />
                <div className="flex">
                    <Sidebar />
                    <main className="flex-1 overflow-x-hidden">
                        {children}
                    </main>
                </div>
            </div>
        </>
    );
}
