import { cookies } from 'next/headers';
import { withI18n } from '~/lib/i18n/with-i18n';
import { createSupabaseServerClient } from '~/lib/supabase/server';
import { StitchPortal } from '~/components/stitch/StitchPortal';
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
      <div className="absolute top-0 left-0 right-0 p-4 md:p-8 pb-0 max-w-5xl mx-auto w-full z-[1000]">
        <div className="border border-red-500 bg-red-50/80 p-4 rounded-md flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-semibold m-0">Low Credits Warning</h3>
            <p className="text-red-700 mt-1 text-sm">
              Your restaurant has <strong>{tenant.credits_balance} credits</strong> remaining. Top up soon to avoid interruption in your automated WhatsApp campaigns.
            </p>
            <div className="mt-3">
              <a href={`https://wa.me/${supportNumber}?text=Hi!%20I%20would%20like%20to%20purchase%20more%20Restoloop%20credits.`} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm font-semibold bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 transition-colors">
                Contact Support via WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

async function HomeLayout({ children }: React.PropsWithChildren) {
  return (
    <StitchPortal>
      <LowCreditsBanner />
      {children}
    </StitchPortal>
  );
}

export default withI18n(HomeLayout);
