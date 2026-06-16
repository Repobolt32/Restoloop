/**
 * slug.ts
 * Generates a URL-safe, unique slug from a restaurant name.
 * Slug is immutable after first creation.
 *
 * Example: "The Golden Spoon" → "the-golden-spoon"
 * Collision: "The Golden Spoon" (2nd) → "the-golden-spoon-a3f2"
 */

/**
 * Converts a string to a URL-safe slug, limited to the first two words.
 * Example: "The Golden Spoon" → "the-golden"
 */
export function toShortSlug(name: string): string {
  const words = name.trim().split(/\s+/).slice(0, 2).join(' ');
  return toSlug(words);
}

/**
 * Converts a string to a URL-safe slug.
 * Lowercases, strips special chars, replaces spaces with dashes.
 */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove special chars
    .replace(/\s+/g, '-')          // spaces → dashes
    .replace(/-+/g, '-')           // collapse multiple dashes
    .replace(/^-|-$/g, '');        // trim leading/trailing dashes
}

/**
 * Generates a slug with a short random suffix to handle collisions.
 * Only used when the base slug is already taken.
 */
export function toSlugWithSuffix(name: string): string {
  const base = toSlug(name);
  const suffix = Math.random().toString(36).slice(2, 6); // 4 char alphanum
  return `${base}-${suffix}`;
}

/**
 * Given a restaurant name and a function to check uniqueness,
 * returns a unique slug — appending a suffix if the base is taken.
 *
 * @param name - Restaurant name from signup form
 * @param isSlugTaken - Async function that checks if a slug already exists
 */
export async function generateUniqueSlug(
  name: string,
  isSlugTaken: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = toShortSlug(name);

  if (!(await isSlugTaken(base))) {
    return base;
  }

  // Try up to 5 suffix variants before giving up
  for (let i = 0; i < 5; i++) {
    const slug = toSlugWithSuffix(name);
    if (!(await isSlugTaken(slug))) {
      return slug;
    }
  }

  // Extremely rare — fallback with timestamp
  return `${base}-${Date.now()}`;
}
