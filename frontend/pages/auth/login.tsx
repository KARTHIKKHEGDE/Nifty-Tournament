import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
    TrendingUp,
    Mail,
    Lock,
    AlertCircle,
    Trophy,
    BarChart3,
    Shield,
    Zap,
    ArrowRight,
    Eye,
    EyeOff
} from 'lucide-react';
import authService from '../../services/authService';
import { useUserStore } from '../../stores/userStore';

export default function Login() {
    const router = useRouter();
    const { setUser } = useUserStore();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await authService.login(formData);
            setUser(response.user);
            router.push('/dashboard/nifty');
        } catch (err: any) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Login - OptionsLeague | Professional Options Trading Platform</title>
                <meta name="description" content="Login to OptionsLeague - Practice options trading with virtual money and compete in tournaments" />
            </Head>

            <div className="min-h-screen relative overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20">
                    {/* Animated Gradient Orbs */}
                    <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

                    {/* Grid Pattern */}
                    <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                </div>

                <div className="relative min-h-screen flex">
                    {/* Left Side - Features */}
                    <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-20">
                        <div className="max-w-xl">
                            {/* Logo */}
                            <Link href="/" className="inline-flex items-center gap-3 mb-12 group">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-500 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                                    <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
                                        <TrendingUp className="w-8 h-8 text-white" />
                                    </div>
                                </div>
                                <span className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                    OptionsLeague
                                </span>
                            </Link>

                            {/* Headline */}
                            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
                                Master Options Trading
                                <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mt-2">
                                    Risk-Free
                                </span>
                            </h1>

                            <p className="text-xl text-gray-300 mb-12">
                                Practice with virtual money, compete in tournaments, and become a better trader.
                            </p>

                            {/* Features */}
                            <div className="space-y-6">
                                <div className="flex items-start gap-4 group">
                                    <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                                        <Trophy className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold mb-1">Competitive Tournaments</h3>
                                        <p className="text-gray-400 text-sm">Compete with traders worldwide and climb the leaderboard</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 group">
                                    <div className="bg-purple-500/10 p-3 rounded-lg border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
                                        <BarChart3 className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold mb-1">Real-Time Market Data</h3>
                                        <p className="text-gray-400 text-sm">Live NIFTY options data powered by Zerodha</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 group">
                                    <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20 group-hover:bg-green-500/20 transition-colors">
                                        <Shield className="w-6 h-6 text-green-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold mb-1">100% Safe Practice</h3>
                                        <p className="text-gray-400 text-sm">No real money at risk - perfect for learning</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 group">
                                    <div className="bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20 group-hover:bg-yellow-500/20 transition-colors">
                                        <Zap className="w-6 h-6 text-yellow-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold mb-1">Instant Execution</h3>
                                        <p className="text-gray-400 text-sm">Lightning-fast paper trading engine</p>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="mt-12 grid grid-cols-3 gap-6">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-white mb-1">₹100K</div>
                                    <div className="text-sm text-gray-400">Starting Balance</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-white mb-1">24/7</div>
                                    <div className="text-sm text-gray-400">Practice Trading</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-white mb-1">Free</div>
                                    <div className="text-sm text-gray-400">Forever</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Login Form */}
                    <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
                        <div className="w-full max-w-md">
                            {/* Mobile Logo */}
                            <div className="lg:hidden text-center mb-8">
                                <Link href="/" className="inline-flex items-center gap-3 mb-4">
                                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
                                        <TrendingUp className="w-8 h-8 text-white" />
                                    </div>
                                    <span className="text-2xl font-bold text-white">OptionsLeague</span>
                                </Link>
                            </div>

                            {/* Login Card */}
                            <div className="glass-card p-8 rounded-2xl border border-white/10 backdrop-blur-xl bg-white/5 shadow-2xl">
                                <div className="mb-8">
                                    <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                                    <p className="text-gray-400">Enter your credentials to continue</p>
                                </div>

                                {/* Error Alert */}
                                {error && (
                                    <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-start gap-3 animate-shake">
                                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-red-400 text-sm">{error}</p>
                                    </div>
                                )}

                                {/* Login Form */}
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* Email Field */}
                                    <div className="group">
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Mail className="w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                                            </div>
                                            <input
                                                id="email"
                                                type="email"
                                                required
                                                className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                placeholder="you@example.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Password Field */}
                                    <div className="group">
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                                            </div>
                                            <input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="w-5 h-5" />
                                                ) : (
                                                    <Eye className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Remember Me & Forgot Password */}
                                    <div className="flex items-center justify-between text-sm">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                                            />
                                            <span className="text-gray-400 group-hover:text-white transition-colors">Remember me</span>
                                        </label>
                                        <Link href="/auth/forgot-password" className="text-blue-400 hover:text-blue-300 transition-colors">
                                            Forgot password?
                                        </Link>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full relative group overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-blue-500/50"
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            {isLoading ? (
                                                <>
                                                    <div className="spinner-small"></div>
                                                    <span>Logging in...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Login to Dashboard</span>
                                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </button>
                                </form>

                                {/* Divider */}
                                <div className="relative my-8">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-white/10"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-4 bg-transparent text-gray-400">New to OptionsLeague?</span>
                                    </div>
                                </div>

                                {/* Sign Up Link */}
                                <Link
                                    href="/auth/signup"
                                    className="block w-full text-center py-3.5 px-6 rounded-xl border-2 border-white/10 text-white font-semibold hover:bg-white/5 hover:border-white/20 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Create Free Account
                                </Link>

                                {/* Demo Info */}
                                <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                    <div className="flex items-start gap-3">
                                        <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-blue-300 font-medium mb-1">100% Paper Trading</p>
                                            <p className="text-xs text-blue-400/80">All trades are simulated with virtual money. No real capital at risk.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Links */}
                            <div className="mt-8 text-center text-sm text-gray-400">
                                <p>
                                    By continuing, you agree to our{' '}
                                    <Link href="/terms" className="text-blue-400 hover:text-blue-300 transition-colors">
                                        Terms of Service
                                    </Link>
                                    {' '}and{' '}
                                    <Link href="/privacy" className="text-blue-400 hover:text-blue-300 transition-colors">
                                        Privacy Policy
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .glass-card {
                    background: rgba(31, 41, 55, 0.4);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                }

                .bg-grid-pattern {
                    background-image: 
                        linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
                    background-size: 50px 50px;
                }

                @keyframes blob {
                    0%, 100% {
                        transform: translate(0, 0) scale(1);
                    }
                    33% {
                        transform: translate(30px, -50px) scale(1.1);
                    }
                    66% {
                        transform: translate(-20px, 20px) scale(0.9);
                    }
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

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }

                .animate-shake {
                    animation: shake 0.5s;
                }

                .spinner-small {
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top: 2px solid white;
                    border-radius: 50%;
                    width: 16px;
                    height: 16px;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
}
