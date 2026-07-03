import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ sessionId: string; action: string[] }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { sessionId, action } = await context.params
  const actionPath = action.join('/')

  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { statusCode: 400, message: 'Invalid JSON body', error: 'Bad Request' },
      { status: 400 }
    )
  }

  const apiKey = request.headers.get('x-api-key')
  const messageId = `true_${(body.chatId as string) || 'unknown'}_${Math.random().toString(36).substring(2, 9)}`
  const timestamp = Math.floor(Date.now() / 1000)

  console.log(`\n[OpenWA Mock] ──────────────────────────────`)
  console.log(`  Action:    ${actionPath}`)
  console.log(`  Session:   ${sessionId}`)
  console.log(`  To:        ${body.chatId || 'N/A'}`)
  console.log(`  Text:      ${(body.text as string)?.substring(0, 120) || 'N/A'}`)
  console.log(`  API Key:   ${apiKey ? '✓ present' : '✗ missing'}`)
  console.log(`  MessageID: ${messageId}`)
  console.log(`────────────────────────────────────────────\n`)

  return NextResponse.json({ messageId, timestamp }, { status: 201 })
}
