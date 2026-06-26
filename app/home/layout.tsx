import { createClient } from '~/lib/supabase/server';
import { getTenantForUser } from '~/lib/tenant';
import { AlertTriangle } from 'lucide-react';

async function SubscriptionBanner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const tenant = await getTenantForUser(supabase, user.id);

  if (tenant && tenant.credits_balance < 50) {
    const supportNumber = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '919999999999';
    return (
      <div className="absolute top-0 left-0 right-0 p-4 md:p-8 pb-0 max-w-5xl mx-auto w-full z-[1000]">
        <div className="border border-orange-500 bg-orange-50/80 p-4 rounded-md flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-orange-800 font-semibold m-0">Monthly Subscription</h3>
            <p className="text-orange-700 mt-1 text-sm">
              Your free credits are running low. Subscribe to a monthly plan to keep your automated WhatsApp campaigns running without interruption.
            </p>
            <div className="mt-3">
              <a href={`https://wa.me/${supportNumber}?text=Hi!%20I%20would%20like%20to%20subscribe%20to%20a%20monthly%20Restoloop%20plan.`} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm font-semibold bg-orange-500 text-white px-3 py-1.5 rounded-md hover:bg-orange-600 transition-colors">
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
    <div>
      <SubscriptionBanner />
      {children}
    </div>
  );
}

export default HomeLayout;
