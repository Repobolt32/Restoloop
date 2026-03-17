import { PageBody, PageHeader } from '@kit/ui/page';
import { createSupabaseServiceClient } from '~/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { AdminTenantTable } from './_components/admin-tenant-table';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
    const supabase = createSupabaseServiceClient();

    // Fetch all tenants with their owners' emails
    const { data: tenants, error } = await supabase
        .from('tenants' as any)
        .select('*')
        .order('created_at', { ascending: false }) as any;

    const { data: platformData } = await supabase
        .from('platform_credits' as any)
        .select('balance')
        .single() as any;

    const totalTenantCredits = (tenants || []).reduce((acc: number, t: any) => acc + (t.credits_balance || 0), 0);
    const platformCredits = platformData?.balance || 0;

    return (
        <>
            <PageHeader
                title="Super Admin Dashboard"
                description="Manage all connected tenants and monitor system credits."
            />

            <PageBody>
                <div className="flex flex-col gap-6 max-w-6xl mx-auto">

                    <div>
                        <Link href="/home" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Dashboard
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Total Tenants</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{tenants?.length || 0}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Total Tenant Credits Circulating</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-blue-600">{totalTenantCredits}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Master Platform Credits</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-purple-600">{platformCredits}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Tenant Management</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AdminTenantTable initialTenants={tenants || []} />
                        </CardContent>
                    </Card>

                </div>
            </PageBody>
        </>
    );
}
