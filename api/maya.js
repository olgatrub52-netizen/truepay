/**
 * POST /api/maya — Прямой канал Майи → немедленное выполнение
 *
 * 1. Майя вызывает этот endpoint с задачей
 * 2. Бот показывает диалог в Telegram (что Майя просит, что делает)
 * 3. Выполняет изменение кода через Claude + GitHub
 * 4. Сообщает результат в Telegram и возвращает Майе в ответе API
 *
 * Request:
 *   Header: x-maya-secret: <MAYA_SECRET>
 *   Body:   { "task": "...", "description": "...", "callbackUrl": "..." }
 *
 * Response:
 *   { "ok": true, "summary": "...", "filesChanged": 2, "deployUrl": "..." }
 */

const TG          = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}`
const GH_API      = 'https://api.github.com'
const GH_OWNER    = process.env.GITHUB_OWNER
const GH_REPO     = process.env.GITHUB_REPO
const GH_TOKEN    = process.env.GITHUB_TOKEN
const CHAT_ID     = process.env.SUPPORT_CHAT_ID ?? '1587586437'
const APP_URL     = 'https://truepay-kappa.vercel.app'

// ─── Telegram ─────────────────────────────────────────────────────────────────

async function say(text) {
  const r = await fetch(`${TG}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text }),
  })
  if (!r.ok) console.error('say() failed:', await r.text())
}

// ─── GitHub ───────────────────────────────────────────────────────────────────

const GH_HEADERS = {
  Authorization: `Bearer ${GH_TOKEN}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'content-type': 'application/json',
}

async function ghGet(path) {
  const r = await fetch(`${GH_API}/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, { headers: GH_HEADERS })
  if (!r.ok) return null
  const d = await r.json()
  return { content: Buffer.from(d.content, 'base64').toString('utf8'), sha: d.sha }
}

async function ghPut(path, content, message, sha) {
  const body = {
    message,
    content: Buffer.from(content, 'utf8').toString('base64'),
    branch: 'main',
  }
  if (sha) body.sha = sha
  const r = await fetch(`${GH_API}/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
    method: 'PUT', headers: GH_HEADERS, body: JSON.stringify(body),
  })
  return r.ok
}

// ─── Smart file selection ─────────────────────────────────────────────────────

const FILE_ROUTES = [
  { keys: ['home', 'главн', 'баланс', 'chart', 'график', 'приветств'], files: ['src/screens/HomeScreen.jsx', 'src/App.jsx'] },
  { keys: ['card', 'карт', 'заморо', 'frost', 'freeze'],               files: ['src/screens/CardsScreen.jsx', 'src/components/card/GlassCard.jsx'] },
  { keys: ['payment', 'платеж', 'транзакц', 'transfer', 'перевод'],    files: ['src/screens/PaymentsScreen.jsx', 'src/screens/TransferScreen.jsx'] },
  { keys: ['profile', 'профил', 'kyc', 'верифик', 'support'],          files: ['src/screens/ProfileScreen.jsx', 'src/screens/SupportScreen.jsx'] },
  { keys: ['limit', 'лимит', 'slider'],                                 files: ['src/screens/LimitsScreen.jsx', 'src/components/ui/Slider.jsx'] },
  { keys: ['topup', 'пополн', 'crypto'],                                files: ['src/screens/TopUpScreen.jsx', 'src/screens/CryptoScreen.jsx'] },
  { keys: ['цвет', 'color', 'фон', 'стиль', 'style', 'шрифт', 'тема'], files: ['src/index.css', 'tailwind.config.js'] },
  { keys: ['tabbar', 'навигац', 'вкладк'],                              files: ['src/components/layout/TabBar.jsx', 'src/App.jsx'] },
]

function pickFiles(task) {
  const lower = task.toLowerCase()
  const set = new Set()
  for (const { keys, files } of FILE_ROUTES) {
    if (keys.some((k) => lower.includes(k))) files.forEach((f) => set.add(f))
  }
  const arr = set.size > 0 ? [...set] : ['src/App.jsx', 'src/screens/HomeScreen.jsx']
  return arr.slice(0, 4)
}

async function readFiles(task) {
  const paths = pickFiles(task)
  const results = await Promise.all(paths.map(async (p) => {
    const f = await ghGet(p)
    return f ? { path: p, content: f.content } : null
  }))
  return results.filter(Boolean)
}

// ─── Claude code generation ───────────────────────────────────────────────────

const CODE_SYSTEM = `Ты — senior React разработчик проекта TruePay (React 19 + Vite + Tailwind CSS 3).
Отвечай ТОЛЬКО валидным JSON без markdown-обёрток.
Формат: {"summary":"Что сделано (по-русски)","files":[{"path":"src/...","content":"полный текст файла"}]}
Правила: в "files" только изменённые файлы, "content" — полное содержимое, не ломай функционал.`

async function generateChanges(task, files) {
  const filesBlock = files.map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``).join('\n\n')

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 8096,
      system: CODE_SYSTEM,
      messages: [{ role: 'user', content: `ЗАДАЧА: ${task}\n\nФАЙЛЫ:\n${filesBlock}` }],
    }),
  })

  const d = await r.json()
  if (!r.ok) throw new Error(JSON.stringify(d.error))

  const raw   = d.content?.[0]?.text ?? ''
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON in Claude response')
  return JSON.parse(match[0])
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({
      info: 'TruePay Maya API',
      usage: 'POST with x-maya-secret header and { task, description, callbackUrl? }',
      secret_header: 'x-maya-secret',
    })
  }

  // Auth
  if (req.headers['x-maya-secret'] !== process.env.MAYA_SECRET) {
    return res.status(401).json({ ok: false, error: 'Invalid secret' })
  }

  const { task, description, callbackUrl } = req.body ?? {}
  if (!task) return res.status(400).json({ ok: false, error: 'task is required' })

  const label = description ?? task

  // Сразу отвечаем Майе — она не будет ждать и не таймаутится
  res.status(200).json({ ok: true, status: 'processing', message: 'Задача принята, выполняю' })

  // Вся работа в фоне после ответа
  ;(async () => {
    try {
      await say(`🤖 Майя: "${label}"`)
      await say('⚙️ Читаю код...')

      const files = await readFiles(task)
      await say(`🧠 Генерирую изменения: ${files.map(f => f.path.split('/').pop()).join(', ')}...`)

      const result = await generateChanges(task, files)

      let committed = 0
      for (const file of result.files ?? []) {
        const existing = await ghGet(file.path)
        const ok = await ghPut(file.path, file.content, `maya: ${result.summary}`, existing?.sha)
        if (ok) committed++
      }

      if (committed === 0) throw new Error('Не удалось применить изменения в GitHub')

      await say(`✅ Майя выполнила: ${result.summary}\n\n📝 Файлов изменено: ${committed}\n🚀 Деплой: ${APP_URL}`)

      if (callbackUrl) {
        fetch(callbackUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ ok: true, summary: result.summary, filesChanged: committed }),
        }).catch(() => {})
      }
    } catch (err) {
      console.error('Maya bg error:', err)
      await say(`❌ Ошибка: ${err.message}`)
    }
  })()
}
