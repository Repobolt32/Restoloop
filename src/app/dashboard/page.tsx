import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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
      <div className="border p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">Credits</h2>
        <p className="text-2xl">{restaurant.credits} / 1000</p>
      </div>
    </div>
  )
}
