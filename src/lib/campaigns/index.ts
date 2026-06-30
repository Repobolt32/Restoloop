import { createServiceClient } from '@/lib/supabase/server'
import { createWhatsAppAdapter } from '@/lib/whatsapp/adapter'

export async function runWelcomeReminders() {
  const supabase = createServiceClient()
  const adapter = createWhatsAppAdapter()

  // Define date bounds for exactly 25 days ago (24 to 25 days ago)
  const gteDate = new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  const lteDate = new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString()

  // Find opted-in customers who signed up 25 days ago
  const { data: customers, error } = await supabase
    .from('customers')
    .select('*, coupons(*)')
    .eq('opt_in_status', 'opted_in')
    .filter('created_at', 'gte', gteDate)
    .filter('created_at', 'lte', lteDate)

  if (error) {
    console.error('Failed to fetch customers for campaigns:', error)
    throw error
  }

  for (const customer of customers || []) {
    // Find unredeemed welcome coupon
    const welcomeCoupon = customer.coupons?.find(
      (c: any) => c.type === 'welcome' && c.status === 'sent'
    )

    if (!welcomeCoupon) continue

    // Get restaurant info
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', customer.restaurant_id)
      .single()

    if (!restaurant) continue

    // Check credits before sending
    if (restaurant.credits <= 0) {
      await supabase.from('message_logs').insert({
        restaurant_id: restaurant.id,
        customer_id: customer.id,
        direction: 'outbound',
        type: 'campaign',
        status: 'blocked_no_credits',
      })
      continue
    }

    // Compose message with opt-out warning
    const reminderMessage = `Hey ${customer.name || 'there'}! Your coupon ${welcomeCoupon.code} for ${restaurant.name} is still active! Reply STOP to opt out.`

    // Send WhatsApp text message
    const result = await adapter.sendText(customer.phone, reminderMessage)

    // Log outbound message status
    await supabase.from('message_logs').insert({
      restaurant_id: restaurant.id,
      customer_id: customer.id,
      direction: 'outbound',
      type: 'campaign',
      status: result.success ? 'sent' : 'failed',
      error: result.error || null,
    })

    if (result.success) {
      try {
        // Deduct 1 credit from restaurant
        await supabase.rpc('deduct_credit', { restaurant_id: restaurant.id })
      } catch (err) {
        console.error(`Failed to deduct credit for restaurant ${restaurant.id}:`, err)
      }
    }
  }
}
