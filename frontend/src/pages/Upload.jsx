import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UploadCloud, FileText, Type, Tags, GraduationCap, BookOpen, AlertCircle, Sparkles } from 'lucide-react';

const SUBJECTS = ["Engineering", "Medical", "Business", "Law", "Arts", "Science", "Design", "Technology"];

export default function Upload() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [subject, setSubject] = useState(SUBJECTS[0]);
    const [tags, setTags] = useState('');
    const [file, setFile] = useState(null);
    const [uploadType, setUploadType] = useState('text');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { getToken } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title) return setError("Please provide a title for your knowledge resource.");
        if (uploadType === 'text' && !content) return setError("Please enter the content of your note.");
        if (uploadType === 'file_upload' && !file) return setError("Please select a PDF or Image to share.");

        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('title', title);
        formData.append('subject', subject);
        formData.append('tags', tags);
        
        if (uploadType === 'text') {
            formData.append('content', content);
            if (file) formData.append('file', file);
        } else {
            formData.append('file', file);
        }

        try {
            const token = await getToken();
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notes`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Knowledge submission failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.type !== 'application/pdf' && !selectedFile.type.startsWith('image/')) {
                setError('Only PDF documents or Image files are accepted.');
                setFile(null);
            } else if (selectedFile.size > 10 * 1024 * 1024) {
                setError('File size exceeds 10MB limit.');
                setFile(null);
            } else {
                setFile(selectedFile);
                setError('');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-8 border-b border-gray-200">
                        <h2 className="text-2xl font-semibold text-gray-900">Upload Knowledge</h2>
                        <p className="mt-1 text-sm text-gray-500">Share your study notes, diagrams, and explanations.</p>
                    </div>

                    <div className="p-6">
                        {error && (
                            <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-md text-sm border border-red-200 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-2" />
                                {error}
                            </div>
                        )}

                        <div className="flex bg-gray-100 p-1 rounded-md mb-8 w-fit">
                            <button
                                className={`px-4 py-2 text-sm font-medium rounded transition-colors ${uploadType === 'text' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                type="button"
                                onClick={() => { setUploadType('text'); setFile(null); }}
                            >
                                Text Explanation
                            </button>
                            <button
                                className={`px-4 py-2 text-sm font-medium rounded transition-colors ${uploadType === 'file_upload' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                type="button"
                                onClick={() => { setUploadType('file_upload'); setContent(''); }}
                            >
                                File Upload
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                                    placeholder="e.g. Intro to Data Structures"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 sm:text-sm bg-white"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                    >
                                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags (Comma separated)</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                                        placeholder="e.g. react, hooks, frontend"
                                        value={tags}
                                        onChange={(e) => setTags(e.target.value)}
                                    />
                                </div>
                            </div>



                            {uploadType === 'text' ? (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                                        <textarea
                                            required
                                            rows={6}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                                            placeholder="Write your explanation here..."
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Attach Image (Optional)</label>
                                        <input 
                                            type="file" 
                                            accept="image/png,image/jpeg,image/jpg" 
                                            onChange={handleFileChange}
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                                        />
                                        {file && <p className="mt-1 text-xs text-gray-500">Selected: {file.name}</p>}
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">File (PDF / Image)</label>
                                    <div
                                        className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer ${file ? 'border-gray-400 bg-gray-50' : 'border-gray-300 hover:border-gray-400'}`}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <div className="space-y-1 text-center">
                                            <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                            <div className="flex text-sm text-gray-600 justify-center">
                                                <span className="relative cursor-pointer rounded-md font-medium text-gray-900 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-gray-500">
                                                    {file ? file.name : "Click to select a file"}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
                                        </div>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="application/pdf,image/png,image/jpeg,image/jpg" ref={fileInputRef} onChange={handleFileChange} />
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-gray-200">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors'}`}
                                >
                                    {loading ? 'Uploading...' : 'Submit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
