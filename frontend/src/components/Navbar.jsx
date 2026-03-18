import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { Plus, Book, Folder, Home } from 'lucide-react';

export default function Navbar() {
    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                            <Book className="h-5 w-5 text-gray-900" />
                            <span className="text-lg font-semibold text-gray-900 tracking-tight">
                                OpenNotes
                            </span>
                        </Link>
                        
                        <div className="hidden md:ml-8 md:flex md:space-x-6">
                            <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                                Explore
                            </Link>
                            <Link to="/collections" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                                Collections
                            </Link>
                            <Link to="/manage" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                                My Library
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <SignedIn>
                            <Link
                                to="/upload"
                                className="hidden sm:inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Upload
                            </Link>
                            <div className="flex items-center">
                                <UserButton afterSignOutUrl="/" />
                            </div>
                        </SignedIn>

                        <SignedOut>
                            <Link
                                to="/login"
                                className="text-sm font-medium text-gray-500 hover:text-gray-900 px-3 py-2 transition-colors"
                            >
                                Sign in
                            </Link>
                            <Link
                                to="/signup"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 transition-colors"
                            >
                                Sign up
                            </Link>
                        </SignedOut>
                    </div>
                </div>
            </div>
        </nav>
    );
}
