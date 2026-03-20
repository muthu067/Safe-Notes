import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AlertCircle, User, Lock } from 'lucide-react';

export default function Login() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const resolveEmail = async (input) => {
        const trimmed = input.trim();
        if (trimmed.includes('@')) return trimmed;

        const { data, error } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', trimmed.toLowerCase())
            .maybeSingle();

        if (error) {
            console.error('[resolveEmail] Supabase error:', error);
            if (error.code === '42P01') {
                throw new Error('profiles_table_missing');
            }
            throw new Error(error.message);
        }

        return data?.email ?? null;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        let email;
        try {
            email = await resolveEmail(identifier);
        } catch (err) {
            if (err.message === 'profiles_table_missing') {
                setError('Setup incomplete: the profiles table is missing in Supabase. Please run the SQL setup script.');
            } else {
                setError('Could not look up account: ' + err.message);
            }
            setLoading(false);
            return;
        }

        if (!email) {
            setError('Username not found. Try signing in with your email address instead, or create a new account.');
            setLoading(false);
            return;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

        if (signInError) {
            setError(signInError.message.includes('Invalid login credentials')
                ? 'Incorrect password. Please try again.'
                : signInError.message);
        } else {
            navigate('/');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2 text-center">Welcome back</h2>
                <p className="text-sm text-gray-500 text-center mb-6">Sign in with your username or email.</p>

                {error && (
                    <div className="mb-4 flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-3 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username or Email</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                required
                                value={identifier}
                                onChange={e => setIdentifier(e.target.value)}
                                placeholder="john_doe or you@example.com"
                                autoComplete="username"
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <Link to="/forgot-password" className="text-xs text-indigo-600 hover:underline">Forgot password?</Link>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Your password"
                                autoComplete="current-password"
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>
                    </div>
                    <button type="submit" disabled={loading}
                        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50">
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-500">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-indigo-600 font-medium hover:underline">Create one</Link>
                </p>
            </div>
        </div>
    );
}
