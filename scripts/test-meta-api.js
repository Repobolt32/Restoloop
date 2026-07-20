const fs = require('fs')
const path = require('path')

const envRaw = fs.readFileSync(path.resolve(__dirname, '..', '.env.local'), 'utf-8')
const env = {}
for (const line of envRaw.split('\n')) {
  const m = line.trim().match(/^([^#][^=]+?)=(.*)$/)
  if (m) env[m[1].trim()] = m[2].trim()
}

const TOKEN = env.META_ACCESS_TOKEN
const PHONE_ID = env.META_PHONE_NUMBER_ID

async function main() {
  // Test 1: Check token info
  console.log('--- Debug Token ---')
  const dt = await fetch(`https://graph.facebook.com/v20.0/debug_token?input_token=${TOKEN}&access_token=${TOKEN}`)
  const dtJ = await dt.json()
  console.log(JSON.stringify(dtJ, null, 2))

  // Test 2: Get phone number info
  console.log('\n--- Phone Number Info ---')
  const pn = await fetch(`https://graph.facebook.com/v20.0/${PHONE_ID}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  })
  console.log(`Status: ${pn.status}`)
  console.log(await pn.text())

  // Test 3: Send text to test number (will fail if number not in allowed list)
  console.log('\n--- Send Text (to 919876543210) ---')
  const r = await fetch(`https://graph.facebook.com/v20.0/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: '919876543210',
      type: 'text',
      text: { body: 'Test from Restoloop' },
    }),
  })
  console.log(`Status: ${r.status}`)
  console.log(await r.text())
}

main().catch(console.error)
