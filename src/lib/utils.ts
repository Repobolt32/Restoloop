export function maskPhone(phone: string): string {
  if (phone.length <= 4) return '****'
  return phone.slice(0, -4) + '****'
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) return digits
  if (digits.length === 11 && digits.startsWith('0')) return '91' + digits.slice(1)
  if (digits.length === 10) return '91' + digits
  return digits
}
