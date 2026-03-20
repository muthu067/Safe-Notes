import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, CheckCircle2, AlertCircle, ArrowLeft, BookOpen, Library, Sparkles, LogOut } from 'lucide-react';

export default function Dashboard() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [profileLoading, setProfileLoading] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    const [profileMsg, setProfileMsg] = useState(null);
    const [emailMsg, setEmailMsg] = useState(null);
    const [passwordMsg, setPasswordMsg] = useState(null);

    const [stats, setStats] = useState({ notes: 0, collections: 0, upvotes: 0 });

    useEffect(() => {
        if (user) {
            const name = user.user_metadata?.username || user.email?.split('@')[0] || '';
            setUsername(prev => prev || name);
            setDisplayName(name);
            setNewEmail(user.email || '');
            fetchStats();
        }
    }, [user]);

    const fetchStats = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const config = { headers: { Authorization: `Bearer ${session.access_token}` } };

            const [notesRes, colRes] = await Promise.all([
                fetch(`${API}/api/notes/mine`, config).then(r => r.json()).catch(() => []),
                fetch(`${API}/api/collections/mine`, { headers: config.headers }).then(r => r.json()).catch(() => [])
            ]);

            const noteList = Array.isArray(notesRes) ? notesRes : [];
            const totalUpvotes = noteList.reduce((sum, n) => sum + (n.upvotes || 0), 0);
            setStats({
                notes: noteList.length,
                collections: Array.isArray(colRes) ? colRes.length : 0,
                upvotes: totalUpvotes
            });
        } catch (err) {
            console.error('Failed to load stats', err);
        }
    };

    const flash = (setter, type, message) => {
        setter({ type, message });
        setTimeout(() => setter(null), 4000);
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setProfileLoading(true);

        const trimmed = username.trim().toLowerCase();

        if (trimmed.length < 3) {
            flash(setProfileMsg, 'error', 'Username must be at least 3 characters.');
            setProfileLoading(false);
            return;
        }

        if (!/^[a-z0-9_]+$/.test(trimmed)) {
            flash(setProfileMsg, 'error', 'Username can only contain letters, numbers, and underscores.');
            setProfileLoading(false);
            return;
        }

        const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', trimmed)
            .neq('id', user.id)
            .maybeSingle();

        if (existing) {
            flash(setProfileMsg, 'error', 'That username is already taken. Please choose another.');
            setProfileLoading(false);
            return;
        }

        const { error: dbError } = await supabase
            .from('profiles')
            .update({ username: trimmed })
            .eq('id', user.id);

        if (dbError) {
            flash(setProfileMsg, 'error', 'Failed to update username: ' + dbError.message);
            setProfileLoading(false);
            return;
        }

        const { error: metaError } = await supabase.auth.updateUser({
            data: { username: trimmed }
        });

        if (metaError) {
            flash(setProfileMsg, 'error', metaError.message);
        } else {
            setUsername(trimmed);
            setDisplayName(trimmed);
            flash(setProfileMsg, 'success', 'Username updated successfully!');
            await supabase.auth.refreshSession();
        }
        setProfileLoading(false);
    };

    const handleUpdateEmail = async (e) => {
        e.preventDefault();
        if (newEmail === user.email) {
            flash(setEmailMsg, 'error', 'This is already your current email.');
            return;
        }
        setEmailLoading(true);
        const { error } = await supabase.auth.updateUser({ email: newEmail });
        if (error) flash(setEmailMsg, 'error', error.message);
        else flash(setEmailMsg, 'success', 'Confirmation email sent to ' + newEmail);
        setEmailLoading(false);
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            flash(setPasswordMsg, 'error', 'Passwords do not match.');
            return;
        }
        if (newPassword.length < 6) {
            flash(setPasswordMsg, 'error', 'Password must be at least 6 characters.');
            return;
        }
        setPasswordLoading(true);
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) flash(setPasswordMsg, 'error', error.message);
        else {
            flash(setPasswordMsg, 'success', 'Password updated!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }
        setPasswordLoading(false);
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    if (!user) return null;

    const avatarLetter = displayName[0]?.toUpperCase() || 'U';

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Link to="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Explore
                    </Link>
                    <button
                        onClick={handleSignOut}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-md transition-colors"
                    >
                        <LogOut className="w-4 h-4" /> Sign out
                    </button>
                </div>

                {/* Profile Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
                    <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-bold text-white flex-shrink-0">
                        {avatarLetter}
                    </div>
                    <div className="text-center sm:text-left">
                        <h1 className="text-2xl font-semibold text-gray-900">{displayName}</h1>
                        <p className="text-gray-500 text-sm mt-0.5">{user.email}</p>
                        <p className="text-xs text-gray-400 mt-1">Member since {new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        { label: 'Notes Shared', value: stats.notes, icon: BookOpen },
                        { label: 'Collections', value: stats.collections, icon: Library },
                        { label: 'Total Upvotes', value: stats.upvotes, icon: Sparkles }
                    ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="bg-white border border-gray-200 rounded-xl p-5 text-center">
                            <Icon className="w-5 h-5 text-indigo-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-gray-900">{value}</p>
                            <p className="text-xs text-gray-500 mt-1">{label}</p>
                        </div>
                    ))}
                </div>

                <div className="space-y-6">
                    {/* Display Name */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50">
                            <User className="w-4 h-4 text-gray-500" />
                            <h2 className="text-sm font-semibold text-gray-900">Display Name</h2>
                        </div>
                        <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
                            {profileMsg && <Alert type={profileMsg.type} message={profileMsg.message} />}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                                    placeholder="Your display name"
                                />
                            </div>
                            <button type="submit" disabled={profileLoading}
                                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50">
                                {profileLoading ? 'Saving...' : 'Save name'}
                            </button>
                        </form>
                    </div>

                    {/* Email */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <h2 className="text-sm font-semibold text-gray-900">Email Address</h2>
                        </div>
                        <form onSubmit={handleUpdateEmail} className="p-6 space-y-4">
                            {emailMsg && <Alert type={emailMsg.type} message={emailMsg.message} />}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={e => setNewEmail(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                                />
                                <p className="mt-1 text-xs text-gray-400">A confirmation will be sent to the new address.</p>
                            </div>
                            <button type="submit" disabled={emailLoading}
                                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50">
                                {emailLoading ? 'Sending...' : 'Update email'}
                            </button>
                        </form>
                    </div>

                    {/* Password */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50">
                            <Lock className="w-4 h-4 text-gray-500" />
                            <h2 className="text-sm font-semibold text-gray-900">Change Password</h2>
                        </div>
                        <form onSubmit={handleUpdatePassword} className="p-6 space-y-4">
                            {passwordMsg && <Alert type={passwordMsg.type} message={passwordMsg.message} />}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    minLength={6}
                                    placeholder="At least 6 characters"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    minLength={6}
                                    placeholder="Re-enter new password"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                                />
                            </div>
                            <button type="submit" disabled={passwordLoading}
                                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50">
                                {passwordLoading ? 'Updating...' : 'Update password'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Alert({ type, message }) {
    return (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-md text-sm border ${
            type === 'success'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
        }`}>
            {type === 'success'
                ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                : <AlertCircle className="w-4 h-4 flex-shrink-0" />
            }
            {message}
        </div>
    );
}
