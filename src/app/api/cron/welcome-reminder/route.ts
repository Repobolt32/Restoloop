import { runWelcomeReminders, runBirthdayCampaigns, runWinbackCampaigns, runExpiryReminders } from '@/lib/campaigns'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    await runWelcomeReminders()
    await runBirthdayCampaigns()
    await runWinbackCampaigns()
    await runExpiryReminders()
    return NextResponse.json({ status: 'ok' })
  } catch (error: any) {
    console.error('Cron engine execution failed:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
