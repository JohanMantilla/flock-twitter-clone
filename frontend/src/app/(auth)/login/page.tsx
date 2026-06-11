'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
    const { login, loading } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            await login(email, password);
            router.push('/home');
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Invalid credentials');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
            <div className="w-full max-w-sm">
                <h1 className="text-2xl font-medium text-gray-900 mb-8">
                    Sign in
                </h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 transition-colors"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-500">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting || !email || !password}
                        className="w-full bg-gray-900 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                    >
                        {submitting ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                <p className="mt-6 text-sm text-gray-500 text-center">
                    No account?{' '}
                    <Link href="/register" className="text-gray-900 underline underline-offset-2">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
}