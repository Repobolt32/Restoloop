import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '~/lib/supabase/server';
import { PublicIntakeForm } from './_components/PublicIntakeForm';

interface FormPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export async function generateMetadata(props: FormPageProps) {
    const { slug } = await props.params;
    const supabase = createSupabaseServerClient();
    const { data: tenant } = await supabase
        .from('tenants')
        .select('name')
        .eq('slug', slug)
        .single();

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

    // We are on a public route, so we use the admin client or standard client to fetch the tenant publicly.
    // Assuming RLS allows read access to basic tenant info if slug matches, or we bypass. 
    // Let's use the standard server client. If RLS blocks it, we may need a service role client just for this lookup.
    const supabase = createSupabaseServerClient();
    const { data: tenant, error } = await supabase
        .from('tenants')
        .select('id, name')
        .eq('slug', slug)
        .single();

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
