import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth, useUser } from '@clerk/clerk-react';
import { BookOpen, AlertCircle, ArrowLeft, ArrowRight, Library, Lock, Globe, ThumbsUp, Clock, Trash2, X } from 'lucide-react';

export default function CollectionDetail() {
    const { id } = useParams();
    const [collection, setCollection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { getToken } = useAuth();
    const { user } = useUser();
    const navigate = useNavigate();

    // Modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Remove Note Modal state
    const [showRemoveNoteModal, setShowRemoveNoteModal] = useState(false);
    const [noteToRemove, setNoteToRemove] = useState(null);
    const [isRemovingNote, setIsRemovingNote] = useState(false);

    const handleDelete = () => {
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            const token = await getToken();
            await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/collections/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate('/collections');
        } catch (err) {
            alert('Failed to delete collection');
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const handleRemoveNoteClick = (e, noteId) => {
        e.preventDefault();
        setNoteToRemove(noteId);
        setShowRemoveNoteModal(true);
    };

    const confirmRemoveNote = async () => {
        if (!noteToRemove) return;
        setIsRemovingNote(true);
        try {
            const token = await getToken();
            await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/collections/${id}/notes/${noteToRemove}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCollection({
                ...collection,
                notes: collection.notes.filter(n => n._id !== noteToRemove)
            });
            setShowRemoveNoteModal(false);
        } catch (err) {
            alert('Failed to remove note');
        } finally {
            setIsRemovingNote(false);
            setNoteToRemove(null);
        }
    };

    useEffect(() => {
        const fetchCollection = async () => {
            try {
                const token = await getToken();
                const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
                const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/collections/${id}`, config);
                setCollection(res.data);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to load collection');
            } finally {
                setLoading(false);
            }
        };
        fetchCollection();
    }, [id, getToken]);

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-500 font-bold">Summoning Learning Pack...</p>
            </div>
        </div>
    );

    if (error || !collection) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <Library className="w-16 h-16 text-gray-300 mb-4" />
            <h2 className="text-2xl font-black text-gray-800 mb-2">Unavailable Pack</h2>
            <p className="text-gray-500 mb-6">{error || 'This learning pack does not exist or is private.'}</p>
            <Link to="/collections" className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl font-black shadow-lg hover:bg-indigo-700 transition">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Discover
            </Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Header */}
            <div className="bg-gray-50/50 border-b border-gray-200 py-10 mb-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <button onClick={() => navigate('/collections')} className="inline-flex items-center text-gray-500 hover:text-gray-900 font-medium text-sm mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Collections
                    </button>
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center space-x-3 mb-3">
                                <span className={`flex items-center text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md ${collection.isPublic ? 'bg-gray-100 text-gray-600' : 'bg-gray-100 text-gray-600'}`}>
                                    {collection.isPublic ? <Globe className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                                    {collection.isPublic ? 'Public' : 'Private'}
                                </span>
                            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                                {collection.notes?.length || 0} items
                            </span>
                        </div>
                        <h1 className="text-3xl font-semibold text-gray-900 mb-2">{collection.name}</h1>
                        <p className="text-gray-500 text-sm max-w-2xl">
                            {collection.description || 'A curated set of study materials.'}
                        </p>
                    </div>
                    {user && collection.ownerId === user.id && (
                        <button onClick={handleDelete} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Delete Collection">
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {collection.notes && collection.notes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {collection.notes.map(note => (
                            <Link to={`/note/${note._id}`} key={note._id} className="group flex flex-col bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-400 transition-colors h-full">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center space-x-2">
                                        <BookOpen className="w-4 h-4 text-gray-400" />
                                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                            {note.subject}
                                        </span>
                                    </div>
                                    {user && collection.ownerId === user.id && (
                                        <button 
                                            onClick={(e) => handleRemoveNoteClick(e, note._id)}
                                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                                            title="Remove note from pack"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                
                                <h3 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                                    {note.title}
                                </h3>
                                
                                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center text-xs text-gray-500 space-x-3">
                                        <span className="flex items-center"><ThumbsUp className="w-3.5 h-3.5 mr-1" /> {note.upvotes || 0}</span>
                                        {note.readingTime && <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> {note.readingTime} min</span>}
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 border border-gray-200 rounded-lg bg-gray-50">
                        <Library className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Collection is empty</h3>
                        <p className="text-gray-500 text-sm mb-6">This collection doesn't have any notes yet.</p>
                        <Link to="/" className="inline-flex items-center px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">
                            Explore Hub
                        </Link>
                    </div>
                )}
            </div>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg w-full max-w-sm shadow-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-900">Delete Collection</h3>
                            <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600 text-sm">
                                Are you sure you want to delete this collection? This action cannot be undone.
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
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Remove Note Modal */}
            {showRemoveNoteModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg w-full max-w-sm shadow-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-900">Remove Knowledge</h3>
                            <button onClick={() => setShowRemoveNoteModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600 text-sm">
                                Are you sure you want to remove this piece of knowledge from your Learning Pack?
                            </p>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                            <button 
                                onClick={() => setShowRemoveNoteModal(false)} 
                                disabled={isRemovingNote}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmRemoveNote}
                                disabled={isRemovingNote}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
                            >
                                {isRemovingNote ? 'Removing...' : 'Remove'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
