import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { maskPhone } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!restaurant) redirect('/dashboard/create')

  const { data: recentLogs } = await supabase
    .from('message_logs')
    .select('id, type, status, created_at, customer_id')
    .eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const customerIds = [...new Set(recentLogs?.map(l => l.customer_id).filter(Boolean) ?? [])]
  const phoneMap: Record<string, string> = {}
  if (customerIds.length > 0) {
    const { data: custs } = await supabase
      .from('customers')
      .select('id, phone')
      .in('id', customerIds)
    custs?.forEach(c => { phoneMap[c.id] = c.phone })
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">{restaurant.name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/dashboard/customers/add" className="border p-4 rounded hover:bg-gray-50">
          <h2 className="text-xl font-semibold">Add Customer</h2>
        </Link>
        <Link href="/dashboard/customers" className="border p-4 rounded hover:bg-gray-50">
          <h2 className="text-xl font-semibold">Active Guests</h2>
        </Link>
        <Link href="/dashboard/coupons" className="border p-4 rounded hover:bg-gray-50">
          <h2 className="text-xl font-semibold">Coupons</h2>
        </Link>
      </div>
      <div className="border p-4 rounded mb-8">
        <h2 className="text-xl font-semibold mb-2">Credits</h2>
        <p className="text-2xl">{restaurant.credits} / 1000</p>
      </div>

      <div className="border p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        {(!recentLogs || recentLogs.length === 0) ? (
          <p className="text-gray-400 text-sm">No activity yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recentLogs.map((log) => {
              const phone = log.customer_id ? phoneMap[log.customer_id] || '—' : '—'
              return (
                <li key={log.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm">{maskPhone(phone)}</span>
                    <span className="text-sm text-gray-500 capitalize">{log.type}</span>
                    <span className={`text-sm font-medium ${
                      log.status === 'sent' || log.status === 'delivered' ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(log.created_at).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
