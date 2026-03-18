'use client';

import Link from 'next/link';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { ArrowRightIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

import { useUpdateUser } from '@kit/supabase/hooks/use-update-user-mutation';

import { PasswordResetSchema } from '../schemas/password-reset.schema';

export function UpdatePasswordForm(params: { redirectTo: string }) {
  const updateUser = useUpdateUser();

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof PasswordResetSchema>>({
    resolver: zodResolver(PasswordResetSchema),
    defaultValues: {
      password: '',
      repeatPassword: '',
    },
  });

  if (updateUser.error) {
    return <ErrorState onRetry={() => updateUser.reset()} />;
  }

  if (updateUser.data && !updateUser.isPending) {
    return <SuccessState redirectTo={params.redirectTo} />;
  }

  return (
    <div className={'flex w-full flex-col space-y-6 max-w-sm mx-auto font-sans'}>
      <div className={'flex justify-center'}>
        <h2 className={'tracking-tight text-xl font-black text-white'}>
          RESET PASSWORD
        </h2>
      </div>

      <form
        className="flex flex-col gap-4 w-full"
        onSubmit={handleSubmit(({ password }) => {
          return updateUser.mutateAsync({
            password,
            redirectTo: params.redirectTo,
          });
        })}
      >
        <div className="flex flex-col gap-1">
          <label className="text-sm font-bold tracking-tight text-white">Password</label>
          <input
            {...register('password')}
            type="password"
            required
            className="border border-white/10 bg-white/5 rounded-lg p-2.5 w-full text-white placeholder-white/30 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-bold tracking-tight text-white">Repeat Password</label>
          <input
            {...register('repeatPassword')}
            type="password"
            required
            className="border border-white/10 bg-white/5 rounded-lg p-2.5 w-full text-white placeholder-white/30 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        <button
          disabled={updateUser.isPending}
          type="submit"
          className="mt-2 bg-white text-black hover:bg-neutral-200 font-black tracking-widest text-sm uppercase rounded-lg p-3 transition-colors disabled:opacity-50"
        >
          {updateUser.isPending ? 'UPDATING...' : 'UPDATE PASSWORD'}
        </button>
      </form>
    </div>
  );
}

function SuccessState(props: { redirectTo: string }) {
  return (
    <div className={'flex flex-col space-y-4'}>
      <div className="flex gap-2 p-3 border border-green-500/20 bg-green-500/10 text-green-500 text-sm rounded-lg" data-test="auth-success-message">
        <CheckIcon className="w-5 h-5 mt-0.5" />
        <div>
          <div className="font-bold mb-1">Success</div>
          <div>Your password was updated successfully.</div>
        </div>
      </div>

      <Link href={props.redirectTo}>
        <button className="flex items-center justify-center space-x-2 border border-white/10 bg-white/5 hover:bg-white/10 text-white p-2.5 rounded-lg transition-colors text-sm font-bold w-full uppercase tracking-widest mt-4">
          <span>Back to Home Page</span>
          <ArrowRightIcon className={'w-4 h-4'} />
        </button>
      </Link>
    </div>
  );
}

function ErrorState(props: { onRetry: () => void }) {
  return (
    <div className={'flex flex-col space-y-4'}>
      <div className="flex gap-2 p-3 border border-red-500/20 bg-red-500/10 text-red-500 text-sm rounded-lg" data-test="auth-error-message">
        <ExclamationTriangleIcon className="w-5 h-5 mt-0.5" />
        <div>
          <div className="font-bold mb-1">Error</div>
          <div>There was an error updating your password. Please try again.</div>
        </div>
      </div>

      <button onClick={props.onRetry} className="border border-white/10 bg-white/5 hover:bg-white/10 text-white font-black tracking-widest text-sm uppercase rounded-lg p-3 transition-colors mt-4 w-full">
        Retry
      </button>
    </div>
  );
}
