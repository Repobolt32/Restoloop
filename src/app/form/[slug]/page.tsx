import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import IntakeForm from './IntakeForm'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function IntakeFormPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = createServiceClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name, whatsapp_number, is_suspended')
    .eq('slug', slug)
    .maybeSingle()

  if (!restaurant) {
    notFound()
  }

  if (restaurant.is_suspended) {
    return (
      <div className="min-h-screen bg-[--color-background] text-[--color-foreground] flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="font-display text-2xl font-black uppercase tracking-tight mb-2">Under Maintenance</h1>
          <p className="text-sm font-bold text-[--color-grey-500]">This restaurant is currently unavailable. Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[--color-background] text-[--color-foreground] flex items-center justify-center p-4">
      <IntakeForm slug={slug} restaurantName={restaurant.name} />
    </div>
  )
}
