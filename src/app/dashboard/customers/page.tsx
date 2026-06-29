import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { maskPhone } from '@/lib/utils'
import Link from 'next/link'

export default async function CustomersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!restaurant) redirect('/dashboard/create')

  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, phone, opt_in_status, last_visit_at, created_at')
    .eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          ← Dashboard
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left text-sm text-gray-600">
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Phone</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Last Visit</th>
              <th className="p-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {(!customers || customers.length === 0) ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400">
                  No customers yet. Share your intake form to get started.
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3">{c.name || '—'}</td>
                  <td className="p-3 font-mono text-sm">{maskPhone(c.phone)}</td>
                  <td className="p-3">
                    <span className={
                      c.opt_in_status === 'confirmed' ? 'text-green-600' :
                      c.opt_in_status === 'opted_out' ? 'text-red-500' :
                      'text-yellow-600'
                    }>
                      {c.opt_in_status}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-500">
                    {c.last_visit_at ? new Date(c.last_visit_at).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="p-3 text-sm text-gray-500">
                    {new Date(c.created_at).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
