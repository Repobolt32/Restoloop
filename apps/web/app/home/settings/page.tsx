import { use } from 'react';

import { PersonalAccountSettingsContainer } from '@kit/accounts/personal-account-settings';
import { PageBody } from '@kit/ui/page';

import authConfig from '~/config/auth.config';
import pathsConfig from '~/config/paths.config';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

const callbackPath = pathsConfig.auth.callback;

const features = {
  enableAccountDeletion: true,
  enablePasswordUpdate: authConfig.providers.password,
};

const paths = {
  callback: callbackPath + `?next=${pathsConfig.app.profileSettings}`,
};

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('account:settingsTab');

  return {
    title,
  };
};

import { StitchPortal } from '~/components/stitch/StitchPortal';

function PersonalAccountSettingsPage() {
  const user = use(requireUserInServerComponent());
  const userId = user.id;

  return (
    <StitchPortal>
      {/* Page Header */}
      <header className="mb-14 flex items-end justify-between border-b border-white/5 pb-10 font-sans">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
            <p className="text-xs font-black tracking-[0.4em] text-neutral-500 uppercase">
              User Core Protocol
            </p>
          </div>
          <h1 className="text-7xl font-black tracking-tighter text-[#FF6B00] leading-none drop-shadow-[0_0_30px_rgba(255,107,0,0.2)]">
            Settings <span className="text-white">.</span>
          </h1>
        </div>

        <div className="text-right hidden md:block">
          <h3 className="text-sm font-black tracking-[0.4em] text-white uppercase mb-2">ACCESS NODE</h3>
          <p className="text-base font-medium text-neutral-400 font-sans">Auth Layer — Secure</p>
        </div>
      </header>

      <div className={'flex w-full flex-1 flex-col lg:max-w-2xl animate-fade-in-up'}>
        <PersonalAccountSettingsContainer
          userId={userId}
          paths={paths}
          features={features}
        />
      </div>
    </StitchPortal>
  );
}

export default withI18n(PersonalAccountSettingsPage);
