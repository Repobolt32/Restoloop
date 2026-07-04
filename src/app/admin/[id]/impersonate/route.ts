import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'admin@restoloop.com') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const serviceSupabase = createServiceClient()
  const { data: restaurant } = await serviceSupabase
    .from('restaurants')
    .select('owner_id')
    .eq('id', id)
    .single()

  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
  }

  const { data: ownerUser } = await serviceSupabase.auth.admin.getUserById(restaurant.owner_id)

  if (!ownerUser?.user?.email) {
    return NextResponse.json({ error: 'Owner email not found' }, { status: 404 })
  }

  const { data: linkData, error: linkError } = await serviceSupabase.auth.admin.generateLink({
    type: 'magiclink',
    email: ownerUser.user.email,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard` },
  })

  if (linkError || !linkData) {
    return NextResponse.json({ error: linkError?.message || 'Failed to generate link' }, { status: 500 })
  }

  const confirmUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify?token=${linkData.properties.hashed_token}&type=magiclink&redirect_to=${encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard`)}`

  return NextResponse.redirect(confirmUrl)
}
