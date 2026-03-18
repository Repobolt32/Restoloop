'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useSignInWithOtp } from '@kit/supabase/hooks/use-sign-in-with-otp';
import { useCaptchaToken } from '../captcha/client';

export function MagicLinkAuthContainer({
  redirectUrl,
  shouldCreateUser,
  defaultValues,
  displayTermsCheckbox,
}: {
  redirectUrl: string;
  shouldCreateUser: boolean;
  displayTermsCheckbox?: boolean;

  defaultValues?: {
    email: string;
  };
}) {
  const { captchaToken, resetCaptchaToken } = useCaptchaToken();
  const signInWithOtpMutation = useSignInWithOtp();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(
      z.object({
        email: z.string().email(),
      }),
    ),
    defaultValues: {
      email: defaultValues?.email ?? '',
    },
  });

  const onSubmit = ({ email }: { email: string }) => {
    const url = new URL(redirectUrl);
    const emailRedirectTo = url.href;

    const promise = async () => {
      await signInWithOtpMutation.mutateAsync({
        email,
        options: {
          emailRedirectTo,
          captchaToken,
          shouldCreateUser,
        },
      });
    };

    toast.promise(promise, {
      loading: 'Sending email link...',
      success: 'Check your email for the magic link!',
      error: 'An error occurred while sending the link.',
    });

    resetCaptchaToken();
  };

  if (signInWithOtpMutation.data) {
    return <SuccessAlert />;
  }

  return (
    <form className="w-full font-sans flex flex-col space-y-4" onSubmit={handleSubmit(onSubmit)}>
      {signInWithOtpMutation.error && <ErrorAlert />}

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

      {displayTermsCheckbox && (
        <div className="flex items-center gap-2 mt-2">
          <input type="checkbox" required id="magic-terms" className="rounded border-white/10 bg-white/5" />
          <label htmlFor="magic-terms" className="text-xs text-neutral-400">I agree to the Terms and Conditions</label>
        </div>
      )}

      <button
        type="submit"
        disabled={signInWithOtpMutation.isPending}
        className="mt-2 text-white bg-transparent border border-white/20 hover:bg-white/10 font-black tracking-widest text-sm uppercase rounded-lg p-3 transition-colors disabled:opacity-50 w-full"
      >
        {signInWithOtpMutation.isPending ? 'SENDING LINK...' : 'SEND MAGIC LINK'}
      </button>
    </form>
  );
}

function SuccessAlert() {
  return (
    <div className="flex gap-2 p-3 border border-green-500/20 bg-green-500/10 text-green-500 text-sm rounded-lg">
      <CheckIcon className="w-5 h-5 mt-0.5" />
      <div>
        <div className="font-bold mb-1">Success</div>
        <div>We've sent you a magic link. Please check your inbox.</div>
      </div>
    </div>
  );
}

function ErrorAlert() {
  return (
    <div className="flex gap-2 p-3 border border-red-500/20 bg-red-500/10 text-red-500 text-sm rounded-lg" data-test="auth-error-message">
      <ExclamationTriangleIcon className="w-5 h-5 mt-0.5" />
      <div>
        <div className="font-bold mb-1">Error</div>
        <div>There was a problem sending the magic link. Please try again.</div>
      </div>
    </div>
  );
}
