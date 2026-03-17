import { use } from 'react';

import { cookies } from 'next/headers';

import {
  Page,
  PageLayoutStyle,
  PageMobileNavigation,
  PageNavigation,
} from '@kit/ui/page';
import { SidebarProvider } from '@kit/ui/shadcn-sidebar';

import { AppLogo } from '~/components/app-logo';
import { navigationConfig } from '~/config/navigation.config';
import { withI18n } from '~/lib/i18n/with-i18n';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

// home imports
import { HomeMenuNavigation } from './_components/home-menu-navigation';
import { HomeMobileNavigation } from './_components/home-mobile-navigation';
import { HomeSidebar } from './_components/home-sidebar';

// Low credits banner
import { createSupabaseServerClient } from '~/lib/supabase/server';
import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import { AlertTriangle } from 'lucide-react';

async function LowCreditsBanner() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: tenant } = await supabase
    .from('tenants' as any)
    .select('credits_balance')
    .eq('owner_id', user.id)
    .single() as any;

  if (tenant && tenant.credits_balance < 100) {
    const supportNumber = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '919999999999';
    return (
      <div className="p-4 md:p-8 pb-0 max-w-5xl mx-auto w-full">
        <Alert variant="destructive" className="border-red-500 bg-red-50/80">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800 font-semibold">Low Credits Warning</AlertTitle>
          <AlertDescription className="text-red-700 mt-1">
            Your restaurant has <strong>{tenant.credits_balance} credits</strong> remaining. Top up soon to avoid interruption in your automated WhatsApp campaigns.
            <div className="mt-3">
              <a href={`https://wa.me/${supportNumber}?text=Hi!%20I%20would%20like%20to%20purchase%20more%20Restoloop%20credits.`} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm font-semibold bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 transition-colors">
                Contact Support via WhatsApp
              </a>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  return null;
}

async function HomeLayout({ children }: React.PropsWithChildren) {
  const style = await getLayoutStyle();
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isSuperAdmin = user?.id === process.env.SUPER_ADMIN_USER_ID;

  if (style === 'sidebar') {
    return <SidebarLayout isSuperAdmin={isSuperAdmin}>{children}</SidebarLayout>;
  }

  return <HeaderLayout isSuperAdmin={isSuperAdmin}>{children}</HeaderLayout>;
}

export default withI18n(HomeLayout);

function SidebarLayout({ children, isSuperAdmin }: React.PropsWithChildren<{ isSuperAdmin: boolean }>) {
  const sidebarMinimized = navigationConfig.sidebarCollapsed;
  const [user] = use(Promise.all([requireUserInServerComponent()]));

  return (
    <SidebarProvider defaultOpen={sidebarMinimized}>
      <Page style={'sidebar'}>
        <PageNavigation>
          <HomeSidebar user={user} isSuperAdmin={isSuperAdmin} />
        </PageNavigation>

        <PageMobileNavigation className={'flex items-center justify-between'}>
          <MobileNavigation isSuperAdmin={isSuperAdmin} />
        </PageMobileNavigation>

        <LowCreditsBanner />
        {children}
      </Page>
    </SidebarProvider>
  );
}

function HeaderLayout({ children, isSuperAdmin }: React.PropsWithChildren<{ isSuperAdmin: boolean }>) {
  return (
    <Page style={'header'}>
      <PageNavigation>
        <HomeMenuNavigation isSuperAdmin={isSuperAdmin} />
      </PageNavigation>

      <PageMobileNavigation className={'flex items-center justify-between'}>
        <MobileNavigation isSuperAdmin={isSuperAdmin} />
      </PageMobileNavigation>

      <LowCreditsBanner />
      {children}
    </Page>
  );
}

function MobileNavigation({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  return (
    <div className="flex items-center justify-between w-full px-4">
      <AppLogo />

      <HomeMobileNavigation isSuperAdmin={isSuperAdmin} />
    </div>
  );
}

async function getLayoutStyle() {
  const cookieStore = await cookies();

  return (
    (cookieStore.get('layout-style')?.value as PageLayoutStyle) ??
    navigationConfig.style
  );
}
