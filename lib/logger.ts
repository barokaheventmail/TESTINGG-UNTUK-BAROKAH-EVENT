/* eslint-disable no-console */

type Level = 'info' | 'warn' | 'error'
type Fields = Record<string, unknown>

function write(level: Level, msg: string, fields?: Fields) {
  const entry = {
    t: new Date().toISOString(),
    level,
    msg,
    ...fields,
  }
  if (process.env.NODE_ENV === 'production') {
    console[level](JSON.stringify(entry))
  } else {
    const icon = level === 'error' ? '✖' : level === 'warn' ? '⚠' : 'ℹ'
    const suffix = fields && Object.keys(fields).length ? ` ${JSON.stringify(fields)}` : ''
    console[level](`${icon} ${msg}${suffix}`)
  }
}

export const logger = {
  info: (msg: string, fields?: Fields) => write('info', msg, fields),
  warn: (msg: string, fields?: Fields) => write('warn', msg, fields),
  error: (msg: string, fields?: Fields) => write('error', msg, fields),
}