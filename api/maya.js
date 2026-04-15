/**
 * POST /api/maya — Maya's entry point
 *
 * Maya calls this endpoint with a code directive.
 * The bot saves it to GitHub and asks the user for approval via Telegram inline keyboard.
 * Execution only happens after the user taps ✅.
 *
 * Request:
 *   Header:  x-maya-secret: <MAYA_SECRET>
 *   Body JSON:
 *     {
 *       "task":        "Измени цвет кнопки пополнения на зелёный",   // what to do (sent to Claude)
 *       "description": "Кнопка TopUp станет зелёной на главном экране" // shown to user for approval
 *     }
 *
 * Response:
 *   { "ok": true, "id": "abc123" }  — directive queued, waiting approval
 *   { "ok": false, "error": "..." } — something went wrong
 */

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}`
const GH_API       = 'https://api.github.com'
const GH_OWNER     = process.env.GITHUB_OWNER
const GH_REPO      = process.env.GITHUB_REPO
const GH_TOKEN     = process.env.GITHUB_TOKEN
const OWNER_CHAT   = process.env.SUPPORT_CHAT_ID  // Denis's personal chat ID

// ─── Save pending directive to GitHub ────────────────────────────────────────

async function savePending(id, task, description) {
  const path    = `directives/pending_${id}.json`
  const content = JSON.stringify({ id, task, description, createdAt: new Date().toISOString() }, null, 2)

  await fetch(`${GH_API}/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      message: `maya: queue directive ${id}`,
      content: Buffer.from(content, 'utf8').toString('base64'),
      branch: 'main',
    }),
  })
}

// ─── Send approval request to owner ──────────────────────────────────────────

async function askApproval(id, description) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: OWNER_CHAT,
      text:
        `🤖 *Майя предлагает изменение:*\n\n` +
        `"${description}"\n\n` +
        `Выполнить?`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ Подтвердить', callback_data: `approve_${id}` },
          { text: '❌ Отклонить',   callback_data: `reject_${id}`  },
        ]],
      },
    }),
  })
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({
      info: 'TruePay Maya API',
      usage: 'POST with header x-maya-secret and body { task, description }',
    })
  }

  // Auth
  const secret = req.headers['x-maya-secret']
  if (!secret || secret !== process.env.MAYA_SECRET) {
    return res.status(401).json({ ok: false, error: 'Invalid secret' })
  }

  const { task, description } = req.body ?? {}
  if (!task) {
    return res.status(400).json({ ok: false, error: 'task is required' })
  }

  const id = Math.random().toString(36).slice(2, 9) // e.g. "a3f8k2z"

  try {
    await savePending(id, task, description ?? task)
    await askApproval(id, description ?? task)
    return res.status(200).json({ ok: true, id, status: 'pending_approval' })
  } catch (err) {
    console.error('Maya handler error:', err)
    return res.status(500).json({ ok: false, error: String(err.message) })
  }
}
