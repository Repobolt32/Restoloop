/**
 * Validates that a redirect path is safe (relative, no protocol).
 * Prevents open redirect attacks.
 */
export function isSafeRedirect(path: string): boolean {
    if (!path) return false;
    if (!path.startsWith('/')) return false;
    if (path.startsWith('//')) return false;
    if (path.includes('://')) return false;
    // Reject paths with tab, newline, or carriage return characters
    // These can be stripped by browsers and lead to open redirects
    if (/[\t\n\r]/.test(path)) return false;
    return true;
}
