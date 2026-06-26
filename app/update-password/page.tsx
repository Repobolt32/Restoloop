'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import { createClient } from '~/lib/supabase/client';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push('/home');
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8 p-8 max-w-md mx-auto w-full">
      <h1 className="text-2xl font-bold tracking-tight text-center">
        Update Password
      </h1>

      {success ? (
        <div className="w-full bg-green-50 border border-green-500 rounded-md p-4 text-center">
          <p className="text-green-800 font-medium">Password updated successfully.</p>
          <p className="text-sm text-green-700 mt-1">Redirecting...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4 w-full">
          {error && (
            <div className="w-full bg-red-50 border border-red-500 rounded-md p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-400 mb-1">New Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-400 mb-1">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-3 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
          >
            Update Password
          </button>
        </form>
      )}
    </div>
  );
}
