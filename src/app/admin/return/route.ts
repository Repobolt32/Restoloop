import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(_request: Request) {
  const cookieStore = await cookies()
  const returnEmail = cookieStore.get('rl_admin_return')?.value

  if (!returnEmail) {
    return NextResponse.json({ error: 'Unauthorized return request' }, { status: 403 })
  }

  const serviceSupabase = createServiceClient()

  // Verify returnEmail is a superadmin
  const { data: { users }, error: listError } = await serviceSupabase.auth.admin.listUsers()
  if (listError || !users) {
    return NextResponse.json({ error: 'Failed to retrieve user list' }, { status: 500 })
  }

  const adminUser = users.find(u => u.email === returnEmail)
  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized return request' }, { status: 403 })
  }

  const { data: roleData, error: roleError } = await serviceSupabase
    .from('user_roles')
    .select('role')
    .eq('user_id', adminUser.id)
    .single()

  if (roleError || roleData?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized return request' }, { status: 403 })
  }

  const { data: linkData, error: linkError } = await serviceSupabase.auth.admin.generateLink({
    type: 'magiclink',
    email: returnEmail,
  })

  if (linkError || !linkData) {
    return NextResponse.json({ error: linkError?.message || 'Failed to generate admin return link' }, { status: 500 })
  }

  const supabase = await createClient()
  await supabase.auth.signOut()
  const { error: verifyError } = await supabase.auth.verifyOtp({
    email: returnEmail,
    token: linkData.properties.email_otp,
    type: 'magiclink',
  })

  if (verifyError) {
    return NextResponse.json({ error: verifyError.message || 'Failed to authenticate admin session' }, { status: 500 })
  }

  cookieStore.delete('rl_admin_return')
  return NextResponse.redirect(new URL('/admin', _request.url))
}
