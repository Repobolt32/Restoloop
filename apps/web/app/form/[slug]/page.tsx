import { notFound } from 'next/navigation';

import { createSupabaseServiceClient } from '~/lib/supabase/server';
import { CustomerForm } from './_components/CustomerForm';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
    const { slug } = await params;
    const supabase = createSupabaseServiceClient();

    const { data: tenant } = await supabase
        .from('tenants')
        .select('name')
        .eq('slug', slug)
        .single();

    if (!tenant) {
        return { title: 'Restaurant Not Found — Restoloop' };
    }

    return {
        title: `Join ${tenant.name} — Get your welcome coupon!`,
        description: `Sign up for exclusive offers and discounts at ${tenant.name}.`,
    };
}

export default async function FormPage({ params }: Props) {
    const { slug } = await params;
    const supabase = createSupabaseServiceClient();

    const { data: tenant } = await supabase
        .from('tenants')
        .select('id, name, coupon_welcome')
        .eq('slug', slug)
        .single();

    if (!tenant) {
        notFound();
    }

    return (
        <main className="flex min-h-screen items-start justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 p-4 pt-12">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 text-3xl shadow-lg">
                        🍽️
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
                    <p className="mt-2 text-gray-500">
                        Sign up and get{' '}
                        <span className="font-semibold text-orange-500">
                            ₹{tenant.coupon_welcome} off
                        </span>{' '}
                        your next visit!
                    </p>
                </div>

                {/* Form Card */}
                <div className="rounded-2xl bg-white p-6 shadow-xl ring-1 ring-gray-100">
                    <CustomerForm
                        slug={slug}
                        restaurantName={tenant.name}
                        welcomeDiscount={tenant.coupon_welcome}
                    />
                </div>

                <p className="mt-6 text-center text-xs text-gray-400">
                    By signing up you agree to receive WhatsApp messages from {tenant.name}.
                    <br />
                    Powered by{' '}
                    <span className="font-medium text-orange-400">Restoloop</span>
                </p>
            </div>
        </main>
    );
}
