/**
 * Security tests for auth redirect routes
 *
 * BUG: Both /auth/callback and /auth/confirm use the `next` URL parameter
 * WITHOUT validation, allowing open redirect attacks.
 *
 * An attacker can craft a URL like:
 *   /auth/callback?code=xxx&next=https://evil.com
 * which redirects the user to a malicious site after successful authentication.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Supabase server client
vi.mock('../../lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Mock paths config
vi.mock('../../config/paths.config', () => ({
  default: {
    app: { home: '/home' },
    auth: { signIn: '/auth/sign-in' },
  },
}));

import { createClient } from '../../lib/supabase/server';

/**
 * Helper to create a mock Supabase client with auth methods
 */
function createMockSupabase(options: {
  exchangeCodeSuccess?: boolean;
  verifyOtpSuccess?: boolean;
} = {}) {
  const { exchangeCodeSuccess = true, verifyOtpSuccess = true } = options;

  return {
    auth: {
      exchangeCodeForSession: vi.fn().mockResolvedValue(
        exchangeCodeSuccess
          ? { error: null }
          : { error: new Error('Exchange failed') }
      ),
      verifyOtp: vi.fn().mockResolvedValue(
        verifyOtpSuccess
          ? { error: null }
          : { error: new Error('Verify failed') }
      ),
    },
  };
}

/**
 * Helper to extract redirect URL from Next.js redirect() which throws NEXT_REDIRECT error
 * The error contains a digest string with the redirect URL
 */
async function extractRedirectUrl(fn: () => Promise<unknown>): Promise<string> {
  try {
    await fn();
    throw new Error('Expected redirect error was not thrown');
  } catch (error: unknown) {
    // Next.js redirect() throws an error with a digest that contains the URL
    if (
      error instanceof Error &&
      'digest' in error &&
      typeof (error as { digest: unknown }).digest === 'string'
    ) {
      const digest = (error as { digest: string }).digest;
      // The digest format is "NEXT_REDIRECT;<status>;<url>"
      const parts = digest.split(';');
      if (parts.length >= 3 && parts[0] === 'NEXT_REDIRECT') {
        return parts[2]!; // The URL is the third part
      }
    }
    throw error;
  }
}

describe('Auth redirect security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('/auth/callback', () => {
    it('redirects to /home by default when no next param', async () => {
      // Arrange
      const mockSupabase = createMockSupabase();
      vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

      const request = new NextRequest(
        'http://localhost:3000/auth/callback?code=test-code'
      );

      // Act - redirect() throws NEXT_REDIRECT, so we extract the URL from the error
      const { GET } = await import('../../app/auth/callback/route');
      const redirectUrl = await extractRedirectUrl(() => GET(request));

      // Assert
      expect(redirectUrl).toBe('http://localhost:3000/home');
    });

    it('redirects to valid internal path when next is provided', async () => {
      // Arrange
      const mockSupabase = createMockSupabase();
      vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

      const request = new NextRequest(
        'http://localhost:3000/auth/callback?code=test-code&next=/dashboard'
      );

      // Act
      const { GET } = await import('../../app/auth/callback/route');
      const redirectUrl = await extractRedirectUrl(() => GET(request));

      // Assert
      expect(redirectUrl).toBe('http://localhost:3000/dashboard');
    });

    it('BUG: allows external redirect via next param (open redirect)', async () => {
      // Arrange - This test PASSES to confirm the vulnerability exists
      const mockSupabase = createMockSupabase();
      vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

      const maliciousUrl = 'https://evil.com';
      const request = new NextRequest(
        `http://localhost:3000/auth/callback?code=test-code&next=${encodeURIComponent(maliciousUrl)}`
      );

      // Act
      const { GET } = await import('../../app/auth/callback/route');
      const redirectUrl = await extractRedirectUrl(() => GET(request));

      // Assert - BUG: The redirect should NOT contain the external URL
      // This test PASSES because the code does NOT validate the next param
      expect(redirectUrl).toContain('https://evil.com'); // BUG: external URL is allowed
      // A secure implementation would redirect to /home instead
    });
  });

  describe('/auth/confirm', () => {
    it('redirects to /home by default when no next param', async () => {
      // Arrange
      const mockSupabase = createMockSupabase();
      vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

      const request = new NextRequest(
        'http://localhost:3000/auth/confirm?token_hash=test-hash&type=email'
      );

      // Act
      const { GET } = await import('../../app/auth/confirm/route');
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/home');
    });

    it('redirects to valid internal path when next is provided', async () => {
      // Arrange
      const mockSupabase = createMockSupabase();
      vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

      const request = new NextRequest(
        'http://localhost:3000/auth/confirm?token_hash=test-hash&type=recovery&next=/update-password'
      );

      // Act
      const { GET } = await import('../../app/auth/confirm/route');
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/update-password');
    });

    it('BUG: allows external redirect via next param (open redirect)', async () => {
      // Arrange - This test PASSES to confirm the vulnerability exists
      const mockSupabase = createMockSupabase();
      vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

      const maliciousUrl = 'https://evil.com';
      const request = new NextRequest(
        `http://localhost:3000/auth/confirm?token_hash=test-hash&type=email&next=${encodeURIComponent(maliciousUrl)}`
      );

      // Act
      const { GET } = await import('../../app/auth/confirm/route');
      const response = await GET(request);

      // Assert - BUG: The redirect should NOT contain the external URL
      // This test PASSES because the code does NOT validate the next param
      const location = response.headers.get('location');
      expect(location).toContain('https://evil.com'); // BUG: external URL is allowed
      // A secure implementation would redirect to /home instead
    });
  });
});
