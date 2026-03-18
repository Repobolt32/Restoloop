import Link from 'next/link';

import { SignUpMethodsContainer } from '@kit/auth/sign-up';

import authConfig from '~/config/auth.config';
import pathsConfig from '~/config/paths.config';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();

  return {
    title: i18n.t('auth:signUp'),
  };
};

const paths = {
  callback: pathsConfig.auth.callback,
  appHome: pathsConfig.app.home,
};

function SignUpPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8 p-8 max-w-md mx-auto w-full">
      <h1 className="text-2xl font-bold tracking-tight text-center">
        Create an Account
      </h1>

      <div className="w-full">
        <SignUpMethodsContainer
          providers={authConfig.providers}
          displayTermsCheckbox={authConfig.displayTermsCheckbox}
          paths={paths}
        />
      </div>

      <div className={'flex justify-center mt-6'}>
        <Link href={pathsConfig.auth.signIn} className="text-sm underline hover:text-gray-600 transition-colors">
          Already have an account? Sign in
        </Link>
      </div>
    </div>
  );
}

export default withI18n(SignUpPage);
