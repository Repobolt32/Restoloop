import Link from 'next/link';

import type { AuthError } from '@supabase/supabase-js';

import pathsConfig from '~/config/paths.config';

interface AuthCallbackErrorPageProps {
  searchParams: Promise<{
    error: string;
    callback?: string;
    email?: string;
    code?: AuthError['code'];
  }>;
}

export default async function AuthCallbackErrorPage(props: AuthCallbackErrorPageProps) {
  const { error, callback } = await props.searchParams;
  const signInPath = pathsConfig.auth.signIn;

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 max-w-md mx-auto w-full space-y-8">
      <div className="w-full bg-red-50 border border-red-500 rounded-md p-4">
        <h2 className="text-red-800 font-semibold mb-2">Authentication Error</h2>
        <p className="text-sm text-red-700">
          {error ?? 'There was an error authenticating your account. Please try again.'}
        </p>
      </div>

      <Link
        href={signInPath}
        className="flex items-center justify-center w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
      >
        Sign in
      </Link>
    </div>
  );
}
