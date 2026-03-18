import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useUser, useAuth } from '@clerk/clerk-react';
import { ThumbsUp, Flag, Search, Filter, FileText, Trash2, Image, Clock, BookOpen, Sparkles, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';

const SUBJECTS = ["Engineering", "Medical", "Business", "Law", "Arts", "Science", "Design", "Technology"];

export default function Home() {
    const [notes, setNotes] = useState([]);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('newest');
    const [subject, setSubject] = useState('');
    const [loading, setLoading] = useState(true);

    const { user } = useUser();
    const { getToken } = useAuth();

    const fetchNotes = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notes`, {
                params: { query: search, sort, subject }
            });
            setNotes(res.data);
        } catch (err) {
            console.error('Failed to fetch notes', err);
        } finally {
            setLoading(false);
        }
    }, [search, sort, subject]);

    useEffect(() => {
        const delay = setTimeout(() => {
            fetchNotes();
        }, 300);
        return () => clearTimeout(delay);
    }, [search, sort, subject, fetchNotes]);

    const handleUpvote = async (e, id) => {
        e.preventDefault();
        if (!user) return alert('Please login to upvote');
        try {
            const token = await getToken();
            const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notes/${id}/upvote`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotes(notes.map(note =>
                note._id === id
                    ? { ...note, upvotes: res.data.upvotes, upvotedUsers: res.data.hasUpvoted ? [...note.upvotedUsers, user.id] : note.upvotedUsers.filter(uid => uid !== user.id) }
                    : note
            ));
        } catch (err) {
            console.error('Upvote failed', err);
        }
    };

    return (
        <div className="min-h-screen bg-white pb-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-10 text-center sm:text-left">
                    <h1 className="text-3xl font-semibold text-gray-900 tracking-tight mb-3">Explore Knowledge</h1>
                    <p className="text-gray-500 max-w-2xl text-base">Search and filter through educational resources shared by the community.</p>
                </div>

                <div className="mb-8 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by topic, title, or keywords..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-4">
                        <select
                            className="py-2 pl-3 pr-8 border border-gray-300 rounded-md text-sm text-gray-700 bg-white focus:outline-none focus:border-gray-500"
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                        >
                            <option value="newest">Latest</option>
                            <option value="upvotes">Most Popular</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-10">
                    <button
                        onClick={() => setSubject('')}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${subject === '' ? 'bg-gray-900 text-white border-transparent' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                    >
                        All
                    </button>
                    {SUBJECTS.map(s => (
                        <button
                            key={s}
                            onClick={() => setSubject(s)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${subject === s ? 'bg-gray-900 text-white border-transparent' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-gray-100 rounded-lg h-48 animate-pulse border border-gray-200" />
                        ))}
                    </div>
                ) : notes.length === 0 ? (
                    <div className="text-center py-20 border border-gray-200 rounded-lg bg-gray-50">
                        <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No notes found</h3>
                        <p className="text-gray-500 text-sm mb-6">We couldn't find any resources matching your search.</p>
                        <Link to="/upload" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800">
                            Upload a Note
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {notes.map(note => {
                            const isPdf = note.fileMimetype === 'application/pdf' || note.fileUrl?.toLowerCase().endsWith('.pdf');
                            return (
                                <Link
                                    to={`/note/${note._id}`}
                                    key={note._id}
                                    className="group bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-400 transition-colors flex flex-col h-full"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center space-x-2">
                                            {isPdf ? <FileText className="w-4 h-4 text-gray-400" /> : <Image className="w-4 h-4 text-gray-400" />}
                                            <span className="text-xs font-medium text-gray-500 px-2 py-1 bg-gray-100 rounded-md">{note.subject}</span>
                                        </div>
                                    </div>
                                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                                        {note.title}
                                    </h3>
                                    <p className="text-gray-500 text-sm line-clamp-3 mb-6 flex-1">
                                        {note.summary || "No summary found."}
                                    </p>
                                    
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                                        <div className="flex items-center text-xs text-gray-500">
                                            <Clock className="w-3.5 h-3.5 mr-1" />
                                            {note.readingTime || 5} min read
                                        </div>
                                        <button
                                            onClick={(e) => handleUpvote(e, note._id)}
                                            className={`flex items-center text-sm ${user && note.upvotedUsers?.includes(user.id) ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
                                        >
                                            <ThumbsUp className={`w-4 h-4 mr-1.5 ${user && note.upvotedUsers?.includes(user.id) ? 'fill-current' : ''}`} />
                                            {note.upvotes}
                                        </button>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
