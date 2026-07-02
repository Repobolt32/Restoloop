import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

function maskPhone(phone: string) {
  return phone.slice(0, -4) + '****'
}

export default async function CustomersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!restaurant) redirect('/dashboard/create')

  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, phone, opt_in_status, last_visit_at, created_at')
    .eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-[900px]">
      <h1
        data-testid="customers-heading"
        className="text-3xl font-black tracking-tight text-[--color-foreground] mb-1 font-display uppercase"
      >
        Active Guests
      </h1>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[--color-accent] mb-8">
        View all registered customers
      </p>

      {!customers || customers.length === 0 ? (
        <div className="bg-white border border-[--color-border] rounded-2xl p-12 text-center shadow-md">
          <p className="text-sm font-bold text-[--color-grey-500]">
            No guests yet. Share your QR code to get started.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[--color-border] rounded-2xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table
              data-testid="customers-table"
              className="w-full border-collapse text-left"
            >
              <thead>
                <tr className="border-b border-[--color-border] bg-[--color-grey-50]">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[--color-grey-600]">Name</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[--color-grey-600]">Phone</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[--color-grey-600]">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[--color-grey-600]">Last Visit</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[--color-grey-600]">Joined</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, i) => (
                  <tr
                    key={customer.id}
                    className={`border-b border-[--color-border] last:border-b-0 hover:bg-[--color-grey-50] transition-colors ${
                      i % 2 === 0 ? 'bg-white' : 'bg-[--color-grey-50]/30'
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-bold text-[--color-foreground]">
                      {customer.name || <span className="opacity-40 font-normal">—</span>}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm font-bold text-[--color-foreground]">
                      {maskPhone(customer.phone)}
                    </td>
                    <td className="px-6 py-4">
                      <OptInBadge status={customer.opt_in_status} />
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-[--color-grey-500]">
                      {customer.last_visit_at
                        ? new Date(customer.last_visit_at).toLocaleDateString('en-IN')
                        : <span className="opacity-40 font-normal">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-[--color-grey-500]">
                      {new Date(customer.created_at).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function OptInBadge({ status }: { status: string }) {
  const isOptedIn = status === 'opted_in'
  const isOptedOut = status === 'opted_out'
  const isPending = status === 'pending'

  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
        isOptedIn
          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
          : isOptedOut
          ? 'bg-red-50 text-red-700 border-red-100'
          : 'bg-amber-50 text-amber-700 border-amber-100'
      }`}
    >
      {status.replace('_', ' ')}
    </span>
  )
}
