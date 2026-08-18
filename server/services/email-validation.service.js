import dns from 'node:dns/promises'
import net from 'node:net'
import crypto from 'node:crypto'
import { Resolver } from 'node:dns/promises'
import { AppError } from '../utils/response.js'
import { env } from '../config/env.js'

const EMAIL_REGEX =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i

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

const PLACEHOLDER_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'test.com',
  'test.org',
  'localhost',
  'invalid.com',
  'email.com',
  'mail.com',
])

const EMAIL_NOT_FOUND_MESSAGE = 'This email does not exist. Enter a valid email address.'

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
          send('EHLO studentsuccess.local')
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
          send('MAIL FROM:<noreply@studentsuccess.local>')
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
          else if (code === 550 || code === 551 || code === 552 || code === 553 || code === 554) finish('invalid')
          else finish('unknown')
        }
      }
    })
  })
}

async function probeMailboxOnHosts(email, mxRecords, timeoutMs) {
  const hosts = [...mxRecords].sort((a, b) => a.priority - b.priority).slice(0, 3)
  let sawUnknown = false

  for (const record of hosts) {
    const result = await probeMailbox(email, record.exchange, timeoutMs)
    if (result === 'invalid') return 'invalid'
    if (result === 'valid') return 'valid'
    sawUnknown = true
  }

  return sawUnknown ? 'unknown' : 'unknown'
}

/**
 * Validates that an email is well-formed and that the mailbox exists.
 * Rejects invalid formats, disposable/placeholder domains, domains without MX,
 * and mailboxes that the receiving server says do not exist.
 */
export async function assertDeliverableEmail(rawEmail) {
  const email = normalizeEmail(rawEmail)

  if (!email || !isValidFormat(email)) {
    throw new AppError('Enter a valid email address', 400, 'INVALID_EMAIL')
  }

  const domain = email.split('@')[1]
  if (!domain || DISPOSABLE_DOMAINS.has(domain) || PLACEHOLDER_DOMAINS.has(domain)) {
    throw new AppError(EMAIL_NOT_FOUND_MESSAGE, 400, 'EMAIL_NOT_FOUND')
  }

  let mxRecords
  try {
    mxRecords = await resolveMxRecords(domain)
  } catch {
    throw new AppError(EMAIL_NOT_FOUND_MESSAGE, 400, 'EMAIL_NOT_FOUND')
  }

  if (!Array.isArray(mxRecords) || mxRecords.length === 0) {
    throw new AppError(EMAIL_NOT_FOUND_MESSAGE, 400, 'EMAIL_NOT_FOUND')
  }

  mxRecords.sort((a, b) => a.priority - b.priority)

  const timeoutMs = env.email.verifyTimeoutMs
  const probe = await probeMailboxOnHosts(email, mxRecords, timeoutMs)

  if (probe === 'invalid') {
    throw new AppError(EMAIL_NOT_FOUND_MESSAGE, 400, 'EMAIL_NOT_FOUND')
  }

  if (probe === 'valid') {
    const decoyLocal = `no-mailbox-${crypto.randomBytes(8).toString('hex')}`
    const decoy = await probeMailboxOnHosts(`${decoyLocal}@${domain}`, mxRecords, timeoutMs)
    if (decoy === 'invalid') {
      return { email, verifiedBy: 'smtp', mailboxConfirmed: true }
    }
    // Catch-all: the server accepts addresses that do not exist.
    throw new AppError(EMAIL_NOT_FOUND_MESSAGE, 400, 'EMAIL_NOT_FOUND')
  }

  throw new AppError(EMAIL_NOT_FOUND_MESSAGE, 400, 'EMAIL_NOT_FOUND')
}
