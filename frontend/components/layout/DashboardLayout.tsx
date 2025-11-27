import React from 'react';
import Head from 'next/head';
import Navbar from './Navbar';


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

            <div className="min-h-screen bg-gray-100 dark:bg-[#1e2329]">
                <Navbar />
                <div className="flex justify-center">
                    <main className="w-full max-w-7xl">
                        {children}
                    </main>
                </div>
            </div>
        </>
    );
}
