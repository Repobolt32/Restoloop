import React from 'react';
import { createClient } from '~/lib/supabase/server';
import { getTenantForUser } from '~/lib/tenant';
import DashboardContent, { DashboardStats } from './dashboard-content';

export default async function DashboardPage() {
    const supabase = await createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();

    let stats: DashboardStats | undefined;
    let fetchError: Error | null = null;

    if (user) {
        try {
            const tenant = await getTenantForUser(supabase, user.id);

            if (!tenant) {
                throw new Error('Tenant not found');
            }

            const tenantId = tenant.id;
            const now = new Date();

            // Parallel queries instead of sequential
            const [customersResult, allCouponsResult, recentSignupsResult] = await Promise.all([
                supabase
                    .from('customers' as any)
                    .select('*', { count: 'exact', head: true })
                    .eq('tenant_id', tenantId),
                supabase
                    .from('coupons' as any)
                    .select('id, type, status, redeemed_at')
                    .eq('tenant_id', tenantId)
                    .limit(50),
                supabase
                    .from('customers' as any)
                    .select('id, name, created_at')
                    .eq('tenant_id', tenantId)
                    .order('created_at', { ascending: false })
                    .limit(10)
            ]);

            const { count: customersCount } = customersResult;
            const { data: allCoupons } = allCouponsResult;
            const { data: recentSignups } = recentSignupsResult;

            // Filter coupons for active stats
            const couponStats = {
                welcome: { sent: 0, redeemed: 0 },
                birthday: { sent: 0, redeemed: 0 },
                winback: { sent: 0, redeemed: 0 }
            };

            let redeemedCount = 0;

            if (allCoupons) {
                allCoupons.forEach((c: any) => {
                    const type = c.type as 'welcome' | 'birthday' | 'winback';
                    if (couponStats[type]) {
                        couponStats[type].sent += 1;
                        if (c.status === 'redeemed') {
                            couponStats[type].redeemed += 1;
                            redeemedCount++;
                        }
                    }
                });
            }

            // Revenue Bar Chart Data (last 6 months, 0-filled)
            const revenueData: { month: string; revenue: number }[] = [];
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                revenueData.push({
                    month: monthNames[d.getMonth()] || '',
                    revenue: 0,
                });
            }

            // Recent Activity Feed
            const activityFeed: any[] = [];

            if (recentSignups) {
                recentSignups.forEach((s: any) => {
                    activityFeed.push({
                        id: `signup-${s.id}`,
                        name: s.name,
                        action: 'joined via form',
                        timestamp: new Date(s.created_at).getTime(),
                    });
                });
            }

            // Sort combined array and limit to 10
            activityFeed.sort((a, b) => b.timestamp - a.timestamp);
            const top10Activity = activityFeed.slice(0, 10).map(a => {
                const diffMs = now.getTime() - a.timestamp;
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMins / 60);
                const diffDays = Math.floor(diffHours / 24);

                let timeAgo = '';
                if (diffMins < 1) timeAgo = 'Just now';
                else if (diffMins < 60) timeAgo = `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
                else if (diffHours < 24) timeAgo = `${diffHours} hr${diffHours !== 1 ? 's' : ''} ago`;
                else timeAgo = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

                return {
                    id: a.id,
                    name: a.name,
                    action: a.action,
                    timeAgo
                };
            });

            stats = {
                revenue: 0,
                customers: customersCount || 0,
                redeemed: redeemedCount,
                couponsSent: allCoupons?.length || 0,
                credits_balance: tenant.credits_balance,
                revenueData,
                couponStats,
                recentActivity: top10Activity,
                tenantSlug: tenant.slug
            };
        } catch (e) {
            fetchError = e instanceof Error ? e : new Error('An unknown error occurred');
        }
    }

    return (
        <div className="min-h-screen">
            <header className="mb-10 flex items-end justify-between border-b border-white/5 pb-6">
                <div className="flex flex-col gap-1">
                    <p className="text-xs font-bold tracking-widest text-neutral-500 uppercase mb-2">
                        Overview
                    </p>
                    <h1 className="text-3xl font-bold text-white">
                        Dashboard
                    </h1>
                </div>
            </header>

            <DashboardContent
                data={stats}
                isLoading={false}
                isError={!!fetchError}
                error={fetchError}
                onRetry={async () => {
                    'use server';
                }}
            />
        </div>
    );
}
