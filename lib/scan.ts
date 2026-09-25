import QRCode from 'qrcode'

export const QR_PREFIX = 'BTHT:'

export function encodeToken(token: string): string {
  return `${QR_PREFIX}${token}`
}

export function decodeToken(payload: string): string | null {
  const s = payload.trim()
  if (!s) return null
  if (s.startsWith(QR_PREFIX)) return s.slice(QR_PREFIX.length) || null
  if (s.includes('/tiket/')) {
    const seg = s.split('/tiket/').pop()
    if (seg) return seg.split(/[?#]/)[0] || null
  }
  return s
}

export async function qrDataUrl(payload: string, size = 384): Promise<string> {
  return QRCode.toDataURL(payload, {
    margin: 1,
    width: size,
    color: { dark: '#1b3555', light: '#ffffff' },
  })
}