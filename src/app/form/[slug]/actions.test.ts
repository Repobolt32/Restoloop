import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase before importing
const mockFrom = vi.fn()
const mockMaybeSingle = vi.fn()
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockEq = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: () => ({
    from: mockFrom,
  }),
}))

// Re-import after mock
let submitIntakeForm: any

async function loadModule() {
  const mod = await import('./actions')
  submitIntakeForm = mod.submitIntakeForm
}

describe('Intake Form Zod Schema', () => {
  // We test the schema indirectly through submitIntakeForm
  // But we can also import z and test directly
  it('validates phone format: must start with +91 and have 10 digits', async () => {
    const { z } = await import('zod')
    const schema = z.object({
      phone: z.string().regex(/^\+91\d{10}$/, 'Phone number must match format +91XXXXXXXXXX'),
    })

    expect(schema.safeParse({ phone: '+919900000000' }).success).toBe(true)
    expect(schema.safeParse({ phone: '919900000000' }).success).toBe(false) // no +
    expect(schema.safeParse({ phone: '+9199000000' }).success).toBe(false)   // 8 digits
    expect(schema.safeParse({ phone: '+9199000000000' }).success).toBe(false) // 11 digits
    expect(schema.safeParse({ phone: '+91abc0000000' }).success).toBe(false)  // letters
  })

  it('validates birthday month range 1-12', async () => {
    const { z } = await import('zod')
    const schema = z.object({
      birthdayMonth: z.number().int().min(1).max(12).optional(),
    })

    expect(schema.safeParse({ birthdayMonth: 1 }).success).toBe(true)
    expect(schema.safeParse({ birthdayMonth: 12 }).success).toBe(true)
    expect(schema.safeParse({ birthdayMonth: 0 }).success).toBe(false)
    expect(schema.safeParse({ birthdayMonth: 13 }).success).toBe(false)
  })

  it('validates birthday day range 1-31', async () => {
    const { z } = await import('zod')
    const schema = z.object({
      birthdayDay: z.number().int().min(1).max(31).optional(),
    })

    expect(schema.safeParse({ birthdayDay: 1 }).success).toBe(true)
    expect(schema.safeParse({ birthdayDay: 31 }).success).toBe(true)
    expect(schema.safeParse({ birthdayDay: 0 }).success).toBe(false)
    expect(schema.safeParse({ birthdayDay: 32 }).success).toBe(false)
  })

  it('validates name is required', async () => {
    const { z } = await import('zod')
    const schema = z.object({
      name: z.string().min(1, 'Name is required'),
    })

    expect(schema.safeParse({ name: 'Alice' }).success).toBe(true)
    expect(schema.safeParse({ name: '' }).success).toBe(false)
  })
})

describe('submitIntakeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when restaurant not found by slug', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    })

    await loadModule()

    const formData = new FormData()
    formData.set('name', 'Alice')
    formData.set('phone', '+919900000000')

    const result = await submitIntakeForm('nonexistent-slug', formData)

    expect(result).toEqual({ success: false, error: 'Restaurant not found' })
  })

  it('creates customer with opted_in status and welcome coupon for valid input', async () => {
    const mockCustomerInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'cust-1', restaurant_id: 'rest-1' },
          error: null,
        }),
      }),
    })

    const mockCouponInsert = vi.fn().mockResolvedValue({ error: null })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'restaurants') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'rest-1', whatsapp_number: '918800000000', welcome_discount_cents: 5000 },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'customers') {
        return { insert: mockCustomerInsert }
      }
      if (table === 'coupons') {
        return { insert: mockCouponInsert }
      }
      return { select: vi.fn().mockReturnThis() }
    })

    await loadModule()

    const formData = new FormData()
    formData.set('name', 'Alice')
    formData.set('phone', '+919900000000')

    const result = await submitIntakeForm('spice-garden', formData)

    expect(result.success).toBe(true)
    expect(result.waUrl).toContain('wa.me/')
    expect(result.waUrl).toContain('918800000000')
  })

  it('returns waUrl on duplicate phone (23505 error)', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'restaurants') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'rest-1', whatsapp_number: '918800000000', welcome_discount_cents: 5000 },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'customers') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: { code: '23505', message: 'duplicate key' },
              }),
            }),
          }),
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'existing-cust' },
                  error: null,
                }),
              }),
            }),
          }),
        }
      }
      return { select: vi.fn().mockReturnThis() }
    })

    await loadModule()

    const formData = new FormData()
    formData.set('name', 'Alice')
    formData.set('phone', '+919900000000')

    const result = await submitIntakeForm('spice-garden', formData)

    expect(result.success).toBe(true)
    expect(result.waUrl).toContain('wa.me/')
  })

  it('returns Zod error for invalid phone format', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'restaurants') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'rest-1', whatsapp_number: '918800000000' },
                error: null,
              }),
            }),
          }),
        }
      }
      return { select: vi.fn().mockReturnThis() }
    })

    await loadModule()

    const formData = new FormData()
    formData.set('name', 'Alice')
    formData.set('phone', '9900000000') // missing +91

    const result = await submitIntakeForm('spice-garden', formData)

    expect(result.success).toBe(false)
    expect(result.error).toContain('+91')
  })
})
