'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { useCaptchaToken } from '../captcha/client';

export function ResendAuthLinkForm(props: { redirectPath?: string }) {
  const resendLink = useResendLink();

  const form = useForm({
    resolver: zodResolver(z.object({ email: z.string().email() })),
    defaultValues: { email: '' },
  });

  if (resendLink.data && !resendLink.isPending) {
    return (
      <div className="p-3 border border-green-500/20 bg-green-500/10 text-green-500 text-sm rounded-lg mt-4">
        <div className="font-bold">Success!</div>
        <div>We've sent you a new sign-up link.</div>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-4 mt-4 font-sans" onSubmit={form.handleSubmit((data) => resendLink.mutate({ email: data.email, redirectPath: props.redirectPath }))}>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-bold tracking-tight text-white">Email Address</label>
        <input
          {...form.register('email')}
          type="email"
          required
          className="border border-white/10 bg-white/5 rounded-lg p-2.5 w-full text-white placeholder-white/30 focus:outline-none focus:border-orange-500 transition-colors"
        />
      </div>
      <button
        type="submit"
        disabled={resendLink.isPending}
        className="mt-2 bg-white text-black hover:bg-neutral-200 font-black tracking-widest text-sm uppercase rounded-lg p-3 transition-colors disabled:opacity-50"
      >
        {resendLink.isPending ? 'RESENDING...' : 'RESEND LINK'}
      </button>
    </form>
  );
}

function useResendLink() {
  const supabase = useSupabase();
  const { captchaToken } = useCaptchaToken();

  const mutationFn = async (props: {
    email: string;
    redirectPath?: string;
  }) => {
    const response = await supabase.auth.resend({
      email: props.email,
      type: 'signup',
      options: {
        emailRedirectTo: props.redirectPath,
        captchaToken,
      },
    });

    if (response.error) {
      throw response.error;
    }

    return response.data;
  };

  return useMutation({
    mutationFn,
  });
}
