import { WhatsAppAdapter } from './types'
import { OpenWAAdapter } from './openwa'
import { MetaAdapter } from './meta'

export function createWhatsAppAdapter(): WhatsAppAdapter {
  const provider = process.env.WHATSAPP_PROVIDER || 'openwa'

  if (provider === 'meta') {
    return new MetaAdapter()
  }

  return new OpenWAAdapter()
}
