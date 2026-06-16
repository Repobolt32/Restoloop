import Link from 'next/link';

import pathsConfig from '~/config/paths.config';
import { signUp } from './actions';

export const metadata = {
  title: 'Create Account',
};

export default function SignUpPage() {
  return (
    <div className="flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="mb-2">
        <h1 className="text-3xl font-black tracking-tighter text-white">
          Create Account
        </h1>
      </div>

      <form action={signUp} className="w-full mt-4 space-y-4">
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
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-neutral-400 mb-1">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          className="w-full px-4 py-3 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
        >
          Create Account
        </button>
      </form>

      <div className={'flex justify-center mt-8 pt-6 border-t border-white/10'}>
        <Link href={pathsConfig.auth.signIn} className="text-sm font-semibold tracking-wider text-neutral-400 hover:text-white transition-colors">
          Already have an account? Sign in <span className="text-orange-500 ml-1">→</span>
        </Link>
      </div>
    </div>
  );
}
