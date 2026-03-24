import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ThumbsUp, FileText, Trash2, Image, Clock, AlertTriangle, CheckCircle2, XCircle, Info, Library, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function ManageNotes() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            navigate('/login');
            return;
        }

        const fetchMyNotes = async () => {
            if (!isSignedIn) return;
            try {
                setLoading(true);
                const token = await getToken();
                const config = {
                    headers: { Authorization: `Bearer ${token}` }
                };
                const [notesRes, colRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notes/mine`, config),
                    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/collections/mine`, config)
                ]);
                setNotes(notesRes.data); // Changed from res.data to notesRes.data
            } catch (err) {
                console.error('Failed to fetch my notes', err);
            } finally {
                setLoading(false);
            }
        };

        fetchMyNotes();
    }, [isLoaded, isSignedIn, navigate, getToken]);

    const handleDelete = (e, id) => {
        e.preventDefault();
        setNoteToDelete(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!noteToDelete) return;
        setIsDeleting(true);
        try {
            const token = await getToken();
            await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notes/${noteToDelete}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotes(notes.filter(note => note._id !== noteToDelete));
            setShowDeleteModal(false);
        } catch (err) {
            console.error('Failed to delete note', err);
            alert('Failed to delete the note');
        } finally {
            setIsDeleting(false);
            setNoteToDelete(null);
        }
    };

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Header Section */}
            <div className="border-b border-gray-200 py-10 mb-8 bg-gray-50/50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">My Library</h1>
                            <p className="mt-2 text-gray-500 text-sm max-w-xl">
                                Manage the educational resources you've shared with the community.
                            </p>
                        </div>
                        <Link 
                            to="/upload" 
                            className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                            Upload Note
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-gray-100 rounded-lg h-48 animate-pulse border border-gray-200" />
                        ))}
                    </div>
                ) : notes.length === 0 ? (
                    <div className="text-center py-20 border border-gray-200 rounded-lg bg-gray-50">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Your library is empty</h3>
                        <p className="text-gray-500 text-sm mb-6">You haven't uploaded any notes yet. Share your knowledge!</p>
                        <Link to="/upload" className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
                            Upload a Note
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {notes.map(note => {
                            const isPdf = note.fileMimetype === 'application/pdf' || note.fileUrl?.toLowerCase().endsWith('.pdf');
                            const isRejected = note.status === 'rejected';

                            return (
                                <Link
                                    to={`/note/${note._id}`}
                                    key={note._id}
                                    className={`group flex flex-col bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-400 transition-colors h-full ${isRejected ? 'opacity-75' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center space-x-2">
                                            {isPdf ? <FileText className="w-4 h-4 text-gray-400" /> : <Image className="w-4 h-4 text-gray-400" />}
                                            <span className="text-xs font-medium text-gray-500 px-2 py-1 bg-gray-100 rounded-md">
                                                {note.subject || 'General'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(e, note._id)}
                                            className="text-gray-400 hover:text-red-600 transition-colors"
                                            title="Delete Note"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    
                                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                                        {note.title}
                                    </h3>
                                    
                                    <div className="flex items-center text-xs text-gray-500 mb-4">
                                        <Clock className="w-3.5 h-3.5 mr-1" />
                                        {note.readingTime || 5} min read
                                    </div>

                                    {isRejected && (
                                        <div className="mt-2 p-3 bg-red-50 text-red-700 rounded-md border border-red-100 flex-1">
                                            <div className="flex items-center text-sm font-medium mb-1">
                                                <AlertTriangle className="w-4 h-4 mr-1.5" />
                                                Safety Alert
                                            </div>
                                            <p className="text-xs">{note.rejectionReason}</p>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-gray-100 mt-auto flex items-center justify-between">
                                        <div className="flex items-center text-xs font-medium">
                                            {isRejected ? (
                                                <span className="text-red-600 flex items-center">
                                                    <XCircle className="w-3.5 h-3.5 mr-1" /> Rejected
                                                </span>
                                            ) : (
                                                <span className="text-green-600 flex items-center">
                                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Published
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center text-xs text-gray-500">
                                            <ThumbsUp className="w-3.5 h-3.5 mr-1" /> {note.upvotes || 0}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg w-full max-w-sm shadow-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-900">Remove Resource</h3>
                            <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600 text-sm">
                                Are you sure you want to remove this resource from the Hub? This action cannot be undone.
                            </p>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                            <button 
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? 'Removing...' : 'Remove'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
