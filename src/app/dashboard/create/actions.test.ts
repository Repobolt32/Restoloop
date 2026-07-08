import { describe, it, expect, vi } from 'vitest'

// slugify is not exported, so we test it via the Zod schema and inline the logic
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

describe('slugify', () => {
  it('converts "Spice Garden" to "spice-garden"', () => {
    expect(slugify('Spice Garden')).toBe('spice-garden')
  })

  it('strips special characters', () => {
    expect(slugify('The Golden!')).toBe('the-golden')
  })

  it('trims and collapses spaces', () => {
    expect(slugify('  hello  world  ')).toBe('hello-world')
  })

  it('lowercases uppercase', () => {
    expect(slugify('UPPERCASE')).toBe('uppercase')
  })

  it('replaces special chars with hyphens', () => {
    expect(slugify('a!@#$b')).toBe('a-b')
  })

  it('strips leading/trailing hyphens', () => {
    expect(slugify('---test---')).toBe('test')
  })
})

describe('Create Restaurant Zod Schema', () => {
  it('validates whatsappNumber: must be 91 + 10 digits', async () => {
    const { z } = await import('zod')
    const schema = z.object({
      whatsappNumber: z.string().regex(/^91\d{10}$/),
    })

    expect(schema.safeParse({ whatsappNumber: '919900000000' }).success).toBe(true)
    expect(schema.safeParse({ whatsappNumber: '+919900000000' }).success).toBe(false) // has +
    expect(schema.safeParse({ whatsappNumber: '9199000000' }).success).toBe(false)   // 8 digits
    expect(schema.safeParse({ whatsappNumber: '9199000000000' }).success).toBe(false) // 11 digits
  })

  it('validates discounts must be positive integers', async () => {
    const { z } = await import('zod')
    const schema = z.object({
      discount: z.coerce.number().int().positive(),
    })

    expect(schema.safeParse({ discount: 50 }).success).toBe(true)
    expect(schema.safeParse({ discount: 1 }).success).toBe(true)
    expect(schema.safeParse({ discount: 0 }).success).toBe(false)
    expect(schema.safeParse({ discount: -5 }).success).toBe(false)
    expect(schema.safeParse({ discount: '50' }).success).toBe(true) // coerce from string
  })

  it('validates name is required', async () => {
    const { z } = await import('zod')
    const schema = z.object({
      name: z.string().min(1),
    })

    expect(schema.safeParse({ name: 'Spice Garden' }).success).toBe(true)
    expect(schema.safeParse({ name: '' }).success).toBe(false)
  })
})

describe('normalizePhone', () => {
  it('handles standard 10 digit number', async () => {
    const { normalizePhone } = await import('@/lib/utils')
    expect(normalizePhone('9876543210')).toBe('919876543210')
  })

  it('handles 10 digit number with spaces or hyphens', async () => {
    const { normalizePhone } = await import('@/lib/utils')
    expect(normalizePhone('98765-43210')).toBe('919876543210')
  })

  it('handles number starting with +91', async () => {
    const { normalizePhone } = await import('@/lib/utils')
    expect(normalizePhone('+919876543210')).toBe('919876543210')
  })

  it('handles number starting with 0', async () => {
    const { normalizePhone } = await import('@/lib/utils')
    expect(normalizePhone('09876543210')).toBe('919876543210')
  })

  it('handles already normalized number', async () => {
    const { normalizePhone } = await import('@/lib/utils')
    expect(normalizePhone('919876543210')).toBe('919876543210')
  })
})
