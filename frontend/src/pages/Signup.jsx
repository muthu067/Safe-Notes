import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AlertCircle, CheckCircle2, User, Mail, Lock } from 'lucide-react';

export default function Signup() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const trimmedUsername = username.trim().toLowerCase();

        if (trimmedUsername.length < 3) {
            setError('Username must be at least 3 characters.');
            setLoading(false);
            return;
        }

        if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
            setError('Username can only contain letters, numbers, and underscores.');
            setLoading(false);
            return;
        }

        const { data: existing } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', trimmedUsername)
            .maybeSingle();

        if (existing) {
            setError('That username is already taken. Please choose another.');
            setLoading(false);
            return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { username: trimmedUsername }
            }
        });

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
            return;
        }

        if (data?.user) {
            await supabase.from('profiles').insert({
                id: data.user.id,
                username: trimmedUsername,
                email
            });
            navigate('/');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2 text-center">Create account</h2>
                <p className="text-sm text-gray-500 text-center mb-6">Join the knowledge-sharing community.</p>

                {error && (
                    <div className="mb-4 flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-3 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                    </div>
                )}
                        <form onSubmit={handleSignup} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        required
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        placeholder="e.g. john_doe"
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-400">Letters, numbers, underscores. Min 3 chars.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="At least 6 characters"
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>
                            <button type="submit" disabled={loading}
                                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50">
                                {loading ? 'Creating account...' : 'Create account'}
                            </button>
                        </form>
                        <p className="mt-4 text-center text-sm text-gray-500">
                            Already have an account?{' '}
                            <Link to="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
                        </p>
            </div>
        </div>
    );
}
