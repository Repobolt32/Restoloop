'use server';

import { createClient } from '~/lib/supabase/server';
import { getTenantForUser } from '~/lib/tenant';
import type { DashboardStats } from './dashboard-content';

export interface RetryResult {
  success: boolean;
  data?: DashboardStats;
  error?: string;
}

export async function retryFetchDashboardStats(): Promise<RetryResult> {
  try {
    const supabase = await createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const tenant = await getTenantForUser(supabase, user.id);

    if (!tenant) {
      return { success: false, error: 'Tenant not found' };
    }

    const tenantId = tenant.id;
    const now = new Date();

    // Parallel queries
    const [customersResult, allCouponsResult, recentSignupsResult] = await Promise.all([
      supabase
        .from('customers' as any)
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId),
      supabase
        .from('coupons' as any)
        .select('id, type, status, redeemed_at')
        .eq('tenant_id', tenantId),
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

    const stats: DashboardStats = {
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

    return { success: true, data: stats };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'An unknown error occurred';
    return { success: false, error: message };
  }
}
