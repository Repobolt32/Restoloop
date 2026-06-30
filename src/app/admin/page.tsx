import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  if (user.email !== 'admin@restoloop.com') {
    redirect('/dashboard')
  }

  const serviceSupabase = createServiceClient()
  const { data: restaurants } = await serviceSupabase
    .from('restaurants')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-8 font-body text-[var(--color-foreground)]">
      <div className="max-w-6xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center border-b border-[var(--color-border)] pb-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--color-primary)]">
              Admin Panel
            </h1>
            <p className="text-sm text-[var(--color-foreground)] opacity-60 mt-1">
              Restoloop SaaS Administration Overview
            </p>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 border border-[var(--color-primary)] text-[var(--color-primary)] rounded-lg text-sm font-semibold hover:bg-[var(--color-border)] transition-colors duration-200 cursor-pointer"
          >
            Go to Dashboard
          </Link>
        </div>

        {/* Restaurant List Section */}
        <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[var(--color-border)] bg-[var(--color-muted)]">
            <h2 className="font-display text-lg font-bold text-[var(--color-foreground)]">
              All Registered Restaurants
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)] font-display text-sm font-bold text-[var(--color-foreground)]">
                  <th className="p-4">Name</th>
                  <th className="p-4">Slug</th>
                  <th className="p-4">WhatsApp Number</th>
                  <th className="p-4">Credits</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4">Registered On</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!restaurants || restaurants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-sm opacity-55">
                      No restaurants registered yet.
                    </td>
                  </tr>
                ) : (
                  restaurants.map((restaurant) => (
                    <tr
                      key={restaurant.id}
                      data-testid={`restaurant-row-${restaurant.slug}`}
                      className="border-b border-[var(--color-border)] hover:bg-[var(--color-background)] transition-colors duration-150 text-sm"
                    >
                      <td className="p-4 font-semibold">{restaurant.name}</td>
                      <td className="p-4 text-xs font-mono">{restaurant.slug}</td>
                      <td className="p-4 font-mono">{restaurant.whatsapp_number}</td>
                      <td className="p-4 font-bold text-[var(--color-accent)]">
                        {restaurant.credits}
                      </td>
                      <td className="p-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--color-border)] text-[var(--color-foreground)] uppercase">
                          {restaurant.plan}
                        </span>
                      </td>
                      <td className="p-4 text-xs opacity-75">
                        {new Date(restaurant.created_at).toLocaleDateString('en-IN', {
                          dateStyle: 'medium',
                        })}
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          href={`/admin/${restaurant.id}`}
                          data-testid={`manage-btn-${restaurant.slug}`}
                          className="inline-block px-3 py-1.5 bg-[var(--color-accent)] text-white rounded-lg text-xs font-bold hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 cursor-pointer"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
