/**
 * Validates that a redirect path is safe (relative, no protocol).
 * Prevents open redirect attacks.
 */
export function isSafeRedirect(path: string): boolean {
    if (!path) return false;
    if (!path.startsWith('/')) return false;
    if (path.startsWith('//')) return false;
    if (path.includes('://')) return false;
    return true;
}
