import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth, useUser } from '../context/AuthContext';
import { FolderPlus, BookOpen, User, Lock, Globe, ArrowRight, Library, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Collections() {
    const [collections, setCollections] = useState([]);
    const [myCollections, setMyCollections] = useState([]);
    const [activeTab, setActiveTab] = useState('discover'); // 'discover' | 'mine'
    const [loading, setLoading] = useState(true);
    const { getToken } = useAuth();
    const { user } = useUser();
    
    // Modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newColName, setNewColName] = useState('');
    const [newColDesc, setNewColDesc] = useState('');
    const [newColPublic, setNewColPublic] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const fetchCollections = async () => {
            try {
                setLoading(true);
                const token = await getToken();
                const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
                
                const reqs = [axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/collections`)];
                if (user) {
                    reqs.push(axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/collections/mine`, config));
                }

                const [publicRes, myRes] = await Promise.all(reqs);
                setCollections(publicRes.data);
                if (myRes) {
                    setMyCollections(myRes.data);
                }
            } catch (err) {
                console.error('Failed to fetch collections', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCollections();
    }, [user, getToken]);

    const handleCreateCollection = async () => {
        if (!newColName.trim()) return;
        setIsCreating(true);

        try {
            const token = await getToken();
            const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/collections`, {
                name: newColName,
                description: newColDesc,
                isPublic: newColPublic
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (newColPublic) {
                setCollections([res.data, ...collections]);
            }
            setMyCollections([res.data, ...myCollections]);
            setActiveTab('mine');
            setShowCreateModal(false);
            setNewColName('');
            setNewColDesc('');
            setNewColPublic(true);
        } catch (err) {
            alert('Failed to create collection');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Header Section */}
            <div className="border-b border-gray-200 py-10 mb-8 bg-gray-50/50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Collections</h1>
                            <p className="mt-2 text-gray-500 text-sm max-w-xl">
                                Curated sets of educational notes. Build structured study paths or explore community collections.
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                            <FolderPlus className="w-4 h-4 mr-2" />
                            Create Collection
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-6 mt-8">
                        <button 
                            onClick={() => setActiveTab('discover')}
                            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'discover' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            Discover Packs
                        </button>
                        {user && (
                            <button 
                                onClick={() => setActiveTab('mine')}
                                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'mine' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                            >
                                My Packs
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-gray-100 rounded-lg h-48 animate-pulse border border-gray-200" />
                        ))}
                    </div>
                ) : (activeTab === 'discover' ? collections : myCollections).length === 0 ? (
                    <div className="text-center py-20 border border-gray-200 rounded-lg bg-gray-50">
                        <Library className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                            {activeTab === 'discover' ? 'No collections found' : 'Your library is empty'}
                        </h3>
                        <p className="text-gray-500 text-sm mb-6">
                            {activeTab === 'discover' ? 'Be the first to create a public learning pack!' : "You haven't created any learning packs yet."}
                        </p>
                        {activeTab === 'mine' && (
                            <button 
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
                            >
                                Create a Pack
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(activeTab === 'discover' ? collections : myCollections).map(col => (
                            <Link key={col._id} to={`/collection/${col._id}`} className="group flex flex-col bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-400 transition-colors h-full">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center text-gray-500">
                                        <Library className="w-5 h-5 mr-2" />
                                        <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{col.name}</h3>
                                    </div>
                                    <span className="flex items-center text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                                        {col.isPublic ? <Globe className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                                        {col.isPublic ? 'Public' : 'Private'}
                                    </span>
                                </div>
                                <p className="text-gray-500 text-sm line-clamp-2 mb-6 flex-1">{col.description || 'A structured collection of study materials.'}</p>
                                
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                                    <div className="flex items-center text-xs text-gray-500">
                                        <User className="w-3.5 h-3.5 mr-1" />
                                        {activeTab === 'mine' ? 'You' : 'Community Author'}
                                    </div>
                                    <div className="text-xs text-gray-500 font-medium">
                                        {col.notes?.length || 0} items
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        {/* Create Modal */}
        {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                <div className="bg-white rounded-lg w-full max-w-md shadow-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        <h3 className="text-lg font-semibold text-gray-900">Create Learning Pack</h3>
                        <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pack Name</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                                placeholder="e.g. Algorithms 101"
                                value={newColName}
                                onChange={(e) => setNewColName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                                placeholder="What is this pack about?"
                                value={newColDesc}
                                onChange={(e) => setNewColDesc(e.target.value)}
                                rows={3}
                            />
                        </div>
                        <div className="flex items-center">
                            <input
                                id="is-public"
                                type="checkbox"
                                className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300 rounded"
                                checked={newColPublic}
                                onChange={(e) => setNewColPublic(e.target.checked)}
                            />
                            <label htmlFor="is-public" className="ml-2 block text-sm text-gray-900">
                                Make this pack public
                            </label>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                        <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300 transition-colors">Cancel</button>
                        <button 
                            onClick={handleCreateCollection}
                            disabled={isCreating || !newColName.trim()}
                            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50"
                        >
                            {isCreating ? 'Creating...' : 'Create Pack'}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </div>
    );
}
