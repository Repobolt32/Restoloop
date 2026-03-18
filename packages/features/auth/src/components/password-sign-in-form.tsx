'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

import { PasswordSignInSchema } from '../schemas/password-sign-in.schema';

export function PasswordSignInForm({
  onSubmit,
  loading,
}: {
  onSubmit: (params: z.infer<typeof PasswordSignInSchema>) => unknown;
  loading: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof PasswordSignInSchema>>({
    resolver: zodResolver(PasswordSignInSchema),
    defaultValues: { email: '', password: '' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 max-w-sm w-full font-sans">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-bold tracking-tight text-white">Email Address</label>
        <input
          {...register('email')}
          type="email"
          required
          placeholder="Enter your email"
          className="border border-white/10 bg-white/5 rounded-lg p-2.5 w-full text-white placeholder-white/30 focus:outline-none focus:border-orange-500 transition-colors"
        />
        {errors.email && <span className="text-red-500 text-xs mt-1">{errors.email.message}</span>}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-bold tracking-tight text-white flex justify-between">
          Password
          <Link href="/auth/password-reset" className="text-xs font-normal text-neutral-400 hover:text-white transition-colors">
            Forgot Password?
          </Link>
        </label>
        <input
          {...register('password')}
          type="password"
          required
          className="border border-white/10 bg-white/5 rounded-lg p-2.5 w-full text-white placeholder-white/30 focus:outline-none focus:border-orange-500 transition-colors"
        />
        {errors.password && <span className="text-red-500 text-xs mt-1">{errors.password.message}</span>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 bg-[#FF6B00] hover:bg-[#FF6B00]/80 text-white font-black tracking-widest text-sm uppercase rounded-lg p-3 transition-colors disabled:opacity-50"
      >
        {loading ? 'SIGNING IN...' : 'SIGN IN'}
      </button>
    </form>
  );
}
