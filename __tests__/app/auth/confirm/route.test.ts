import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '~/auth/confirm/route';
import { NextRequest } from 'next/server';

// Mock the Supabase client
vi.mock('~/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    auth: {
      verifyOtp: vi.fn(() => Promise.resolve({ error: null })),
    },
  })),
}));

describe('/auth/confirm route handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /home when next param is valid relative path', async () => {
    const request = new NextRequest(
      'https://example.com/auth/confirm?token_hash=abc123&type=email&next=/dashboard'
    );

    const response = await GET(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://example.com/dashboard');
  });

  it('redirects to /home when next param is missing', async () => {
    const request = new NextRequest(
      'https://example.com/auth/confirm?token_hash=abc123&type=email'
    );

    const response = await GET(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://example.com/home');
  });

  it('rejects absolute URL to external domain and falls back to /home', async () => {
    const request = new NextRequest(
      'https://example.com/auth/confirm?token_hash=abc123&type=email&next=https://evil.com'
    );

    const response = await GET(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://example.com/home');
  });

  it('rejects protocol-relative URL and falls back to /home', async () => {
    const request = new NextRequest(
      'https://example.com/auth/confirm?token_hash=abc123&type=email&next=//evil.com'
    );

    const response = await GET(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://example.com/home');
  });

  it('rejects javascript: URI and falls back to /home', async () => {
    const request = new NextRequest(
      'https://example.com/auth/confirm?token_hash=abc123&type=email&next=javascript:alert(1)'
    );

    const response = await GET(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://example.com/home');
  });

  it('rejects path without leading slash and falls back to /home', async () => {
    const request = new NextRequest(
      'https://example.com/auth/confirm?token_hash=abc123&type=email&next=dashboard'
    );

    const response = await GET(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://example.com/home');
  });

  it('redirects to error page when token_hash is missing', async () => {
    const request = new NextRequest(
      'https://example.com/auth/confirm?type=email&next=/dashboard'
    );

    const response = await GET(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://example.com/auth/callback/error');
  });

  it('redirects to error page when type is missing', async () => {
    const request = new NextRequest(
      'https://example.com/auth/confirm?token_hash=abc123&next=/dashboard'
    );

    const response = await GET(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://example.com/auth/callback/error');
  });
});
