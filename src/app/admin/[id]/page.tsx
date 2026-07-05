import { createClient, createServiceClient } from '@/lib/supabase/server'
import { addCreditsAction, addCreditsWithLogAction, updatePlanAction, toggleSuspensionAction, triggerCronAction, resetWhatsAppSessionAction } from './actions'
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
  const addedCredits = typeof sParams.added === 'string' ? sParams.added : Array.isArray(sParams.added) ? sParams.added[0] : undefined
  const action = typeof sParams.action === 'string' ? sParams.action : Array.isArray(sParams.action) ? sParams.action[0] : undefined

  let successMessage = `Successfully updated ${restaurant.name}!`
  if (addedCredits) {
    successMessage = `Successfully added ${addedCredits} credits to ${restaurant.name}!`
  } else if (action === 'update-plan') {
    successMessage = `Successfully updated plan settings for ${restaurant.name}!`
  } else if (action === 'toggle-suspension') {
    successMessage = `Successfully updated suspension status for ${restaurant.name}!`
  } else if (action === 'trigger-cron') {
    successMessage = `Successfully executed automated campaigns for ${restaurant.name}!`
  } else if (action === 'reset-whatsapp') {
    successMessage = `Successfully reset WhatsApp session for ${restaurant.name}!`
  }

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
            {successMessage}
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
            Add / Deduct Credits
          </h3>

          <div className="grid grid-cols-3 gap-4 mb-4">
            {[100, 500, 1000].map((amt) => (
              <form key={amt} action={addCreditsWithLogAction}>
                <input type="hidden" name="restaurantId" value={restaurant.id} />
                <input type="hidden" name="amount" value={String(amt)} />
                <input type="hidden" name="reason" value={`Quick add +${amt}`} />
                <button type="submit" data-testid={`add-${amt}-btn`}
                  className="w-full py-3 bg-black hover:bg-gray-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors cursor-pointer">
                  +{amt} Credits
                </button>
              </form>
            ))}
          </div>

          <form action={addCreditsWithLogAction} className="space-y-3">
            <input type="hidden" name="restaurantId" value={restaurant.id} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-grey-500)] mb-1">
                  Amount (negative to deduct)
                </label>
                <input type="number" name="amount" data-testid="custom-credit-amount" required
                  className="w-full px-4 py-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl font-bold text-sm outline-none focus:border-[var(--color-primary)]"
                  placeholder="e.g. 250 or -50" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-grey-500)] mb-1">
                  Reason (required)
                </label>
                <input type="text" name="reason" data-testid="custom-credit-reason" required
                  className="w-full px-4 py-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl font-bold text-sm outline-none focus:border-[var(--color-primary)]"
                  placeholder="e.g. Loyalty bonus, refund, correction" />
              </div>
            </div>
            <button type="submit" data-testid="custom-credit-btn"
              className="w-full py-3.5 bg-black hover:bg-gray-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors cursor-pointer">
              Apply Credit Change
            </button>
          </form>
        </div>

        {/* Plan & Trial Override Block */}
        <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-md p-8 mb-6">
          <h2 className="font-display text-lg font-black mb-4 text-[var(--color-foreground)] uppercase">
            Plan & Trial Override
          </h2>
          
          <form action={updatePlanAction} className="space-y-4">
            <input type="hidden" name="restaurantId" value={restaurant.id} />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-grey-500)] mb-1">
                  Pricing Plan
                </label>
                <select
                  name="plan"
                  data-testid="admin-plan-select"
                  defaultValue={restaurant.plan}
                  className="w-full px-4 py-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl font-bold text-sm outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="free">Free</option>
                  <option value="trial">Trial</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--color-grey-500)] mb-1">
                  Trial Expiration
                </label>
                <input
                  type="datetime-local"
                  name="trialExpiresAt"
                  data-testid="admin-trial-expires-input"
                  defaultValue={
                    restaurant.trial_expires_at
                      ? new Date(restaurant.trial_expires_at)
                          .toISOString()
                          .slice(0, 16)
                      : ''
                  }
                  className="w-full px-4 py-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl font-bold text-sm outline-none focus:border-[var(--color-primary)]"
                />
              </div>
            </div>

            <button
              type="submit"
              data-testid="admin-update-plan-btn"
              className="w-full py-3.5 bg-black hover:bg-gray-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors cursor-pointer"
            >
              Update Plan & Expiry
            </button>
          </form>
        </div>

        {/* Account Suspension */}
        <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-md p-8 mb-6">
          <h2 className="font-display text-lg font-black mb-4 text-[var(--color-foreground)] uppercase">
            Account Status
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <span
                data-testid="suspension-status"
                className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                  restaurant.is_suspended
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : 'border-green-200 bg-green-50 text-green-700'
                }`}
              >
                {restaurant.is_suspended ? 'Suspended' : 'Active'}
              </span>
            </div>
            <form action={toggleSuspensionAction}>
              <input type="hidden" name="restaurantId" value={restaurant.id} />
              <input type="hidden" name="suspend" value={restaurant.is_suspended ? 'false' : 'true'} />
              <button
                type="submit"
                data-testid="toggle-suspension-btn"
                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer ${
                  restaurant.is_suspended
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {restaurant.is_suspended ? 'Reactivate Account' : 'Suspend Account'}
              </button>
            </form>
          </div>
        </div>

        {/* Impersonation */}
        <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-md p-8 mb-6">
          <h2 className="font-display text-lg font-black mb-2 text-[var(--color-foreground)] uppercase">
            Support Tools
          </h2>
          <p className="text-xs font-bold text-[var(--color-grey-500)] mb-4">
            Login as this restaurant&apos;s owner to troubleshoot their dashboard. This will sign you out of the admin session.
          </p>
          <a
            href={`/admin/${restaurant.id}/impersonate`}
            data-testid="impersonate-btn"
            className="inline-block px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer"
          >
            Login as Owner
          </a>
          <form action={triggerCronAction} className="inline-block mr-3 ml-3">
            <input type="hidden" name="restaurantId" value={restaurant.id} />
            <button type="submit" data-testid="trigger-cron-btn"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer">
              Run Campaigns Now
            </button>
          </form>
          <form action={resetWhatsAppSessionAction} className="inline-block">
            <input type="hidden" name="restaurantId" value={restaurant.id} />
            <button type="submit" data-testid="reset-whatsapp-btn"
              className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer">
              Reset WhatsApp Session
            </button>
          </form>
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
