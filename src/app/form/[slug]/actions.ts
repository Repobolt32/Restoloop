'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { normalizePhone } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().regex(/^91\d{10}$/, 'Phone number must be a valid 10-digit number (e.g. 9876543210)'),
  birthdayMonth: z.number().int().min(1).max(12).optional(),
  birthdayDay: z.number().int().min(1).max(31).optional(),
  foodPreference: z.string().optional(),
})

export async function submitIntakeForm(slug: string, formData: FormData) {
  try {
    const supabase = createServiceClient()

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    if (!restaurant) {
      return { success: false, error: 'Restaurant not found' }
    }

    const name = formData.get('name')
    const phoneInput = (formData.get('phone') as string) || ''
    const rawBirthdayMonth = formData.get('birthdayMonth')
    const rawBirthdayDay = formData.get('birthdayDay')
    const foodPreference = formData.get('foodPreference')

    const validated = schema.parse({
      name,
      phone: normalizePhone(phoneInput),
      birthdayMonth: rawBirthdayMonth ? Number(rawBirthdayMonth) : undefined,
      birthdayDay: rawBirthdayDay ? Number(rawBirthdayDay) : undefined,
      foodPreference: foodPreference || undefined,
    })

    const phone = validated.phone

    // Create opted_in customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        restaurant_id: restaurant.id,
        phone,
        name: validated.name,
        opt_in_status: 'opted_in',
        birthday_month: validated.birthdayMonth || null,
        birthday_day: validated.birthdayDay || null,
        food_preference: validated.foodPreference || null,
      })
      .select()
      .maybeSingle()

    if (customerError) {
      if (customerError.code === '23505') {
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('*')
          .eq('restaurant_id', restaurant.id)
          .eq('phone', phone)
          .maybeSingle()

        if (existingCustomer) {
          if (existingCustomer.opt_in_status === 'opted_out') {
            return {
              success: false,
              error: 'You have opted out of this loyalty club. Please contact the restaurant to re-enable your membership.',
            }
          }
          const { data: existingCoupon } = await supabase
            .from('coupons')
            .select('code')
            .eq('customer_id', existingCustomer.id)
            .eq('type', 'welcome')
            .maybeSingle()
          const code = existingCoupon?.code || ''
          const prefilledMessage = encodeURIComponent(
            `Hi! I just signed up for your loyalty club.${code ? ` My coupon code is ${code}` : ''}`
          )
          const waUrl = `https://wa.me/${restaurant.whatsapp_number}?text=${prefilledMessage}`
          return { success: true, waUrl }
        }
      }
      return { success: false, error: customerError.message }
    }

    // Create welcome coupon
    const couponCode = `W${restaurant.welcome_discount_percent}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    const { error: couponError } = await supabase.from('coupons').insert({
      restaurant_id: restaurant.id,
      customer_id: customer?.id,
      type: 'welcome',
      code: couponCode,
      discount_percent: restaurant.welcome_discount_percent,
      discount_cents: 0, // Keep 0 for legacy constraints
      status: 'sent',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })

    if (couponError) {
      return { success: false, error: couponError.message }
    }

    const prefilledMessage = encodeURIComponent(`Hi! I just signed up for your loyalty club. My coupon code is ${couponCode}`)
    const waUrl = `https://wa.me/${restaurant.whatsapp_number}?text=${prefilledMessage}`
    return { success: true, waUrl }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Invalid form input' }
    }
    return { success: false, error: String(error) }
  }
}
