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
            <h1 className="font-display text-3xl font-black tracking-tight text-[var(--color-foreground)] uppercase">
              Admin Panel
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-accent)] mt-1">
              Restoloop SaaS Administration Overview
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/coupons"
              className="px-4 py-2 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Coupon Finder
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 border border-[var(--color-accent)] text-[var(--color-accent)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-border)] transition-colors duration-200 cursor-pointer"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>

        {/* Restaurant List Section */}
        <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-md overflow-hidden">
          <div className="p-6 border-b border-[var(--color-border)] bg-[var(--color-grey-50)]">
            <h2 className="font-display text-sm font-black uppercase tracking-[0.1em] text-[var(--color-foreground)]">
              All Registered Restaurants
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]">
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-grey-600)]">Name</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-grey-600)]">Slug</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-grey-600)]">WhatsApp Number</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-grey-600)]">Credits</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-grey-600)]">Plan</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-grey-600)]">Status</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-grey-600)]">Registered On</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-grey-600)] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!restaurants || restaurants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-sm font-bold text-[var(--color-grey-500)]">
                      No restaurants registered yet.
                    </td>
                  </tr>
                ) : (
                  restaurants.map((restaurant) => (
                    <tr
                      key={restaurant.id}
                      data-testid={`restaurant-row-${restaurant.slug}`}
                      className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-grey-50)] transition-colors duration-150 text-sm font-bold text-[var(--color-foreground)]"
                    >
                      <td className="p-4">{restaurant.name}</td>
                      <td className="p-4 text-xs font-mono text-[var(--color-grey-800)]">{restaurant.slug}</td>
                      <td className="p-4 font-mono text-[var(--color-grey-800)]">{restaurant.whatsapp_number}</td>
                      <td className="p-4 font-black text-[var(--color-accent)]">
                        {restaurant.credits}
                      </td>
                      <td className="p-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100 bg-amber-50 text-amber-700">
                          {restaurant.plan}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          data-testid={`restaurant-status-${restaurant.slug}`}
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            restaurant.is_suspended
                              ? 'border-red-200 bg-red-50 text-red-700'
                              : 'border-green-200 bg-green-50 text-green-700'
                          }`}
                        >
                          {restaurant.is_suspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-[var(--color-grey-500)]">
                        {new Date(restaurant.created_at).toLocaleDateString('en-IN', {
                          dateStyle: 'medium',
                        })}
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          href={`/admin/${restaurant.id}`}
                          data-testid={`manage-btn-${restaurant.slug}`}
                          className="inline-block px-3 py-2 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-800 transition-colors cursor-pointer"
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
