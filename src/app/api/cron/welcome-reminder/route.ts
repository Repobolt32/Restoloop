import { runWelcomeReminders, runBirthdayCampaigns, runWinbackCampaigns, runExpiryReminders } from '@/lib/campaigns'
import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

function getBaseUrl(): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const restaurantId = searchParams.get('restaurant_id') || undefined

  // WORKER MODE: process a single restaurant
  if (restaurantId) {
    try {
      await runWelcomeReminders(restaurantId)
      await runBirthdayCampaigns(restaurantId)
      await runWinbackCampaigns(restaurantId)
      await runExpiryReminders(restaurantId)
      return NextResponse.json({ status: 'ok', restaurant_id: restaurantId })
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Internal error'
      console.error(`Campaign failed for restaurant ${restaurantId}:`, error)
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  }

  // DISPATCHER MODE: fan out to per-restaurant workers
  try {
    const supabase = createServiceClient()
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('id')
      .eq('is_suspended', false)

    if (error) {
      console.error('Failed to fetch restaurants for fan-out:', error)
      return NextResponse.json({ error: 'Failed to fetch restaurants' }, { status: 500 })
    }

    const ids = (restaurants ?? []).map((r: { id: string }) => r.id)

    if (ids.length === 0) {
      return NextResponse.json({ status: 'ok', dispatched: 0 })
    }

    const baseUrl = getBaseUrl()

    // ponytail: Promise.allSettled ensures fetch() calls leave the process before we return 200
    const dispatches = ids.map((id: string) =>
      fetch(`${baseUrl}/api/cron/welcome-reminder?restaurant_id=${id}`, {
        headers: { Authorization: `Bearer ${cronSecret}` },
      }).catch((err: Error) => {
        console.error(`Fan-out failed for restaurant ${id}:`, err.message)
      })
    )

    await Promise.allSettled(dispatches)

    return NextResponse.json({ status: 'ok', dispatched: ids.length })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal error'
    console.error('Cron fan-out failed:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
