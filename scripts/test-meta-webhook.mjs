import { createHmac } from 'crypto'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const envContent = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8')
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const idx = trimmed.indexOf('=')
  if (idx === -1) continue
  const key = trimmed.substring(0, idx).trim()
  const value = trimmed.substring(idx + 1).trim()
  if (!process.env[key]) process.env[key] = value
}

const { MetaAdapter } = await import('../src/lib/whatsapp/meta.js')

const APP_SECRET = process.env.META_APP_SECRET!

function sign(body: string) {
  return 'sha256=' + createHmac('sha256', APP_SECRET).update(body).digest('hex')
}

const adapter = new MetaAdapter()

let p = 0, f = 0
function t(name: string, fn: () => boolean) {
  if (fn()) { p++; console.log(`  PASS ${name}`) }
  else { f++; console.log(`  FAIL ${name}`) }
}

console.log(`APP_SECRET: ${APP_SECRET ? 'set' : 'MISSING'}`)
console.log(`VERIFY_TOKEN: ${process.env.META_VERIFY_TOKEN || 'MISSING'}`)
console.log(`PHONE_NUMBER_ID: ${process.env.META_PHONE_NUMBER_ID || 'MISSING'}`)

console.log('\n--- verifySignature ---')
t('valid sig matches', () => adapter.verifySignature(JSON.stringify({ test: true }), sign(JSON.stringify({ test: true }))))
t('invalid sig rejected', () => !adapter.verifySignature('x', 'sha256=deadbeef'))

console.log('\n--- verifyWebhookChallenge ---')
t('correct token returns challenge', () => adapter.verifyWebhookChallenge('subscribe', process.env.META_VERIFY_TOKEN!, 'test-ch') === 'test-ch')
t('wrong token rejected', () => adapter.verifyWebhookChallenge('subscribe', 'bad', 'c') === null)

console.log('\n--- validateWebhook (inbound) ---')
const payload = JSON.stringify({
  object: 'whatsapp_business_account',
  entry: [{ id: '123', changes: [{ field: 'messages', value: {
    messaging_product: 'whatsapp',
    metadata: { display_phone_number: '919472673183', phone_number_id: process.env.META_PHONE_NUMBER_ID },
    contacts: [{ profile: { name: 'Test' }, wa_id: '919876543210' }],
    messages: [{ from: '919876543210', id: 'wamid.x', timestamp: '1700000000', text: { body: 'YES' }, type: 'text' }],
  } }] }],
})
const event = adapter.validateWebhook(payload, sign(payload))
t('parsed event', () => event !== null)
t('from=919876543210', () => event?.from === '919876543210')
t('to=919472673183', () => event?.to === '919472673183')
t('body=YES', () => event?.body === 'YES')

console.log('\n--- status update ---')
const sp = JSON.stringify({ object: 'whatsapp_business_account', entry: [{ id: '1', changes: [{ field: 'messages', value: { messaging_product: 'whatsapp', metadata: { display_phone_number: '1', phone_number_id: '1' }, statuses: [{ id: 's', status: 'delivered' }] } }] }] })
t('returns null', () => adapter.validateWebhook(sp, sign(sp)) === null)

console.log('\n--- parseInbound ---')
const msg = adapter.parseInbound(payload)
t('extracts from/body/id', () => msg?.from === '919876543210' && msg?.body === 'YES' && msg?.messageId === 'wamid.x')

console.log('\n--- sendText (real Meta API) ---')
const r = await adapter.sendText('919876543210', 'Test from Restoloop webhook test')
if (r.success) t(`sent, msgId: ${r.messageId}`, () => true)
else { console.log(`  FAIL ${r.error}`); f++ }

console.log('\n--- getStatus ---')
const st = await adapter.getStatus()
if (st.startsWith('HTTP') || st.startsWith('Error')) { console.log(`  FAIL ${st}`); f++ }
else t(st, () => true)

console.log(`\n${p}/${p + f} passed`)
