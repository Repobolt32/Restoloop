import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/navigation redirect
const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (...args: any[]) => {
    mockRedirect(...args);
    // Throw to stop execution after redirect
    throw new Error('NEXT_REDIRECT');
  },
}));

// Mock Supabase server client
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockResetPasswordForEmail = vi.fn();

vi.mock('~/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  })),
}));

// Import after mocking
import { signIn } from '~/auth/sign-in/actions';
import { signUp } from '~/auth/sign-up/actions';
import { resetPassword } from '~/auth/password-reset/actions';

describe('Auth Actions - Error Message Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('signIn', () => {
    it('should NOT leak internal error messages in URL params', async () => {
      // Arrange: Simulate Supabase returning an internal error
      mockSignInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials', status: 400 },
      });

      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'wrongpassword');

      // Act
      await expect(signIn(formData)).rejects.toThrow('NEXT_REDIRECT');

      // Assert: Redirect should be called with a generic message, not the internal error
      const redirectUrl = mockRedirect.mock.calls[0][0] as string;
      expect(redirectUrl).toContain('/auth/sign-in?error=');
      expect(redirectUrl).not.toContain('Invalid+login+credentials');
      expect(redirectUrl).not.toContain('Invalid login credentials');
      expect(redirectUrl).toContain(encodeURIComponent('Authentication failed'));
    });

    it('should log the internal error server-side', async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'error');
      mockSignInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials', status: 400 },
      });

      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'wrongpassword');

      // Act
      await expect(signIn(formData)).rejects.toThrow('NEXT_REDIRECT');

      // Assert: Error should be logged server-side
      expect(consoleSpy).toHaveBeenCalledWith(
        'Sign-in error:',
        expect.objectContaining({ message: 'Invalid login credentials' })
      );
    });
  });

  describe('signUp', () => {
    it('should NOT leak internal error messages in URL params', async () => {
      // Arrange: Simulate Supabase returning an internal error
      mockSignUp.mockResolvedValue({
        data: null,
        error: { message: 'User already registered', status: 400 },
      });

      const formData = new FormData();
      formData.append('email', 'existing@example.com');
      formData.append('password', 'password123');

      // Act
      await expect(signUp(formData)).rejects.toThrow('NEXT_REDIRECT');

      // Assert: Redirect should be called with a generic message
      const redirectUrl = mockRedirect.mock.calls[0][0] as string;
      expect(redirectUrl).toContain('/auth/sign-up?error=');
      expect(redirectUrl).not.toContain('User+already+registered');
      expect(redirectUrl).not.toContain('User already registered');
      expect(redirectUrl).toContain(encodeURIComponent('Registration failed'));
    });

    it('should log the internal error server-side', async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'error');
      mockSignUp.mockResolvedValue({
        data: null,
        error: { message: 'User already registered', status: 400 },
      });

      const formData = new FormData();
      formData.append('email', 'existing@example.com');
      formData.append('password', 'password123');

      // Act
      await expect(signUp(formData)).rejects.toThrow('NEXT_REDIRECT');

      // Assert: Error should be logged server-side
      expect(consoleSpy).toHaveBeenCalledWith(
        'Sign-up error:',
        expect.objectContaining({ message: 'User already registered' })
      );
    });
  });

  describe('resetPassword', () => {
    it('should NOT leak internal error messages in URL params', async () => {
      // Arrange: Simulate Supabase returning an internal error
      mockResetPasswordForEmail.mockResolvedValue({
        data: null,
        error: { message: 'Email rate limit exceeded', status: 429 },
      });

      const formData = new FormData();
      formData.append('email', 'test@example.com');

      // Act
      await expect(resetPassword(formData)).rejects.toThrow('NEXT_REDIRECT');

      // Assert: Redirect should be called with a generic message
      const redirectUrl = mockRedirect.mock.calls[0][0] as string;
      expect(redirectUrl).toContain('/auth/password-reset?error=');
      expect(redirectUrl).not.toContain('Email+rate+limit+exceeded');
      expect(redirectUrl).not.toContain('Email rate limit exceeded');
      expect(redirectUrl).toContain(encodeURIComponent('Password reset failed'));
    });

    it('should log the internal error server-side', async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'error');
      mockResetPasswordForEmail.mockResolvedValue({
        data: null,
        error: { message: 'Email rate limit exceeded', status: 429 },
      });

      const formData = new FormData();
      formData.append('email', 'test@example.com');

      // Act
      await expect(resetPassword(formData)).rejects.toThrow('NEXT_REDIRECT');

      // Assert: Error should be logged server-side
      expect(consoleSpy).toHaveBeenCalledWith(
        'Password reset error:',
        expect.objectContaining({ message: 'Email rate limit exceeded' })
      );
    });
  });
});
