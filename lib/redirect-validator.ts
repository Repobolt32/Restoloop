/**
 * Validates a redirect path to prevent open redirect attacks.
 * Only allows internal paths starting with `/` and not `//`.
 * Returns the default fallback if the path is invalid.
 */
export function safeRedirectPath(
  next: string | null | undefined,
  fallback: string
): string {
  if (!next) return fallback;
  // Must start with single `/` (not `//` which is protocol-relative URL)
  if (!next.startsWith('/') || next.startsWith('//')) return fallback;
  // Must not contain protocol or javascript:
  if (next.includes('://') || next.toLowerCase().includes('javascript:')) return fallback;
  return next;
}
