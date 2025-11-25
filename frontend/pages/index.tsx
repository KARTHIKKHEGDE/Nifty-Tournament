import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { TrendingUp, Trophy, Users, Shield, ArrowRight, BarChart3, Zap } from 'lucide-react';
import { useUserStore } from '../stores/userStore';

export default function Home() {
    const router = useRouter();
    const { isAuthenticated } = useUserStore();

    useEffect(() => {
        if (isAuthenticated) {
            router.push('/dashboard/nifty');
        }
    }, [isAuthenticated, router]);

    return (
        <>
            <Head>
                <title>Nifty Options Trading Platform - Practice & Compete</title>
                <meta
                    name="description"
                    content="Practice Nifty options trading with virtual money. Compete in tournaments and win real prizes!"
                />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                {/* Navigation */}
                <nav className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-lg">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-8 h-8 text-blue-500" />
                                <span className="text-xl font-bold text-white">OptionsLeague</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <Link
                                    href="/auth/login"
                                    className="text-gray-300 hover:text-white transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="btn btn-primary"
                                >
                                    Get Started
                                </Link>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <section className="relative overflow-hidden py-20 px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center">
                            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 slide-down">
                                Master Nifty Options Trading
                                <br />
                                <span className="text-transparent bg-clip-text gradient-primary">
                                    Win Real Money Prizes
                                </span>
                            </h1>
                            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto slide-up">
                                Practice trading with virtual money using real-time market data from Zerodha.
                                Compete in tournaments and win actual cash prizes based on your performance!
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center slide-up">
                                <Link
                                    href="/auth/signup"
                                    className="btn btn-primary text-lg px-8 py-3 hover-lift"
                                >
                                    Start Trading Free
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                                <Link
                                    href="/dashboard/nifty"
                                    className="btn bg-gray-700 hover:bg-gray-600 text-white text-lg px-8 py-3 hover-lift"
                                >
                                    View Demo
                                </Link>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
                            <div className="card text-center hover-lift">
                                <div className="text-4xl font-bold text-blue-500 mb-2">₹10L+</div>
                                <div className="text-gray-400">Total Prizes Distributed</div>
                            </div>
                            <div className="card text-center hover-lift">
                                <div className="text-4xl font-bold text-green-500 mb-2">5,000+</div>
                                <div className="text-gray-400">Active Traders</div>
                            </div>
                            <div className="card text-center hover-lift">
                                <div className="text-4xl font-bold text-purple-500 mb-2">50+</div>
                                <div className="text-gray-400">Tournaments Completed</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="py-20 px-4 bg-gray-900/50">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-4xl font-bold text-white text-center mb-12">
                            Why Choose OptionsLeague?
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <FeatureCard
                                icon={<BarChart3 className="w-12 h-12 text-blue-500" />}
                                title="Real-Time Market Data"
                                description="Live data from Zerodha Kite Connect API. Practice with actual market conditions."
                            />
                            <FeatureCard
                                icon={<Shield className="w-12 h-12 text-green-500" />}
                                title="100% Risk-Free"
                                description="Trade with virtual money. No real capital at risk. Perfect for learning."
                            />
                            <FeatureCard
                                icon={<Trophy className="w-12 h-12 text-yellow-500" />}
                                title="Real Money Prizes"
                                description="Compete in tournaments and win actual cash prizes based on your trading performance."
                            />
                            <FeatureCard
                                icon={<Zap className="w-12 h-12 text-purple-500" />}
                                title="Professional Charts"
                                description="KlineChart Pro with 50+ indicators and drawing tools built-in."
                            />
                            <FeatureCard
                                icon={<Users className="w-12 h-12 text-pink-500" />}
                                title="Competitive Tournaments"
                                description="Join daily, weekly, and monthly tournaments. Climb the leaderboard."
                            />
                            <FeatureCard
                                icon={<TrendingUp className="w-12 h-12 text-cyan-500" />}
                                title="Options Trading"
                                description="Full options chain for NIFTY and BANKNIFTY. Practice CE/PE strategies."
                            />
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="card glass-effect p-12">
                            <h2 className="text-4xl font-bold text-white mb-4">
                                Ready to Start Trading?
                            </h2>
                            <p className="text-xl text-gray-300 mb-8">
                                Join thousands of traders practicing and competing for real prizes.
                            </p>
                            <Link
                                href="/auth/signup"
                                className="btn btn-primary text-lg px-8 py-3 hover-lift inline-flex items-center gap-2"
                            >
                                Create Free Account
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-gray-700 py-8 px-4">
                    <div className="max-w-7xl mx-auto text-center text-gray-400">
                        <p>&copy; 2024 OptionsLeague. All rights reserved.</p>
                        <p className="text-sm mt-2">
                            Paper trading platform for educational purposes. Not affiliated with Zerodha.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
    return (
        <div className="card hover-lift">
            <div className="mb-4">{icon}</div>
            <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
            <p className="text-gray-400">{description}</p>
        </div>
    );
}
