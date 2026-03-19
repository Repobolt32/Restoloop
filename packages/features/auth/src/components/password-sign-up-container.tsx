'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { useFetchAuthFactors } from '@kit/supabase/hooks/use-fetch-mfa-factors';
import { useSignOut } from '@kit/supabase/hooks/use-sign-out';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';

export function MultiFactorChallengeContainer({
  paths,
  userId,
}: React.PropsWithChildren<{
  userId: string;
  paths: {
    redirectPath: string;
  };
}>) {
  const verifyMFAChallenge = useVerifyMFAChallenge({
    onSuccess: () => {
      window.location.replace(paths.redirectPath);
    },
  });

  const verificationCodeForm = useForm({
    resolver: zodResolver(
      z.object({
        factorId: z.string().min(1),
        verificationCode: z.string().min(6).max(6),
      }),
    ),
    defaultValues: {
      factorId: '',
      verificationCode: '',
    },
  });

  const factorId = useWatch({
    name: 'factorId',
    control: verificationCodeForm.control,
  });

  if (!factorId) {
    return (
      <FactorsListContainer
        userId={userId}
        onSelect={(factorId) => {
          verificationCodeForm.setValue('factorId', factorId);
        }}
      />
    );
  }

  return (
    <form
      className={'w-full'}
      onSubmit={verificationCodeForm.handleSubmit(async (data) => {
        await verifyMFAChallenge.mutateAsync({
          factorId,
          verificationCode: data.verificationCode,
        });
      })}
    >
      <div className={'flex flex-col space-y-4'}>
        <span className={'text-muted-foreground text-sm'}>
          Enter the 6-digit code from your authenticator app
        </span>

        <div className={'flex w-full flex-col space-y-2.5'}>
          <div className={'flex flex-col space-y-4'}>
            {verifyMFAChallenge.error && (
              <div className="alert alert-destructive border-red-500 bg-red-50 p-4">
                <h3 className="font-semibold text-red-800">Invalid code</h3>
                <p className="text-sm text-red-700">
                  The verification code you entered is invalid. Please try again.
                </p>
              </div>
            )}

            <div className="mx-auto flex flex-col items-center justify-center">
              <input
                type="text"
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                minLength={6}
                pattern="\d{6}"
                className="w-full max-w-xs px-3 py-2 border rounded-md"
                placeholder="123456"
                {...verificationCodeForm.register('verificationCode')}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Verification code is required
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={
            verifyMFAChallenge.isPending ||
            !verificationCodeForm.formState.isValid
          }
          className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md disabled:opacity-50"
        >
          {verifyMFAChallenge.isPending ? 'Verifying...' : 'Submit Code'}
        </button>
      </div>
    </form>
  );
}

function useVerifyMFAChallenge({ onSuccess }: { onSuccess: () => void }) {
  const client = useSupabase();
  const mutationKey = ['mfa-verify-challenge'];

  const mutationFn = async (params: {
    factorId: string;
    verificationCode: string;
  }) => {
    const { factorId, verificationCode: code } = params;

    const response = await client.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });

    if (response.error) {
      throw response.error;
    }

    return response.data;
  };

  return useMutation({ mutationKey, mutationFn, onSuccess });
}

function FactorsListContainer({
  onSelect,
  userId,
}: React.PropsWithChildren<{
  userId: string;
  onSelect: (factor: string) => void;
}>) {
  const signOut = useSignOut();
  const { data: factors, isLoading, error } = useFetchAuthFactors(userId);

  const isSuccess = factors && !isLoading && !error;

  useEffect(() => {
    if (error) {
      void signOut.mutateAsync();
    }
  }, [error, signOut]);

  useEffect(() => {
    if (isSuccess && factors.totp.length === 1) {
      const factorId = factors.totp[0]?.id;

      if (factorId) {
        onSelect(factorId);
      }
    }
  });

  if (isLoading) {
    return (
      <div className={'flex flex-col items-center space-y-4 py-8'}>
        <div>Loading factors...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={'w-full'}>
        <div className="alert alert-destructive border-red-500 bg-red-50 p-4">
          <h3 className="font-semibold text-red-800">Error loading factors</h3>
          <p className="text-sm text-red-700">
            There was an error loading your authentication factors. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  const verifiedFactors = factors?.totp ?? [];

  return (
    <div className={'flex flex-col space-y-4'}>
      <div>
        <span className={'font-medium'}>
          Select an authentication factor
        </span>
      </div>

      <div className={'flex flex-col space-y-2'}>
        {verifiedFactors.map((factor) => (
          <div key={factor.id}>
            <button
              type="button"
              className="w-full px-4 py-2 border rounded-md"
              onClick={() => onSelect(factor.id)}
            >
              {factor.friendly_name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmailPasswordSignUpContainer(props: {
  emailRedirectTo: string;
  defaultValues?: { email: string };
  displayTermsCheckbox?: boolean;
}) {
  const [email, setEmail] = useState(props.defaultValues?.email ?? '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = useSupabase();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: props.emailRedirectTo }
    });
    setLoading(false);
    if (error) {
      alert(error.message);
    } else {
      // Auto redirect to bypass Nextjs cache lag
      const nextPath = new URLSearchParams(window.location.search).get('next');
      window.location.href = nextPath ?? props.emailRedirectTo ?? '/home';
    }
  };

  return (
    <form onSubmit={handleSignUp} className="flex flex-col space-y-4">
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" required className="w-full px-4 py-2 border border-border bg-background rounded-md text-sm outline-none focus:ring-2 focus:ring-primary" />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" minLength={8} required className="w-full px-4 py-2 border border-border bg-background rounded-md text-sm outline-none focus:ring-2 focus:ring-primary" />
      <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md disabled:opacity-50 transition-opacity">
        {loading ? 'Accessing Secure Router...' : 'Create Account'}
      </button>
    </form>
  );
}
