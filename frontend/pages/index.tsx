import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
    TrendingUp,
    Trophy,
    Users,
    Shield,
    ArrowRight,
    BarChart3,
    Zap,
    Target,
    LineChart,
    Sparkles,
    CheckCircle2,
    Star,
    Rocket,
    Award,
    TrendingDown,
    Activity
} from 'lucide-react';
import { useUserStore } from '../stores/userStore';

export default function Home() {
    const router = useRouter();
    const { isAuthenticated } = useUserStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, router]);

    if (!mounted) return null;

    return (
        <>
            <Head>
                <title>OptionsLeague - Master NIFTY Options Trading | Practice & Win Real Prizes</title>
                <meta
                    name="description"
                    content="India's premier options trading platform. Practice with ₹1 Lakh virtual money, compete in tournaments, and win real cash prizes. Real-time NIFTY market data."
                />
                <meta name="keywords" content="options trading, NIFTY options, paper trading, trading tournaments, stock market" />
            </Head>

            <div className="min-h-screen relative overflow-hidden bg-gray-950">
                {/* Animated Background */}
                <div className="fixed inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-gray-950 to-purple-950"></div>
                    <div className="absolute top-0 -left-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
                    <div className="absolute top-0 -right-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-40 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
                    <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                </div>

                {/* Navigation */}
                <nav className="relative z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl sticky top-0">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-20">
                            <Link href="/" className="flex items-center gap-3 group">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-500 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity pointer-events-none"></div>
                                    <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 rounded-xl z-10">
                                        <TrendingUp className="w-7 h-7 text-white" />
                                    </div>
                                </div>
                                <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent relative z-10">
                                    OptionsLeague
                                </span>
                            </Link>
                            <div className="flex items-center gap-4">
                                <Link
                                    href="/auth/login"
                                    className="text-gray-300 hover:text-white transition-colors font-medium"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/50"
                                >
                                    Get Started Free
                                </Link>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <section className="relative z-10 pt-20 pb-32 px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center max-w-5xl mx-auto">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8 animate-fade-in">
                                <Sparkles className="w-4 h-4 text-blue-400" />
                                <span className="text-sm font-medium text-blue-300">India's #1 Options Trading Practice Platform</span>
                            </div>

                            {/* Main Headline */}
                            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight animate-slide-up">
                                Master Options
                                <br />
                                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
                                    Trading Today
                                </span>
                            </h1>

                            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-up animation-delay-200">
                                Practice with <span className="text-green-400 font-bold">₹1,00,000</span> virtual money.
                                Trade real-time NIFTY options. Compete in tournaments.
                                <span className="text-yellow-400 font-bold"> Win actual cash prizes.</span>
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up animation-delay-400">
                                <Link
                                    href="/auth/signup"
                                    className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold text-lg px-10 py-5 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-blue-500/50 flex items-center justify-center gap-3"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                    <Rocket className="w-6 h-6 group-hover:translate-y-[-2px] transition-transform relative z-10" />
                                    <span className="relative z-10">Start Trading Free</span>
                                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform relative z-10" />
                                </Link>
                                <Link
                                    href="#features"
                                    className="bg-white/5 hover:bg-white/10 border-2 border-white/10 hover:border-white/20 text-white font-bold text-lg px-10 py-5 rounded-2xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm flex items-center justify-center gap-3"
                                >
                                    <Activity className="w-6 h-6 relative z-10" />
                                    <span className="relative z-10">See How It Works</span>
                                </Link>
                            </div>

                            {/* Trust Indicators */}
                            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400 animate-fade-in animation-delay-600">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                                    <span>No Credit Card Required</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                                    <span>100% Risk-Free</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                                    <span>Real Market Data</span>
                                </div>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-24 animate-slide-up animation-delay-800">
                            <StatsCard
                                value="₹10L+"
                                label="Prizes Distributed"
                                icon={<Trophy className="w-8 h-8 text-yellow-400" />}
                                gradient="from-yellow-500/20 to-orange-500/20"
                                borderColor="border-yellow-500/30"
                            />
                            <StatsCard
                                value="5,000+"
                                label="Active Traders"
                                icon={<Users className="w-8 h-8 text-blue-400" />}
                                gradient="from-blue-500/20 to-cyan-500/20"
                                borderColor="border-blue-500/30"
                            />
                            <StatsCard
                                value="50+"
                                label="Tournaments"
                                icon={<Award className="w-8 h-8 text-purple-400" />}
                                gradient="from-purple-500/20 to-pink-500/20"
                                borderColor="border-purple-500/30"
                            />
                            <StatsCard
                                value="24/7"
                                label="Practice Trading"
                                icon={<Zap className="w-8 h-8 text-green-400" />}
                                gradient="from-green-500/20 to-emerald-500/20"
                                borderColor="border-green-500/30"
                            />
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="relative z-10 py-32 px-4 bg-gradient-to-b from-transparent to-gray-950/50">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-20">
                            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
                                Everything You Need to
                                <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                    Become a Pro Trader
                                </span>
                            </h2>
                            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                                Professional-grade tools and features designed to help you master options trading
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <FeatureCard
                                icon={<BarChart3 className="w-12 h-12" />}
                                title="Live Market Data"
                                description="Real-time NIFTY options data with live market prices. Trade with actual market conditions."
                                gradient="from-blue-500 to-cyan-500"
                            />
                            <FeatureCard
                                icon={<Shield className="w-12 h-12" />}
                                title="100% Risk-Free"
                                description="Practice with ₹1,00,000 virtual money. No real capital at risk. Perfect for learning and testing strategies."
                                gradient="from-green-500 to-emerald-500"
                            />
                            <FeatureCard
                                icon={<Trophy className="w-12 h-12" />}
                                title="Real Cash Prizes"
                                description="Compete in daily, weekly, and monthly tournaments. Win actual money based on your trading performance."
                                gradient="from-yellow-500 to-orange-500"
                            />
                            <FeatureCard
                                icon={<LineChart className="w-12 h-12" />}
                                title="Professional Charts"
                                description="KlineChart Pro with 50+ technical indicators, drawing tools, and advanced analysis features built-in."
                                gradient="from-purple-500 to-pink-500"
                            />
                            <FeatureCard
                                icon={<Target className="w-12 h-12" />}
                                title="Options Chain"
                                description="Complete options chain for NIFTY and BANKNIFTY. Practice CE/PE strategies with live Greeks."
                                gradient="from-red-500 to-pink-500"
                            />
                            <FeatureCard
                                icon={<Zap className="w-12 h-12" />}
                                title="Instant Execution"
                                description="Lightning-fast paper trading engine. Execute orders in milliseconds just like real trading."
                                gradient="from-cyan-500 to-blue-500"
                            />
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="relative z-10 py-32 px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-20">
                            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
                                Get Started in
                                <span className="block bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                                    3 Simple Steps
                                </span>
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <StepCard
                                number="1"
                                title="Create Free Account"
                                description="Sign up in 30 seconds. No credit card required. Get ₹1,00,000 virtual money instantly."
                                icon={<Users className="w-10 h-10" />}
                            />
                            <StepCard
                                number="2"
                                title="Practice Trading"
                                description="Trade NIFTY options with real-time data. Learn strategies, test ideas, build confidence."
                                icon={<TrendingUp className="w-10 h-10" />}
                            />
                            <StepCard
                                number="3"
                                title="Compete & Win"
                                description="Join tournaments, climb leaderboards, and win real cash prizes based on your performance."
                                icon={<Trophy className="w-10 h-10" />}
                            />
                        </div>
                    </div>
                </section>

                {/* Social Proof */}
                <section className="relative z-10 py-32 px-4 bg-gradient-to-b from-gray-950/50 to-transparent">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                                Trusted by Traders Across India
                            </h2>
                            <div className="flex items-center justify-center gap-2 text-yellow-400">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Star key={i} className="w-6 h-6 fill-current" />
                                ))}
                                <span className="text-white ml-2 text-lg font-semibold">4.9/5 from 1,000+ reviews</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <TestimonialCard
                                quote="Best platform to practice options trading! Made ₹25,000 profit in my first tournament."
                                author="Rahul Sharma"
                                role="Day Trader, Mumbai"
                            />
                            <TestimonialCard
                                quote="The real-time data and professional charts helped me learn options trading without any risk."
                                author="Priya Patel"
                                role="Swing Trader, Ahmedabad"
                            />
                            <TestimonialCard
                                quote="Won ₹50,000 in the monthly tournament! This platform is a game-changer for traders."
                                author="Amit Kumar"
                                role="Options Trader, Delhi"
                            />
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="relative z-10 py-32 px-4">
                    <div className="max-w-5xl mx-auto">
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-1">
                            <div className="bg-gray-950 rounded-3xl p-12 md:p-16 text-center">
                                <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
                                    Ready to Start Your
                                    <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                        Trading Journey?
                                    </span>
                                </h2>
                                <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                                    Join 5,000+ traders who are already practicing and winning.
                                    Get started in less than 60 seconds.
                                </p>
                                <Link
                                    href="/auth/signup"
                                    className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold text-xl px-12 py-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-blue-500/50"
                                >
                                    <Rocket className="w-6 h-6 relative z-10" />
                                    <span className="relative z-10">Start Your Journey</span>
                                    <ArrowRight className="w-6 h-6 relative z-10" />
                                </Link>
                                <p className="text-sm text-gray-400 mt-6">
                                    No credit card required • Start with ₹1,00,000 virtual money
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="relative z-10 border-t border-white/5 py-12 px-4 bg-gray-950/80 backdrop-blur-xl">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-xl">
                                    <TrendingUp className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-xl font-bold text-white">OptionsLeague</span>
                            </div>
                            <div className="text-center text-gray-400">
                                <p>&copy; 2024 OptionsLeague. All rights reserved.</p>
                                <p className="text-sm mt-1">
                                    Paper trading platform for educational purposes. Practice trading with virtual money.
                                </p>
                            </div>
                            <div className="flex gap-6 text-gray-400">
                                <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                                <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                                <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>

            <style jsx>{`
                .bg-grid-pattern {
                    background-image: 
                        linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
                    background-size: 50px 50px;
                }

                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }

                .animate-blob {
                    animation: blob 7s infinite;
                }

                .animation-delay-2000 {
                    animation-delay: 2s;
                }

                .animation-delay-4000 {
                    animation-delay: 4s;
                }

                @keyframes gradient {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }

                .animate-gradient {
                    background-size: 200% 200%;
                    animation: gradient 3s ease infinite;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fade-in {
                    animation: fadeIn 0.8s ease-out;
                }

                .animate-slide-up {
                    animation: slideUp 0.8s ease-out;
                }

                .animation-delay-200 {
                    animation-delay: 0.2s;
                    opacity: 0;
                    animation-fill-mode: forwards;
                }

                .animation-delay-400 {
                    animation-delay: 0.4s;
                    opacity: 0;
                    animation-fill-mode: forwards;
                }

                .animation-delay-600 {
                    animation-delay: 0.6s;
                    opacity: 0;
                    animation-fill-mode: forwards;
                }

                .animation-delay-800 {
                    animation-delay: 0.8s;
                    opacity: 0;
                    animation-fill-mode: forwards;
                }
            `}</style>
        </>
    );
}

interface StatsCardProps {
    value: string;
    label: string;
    icon: React.ReactNode;
    gradient: string;
    borderColor: string;
}

function StatsCard({ value, label, icon, gradient, borderColor }: StatsCardProps) {
    return (
        <div className={`relative group overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-[1px]`}>
            <div className="bg-gray-950 rounded-2xl p-8 h-full backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                    {icon}
                    <div className="text-right">
                        <div className="text-3xl font-black text-white">{value}</div>
                    </div>
                </div>
                <div className="text-gray-400 font-medium">{label}</div>
            </div>
        </div>
    );
}

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    gradient: string;
}

function FeatureCard({ icon, title, description, gradient }: FeatureCardProps) {
    return (
        <div className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-8 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${gradient} mb-6 group-hover:scale-110 transition-transform`}>
                <div className="text-white">{icon}</div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
            <p className="text-gray-400 leading-relaxed">{description}</p>
        </div>
    );
}

interface StepCardProps {
    number: string;
    title: string;
    description: string;
    icon: React.ReactNode;
}

function StepCard({ number, title, description, icon }: StepCardProps) {
    return (
        <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
            <div className="relative bg-gray-950 rounded-2xl p-8 border border-white/10">
                <div className="flex items-center gap-4 mb-6">
                    <div className="text-6xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        {number}
                    </div>
                    <div className="text-blue-400">
                        {icon}
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
                <p className="text-gray-400 leading-relaxed">{description}</p>
            </div>
        </div>
    );
}

interface TestimonialCardProps {
    quote: string;
    author: string;
    role: string;
}

function TestimonialCard({ quote, author, role }: TestimonialCardProps) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
            <div className="flex gap-1 mb-4 text-yellow-400">
                {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                ))}
            </div>
            <p className="text-gray-300 text-lg mb-6 italic">"{quote}"</p>
            <div>
                <div className="text-white font-bold">{author}</div>
                <div className="text-gray-400 text-sm">{role}</div>
            </div>
        </div>
    );
}
