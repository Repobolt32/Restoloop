'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { PasswordSignUpSchema } from '../schemas/password-sign-up.schema';

export function PasswordSignUpForm({
  defaultValues,
  displayTermsCheckbox,
  onSubmit,
  loading,
}: {
  defaultValues?: {
    email: string;
  };

  displayTermsCheckbox?: boolean;

  onSubmit: (params: {
    email: string;
    password: string;
    repeatPassword: string;
  }) => unknown;
  loading: boolean;
}) {

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(PasswordSignUpSchema),
    defaultValues: {
      email: defaultValues?.email ?? '',
      password: '',
      repeatPassword: '',
    },
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
        {errors.email && <span className="text-red-500 text-xs mt-1">{errors.email.message as string}</span>}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-bold tracking-tight text-white">Password</label>
        <input
          {...register('password')}
          type="password"
          required
          className="border border-white/10 bg-white/5 rounded-lg p-2.5 w-full text-white placeholder-white/30 focus:outline-none focus:border-orange-500 transition-colors"
        />
        {errors.password && <span className="text-red-500 text-xs mt-1">{errors.password.message as string}</span>}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-bold tracking-tight text-white">Repeat Password</label>
        <input
          {...register('repeatPassword')}
          type="password"
          required
          className="border border-white/10 bg-white/5 rounded-lg p-2.5 w-full text-white placeholder-white/30 focus:outline-none focus:border-orange-500 transition-colors"
        />
        {errors.repeatPassword && <span className="text-red-500 text-xs mt-1">{errors.repeatPassword.message as string}</span>}
      </div>

      {displayTermsCheckbox && (
        <div className="flex items-center gap-2 mt-2">
          <input type="checkbox" required id="terms" className="rounded border-white/10 bg-white/5" />
          <label htmlFor="terms" className="text-xs text-neutral-400">I agree to the Terms and Conditions</label>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 bg-white text-black hover:bg-neutral-200 font-black tracking-widest text-sm uppercase rounded-lg p-3 transition-colors disabled:opacity-50"
      >
        {loading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
      </button>
    </form>
  );
}
