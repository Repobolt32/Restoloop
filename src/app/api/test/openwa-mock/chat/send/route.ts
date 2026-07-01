import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    return NextResponse.json({ id: `mock-msg-${Math.random().toString(36).substring(2, 9)}` })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}
