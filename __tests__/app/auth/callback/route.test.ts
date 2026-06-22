import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '~/auth/callback/route';
import { NextRequest } from 'next/server';

// Mock the Supabase client
vi.mock('~/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    auth: {
      exchangeCodeForSession: vi.fn(() => Promise.resolve({ error: null })),
    },
  })),
}));

// Mock next/navigation redirect
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT: ${url}`);
  }),
}));

describe('/auth/callback route handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to valid relative path with origin', async () => {
    const request = new NextRequest(
      'https://example.com/auth/callback?code=abc123&next=/dashboard'
    );

    try {
      await GET(request);
    } catch (error) {
      expect(error).toEqual(new Error('REDIRECT: https://example.com/dashboard'));
    }
  });

  it('redirects to /home when next param is missing', async () => {
    const request = new NextRequest(
      'https://example.com/auth/callback?code=abc123'
    );

    try {
      await GET(request);
    } catch (error) {
      expect(error).toEqual(new Error('REDIRECT: https://example.com/home'));
    }
  });

  it('rejects absolute URL to external domain and falls back to /home', async () => {
    const request = new NextRequest(
      'https://example.com/auth/callback?code=abc123&next=https://evil.com'
    );

    try {
      await GET(request);
    } catch (error) {
      expect(error).toEqual(new Error('REDIRECT: https://example.com/home'));
    }
  });

  it('rejects protocol-relative URL and falls back to /home', async () => {
    const request = new NextRequest(
      'https://example.com/auth/callback?code=abc123&next=//evil.com'
    );

    try {
      await GET(request);
    } catch (error) {
      expect(error).toEqual(new Error('REDIRECT: https://example.com/home'));
    }
  });

  it('rejects javascript: URI and falls back to /home', async () => {
    const request = new NextRequest(
      'https://example.com/auth/callback?code=abc123&next=javascript:alert(1)'
    );

    try {
      await GET(request);
    } catch (error) {
      expect(error).toEqual(new Error('REDIRECT: https://example.com/home'));
    }
  });

  it('rejects path without leading slash and falls back to /home', async () => {
    const request = new NextRequest(
      'https://example.com/auth/callback?code=abc123&next=dashboard'
    );

    try {
      await GET(request);
    } catch (error) {
      expect(error).toEqual(new Error('REDIRECT: https://example.com/home'));
    }
  });

  it('redirects to error page when code is missing', async () => {
    const request = new NextRequest(
      'https://example.com/auth/callback?next=/dashboard'
    );

    try {
      await GET(request);
    } catch (error) {
      expect(error).toEqual(new Error('REDIRECT: https://example.com/auth/callback/error'));
    }
  });
});
