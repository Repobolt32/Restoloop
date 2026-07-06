/**
 * Restoloop OpenWA Setup Script
 * Run: node setup-openwa.js
 * 
 * This script:
 * 1. Creates the OpenWA session named 'restoloop'
 * 2. Starts it so WhatsApp begins initializing
 * 3. Registers the webhook pointing at your Next.js app
 * 4. Prints the QR URL so you can scan it
 */
const API_KEY = 'owa_k1_restoloop_real_2026'
const BASE = 'http://localhost:2785/api'
const SESSION_NAME = 'restoloop'
const WEBHOOK_URL = 'http://localhost:3000/api/whatsapp'

const headers = {
  'Content-Type': 'application/json',
  'X-API-Key': API_KEY,
}

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  try { return JSON.parse(text) } catch { return text }
}

async function main() {
  console.log('🔌 Connecting to OpenWA at', BASE)

  // 1. Try to get existing sessions
  let sessions = []
  try {
    sessions = await req('GET', '/sessions')
    console.log(`📋 Found ${sessions.length} existing session(s)`)
  } catch (e) {
    console.error('❌ Cannot reach OpenWA. Is it running? (npm run dev in E:\\openwa)')
    process.exit(1)
  }

  // 2. Find or create session
  let session = Array.isArray(sessions) && sessions.find(s => s.name === SESSION_NAME)

  if (!session) {
    console.log(`➕ Creating session '${SESSION_NAME}'...`)
    session = await req('POST', '/sessions', { name: SESSION_NAME })
    if (!session.id) {
      console.error('❌ Failed to create session:', session)
      process.exit(1)
    }
    console.log(`✅ Session created: ${session.id}`)
  } else {
    console.log(`♻️  Reusing existing session: ${session.id} (status: ${session.status})`)
  }

  const sessionId = session.id

  // 3. Start session if not already running
  if (!['initializing', 'qr_ready', 'authenticating', 'ready'].includes(session.status)) {
    console.log('🚀 Starting session...')
    await req('POST', `/sessions/${sessionId}/start`)
    console.log('⏳ Session starting, waiting 3s...')
    await new Promise(r => setTimeout(r, 3000))
  }

  // 4. Register webhook (skip if already set)
  console.log('\n🔗 Registering webhook...')
  const webhooks = await req('GET', `/sessions/${sessionId}/webhooks`)
  const existing = Array.isArray(webhooks) && webhooks.find(w => w.url === WEBHOOK_URL)
  if (existing) {
    console.log(`✅ Webhook already registered: ${existing.id}`)
  } else {
    const wh = await req('POST', `/sessions/${sessionId}/webhooks`, {
      url: WEBHOOK_URL,
      events: ['message.received'],
    })
    console.log(`✅ Webhook registered: ${wh.id || JSON.stringify(wh)}`)
  }

  // 5. Print instructions
  console.log('\n' + '='.repeat(60))
  console.log('📱 SCAN QR CODE TO LINK RESTAURANT PHONE (+91 7542011085)')
  console.log('='.repeat(60))
  console.log(`\n👉 Open this URL in your browser:\n`)
  console.log(`   file:///e:/desktop/Restoloop/openwa-qr.html?sid=${sessionId}`)
  console.log(`\n   OR open the Swagger dashboard: http://localhost:2785/api/docs`)
  console.log(`\n📝 Session ID: ${sessionId}`)
  console.log(`🔑 API Key:    ${API_KEY}`)
  console.log('\n⚠️  On the RESTAURANT phone (+91 7542011085):')
  console.log('   WhatsApp → Settings → Linked Devices → Link a Device → Scan QR\n')
  console.log('='.repeat(60))

  // 6. Poll for QR
  let attempts = 0
  console.log('\n🔄 Waiting for QR to be ready...')
  while (attempts < 15) {
    await new Promise(r => setTimeout(r, 2000))
    const status = await req('GET', `/sessions/${sessionId}`)
    if (status.status === 'qr_ready') {
      console.log('✅ QR is ready! Open the browser URL above to scan it.')
      break
    } else if (status.status === 'ready') {
      console.log('✅ Session is already authenticated! Ready to send messages.')
      break
    } else {
      process.stdout.write(`   Status: ${status.status}...\r`)
      attempts++
    }
  }
}

main().catch(e => {
  console.error('Fatal error:', e.message)
  process.exit(1)
})
