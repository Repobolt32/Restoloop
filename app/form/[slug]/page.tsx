import { notFound } from 'next/navigation';
import { createServiceClient } from '~/lib/supabase/server';
import { PublicIntakeForm } from './_components/PublicIntakeForm';

interface FormPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export async function generateMetadata(props: FormPageProps) {
    const { slug } = await props.params;
    const supabase = await createServiceClient();
    const { data } = await supabase
        .from('tenants')
        .select('name')
        .eq('slug', slug)
        .single();
    const tenant = data as { name: string } | null;

    if (!tenant) {
        return { title: 'Not Found' };
    }

    return {
        title: `Welcome to ${tenant.name}`,
        description: 'Sign up to receive your exclusive welcome offer.',
    };
}

export default async function CustomerFormPage(props: FormPageProps) {
    const { slug } = await props.params;

    // Using the admin/service role client to bypass RLS since unauthenticated
    // public intake lookups are blocked by default tenant policies.
    const supabase = await createServiceClient();
    const { data, error } = await supabase
        .from('tenants')
        .select('id, name')
        .eq('slug', slug)
        .single();
    const tenant = data as { id: string; name: string } | null;

    if (error || !tenant) {
        console.error('Tenant lookup failed:', error);
        notFound();
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <PublicIntakeForm tenantId={tenant.id} restaurantName={tenant.name} />
            </div>
        </div>
    );
}
