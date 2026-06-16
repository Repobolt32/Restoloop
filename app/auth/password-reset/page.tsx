import Link from 'next/link';

import pathsConfig from '~/config/paths.config';
import { resetPassword } from './actions';

export const metadata = {
  title: 'Reset Password',
};

export default function PasswordResetPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8 p-8 max-w-md mx-auto w-full">
      <h1 className="text-2xl font-bold tracking-tight text-center">
        Reset Password
      </h1>

      <form action={resetPassword} className="flex flex-col space-y-4 w-full">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-400 mb-1">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
            placeholder="you@restaurant.com"
          />
        </div>
        <button
          type="submit"
          className="w-full px-4 py-3 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
        >
          Send Reset Link
        </button>

        <div className={'flex justify-center text-xs mt-6'}>
          <Link href={pathsConfig.auth.signIn} className="underline hover:text-gray-600 transition-colors">
            Password recovered? Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}
