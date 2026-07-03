import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockExchangeCode, mockGetUser } = vi.hoisted(() => ({
  mockExchangeCode: vi.fn(),
  mockGetUser: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      exchangeCodeForSession: mockExchangeCode,
      getUser: mockGetUser,
    },
  }),
}))

vi.mock('next/server', () => ({
  NextResponse: {
    redirect: (url: URL) => {
      const headers = new Headers()
      headers.set('location', url.toString())
      return {
        status: 302,
        headers,
      }
    },
  },
}))

import { GET } from './route'

describe('Auth Callback Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exchanges code for session and redirects to next when code present', async () => {
    mockExchangeCode.mockResolvedValue({ error: null })

    const req = { url: 'http://localhost:3000/auth/callback?code=abc123&next=/dashboard' }
    const res = await GET(req as any)

    expect(mockExchangeCode).toHaveBeenCalledWith('abc123')
    expect(res.headers.get('location')).toContain('/dashboard')
  })

  it('redirects to /dashboard by default when no next param', async () => {
    mockExchangeCode.mockResolvedValue({ error: null })

    const req = { url: 'http://localhost:3000/auth/callback?code=abc123' }
    const res = await GET(req as any)

    expect(res.headers.get('location')).toContain('/dashboard')
  })

  it('redirects without exchanging when no code present', async () => {
    const req = { url: 'http://localhost:3000/auth/callback' }
    const res = await GET(req as any)

    expect(mockExchangeCode).not.toHaveBeenCalled()
    expect(res.headers.get('location')).toContain('/dashboard')
  })

  it('redirects to custom next path', async () => {
    mockExchangeCode.mockResolvedValue({ error: null })

    const req = { url: 'http://localhost:3000/auth/callback?code=abc123&next=/admin' }
    const res = await GET(req as any)

    expect(res.headers.get('location')).toContain('/admin')
  })
})
