import { createServiceClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const supabaseService = createServiceClient()
  const { data: serviceRest, error: serviceError } = await supabaseService
    .from('restaurants')
    .select('id, name, slug')
    .eq('slug', 'u-i8ujum')
    .maybeSingle()

  const supabaseClient = await createClient()
  const { data: clientRest, error: clientError } = await supabaseClient
    .from('restaurants')
    .select('id, name, slug')
    .eq('slug', 'u-i8ujum')
    .maybeSingle()

  return NextResponse.json({
    env: {
      supabaseUrl: url ? 'PRESENT' : 'MISSING',
      anonKeyLength: anonKey ? anonKey.length : 0,
      serviceRoleKeyLength: serviceRoleKey ? serviceRoleKey.length : 0,
      serviceRoleKeyStart: serviceRoleKey ? serviceRoleKey.slice(0, 10) + '...' : 'NONE',
    },
    serviceClientQuery: {
      data: serviceRest,
      error: serviceError ? { message: serviceError.message, code: serviceError.code } : null,
    },
    anonClientQuery: {
      data: clientRest,
      error: clientError ? { message: clientError.message, code: clientError.code } : null,
    }
  })
}
