'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useRequestResetPassword } from '@kit/supabase/hooks/use-request-reset-password';
import { useCaptchaToken } from '../captcha/client';
import { AuthErrorAlert } from './auth-error-alert';
import { CheckIcon } from '@radix-ui/react-icons';

const PasswordResetSchema = z.object({
  email: z.string().email(),
});

export function PasswordResetRequestContainer(params: {
  redirectPath: string;
}) {
  const resetPasswordMutation = useRequestResetPassword();
  const { captchaToken, resetCaptchaToken } = useCaptchaToken();

  const error = resetPasswordMutation.error;
  const success = resetPasswordMutation.data;

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof PasswordResetSchema>>({
    resolver: zodResolver(PasswordResetSchema),
    defaultValues: { email: '' },
  });

  return (
    <div className="font-sans flex flex-col gap-4">
      {success && (
        <div className="flex gap-2 p-3 border border-green-500/20 bg-green-500/10 text-green-500 text-sm rounded-lg">
          <CheckIcon className="w-5 h-5 mt-0.5" />
          <div>
            <div className="font-bold mb-1">Check Your Email</div>
            <div>We've sent you a password reset link to your email address.</div>
          </div>
        </div>
      )}

      {!resetPasswordMutation.data && (
        <form
          onSubmit={handleSubmit(({ email }) => {
            const redirectTo = new URL(
              params.redirectPath,
              window.location.origin,
            ).href;

            return resetPasswordMutation
              .mutateAsync({ email, redirectTo, captchaToken })
              .catch(() => resetCaptchaToken());
          })}
          className="w-full flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <p className={'text-neutral-400 text-sm mb-4'}>
              Please enter your email address to request a password reset.
            </p>

            <AuthErrorAlert error={error} />

            <div className="flex flex-col gap-1 mt-2">
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
          </div>

          <button
            disabled={resetPasswordMutation.isPending}
            type="submit"
            className="w-full mt-2 bg-white text-black hover:bg-neutral-200 font-black tracking-widest text-sm uppercase rounded-lg p-3 transition-colors disabled:opacity-50"
          >
            {resetPasswordMutation.isPending ? 'REQUESTING...' : 'RESET PASSWORD'}
          </button>
        </form>
      )}
    </div>
  );
}
