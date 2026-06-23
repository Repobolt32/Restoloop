import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';
import { createClient } from '~/lib/supabase/server';
import { getTenantForUser } from '~/lib/tenant';
import CouponsContent from './coupons-content';

export default async function CouponsPage() {
  const user = await requireUserInServerComponent();
  const supabase = await createClient();
  const tenant = await getTenantForUser(supabase, user.id);

  if (!tenant) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-500">
        No tenant associated with your account.
      </div>
    );
  }

  try {
    console.log('Fetching coupons for tenant:', tenant.id);
    const { data, error } = await supabase
      .from('coupons')
      .select(`
        id,
        code,
        type,
        discount,
        status,
        created_at,
        customers (
          name
        )
      `)
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching coupons:', error);
      throw error;
    }

    console.log('Fetched coupons data:', data?.length);

    const couponRows = data.map(coupon => ({
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      discount: coupon.discount,
      status: coupon.status,
      sentDate: new Date(coupon.created_at).toISOString().split('T')[0],
      customerName: coupon.customers?.name || 'Unknown',
    }));

    return (
      <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto w-full">
        <header className="mb-10 flex items-end justify-between border-b border-neutral-200 pb-6">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold tracking-widest text-neutral-500 uppercase mb-2">
              Marketing
            </p>
            <h1 className="text-3xl font-bold text-neutral-900">
              Coupons History
            </h1>
          </div>
        </header>

        <CouponsContent
          data={couponRows}
          isLoading={false}
          isError={false}
          error={null}
        />
      </div>
    );
  } catch (e) {
    return (
      <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto w-full">
        <header className="mb-10 flex items-end justify-between border-b border-neutral-200 pb-6">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold tracking-widest text-neutral-500 uppercase mb-2">
              Marketing
            </p>
            <h1 className="text-3xl font-bold text-neutral-900">
              Coupons History
            </h1>
          </div>
        </header>
        <CouponsContent
          data={undefined}
          isLoading={false}
          isError={true}
          error={e instanceof Error ? e : new Error('Failed to fetch coupons')}
        />
      </div>
    );
  }
}
