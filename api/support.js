/**
 * /api/support — secure bridge between the TruePay app and the Maya Telegram bot
 *
 * The app POSTs here with { text, userName, photo? }
 * This function forwards the message to the configured Telegram chat.
 * Token stays server-side — never exposed to the browser.
 */

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}`
const SUPPORT_CHAT = process.env.SUPPORT_CHAT_ID  // Telegram chat ID where Maya reads messages

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Vercel parses multipart automatically when using formidable-compatible approach
    // For simplicity we read from req.body (works with JSON too)
    const userName = req.body?.userName ?? 'Пользователь'
    const text     = req.body?.text ?? ''

    if (!text && !req.body?.photo) {
      return res.status(400).json({ error: 'No content' })
    }

    if (!SUPPORT_CHAT) {
      // SUPPORT_CHAT_ID not configured yet — still return ok so app doesn't break
      console.warn('SUPPORT_CHAT_ID env var not set')
      return res.status(200).json({ ok: true, warn: 'SUPPORT_CHAT_ID not configured' })
    }

    const message = `📱 *Сообщение из приложения*\n👤 ${userName}\n\n${text}`

    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: SUPPORT_CHAT,
        text: message,
        parse_mode: 'Markdown',
      }),
    })

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Support endpoint error:', err)
    return res.status(500).json({ error: 'Internal error' })
  }
}
