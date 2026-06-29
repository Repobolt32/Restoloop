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
    .select('name, whatsapp_number')
    .eq('slug', slug)
    .maybeSingle()

  if (!restaurant) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <IntakeForm slug={slug} restaurantName={restaurant.name} />
    </div>
  )
}
