import Link from 'next/link';

export default function NotFound() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 p-4">
            <div className="text-center">
                <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-100 text-5xl">
                    🔍
                </div>
                <h1 className="mt-4 text-3xl font-bold text-gray-900">
                    Restaurant not found
                </h1>
                <p className="mt-3 text-gray-500">
                    This link may be incorrect or the restaurant may no longer be active.
                </p>
                <p className="mt-6 text-sm text-gray-400">
                    Are you a restaurant owner?{' '}
                    <Link href="/auth/sign-up" className="font-medium text-orange-500 underline underline-offset-2">
                        Create your free account
                    </Link>
                </p>
            </div>
        </main>
    );
}
