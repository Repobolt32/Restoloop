'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import type { Provider } from '@supabase/supabase-js';

import { isBrowser } from '@kit/shared/utils';

import { MagicLinkAuthContainer } from './magic-link-auth-container';
import { OauthProviders } from './oauth-providers';
import { PasswordSignInContainer } from './password-sign-in-container';

export function SignInMethodsContainer(props: {
  paths: {
    callback: string;
    home: string;
  };

  providers: {
    password: boolean;
    magicLink: boolean;
    oAuth: Provider[];
  };
}) {
  const router = useRouter();
  const nextPath = useSearchParams().get('next') ?? props.paths.home;

  const redirectUrl = isBrowser()
    ? new URL(props.paths.callback, window?.location.origin).toString()
    : '';

  const onSignIn = () => {
    router.replace(nextPath);
  };

  return (
    <div className="flex flex-col gap-4">
      {props.providers.password && <PasswordSignInContainer onSignIn={onSignIn} />}

      {props.providers.magicLink && (
        <MagicLinkAuthContainer
          redirectUrl={redirectUrl}
          shouldCreateUser={false}
        />
      )}

      {Boolean(props.providers.oAuth.length) && (
        <>
          <div className="h-px w-full bg-white/10 my-1" />

          <OauthProviders
            enabledProviders={props.providers.oAuth}
            shouldCreateUser={false}
            paths={{
              callback: props.paths.callback,
              returnPath: props.paths.home,
            }}
          />
        </>
      )}
    </div>
  );
}
