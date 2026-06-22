import { describe, it, expect } from 'vitest';
import { isSafeRedirect } from '~/lib/urls';

describe('isSafeRedirect', () => {
    it('allows relative paths starting with /', () => {
        expect(isSafeRedirect('/home')).toBe(true);
        expect(isSafeRedirect('/home/dashboard')).toBe(true);
        expect(isSafeRedirect('/auth/callback')).toBe(true);
    });

    it('allows the default path', () => {
        expect(isSafeRedirect('/home')).toBe(true);
    });

    it('rejects absolute URLs with protocol', () => {
        expect(isSafeRedirect('https://evil.com')).toBe(false);
        expect(isSafeRedirect('http://evil.com/phish')).toBe(false);
    });

    it('rejects protocol-relative URLs', () => {
        expect(isSafeRedirect('//evil.com')).toBe(false);
    });

    it('rejects URLs with embedded protocol in query', () => {
        expect(isSafeRedirect('/path?next=http://evil.com')).toBe(false);
    });

    it('rejects javascript: URIs', () => {
        expect(isSafeRedirect('javascript:alert(1)')).toBe(false);
    });

    it('rejects empty string', () => {
        expect(isSafeRedirect('')).toBe(false);
    });

    it('rejects paths without leading slash', () => {
        expect(isSafeRedirect('home/dashboard')).toBe(false);
    });

    it('rejects URL-encoded protocol-relative URLs', () => {
        expect(isSafeRedirect('%2F%2Fevil.com')).toBe(false);
    });

    it('rejects double-encoded protocol-relative URLs', () => {
        expect(isSafeRedirect('%252F%252Fevil.com')).toBe(false);
    });

    it('rejects backslash paths', () => {
        expect(isSafeRedirect('\\evil.com')).toBe(false);
    });

    it('rejects tab characters in path', () => {
        expect(isSafeRedirect('/path\tevil.com')).toBe(false);
    });

    it('rejects newline characters in path', () => {
        expect(isSafeRedirect('/path\nevil.com')).toBe(false);
    });

    it('allows nested relative paths', () => {
        expect(isSafeRedirect('/home/dashboard')).toBe(true);
        expect(isSafeRedirect('/home/restaurant-profile')).toBe(true);
    });

    it('allows paths with query parameters', () => {
        expect(isSafeRedirect('/home?tab=dashboard')).toBe(true);
    });

    it('allows paths with hash fragments', () => {
        expect(isSafeRedirect('/home#section')).toBe(true);
    });
});
