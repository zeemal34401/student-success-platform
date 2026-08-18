import nodemailer from 'nodemailer'
import { env } from '../config/env.js'
import { AppError } from '../utils/response.js'

let transporter
let transporterKey = ''

const PLACEHOLDER_MARKERS = [
  'your-smtp',
  'your_gmail',
  'your-gmail',
  'your_16',
  'your-16',
  'changeme',
  'example.com',
  'noreply@youruniversity',
]

function looksLikePlaceholder(value) {
  const v = String(value ?? '').trim().toLowerCase()
  if (!v) return true
  return PLACEHOLDER_MARKERS.some((marker) => v.includes(marker))
}

export function getSmtpConfigStatus() {
  const host = env.email.smtpHost?.trim() ?? ''
  const user = env.email.smtpUser?.trim() ?? ''
  const pass = env.email.smtpPass ?? ''

  if (!host || !user || !pass) {
    return {
      configured: false,
      reason:
        'Email delivery is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in the server .env file, then restart the API.',
    }
  }

  if (looksLikePlaceholder(user) || looksLikePlaceholder(pass) || looksLikePlaceholder(env.email.from)) {
    return {
      configured: false,
      reason:
        'SMTP credentials still look like placeholders. Set a real SMTP_USER and SMTP_PASS (for Gmail: a 16-character App Password with 2-Step Verification), then restart the API.',
    }
  }

  return { configured: true, reason: null }
}

function assertSmtpConfigured() {
  const status = getSmtpConfigStatus()
  if (!status.configured) {
    throw new AppError(status.reason, 503, 'EMAIL_NOT_CONFIGURED')
  }
}

function buildTransportOptions() {
  const port = env.email.smtpPort
  const secure = env.email.smtpSecure || port === 465
  const options = {
    host: env.email.smtpHost.trim(),
    port,
    secure,
    auth: {
      user: env.email.smtpUser.trim(),
      pass: env.email.smtpPass,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  }

  // STARTTLS on submission ports (Gmail / Outlook / most providers)
  if (!secure && (port === 587 || port === 25)) {
    options.requireTLS = true
  }

  if (env.email.smtpService) {
    options.service = env.email.smtpService
  }

  return options
}

function getTransporter() {
  assertSmtpConfigured()

  const key = [
    env.email.smtpHost,
    env.email.smtpPort,
    env.email.smtpSecure,
    env.email.smtpUser,
    env.email.smtpPass,
    env.email.smtpService,
  ].join('|')

  if (!transporter || transporterKey !== key) {
    transporter = nodemailer.createTransport(buildTransportOptions())
    transporterKey = key
  }

  return transporter
}

function buildInviteHtml({ name, role, department, courses, inviteUrl, invitedBy, expiryHours }) {
  const courseLine =
    courses?.length > 0
      ? `Assigned courses: <strong>${courses.map((c) => escapeHtml(c)).join(', ')}</strong>`
      : 'Course assignments will be confirmed by your administrator.'

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#0F172A;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F8FAFC;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#0B6E4F;padding:24px 28px;color:#ffffff;">
              <p style="margin:0;font-size:13px;opacity:0.85;">PrognosEd · Student Success Platform</p>
              <h1 style="margin:8px 0 0;font-size:22px;font-weight:600;">Activate your account</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Hello ${escapeHtml(name)},</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475467;">
                ${escapeHtml(invitedBy || 'An administrator')} has invited you to join as
                <strong>${escapeHtml(role)}</strong>${department ? ` in <strong>${escapeHtml(department)}</strong>` : ''}.
              </p>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#475467;">${courseLine}</p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#475467;">
                This is your professional system account. Sign in with the email address that received this invitation.
              </p>
              <p style="margin:0 0 28px;">
                <a href="${escapeHtml(inviteUrl)}"
                   style="display:inline-block;background:#0B6E4F;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;font-size:14px;">
                  Set password &amp; activate
                </a>
              </p>
              <p style="margin:0 0 12px;font-size:12px;line-height:1.5;color:#98A2B3;">
                Or paste this link into your browser:<br />
                <a href="${escapeHtml(inviteUrl)}" style="color:#0B6E4F;word-break:break-all;">${escapeHtml(inviteUrl)}</a>
              </p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:#98A2B3;">
                This link expires in ${expiryHours} hours. If it expires, ask your administrator to resend the invitation.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim()
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function describeSmtpError(error) {
  const msg = String(error?.message ?? error ?? '')
  const code = error?.code ?? error?.responseCode

  if (/Invalid login|EAUTH|535|Username and Password not accepted/i.test(msg) || code === 'EAUTH') {
    return 'SMTP authentication failed. For Gmail, enable 2-Step Verification and use a 16-character App Password in SMTP_PASS (not your normal Gmail password).'
  }
  if (/self signed certificate|CERT|UNABLE_TO_VERIFY/i.test(msg)) {
    return 'SMTP TLS certificate verification failed. Check SMTP_HOST / SMTP_PORT, or your network TLS interception settings.'
  }
  if (/ECONNECTION|ETIMEDOUT|ESOCKET|ECONNREFUSED|ENOTFOUND/i.test(msg) || code === 'ESOCKET') {
    return 'Could not connect to the SMTP server. Verify SMTP_HOST and SMTP_PORT, and that outbound port 587 (or 465) is allowed.'
  }
  if (/Recipient|550|551|553|mailbox unavailable/i.test(msg)) {
    return 'The SMTP server rejected the recipient address. Confirm the work email can receive mail.'
  }
  return 'Unable to send the activation email. Verify SMTP settings and that the mailbox can receive mail.'
}

/**
 * Sends the activation invitation to the faculty/staff work email.
 * Fails hard if SMTP is not configured or delivery fails — never returns the invite URL to clients.
 */
export async function sendInviteEmail({ to, name, role, department, courses, inviteUrl, invitedBy }) {
  assertSmtpConfigured()

  if (!to?.trim()) {
    throw new AppError('Invitation recipient email is missing.', 400, 'INVALID_EMAIL')
  }

  const subject = 'Activate your PrognosEd account'
  const expiryHours = env.inviteExpiryHours
  const courseLine =
    courses?.length > 0
      ? `Assigned courses: ${courses.join(', ')}`
      : 'Course assignments will be confirmed by your administrator.'

  const text = [
    `Hello ${name},`,
    '',
    `${invitedBy || 'An administrator'} has invited you to join PrognosEd (Student Success Platform) as ${role}${department ? ` in ${department}` : ''}.`,
    '',
    courseLine,
    '',
    'This is your professional system account. Use the email address this invitation was sent to when you sign in.',
    '',
    'Activate your account and set your password here:',
    inviteUrl,
    '',
    `This link expires in ${expiryHours} hours. If it expires, ask your administrator to resend the invitation.`,
    '',
    '— PrognosEd',
  ].join('\n')

  const html = buildInviteHtml({
    name,
    role,
    department,
    courses,
    inviteUrl,
    invitedBy,
    expiryHours,
  })

  try {
    const transport = getTransporter()
    const info = await transport.sendMail({
      from: env.email.from,
      to: to.trim(),
      subject,
      text,
      html,
    })

    if (info.rejected?.length) {
      console.error('[email] SMTP rejected recipients:', info.rejected)
      throw new AppError(
        'The SMTP server rejected the recipient address. Confirm the work email can receive mail.',
        502,
        'EMAIL_DELIVERY_FAILED',
      )
    }

    console.log(`[email] Invitation sent to ${to} (messageId=${info.messageId ?? 'n/a'})`)

    return {
      delivered: true,
      mode: 'smtp',
      to: to.trim(),
      messageId: info.messageId ?? null,
    }
  } catch (error) {
    if (error instanceof AppError) throw error
    console.error('[email] Invitation delivery failed:', error.message || error)
    throw new AppError(describeSmtpError(error), 502, 'EMAIL_DELIVERY_FAILED')
  }
}

function buildPasswordResetHtml({ name, resetUrl, localUrl, expiryMinutes }) {
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#0F172A;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F8FAFC;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#2C3546;padding:24px 28px;color:#ffffff;">
              <p style="margin:0;font-size:13px;opacity:0.85;">PrognosEd · Student Success Platform</p>
              <h1 style="margin:8px 0 0;font-size:22px;font-weight:600;">Reset your password</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Hello ${escapeHtml(name)},</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475467;">
                We received a request to reset the password for your PrognosEd account.
                If you made this request, use the button below to choose a new password.
              </p>
              <p style="margin:0 0 28px;">
                <a href="${escapeHtml(resetUrl)}"
                   style="display:inline-block;background:#0B6E4F;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;font-size:14px;">
                  Reset password
                </a>
              </p>
              <p style="margin:0 0 12px;font-size:12px;line-height:1.5;color:#98A2B3;">
                Or paste this link into your browser:<br />
                <a href="${escapeHtml(resetUrl)}" style="color:#0B6E4F;word-break:break-all;">${escapeHtml(resetUrl)}</a>
              </p>
              ${
                localUrl && localUrl !== resetUrl
                  ? `<p style="margin:0 0 12px;font-size:12px;line-height:1.5;color:#98A2B3;">
                If you are on the computer running PrognosEd, use this link instead:<br />
                <a href="${escapeHtml(localUrl)}" style="color:#0B6E4F;word-break:break-all;">${escapeHtml(localUrl)}</a>
              </p>`
                  : ''
              }
              <p style="margin:0;font-size:12px;line-height:1.5;color:#98A2B3;">
                This link expires in ${expiryMinutes} minutes and can be used once.
                If you did not request a reset, you can ignore this email — your password will stay the same.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim()
}

export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  assertSmtpConfigured()

  if (!to?.trim()) {
    throw new AppError('Reset recipient email is missing.', 400, 'INVALID_EMAIL')
  }

  const expiryMinutes = env.passwordResetExpiryMinutes
  const localUrl = `http://localhost:${env.port}/reset-password?token=${new URL(resetUrl).searchParams.get('token') ?? ''}`
  const subject = 'Reset your PrognosEd password'
  const text = [
    `Hello ${name},`,
    '',
    'We received a request to reset the password for your PrognosEd account.',
    'If you made this request, open this link to choose a new password:',
    resetUrl,
    localUrl !== resetUrl ? `\nIf you are on the computer running PrognosEd, use:\n${localUrl}\n` : '',
    `This link expires in ${expiryMinutes} minutes and can be used once.`,
    'If you did not request a reset, ignore this email — your password will stay the same.',
    '',
    '— PrognosEd',
  ].filter(Boolean).join('\n')

  try {
    const transport = getTransporter()
    const info = await transport.sendMail({
      from: env.email.from,
      to: to.trim(),
      subject,
      text,
      html: buildPasswordResetHtml({ name, resetUrl, localUrl, expiryMinutes }),
    })

    if (info.rejected?.length) {
      console.error('[email] SMTP rejected password-reset recipients:', info.rejected)
      throw new AppError(
        'Unable to send the reset email. Confirm the mailbox can receive mail.',
        502,
        'EMAIL_DELIVERY_FAILED',
      )
    }

    console.log(`[email] Password reset sent to ${to} (messageId=${info.messageId ?? 'n/a'})`)
    return { delivered: true, messageId: info.messageId ?? null }
  } catch (error) {
    if (error instanceof AppError) throw error
    console.error('[email] Password reset delivery failed:', error.message || error)
    throw new AppError(describeSmtpError(error), 502, 'EMAIL_DELIVERY_FAILED')
  }
}

/** Lightweight connectivity check for ops / startup diagnostics */
export async function verifySmtpConnection() {
  const status = getSmtpConfigStatus()
  if (!status.configured) {
    return { ok: false, reason: status.reason }
  }
  try {
    await getTransporter().verify()
    return { ok: true }
  } catch (error) {
    return { ok: false, reason: describeSmtpError(error) }
  }
}
