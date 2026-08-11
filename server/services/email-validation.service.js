import dns from 'node:dns/promises'
import net from 'node:net'
import { Resolver } from 'node:dns/promises'
import { AppError } from '../utils/response.js'
import { env } from '../config/env.js'

const EMAIL_REGEX =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i

/** Common disposable / throwaway domains rejected for industrial accounts */
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'yopmail.com',
  'trashmail.com',
  'sharklasers.com',
  'getnada.com',
  'maildrop.cc',
])

function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase()
}

function isValidFormat(email) {
  return EMAIL_REGEX.test(email) && email.length <= 254
}

async function resolveMxRecords(domain) {
  const attempts = [
    async () => dns.resolveMx(domain),
    async () => {
      const resolver = new Resolver()
      resolver.setServers(['8.8.8.8', '1.1.1.1'])
      return resolver.resolveMx(domain)
    },
    async () => {
      const resolver = new Resolver()
      resolver.setServers(['1.1.1.1', '8.8.4.4'])
      return resolver.resolveMx(domain)
    },
  ]

  let lastError
  for (const attempt of attempts) {
    try {
      const records = await attempt()
      if (Array.isArray(records) && records.length > 0) return records
    } catch (error) {
      lastError = error
    }
  }

  throw lastError ?? new Error('No MX records')
}

/**
 * Probe recipient MX with SMTP RCPT TO.
 * Returns: 'valid' | 'invalid' | 'unknown'
 */
function probeMailbox(email, mxHost, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: mxHost, port: 25 })
    let settled = false
    let buffer = ''
    let step = 0

    const finish = (result) => {
      if (settled) return
      settled = true
      try {
        socket.destroy()
      } catch {
        // ignore
      }
      resolve(result)
    }

    const timer = setTimeout(() => finish('unknown'), timeoutMs)

    const send = (line) => {
      socket.write(`${line}\r\n`)
    }

    socket.setEncoding('utf8')
    socket.on('error', () => {
      clearTimeout(timer)
      finish('unknown')
    })

    socket.on('data', (chunk) => {
      buffer += chunk
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!/^\d{3}[\s-]/.test(line)) continue
        const code = Number(line.slice(0, 3))

        if (step === 0) {
          if (code !== 220) {
            clearTimeout(timer)
            finish('unknown')
            return
          }
          step = 1
          send(`EHLO studentsuccess.local`)
          continue
        }

        if (step === 1) {
          if (code >= 400) {
            clearTimeout(timer)
            finish('unknown')
            return
          }
          if (line.startsWith('250-')) continue
          if (code !== 250) continue
          step = 2
          send(`MAIL FROM:<noreply@studentsuccess.local>`)
          continue
        }

        if (step === 2) {
          if (code !== 250) {
            clearTimeout(timer)
            finish('unknown')
            return
          }
          step = 3
          send(`RCPT TO:<${email}>`)
          continue
        }

        if (step === 3) {
          clearTimeout(timer)
          send('QUIT')
          if (code === 250 || code === 251) finish('valid')
          else if (code === 550 || code === 551 || code === 553 || code === 554) finish('invalid')
          else finish('unknown')
        }
      }
    })
  })
}

/**
 * Validates that an email is well-formed and can receive mail.
 * Rejects invalid formats, disposable domains, domains without MX, and
 * mailboxes that SMTP servers confirm do not exist.
 */
export async function assertDeliverableEmail(rawEmail) {
  const email = normalizeEmail(rawEmail)

  if (!email || !isValidFormat(email)) {
    throw new AppError('Enter a valid email address', 400, 'INVALID_EMAIL')
  }

  const domain = email.split('@')[1]
  if (!domain || DISPOSABLE_DOMAINS.has(domain)) {
    throw new AppError(
      'Enter a valid professional work email. Disposable addresses are not allowed.',
      400,
      'INVALID_EMAIL',
    )
  }

  let mxRecords
  try {
    mxRecords = await resolveMxRecords(domain)
  } catch {
    throw new AppError(
      'The entered email does not exist or its domain cannot receive mail. Enter a valid email.',
      400,
      'EMAIL_NOT_FOUND',
    )
  }

  if (!Array.isArray(mxRecords) || mxRecords.length === 0) {
    throw new AppError(
      'The entered email does not exist or its domain cannot receive mail. Enter a valid email.',
      400,
      'EMAIL_NOT_FOUND',
    )
  }

  mxRecords.sort((a, b) => a.priority - b.priority)

  if (env.email.verifyMode === 'mx') {
    return { email, verifiedBy: 'mx' }
  }

  const host = mxRecords[0].exchange
  const probe = await probeMailbox(email, host, env.email.verifyTimeoutMs)

  if (probe === 'invalid') {
    throw new AppError(
      'The entered email does not exist. Enter a valid email address.',
      400,
      'EMAIL_NOT_FOUND',
    )
  }

  if (probe === 'unknown' && env.email.verifyStrict) {
    throw new AppError(
      'Unable to verify that this email exists. Enter a valid, reachable work email.',
      400,
      'EMAIL_UNVERIFIED',
    )
  }

  return { email, verifiedBy: probe === 'valid' ? 'smtp' : 'mx' }
}
