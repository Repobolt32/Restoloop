import { createServiceClient } from '~/lib/supabase/server';
import { AdminTenantTable } from './_components/admin-tenant-table';
import { Users, Coins, ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
    const supabase = await createServiceClient();

    // Fetch all tenants with their owners' emails
    const { data: tenants } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

    const { data: platformData } = await supabase
        .from('platform_credits')
        .select('balance')
        .single();

    const totalTenantCredits = (tenants || []).reduce((acc: number, t: { credits_balance: number | null }) => acc + (t.credits_balance || 0), 0);
    const platformCredits = platformData?.balance || 0;

    return (
        <div className="animate-fade-in-up">
            <header className="mb-14 flex items-end justify-between border-b border-white/5 pb-10 font-sans">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        <p className="text-xs font-black tracking-[0.4em] text-neutral-500 uppercase">
                            Super Admin
                        </p>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-white mb-2">
                        Admin
                    </h1>
                    <p className="text-neutral-500 font-medium">Manage all connected tenants and monitor system credits.</p>
                </div>
            </header>

            <div className="flex flex-col gap-6 mb-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-8 bg-neutral-900/40 border border-white/5 rounded-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-black tracking-[0.2em] text-neutral-500 uppercase">Total Tenants</h3>
                            <Users className="text-orange-500 w-5 h-5 opacity-50" />
                        </div>
                        <div className="text-5xl font-black text-white">{tenants?.length || 0}</div>
                        <div className="text-xs text-orange-500 font-bold mt-2">Active Tenants</div>
                    </div>

                    <div className="p-8 bg-neutral-900/40 border border-white/5 rounded-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-black tracking-[0.2em] text-neutral-500 uppercase">Tenant Credits</h3>
                            <Coins className="text-blue-500 w-5 h-5 opacity-50" />
                        </div>
                        <div className="text-5xl font-black text-white">{totalTenantCredits}</div>
                        <div className="text-xs text-blue-500 font-bold mt-2">Total Credits</div>
                    </div>

                    <div className="p-8 bg-neutral-900/40 border border-white/5 rounded-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-black tracking-[0.2em] text-neutral-500 uppercase">Master Credits</h3>
                            <ShieldAlert className="text-emerald-500 w-5 h-5 opacity-50" />
                        </div>
                        <div className="text-5xl font-black text-white">{platformCredits}</div>
                        <div className="text-xs text-emerald-500 font-bold mt-2">Platform Balance</div>
                    </div>
                </div>

                <div className="mt-8 border border-white/5 bg-transparent overflow-hidden rounded-xl">
                    <div className="p-8 border-b border-white/5">
                        <h3 className="text-xl font-black tracking-tight text-white mb-1">Tenant Management</h3>
                        <p className="text-neutral-500 text-sm">Direct access to tenant modifications and balance adjustments.</p>
                    </div>
                    <div className="p-0">
                        <AdminTenantTable initialTenants={tenants || []} />
                    </div>
                </div>
            </div>
        </div>
    );
}
