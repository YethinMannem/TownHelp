'use client';

import { useRouter } from 'next/navigation';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProviderDetailError({ error, reset }: ErrorProps) {
  const router = useRouter();

  const isNotFound =
    error.message.toLowerCase().includes('not found') ||
    error.message.toLowerCase().includes('no rows');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-4">
        <div
          className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto"
          aria-hidden="true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-7 h-7 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>

        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-gray-900">
            {isNotFound ? 'Provider not found' : 'Something went wrong'}
          </h1>
          <p className="text-sm text-gray-500">
            {isNotFound
              ? 'This provider may have removed their profile or the link is incorrect.'
              : 'We could not load this provider right now. Please try again.'}
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button
            type="button"
            onClick={reset}
            className="w-full h-11 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => router.push('/browse')}
            className="w-full h-11 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
          >
            Go back to Browse
          </button>
        </div>
      </div>
    </div>
  );
}
