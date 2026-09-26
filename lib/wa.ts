export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return ''
  const digits = phone.replace(/\D+/g, '').replace(/^\+/, '')
  if (digits.startsWith('628')) return digits
  if (digits.startsWith('62')) return digits
  if (digits.startsWith('0')) return '62' + digits.slice(1)
  if (digits.startsWith('8')) return '62' + digits
  return digits
}

export function waLink(phone: string | null | undefined): string {
  const normalized = normalizePhone(phone)
  return normalized ? `https://wa.me/${normalized}` : ''
}