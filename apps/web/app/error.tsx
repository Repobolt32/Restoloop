'use client';

import Link from 'next/link';
import { ArrowLeft, MessageCircle } from 'lucide-react';

const ErrorPage = ({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  console.error(error);

  return (
    <div className={'flex h-screen flex-1 flex-col items-center justify-center p-8'}>
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-red-600">Oops!</h1>
        <h2 className="text-2xl font-semibold">Something went wrong</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          An unexpected error occurred. Please try again.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <button
            onClick={reset}
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors w-full sm:w-auto justify-center"
          >
            <ArrowLeft className={'mr-2 h-4 w-4'} />
            Try again
          </button>
          <Link
            href="/contact"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors w-full sm:w-auto justify-center"
          >
            <MessageCircle className={'mr-2 h-4 w-4'} />
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
