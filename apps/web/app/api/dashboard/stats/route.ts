import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '~/lib/supabase/server';

export async function GET() {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user is an owner of a tenant and get that tenant
    const { data: tenant, error: tenantError } = await supabase
        .from('tenants' as any)
        .select('id, name, slug, credits_balance')
        .eq('owner_id', user.id)
        .single() as any;

    if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const tenantId = tenant.id;
    const now = new Date();

    // Get total customers
    const { count: customersCount } = await supabase
        .from('customers' as any)
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

    // Fetch all coupons for the tenant to calculate multiple aggregate stats
    const { data: allCoupons } = await supabase
        .from('coupons' as any)
        .select('id, type, status, redeemed_at')
        .eq('tenant_id', tenantId);

    // Filter coupons for active stats
    const couponStats = {
        welcome: { sent: 0, redeemed: 0 },
        birthday: { sent: 0, redeemed: 0 },
        winback: { sent: 0, redeemed: 0 }
    };

    let redeemedCount = 0;

    if (allCoupons) {
        allCoupons.forEach(c => {
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

    // Fetch all bills for calculating revenue and charting
    const { data: allBills } = await supabase
        .from('bills' as any)
        .select('id, final_total, created_at, customer_id, customers (name)')
        .eq('tenant_id', tenantId) as any;

    // Element 2: Revenue Bar Chart Data (last 6 months, 0-filled)
    const revenueData = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        revenueData.push({
            month: monthNames[d.getMonth()],
            revenue: 0,
            year: d.getFullYear(),
            monthNum: d.getMonth()
        });
    }

    let totalRevenue = 0;

    if (allBills) {
        allBills.forEach((b: any) => {
            const amount = Number(b.final_total) || 0;
            totalRevenue += amount;

            const billDate = new Date(b.created_at);
            // Check if it fits in the last 6 months
            for (let m of revenueData) {
                if (m.year === billDate.getFullYear() && m.monthNum === billDate.getMonth()) {
                    m.revenue += amount;
                    break;
                }
            }
        });
    }

    const finalRevenueData = revenueData.map(r => ({ month: r.month, revenue: r.revenue }));

    // Element 4: Recent Activity Feed Combine and format
    const { data: recentSignups } = await supabase
        .from('customers' as any)
        .select('id, name, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(10);

    const activityFeed: any[] = [];

    if (recentSignups) {
        recentSignups.forEach(s => {
            activityFeed.push({
                id: `signup-${s.id}`,
                name: s.name,
                action: 'joined via form',
                timestamp: new Date(s.created_at).getTime(),
            });
        });
    }

    if (allBills) {
        // Sort bills roughly and take top 10
        const sortedBills = [...allBills].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10);

        sortedBills.forEach((b: any) => {
            const custName = Array.isArray(b.customers) ? b.customers[0]?.name : b.customers?.name;
            activityFeed.push({
                id: `bill-${b.id}`,
                name: custName || 'Walk-in Customer',
                action: `paid a bill of ₹${b.final_total}`,
                timestamp: new Date(b.created_at).getTime(),
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

    return NextResponse.json({
        revenue: totalRevenue,
        customers: customersCount || 0,
        redeemed: redeemedCount,
        couponsSent: allCoupons?.length || 0,
        revenueData: finalRevenueData,
        couponStats,
        recentActivity: top10Activity,
        tenantSlug: tenant.slug
    });
}
