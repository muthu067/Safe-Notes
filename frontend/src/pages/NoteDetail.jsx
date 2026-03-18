import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser, useAuth } from '@clerk/clerk-react';
import { ThumbsUp, Flag, FileText, ArrowLeft, Trash2, Eye, Clock, BookOpen, Target, Sparkles, AlertCircle, CheckCircle2, HelpCircle, XCircle, ArrowRight, Library } from 'lucide-react';
import { Link } from 'react-router-dom';
import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function NoteDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [note, setNote] = useState(null);
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);
    const [numPages, setNumPages] = useState(null);
    const [userCollections, setUserCollections] = useState([]);
    const [showCollectionModal, setShowCollectionModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [isReporting, setIsReporting] = useState(false);
    
    // AI Chat State
    const [chatInput, setChatInput] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [isAsking, setIsAsking] = useState(false);
    
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const { user } = useUser();
    const { getToken } = useAuth();

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const token = await getToken();
                const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
                const [noteRes, relatedRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notes/${id}`, config),
                    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notes/${id}/related`)
                ]);
                
                setNote(noteRes.data);
                setRelated(relatedRes.data);

                if (user) {
                    const colRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/collections?userId=${user.id}`, config);
                    setUserCollections(colRes.data || []);
                }
            } catch (err) {
                console.error("Failed to fetch knowledge detail", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, getToken]);

    const handleUpvote = async () => {
        if (!user) return alert('Please login to upvote');
        try {
            const token = await getToken();
            const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notes/${id}/upvote`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNote({ ...note, upvotes: res.data.upvotes, upvotedUsers: res.data.hasUpvoted ? [...note.upvotedUsers, user.id] : note.upvotedUsers.filter(uid => uid !== user.id) });
        } catch (err) { console.error(err); }
    };

    const submitReport = async () => {
        if (!user) return;
        setIsReporting(true);
        try {
            const token = await getToken();
            const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notes/${id}/report`, {
                reason: reportReason
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            showToast(res.data.message);
            setShowReportModal(false);
            setReportReason('');
        } catch (err) { 
            showToast(err.response?.data?.error || 'Failed to report', 'error');
        } finally {
            setIsReporting(false);
        }
    };

    const askAI = async (e) => {
        e.preventDefault();
        if (!chatInput.trim() || !user) return;
        
        setIsAsking(true);
        const newUserMsg = { role: 'user', content: chatInput };
        setChatHistory([...chatHistory, newUserMsg]);
        setChatInput('');

        try {
            const token = await getToken();
            const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notes/${id}/ask`, {
                question: chatInput
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            setChatHistory(prev => [...prev, { role: 'assistant', content: res.data.answer }]);
        } catch (err) {
            showToast('AI thinking failed. Check API configuration.', 'error');
        } finally {
            setIsAsking(false);
        }
    };

    const addToCollection = async (colId) => {
        try {
            const token = await getToken();
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/collections/${colId}/notes`, {
                noteId: id
            }, { headers: { Authorization: `Bearer ${token}` } });
            setShowCollectionModal(false);
            showToast('Knowledge added to your Learning Pack!');
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to add to pack', 'error');
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-500 font-bold">Synchronizing Knowledge...</p>
            </div>
        </div>
    );

    if (!note) return <div>Note not found</div>;

    const isPdf = note.fileMimetype === 'application/pdf' || note.fileUrl?.toLowerCase().endsWith('.pdf');

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-3">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center">
                        <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors mr-3">
                            <ArrowLeft className="w-5 h-5 text-gray-500" />
                        </button>
                        <div>
                            <h1 className="text-lg font-semibold text-gray-900 line-clamp-1">{note.title}</h1>
                            <div className="flex items-center text-[11px] font-medium text-gray-500 space-x-2 mt-0.5">
                                <span className="flex items-center"><BookOpen className="w-3.5 h-3.5 mr-1" /> {note.subject}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setShowCollectionModal(true)}
                            className="flex items-center px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                            <Library className="mr-1.5 w-4 h-4" /> Save
                        </button>
                        <button 
                            onClick={handleUpvote} 
                            className={`flex items-center px-3 py-1.5 border rounded-md text-sm font-medium transition-colors ${user && note.upvotedUsers?.includes(user.id) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                        >
                            <ThumbsUp className={`mr-1.5 w-4 h-4 ${user && note.upvotedUsers?.includes(user.id) ? 'fill-current' : ''}`} /> {note.upvotes}
                        </button>
                        <button 
                            onClick={() => {
                                if (!user) return showToast('Please login to report this resource.', 'error');
                                setShowReportModal(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors ml-1"
                            title="Report this resource"
                        >
                            <Flag className="w-5 h-5" />
                        </button>
                        {note.uploadedBy === user?.id && (
                            <button onClick={() => navigate('/manage')} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors ml-1">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:flex gap-6">
                {/* Left Column: Metadata & Summary */}
                <div className="lg:w-72 flex-shrink-0 space-y-4">
                    <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                        <h3 className="flex items-center text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
                            <Sparkles className="w-4 h-4 mr-1.5 text-gray-500" /> Summary
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed border-l-2 border-gray-200 pl-3 italic">
                            {note.summary || "No summary found."}
                        </p>
                        <div className="mt-5 space-y-3 pt-5 border-t border-gray-100">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-medium">Reading Time</span>
                                <span className="flex items-center text-gray-900"><Clock className="w-4 h-4 mr-1" /> {note.readingTime}m</span>
                            </div>

                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                        <h3 className="flex items-center text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
                            <Target className="w-4 h-4 mr-1.5 text-gray-500" /> Topics
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                            {note.keyTopics?.map(t => (
                                <span key={t} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">#{t}</span>
                            ))}
                        </div>
                    </div>

                    {/* AI Chat Sidebar */}
                    <div className="bg-indigo-50 rounded-lg p-5 border border-indigo-100 shadow-sm">
                        <h3 className="flex items-center text-xs font-semibold text-indigo-900 uppercase tracking-wider mb-3">
                            <Sparkles className="w-4 h-4 mr-1.5 text-indigo-600" /> Ask AI
                        </h3>
                        <div className="max-h-64 overflow-y-auto mb-3 space-y-2 text-xs">
                            {chatHistory.length === 0 && <p className="text-indigo-400 italic">No questions asked yet.</p>}
                            {chatHistory.map((m, i) => (
                                <div key={i} className={`p-2 rounded-lg ${m.role === 'user' ? 'bg-indigo-600 text-white ml-4' : 'bg-white text-indigo-900 mr-4 border border-indigo-100'}`}>
                                    {m.content}
                                </div>
                            ))}
                            {isAsking && <div className="animate-pulse text-indigo-400 italic">Thinking...</div>}
                        </div>
                        <form onSubmit={askAI} className="relative">
                            <input 
                                type="text"
                                placeholder="Ask about this note..."
                                className="w-full text-xs px-3 py-2 bg-white border border-indigo-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                            />
                            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-600 hover:text-indigo-800">
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Center Column: Viewer */}
                <div className="flex-1 mt-6 lg:mt-0">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        {!isPdf ? (
                            <div className="p-8 min-h-[500px] prose prose-sm max-w-none">
                                {(note.fileData || note.fileUrl) && (
                                    <div className="mb-8 border border-gray-100 rounded-md p-2 bg-gray-50 flex justify-center">
                                        <img 
                                            src={note.fileData ? `data:${note.fileMimetype};base64,${note.fileData}` : note.fileUrl} 
                                            alt={note.title} 
                                            className="max-w-full rounded h-auto max-h-[500px] object-contain" 
                                        />
                                    </div>
                                )}
                                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">{note.content}</div>
                            </div>
                        ) : (
                            <div className="bg-gray-100 max-h-[85vh] overflow-y-auto w-full flex flex-col items-center py-6">
                                <Document
                                    file={note.fileData ? `data:${note.fileMimetype};base64,${note.fileData}` : note.fileUrl}
                                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                                    className="flex flex-col items-center gap-6"
                                >
                                    {Array.from(new Array(numPages), (el, index) => (
                                        <div key={`p_${index + 1}`} className="shadow-lg mb-6 border border-gray-200">
                                            <Page 
                                                pageNumber={index + 1} 
                                                width={Math.min(window.innerWidth - 100, 800)} 
                                                renderTextLayer={true}
                                                renderAnnotationLayer={true}
                                            />
                                        </div>
                                    ))}
                                </Document>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Related Content */}
                <div className="lg:w-64 flex-shrink-0 mt-6 lg:mt-0 space-y-4">
                    <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-4">
                            Related
                        </h3>
                        <div className="space-y-3">
                            {related.map(r => (
                                <Link to={`/note/${r._id}`} key={r._id} className="block group">
                                    <div className="border border-gray-100 rounded-md p-3 hover:border-gray-300 hover:bg-gray-50 transition-all">
                                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-600">{r.title}</h4>
                                        <div className="mt-2 flex items-center justify-between">
                                            <span className="text-[10px] text-gray-500 uppercase">{r.subject}</span>
                                            <span className="text-xs text-gray-500 flex items-center"><ThumbsUp className="w-3 h-3 mr-1" /> {r.upvotes}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                            {related.length === 0 && <p className="text-sm text-gray-500 text-center py-2">No related notes found.</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Collection Modal */}
            {showCollectionModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50">
                    <div className="bg-white rounded-lg w-full max-w-md shadow-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Add to Collection</h3>
                                <p className="text-gray-500 text-xs mt-0.5">Select a collection for this note.</p>
                            </div>
                            <button onClick={() => setShowCollectionModal(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 max-h-[300px] overflow-y-auto space-y-2">
                            {userCollections.map(col => (
                                <button
                                    key={col._id}
                                    onClick={() => addToCollection(col._id)}
                                    className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-md hover:border-gray-400 hover:bg-gray-50 transition-colors group text-left"
                                >
                                    <div className="flex items-center">
                                        <Library className="w-4 h-4 text-gray-400 mr-3" />
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{col.name}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{col.notes?.length || 0} items • {col.isPublic ? 'Public' : 'Private'}</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
                                </button>
                            ))}
                            {userCollections.length === 0 && (
                                <div className="text-center py-6">
                                    <Library className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-500 text-sm">No collections found.</p>
                                    <Link to="/collections" className="mt-2 inline-block text-blue-600 text-sm font-medium hover:underline">Create a Collection</Link>
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                            <button onClick={() => setShowCollectionModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300 transition-colors">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg w-full max-w-sm shadow-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-900">Report Resource</h3>
                            <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600 text-sm mb-4">
                                Please describe why you are reporting this resource (e.g. Inappropriate content, spam, policy violation).
                            </p>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                                placeholder="Reason for reporting..."
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                rows={3}
                            />
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                            <button 
                                onClick={() => setShowReportModal(false)} 
                                disabled={isReporting}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={submitReport}
                                disabled={isReporting || !reportReason.trim()}
                                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md transition-colors disabled:opacity-50"
                            >
                                {isReporting ? 'Submitting...' : 'Submit Report'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast.show && (
                <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-md shadow-lg border flex items-center transition-all animate-in fade-in slide-in-from-top-4 ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-3" /> : <AlertCircle className="w-5 h-5 mr-3" />}
                    <span className="font-medium text-sm">{toast.message}</span>
                </div>
            )}
        </div>
    );
}
