import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        });

        if (error) {
            setError(error.message);
        } else {
            setSent(true);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <Link to="/login" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Sign in
                </Link>

                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Reset your password</h2>
                <p className="text-sm text-gray-500 mb-6">
                    Enter the email address you signed up with and we'll send you a reset link.
                </p>

                {sent ? (
                    <div className="flex items-start gap-3 text-green-700 bg-green-50 border border-green-200 rounded-md px-4 py-4 text-sm">
                        <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-medium mb-1">Email sent!</p>
                            <p>Check your inbox at <strong>{email}</strong> for the password reset link. It expires in 1 hour.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {error && (
                            <div className="mb-4 flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-3 text-sm">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 sm:text-sm"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Sending...' : 'Send reset link'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
