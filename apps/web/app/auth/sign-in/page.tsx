import Link from 'next/link';

import { SignInMethodsContainer } from '@kit/auth/sign-in';

import authConfig from '~/config/auth.config';
import pathsConfig from '~/config/paths.config';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();

  return {
    title: i18n.t('auth:signIn'),
  };
};

const paths = {
  callback: pathsConfig.auth.callback,
  home: pathsConfig.app.home,
};

function SignInPage() {
  return (
    <div className="flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="mb-2">
        <h1 className="text-3xl font-black tracking-tighter text-white">
          Access Portal
        </h1>
        <p className="text-sm font-medium text-neutral-400 mt-1 tracking-wide">
          SYSTEM: <span className="text-[#FF6B00]">ONLINE</span>
        </p>
      </div>

      <div className="w-full mt-4">
        <SignInMethodsContainer paths={paths} providers={authConfig.providers} />
      </div>

      <div className={'flex justify-center mt-8 pt-6 border-t border-white/10'}>
        <Link href={pathsConfig.auth.signUp} className="text-sm font-semibold tracking-wider text-neutral-400 hover:text-white transition-colors">
          REQUEST ACCESS <span className="text-[#FF6B00] ml-1">→</span>
        </Link>
      </div>
    </div>
  );
}

export default withI18n(SignInPage);
