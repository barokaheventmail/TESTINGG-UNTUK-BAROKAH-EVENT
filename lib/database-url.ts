// Prisma menolak DATABASE_URL yang bagian host/credential-nya rusak dengan
// "Error parsing connection string: invalid domain character in database URL".
// Nilai yang disalin dari panel hosting atau terminal sering mengandung spasi,
// tanda kutip, atau karakter terlarang. Fungsi di bawah memperbaiki nilai
// tersebut supaya `next build` tidak berhenti hanya karena format URL.

const URL_PATTERN = /^([a-zA-Z][a-zA-Z0-9+.-]*):\/\/(?:([^@/?#]*)@)?(\[[^\]]*\]|[^:/?#]*)(?::([^/?#]*))?([/?#].*)?$/
// Karakter yang boleh apa adanya di username/password menurut RFC 3986
const CREDENTIAL_SAFE = /[A-Za-z0-9\-._~!$&'()*+,;:=]/
// Karakter yang ditolak parser URL pada bagian host
const HOST_FORBIDDEN = /[\s<>^|"]/g
const HEX_PAIR = /^[0-9A-Fa-f]{2}$/

function stripQuotes(value: string) {
  const quote = value[0]
  if (value.length > 1 && (quote === '"' || quote === "'") && value.endsWith(quote)) return value.slice(1, -1)
  return value
}

function encodeCredential(value: string) {
  let out = ''
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i]
    // Escape yang sudah percent-encoded jangan di-encode dua kali
    if (char === '%' && HEX_PAIR.test(value.slice(i + 1, i + 3))) {
      out += value.slice(i, i + 3)
      i += 2
      continue
    }
    out += CREDENTIAL_SAFE.test(char) ? char : encodeURIComponent(char)
  }
  return out
}

export function normalizeDatabaseUrl(raw?: string | null): string | undefined {
  const value = stripQuotes((raw ?? '').trim())
  if (!value) return undefined

  const match = URL_PATTERN.exec(value)
  if (!match) return value

  const [, scheme, credentials, host, port, rest = ''] = match
  const safeHost = host.replace(HOST_FORBIDDEN, (char) => encodeURIComponent(char))
  // Port non-numerik dibuang supaya Prisma memakai port default, bukan gagal parse
  const safePort = port !== undefined && /^\d+$/.test(port) ? `:${port}` : ''
  const safeCredentials = credentials === undefined ? '' : `${encodeCredential(credentials)}@`

  return `${scheme}://${safeCredentials}${safeHost}${safePort}${rest}`
}
