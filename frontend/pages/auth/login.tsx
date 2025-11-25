import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { TrendingUp, Mail, Lock, AlertCircle } from 'lucide-react';
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
                <title>Login - OptionsLeague</title>
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
                <div className="max-w-md w-full">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-flex items-center gap-2 mb-4">
                            <TrendingUp className="w-10 h-10 text-blue-500" />
                            <span className="text-2xl font-bold text-white">OptionsLeague</span>
                        </Link>
                        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                        <p className="text-gray-400">Login to continue trading</p>
                    </div>

                    {/* Login Form */}
                    <div className="card">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-red-500 text-sm">{error}</p>
                                </div>
                            )}

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        className="input pl-10"
                                        placeholder="you@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        id="password"
                                        type="password"
                                        required
                                        className="input pl-10"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn btn-primary w-full"
                            >
                                {isLoading ? (
                                    <div className="spinner mx-auto" style={{ width: '20px', height: '20px' }} />
                                ) : (
                                    'Login'
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-gray-400">
                                Don't have an account?{' '}
                                <Link href="/auth/signup" className="text-blue-500 hover:text-blue-400 font-medium">
                                    Sign up
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Demo Info */}
                    <div className="mt-6 card bg-blue-500/10 border-blue-500/30">
                        <p className="text-sm text-blue-400 text-center">
                            <strong>Paper Trading Only:</strong> All trades are simulated with virtual money.
                            No real capital at risk.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
