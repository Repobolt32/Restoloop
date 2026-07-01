import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Try to read another user's restaurant (should return 0 rows due to RLS)
  const { data, error } = await supabase
    .from('restaurants')
    .select('id')
    .neq('owner_id', user.id)

  return NextResponse.json({
    userId: user.id,
    otherRestaurants: data?.length ?? 0,
    rlsWorking: (data?.length ?? 0) === 0,
    error: error?.message,
  })
}
