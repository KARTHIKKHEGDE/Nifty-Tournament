import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { TrendingUp, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import authService from '../../services/authService';
import { useUserStore } from '../../stores/userStore';
import { isValidEmail, isValidPassword } from '../../utils/formatters';

export default function Signup() {
    const router = useRouter();
    const { setUser } = useUserStore();
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        confirm_password: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!isValidEmail(formData.email)) {
            newErrors.email = 'Invalid email address';
        }

        if (!formData.username) {
            newErrors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (!isValidPassword(formData.password)) {
            newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number';
        }

        if (formData.password !== formData.confirm_password) {
            newErrors.confirm_password = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsLoading(true);

        try {
            const response = await authService.signup(formData);
            setUser(response.user);
            router.push('/dashboard/nifty');
        } catch (err: any) {
            setErrors({ general: err.message || 'Signup failed. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Sign Up - OptionsLeague</title>
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4 py-12">
                <div className="max-w-md w-full">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-flex items-center gap-2 mb-4">
                            <TrendingUp className="w-10 h-10 text-blue-500" />
                            <span className="text-2xl font-bold text-white">OptionsLeague</span>
                        </Link>
                        <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
                        <p className="text-gray-400">Start your trading journey today</p>
                    </div>

                    {/* Signup Form */}
                    <div className="card">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {errors.general && (
                                <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-red-500 text-sm">{errors.general}</p>
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
                                        className={`input pl-10 ${errors.email ? 'border-red-500' : ''}`}
                                        placeholder="you@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                            </div>

                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                                    Username
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        id="username"
                                        type="text"
                                        required
                                        className={`input pl-10 ${errors.username ? 'border-red-500' : ''}`}
                                        placeholder="johndoe"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    />
                                </div>
                                {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
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
                                        className={`input pl-10 ${errors.password ? 'border-red-500' : ''}`}
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                            </div>

                            <div>
                                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-300 mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        id="confirm_password"
                                        type="password"
                                        required
                                        className={`input pl-10 ${errors.confirm_password ? 'border-red-500' : ''}`}
                                        placeholder="••••••••"
                                        value={formData.confirm_password}
                                        onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                                    />
                                </div>
                                {errors.confirm_password && (
                                    <p className="text-red-500 text-sm mt-1">{errors.confirm_password}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn btn-primary w-full"
                            >
                                {isLoading ? (
                                    <div className="spinner mx-auto" style={{ width: '20px', height: '20px' }} />
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-gray-400">
                                Already have an account?{' '}
                                <Link href="/auth/login" className="text-blue-500 hover:text-blue-400 font-medium">
                                    Login
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Benefits */}
                    <div className="mt-6 card bg-green-500/10 border-green-500/30">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-green-400 text-sm">
                                <CheckCircle className="w-4 h-4" />
                                <span>₹1,00,000 virtual starting balance</span>
                            </div>
                            <div className="flex items-center gap-2 text-green-400 text-sm">
                                <CheckCircle className="w-4 h-4" />
                                <span>Real-time market data from Zerodha</span>
                            </div>
                            <div className="flex items-center gap-2 text-green-400 text-sm">
                                <CheckCircle className="w-4 h-4" />
                                <span>Compete for real money prizes</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
