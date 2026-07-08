import { createWhatsAppAdapter } from '@/lib/whatsapp/adapter'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const provider = process.env.WHATSAPP_PROVIDER || 'openwa'
  const baseUrl = process.env.OPENWA_BASE_URL || 'http://localhost:2785/api'
  const sessionId = process.env.OPENWA_SESSION_ID || 'default'

  try {
    const adapter = createWhatsAppAdapter()
    const status = await adapter.getStatus()

    return NextResponse.json({
      provider,
      baseUrl,
      sessionId,
      status,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        provider,
        baseUrl,
        sessionId,
        status: 'error',
        error: error.message || String(error),
      },
      { status: 500 }
    )
  }
}
