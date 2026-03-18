import { SignUp } from '@clerk/clerk-react';

export default function Signup() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <SignUp
                signInUrl="/login"
                appearance={{
                    elements: {
                        formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-sm normal-case',
                        card: 'rounded-2xl shadow-sm border border-gray-100'
                    }
                }}
            />
        </div>
    );
}
