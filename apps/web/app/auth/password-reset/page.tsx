import Link from 'next/link';

import { PasswordResetRequestContainer } from '@kit/auth/password-reset';

import pathsConfig from '~/config/paths.config';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export const generateMetadata = async () => {
  const { t } = await createI18nServerInstance();

  return {
    title: t('auth:passwordResetLabel'),
  };
};

const { callback, passwordUpdate, signIn } = pathsConfig.auth;
const redirectPath = `${callback}?next=${passwordUpdate}`;

function PasswordResetPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8 p-8 max-w-md mx-auto w-full">
      <h1 className="text-2xl font-bold tracking-tight text-center">
        Reset Password
      </h1>

      <div className={'flex flex-col space-y-4 w-full'}>
        <PasswordResetRequestContainer redirectPath={redirectPath} />

        <div className={'flex justify-center text-xs mt-6'}>
          <Link href={signIn} className="underline hover:text-gray-600 transition-colors">
            Password recovered? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default withI18n(PasswordResetPage);
