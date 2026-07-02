import { createClient, createServiceClient } from '@/lib/supabase/server'
import { addCreditsAction } from './actions'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AdminDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const sParams = await searchParams

  // 1. Check permissions
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  if (user.email !== 'admin@restoloop.com') {
    redirect('/dashboard')
  }

  // 2. Fetch restaurant data using Service Client (bypassing RLS)
  const serviceSupabase = createServiceClient()
  const { data: restaurant } = await serviceSupabase
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .single()

  if (!restaurant) {
    notFound()
  }

  const showSuccess = sParams.success === 'true'
  const addedCredits = sParams.added

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-8 font-body text-[var(--color-foreground)]">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb / Back Navigation */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-[var(--color-grey-500)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5 mr-2"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Restaurants
          </Link>
        </div>

        {/* Success Banner */}
        {showSuccess && (
          <div
            data-testid="success-alert"
            className="mb-6 p-4 rounded-xl border border-green-200 bg-green-50 text-green-800 text-sm flex items-center font-bold animate-fade-in"
            role="alert"
          >
            <svg
              className="w-5 h-5 mr-3 text-green-600 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Successfully added {addedCredits} credits to {restaurant.name}!
          </div>
        )}

        {/* Restaurant Details Title */}
        <div className="mb-8 border-b border-[var(--color-border)] pb-4">
          <h1
            data-testid="admin-restaurant-name"
            className="font-display text-3xl font-black tracking-tight text-[var(--color-foreground)] uppercase"
          >
            {restaurant.name}
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-accent)] mt-1">
            Admin Credit & Information Panel
          </p>
        </div>

        {/* Credit Management Block */}
        <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-md p-8 mb-6">
          <h2 className="font-display text-lg font-black mb-2 text-[var(--color-foreground)] uppercase">
            Credit Balance
          </h2>
          <div className="flex items-baseline space-x-2 mb-6">
            <span
              data-testid="admin-credits-display"
              className="text-4xl font-black font-mono text-[var(--color-accent)]"
            >
              {restaurant.credits}
            </span>
            <span className="text-sm font-bold text-[var(--color-grey-500)]">credits</span>
          </div>

          <h3 className="text-[10px] font-black mb-3 uppercase tracking-widest text-[var(--color-grey-500)]">
            Add Credits
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <form action={addCreditsAction}>
              <input type="hidden" name="restaurantId" value={restaurant.id} />
              <input type="hidden" name="amount" value="100" />
              <button
                type="submit"
                data-testid="add-100-btn"
                className="w-full py-3 bg-black hover:bg-gray-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors cursor-pointer"
              >
                +100 Credits
              </button>
            </form>

            <form action={addCreditsAction}>
              <input type="hidden" name="restaurantId" value={restaurant.id} />
              <input type="hidden" name="amount" value="500" />
              <button
                type="submit"
                data-testid="add-500-btn"
                className="w-full py-3 bg-black hover:bg-gray-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors cursor-pointer"
              >
                +500 Credits
              </button>
            </form>

            <form action={addCreditsAction}>
              <input type="hidden" name="restaurantId" value={restaurant.id} />
              <input type="hidden" name="amount" value="1000" />
              <button
                type="submit"
                data-testid="add-1000-btn"
                className="w-full py-3 bg-black hover:bg-gray-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors cursor-pointer"
              >
                +1000 Credits
              </button>
            </form>
          </div>
        </div>

        {/* General Metadata Details */}
        <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-md p-8">
          <h2 className="font-display text-lg font-black mb-4 text-[var(--color-foreground)] uppercase">
            General Details
          </h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-bold">
            <div className="border-b border-[var(--color-border)] pb-2">
              <dt className="text-[10px] font-black uppercase tracking-wider text-[var(--color-grey-500)]">Owner ID</dt>
              <dd className="font-mono mt-0.5 select-all text-xs text-[var(--color-foreground)]">{restaurant.owner_id}</dd>
            </div>
            <div className="border-b border-[var(--color-border)] pb-2">
              <dt className="text-[10px] font-black uppercase tracking-wider text-[var(--color-grey-500)]">Restaurant ID</dt>
              <dd className="font-mono mt-0.5 select-all text-xs text-[var(--color-foreground)]">{restaurant.id}</dd>
            </div>
            <div className="border-b border-[var(--color-border)] pb-2">
              <dt className="text-[10px] font-black uppercase tracking-wider text-[var(--color-grey-500)]">Slug</dt>
              <dd className="font-mono mt-0.5 text-[var(--color-foreground)]">{restaurant.slug}</dd>
            </div>
            <div className="border-b border-[var(--color-border)] pb-2">
              <dt className="text-[10px] font-black uppercase tracking-wider text-[var(--color-grey-500)]">WhatsApp Contact</dt>
              <dd className="font-mono mt-0.5 text-[var(--color-foreground)]">{restaurant.whatsapp_number}</dd>
            </div>
            <div className="border-b border-[var(--color-border)] pb-2 col-span-2">
              <dt className="text-[10px] font-black uppercase tracking-wider text-[var(--color-grey-500)]">Pricing Plan</dt>
              <dd className="font-black text-[var(--color-primary)] uppercase tracking-wider text-xs mt-0.5">
                {restaurant.plan}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
