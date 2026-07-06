const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
const PHONE = '919771631252'

async function debug() {
  console.log('🔍 Querying DB for customer:', PHONE)
  
  const { data: customer } = await supabase
    .from('customers')
    .select('*, coupons(*), message_logs(*)')
    .eq('phone', PHONE)
    .maybeSingle()

  if (!customer) {
    console.log('❌ Customer does not exist in DB!')
    return
  }

  console.log('👤 Customer:', {
    id: customer.id,
    name: customer.name,
    opt_in_status: customer.opt_in_status,
    created_at: customer.created_at
  })

  console.log('🎟️ Coupons count:', customer.coupons?.length)
  customer.coupons?.forEach(c => {
    console.log(`  - Code: ${c.code}, Type: ${c.type}, Status: ${c.status}, Expires: ${c.expires_at}`)
  })

  console.log('✉️ Message Logs count:', customer.message_logs?.length)
  customer.message_logs?.forEach(l => {
    console.log(`  - Time: ${l.created_at}, Direction: ${l.direction}, Type: ${l.type}, Status: ${l.status}, Error: ${l.error}`)
  })
}

debug().catch(console.error)
