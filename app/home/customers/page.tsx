import React from 'react';
import { createClient } from '~/lib/supabase/server';
import { getTenantForUser } from '~/lib/tenant';
import { redirect } from 'next/navigation';
import { TicketPercent } from 'lucide-react';

interface ActiveGuest {
  id: string;
  code: string;
  discount: number;
  type: 'welcome' | 'bday' | 'winback';
  expires_at: string;
  customer_name: string;
  customer_phone: string;
}

function formatExpiresIn(isoDate: string): string {
  const now = new Date();
  const target = new Date(isoDate);
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return 'Expired';

  const diffHrs = Math.ceil(diffMs / (1000 * 60 * 60));
  if (diffHrs < 24) return `${diffHrs} hr${diffHrs !== 1 ? 's' : ''}`;

  const diffDays = Math.ceil(diffHrs / 24);
  return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
}

function typeBadge(type: string) {
  const styles: Record<string, string> = {
    welcome: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    bday: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    winback: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  };
  const labels: Record<string, string> = {
    welcome: 'Welcome',
    bday: 'Birthday',
    winback: 'Winback',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${styles[type] || styles.welcome}`}>
      {labels[type] || type}
    </span>
  );
}

export default async function ActiveGuestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  const tenant = await getTenantForUser(supabase, user.id);
  if (!tenant) {
    redirect('/home');
  }

  const now = new Date().toISOString();

  const { data: rows, error } = await supabase
    .from('coupons' as any)
    .select(`
      id,
      code,
      discount,
      type,
      expires_at,
      customers ( name, phone )
    `)
    .eq('tenant_id', tenant.id)
    .eq('status', 'sent')
    .gt('expires_at', now)
    .order('expires_at', { ascending: true })
    .limit(10) as any;

  const guests: ActiveGuest[] = (rows || []).map((r: any) => {
    const cust = Array.isArray(r.customers) ? r.customers[0] : r.customers;
    return {
      id: r.id,
      code: r.code,
      discount: r.discount,
      type: r.type,
      expires_at: r.expires_at,
      customer_name: cust?.name || 'Unknown',
      customer_phone: cust?.phone || '—',
    };
  });

  return (
    <div>
      <header className="mb-10 flex items-end justify-between border-b border-white/5 pb-6">
        <div>
          <p className="text-xs font-bold tracking-widest text-neutral-500 uppercase mb-2">
            Coupons
          </p>
          <h1 className="text-3xl font-bold text-white">Active Guests</h1>
        </div>
        <div className="text-sm text-neutral-500">
          {guests.length} active
        </div>
      </header>

      {guests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-neutral-800 border border-white/5 flex items-center justify-center mb-6">
            <TicketPercent className="w-7 h-7 text-neutral-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No active coupons right now</h3>
          <p className="text-sm text-neutral-500 max-w-sm">
            Campaigns run daily — check back tomorrow.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-neutral-500 text-xs font-medium">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-4">Expires In</th>
                <th className="py-3 px-4">Type</th>
              </tr>
            </thead>
            <tbody className="text-sm text-white">
              {guests.map((g) => (
                <tr key={g.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 font-medium">{g.customer_name}</td>
                  <td className="py-3 px-4 text-neutral-400">{g.customer_phone}</td>
                  <td className="py-3 px-4 font-mono font-bold text-white">{g.code}</td>
                  <td className="py-3 px-4">₹{g.discount} OFF</td>
                  <td className="py-3 px-4 text-emerald-400">{formatExpiresIn(g.expires_at)}</td>
                  <td className="py-3 px-4">{typeBadge(g.type)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
