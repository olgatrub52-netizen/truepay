/**
 * TruePay Autonomous Bot — Vercel Serverless Function
 *
 * Pipeline:
 *   Telegram message → detect intent → (code task?) →
 *   read files from GitHub → Claude generates changes →
 *   commit via GitHub API → Vercel auto-deploys
 */

const TELEGRAM_API  = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}`
const GROQ_BASE     = 'https://api.groq.com/openai/v1'
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const GH_API        = 'https://api.github.com'
const APP_URL       = 'https://truepay-kappa.vercel.app'

const GH_OWNER = process.env.GITHUB_OWNER
const GH_REPO  = process.env.GITHUB_REPO
const GH_TOKEN = process.env.GITHUB_TOKEN

// ─── File routing by keyword ─────────────────────────────────────────────────
// Only read files relevant to the task — keeps function under Vercel time limit

const FILE_ROUTES = [
  { keys: ['home', 'главн', 'баланс', 'chart', 'график', 'приветств'],  files: ['src/screens/HomeScreen.jsx', 'src/App.jsx'] },
  { keys: ['card', 'карт', 'заморо', 'frost', 'freeze'],                files: ['src/screens/CardsScreen.jsx', 'src/components/card/GlassCard.jsx'] },
  { keys: ['payment', 'платеж', 'транзакц', 'перевод', 'transfer'],     files: ['src/screens/PaymentsScreen.jsx', 'src/screens/TransferScreen.jsx'] },
  { keys: ['profile', 'профил', 'kyc', 'верифик', 'support', 'поддерж'],files: ['src/screens/ProfileScreen.jsx', 'src/screens/SupportScreen.jsx'] },
  { keys: ['limit', 'лимит', 'slider', 'слайдер'],                      files: ['src/screens/LimitsScreen.jsx', 'src/components/ui/Slider.jsx'] },
  { keys: ['topup', 'пополн', 'crypto', 'крипто'],                      files: ['src/screens/TopUpScreen.jsx', 'src/screens/CryptoScreen.jsx'] },
  { keys: ['цвет', 'color', 'фон', 'background', 'стиль', 'style', 'шрифт', 'font', 'тема', 'theme'], files: ['src/index.css', 'tailwind.config.js'] },
  { keys: ['tabbar', 'таббар', 'навигац', 'вкладк'],                    files: ['src/components/layout/TabBar.jsx', 'src/App.jsx'] },
  { keys: ['данные', 'data', 'mock', 'баланс'],                         files: ['src/data/mockData.js'] },
]

const DEFAULT_FILES = ['src/App.jsx', 'src/screens/HomeScreen.jsx']

function selectFiles(task) {
  const lower = task.toLowerCase()
  const matched = new Set()
  for (const { keys, files } of FILE_ROUTES) {
    if (keys.some((k) => lower.includes(k))) {
      files.forEach((f) => matched.add(f))
    }
  }
  const result = matched.size > 0 ? [...matched] : DEFAULT_FILES
  return result.slice(0, 4) // max 4 files to stay under time limit
}

// ─── System prompts ───────────────────────────────────────────────────────────

const CHAT_SYSTEM = `Ты — AI-ассистент проекта TruePay.
TruePay — финтех приложение (React + Vite + Tailwind CSS). Живой сайт: ${APP_URL}
Отвечай кратко по-русски. Если задача про изменение кода — скажи что понял и что сделаешь.`

const CODE_SYSTEM = `Ты — senior React разработчик проекта TruePay (React 19 + Vite + Tailwind CSS 3).
Тебе дают файлы проекта и задачу. Отвечай ТОЛЬКО валидным JSON без markdown-обёрток.

Формат:
{"summary":"Что сделано (по-русски)","files":[{"path":"src/...","content":"полный текст файла"}]}

Правила:
- В "files" только изменённые файлы
- "content" — полное содержимое (не diff)
- Не ломай существующий функционал
- Используй только уже импортированные библиотеки`

// ─── Telegram helpers ─────────────────────────────────────────────────────────

async function sendMessage(chatId, text, ctx = {}) {
  const body = { chat_id: chatId, text }
  if (ctx.threadId)  body.message_thread_id  = ctx.threadId
  if (ctx.replyToId) body.reply_to_message_id = ctx.replyToId
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function sendTyping(chatId, ctx = {}) {
  const body = { chat_id: chatId, action: 'typing' }
  if (ctx.threadId) body.message_thread_id = ctx.threadId
  fetch(`${TELEGRAM_API}/sendChatAction`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ─── Groq Whisper — voice → text ─────────────────────────────────────────────

async function transcribeVoice(fileId) {
  const infoRes  = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`)
  const filePath = (await infoRes.json()).result?.file_path
  if (!filePath) throw new Error('No file path')

  const audioBuffer = await (await fetch(
    `https://api.telegram.org/file/bot${process.env.TELEGRAM_TOKEN}/${filePath}`
  )).arrayBuffer()

  const form = new FormData()
  form.append('file', new Blob([audioBuffer], { type: 'audio/ogg' }), 'voice.ogg')
  form.append('model', 'whisper-large-v3-turbo')
  form.append('language', 'ru')
  form.append('response_format', 'json')

  const res  = await fetch(`${GROQ_BASE}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: form,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message ?? 'Whisper failed')
  return data.text?.trim() ?? ''
}

// ─── GitHub API helpers ───────────────────────────────────────────────────────

const GH_HEADERS = () => ({
  Authorization: `Bearer ${GH_TOKEN}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'content-type': 'application/json',
})

async function ghGetFile(path) {
  const res  = await fetch(`${GH_API}/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
    headers: GH_HEADERS(),
  })
  if (!res.ok) return null
  const data = await res.json()
  return {
    content: Buffer.from(data.content, 'base64').toString('utf8'),
    sha: data.sha,
  }
}

async function ghPutFile(path, content, message, sha) {
  const body = {
    message,
    content: Buffer.from(content, 'utf8').toString('base64'),
    branch: 'main',
  }
  if (sha) body.sha = sha

  const res = await fetch(`${GH_API}/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
    method: 'PUT',
    headers: GH_HEADERS(),
    body: JSON.stringify(body),
  })
  return res.ok
}

// ─── Read selected files from GitHub ─────────────────────────────────────────

async function readProjectFiles(task) {
  const paths   = selectFiles(task)
  const results = await Promise.all(
    paths.map(async (path) => {
      const file = await ghGetFile(path)
      return file ? { path, content: file.content } : null
    })
  )
  return results.filter(Boolean)
}

// ─── Claude — generate code changes ──────────────────────────────────────────

async function generateCodeChanges(task, files) {
  const filesBlock = files
    .map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
    .join('\n\n')

  const res  = await fetch(ANTHROPIC_API, {
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
      messages: [{
        role: 'user',
        content: `ЗАДАЧА: ${task}\n\nФАЙЛЫ ПРОЕКТА:\n${filesBlock}`,
      }],
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    console.error('Claude error:', JSON.stringify(data))
    throw new Error('Claude API error')
  }

  const raw = data.content?.[0]?.text ?? ''

  // Extract JSON — find first { ... } block even if Claude adds text around it
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) {
    console.error('No JSON in Claude response:', raw.slice(0, 300))
    throw new Error('No JSON in response')
  }
  return JSON.parse(match[0])
}

// ─── Claude chat (conversational, no code) ───────────────────────────────────

const convHistory = {}

async function chatReply(chatId, text) {
  if (!convHistory[chatId]) convHistory[chatId] = []
  convHistory[chatId].push({ role: 'user', content: text })
  if (convHistory[chatId].length > 20) convHistory[chatId] = convHistory[chatId].slice(-20)

  const res  = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: CHAT_SYSTEM,
      messages: convHistory[chatId],
    }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error('Claude chat error')
  const reply = data.content?.[0]?.text ?? 'Нет ответа.'
  convHistory[chatId].push({ role: 'assistant', content: reply })
  return reply
}

// ─── Detect if message is a coding task ──────────────────────────────────────

const CODE_KEYWORDS = [
  'сделай', 'измени', 'добавь', 'удали', 'убери', 'поменяй', 'исправь',
  'создай', 'напиши', 'переделай', 'обнови', 'замени', 'покрась', 'цвет',
  'кнопк', 'экран', 'текст', 'шрифт', 'анимац', 'компонент', 'стиль',
  'make', 'add', 'change', 'remove', 'update', 'fix', 'create',
]

function isCodeTask(text) {
  const lower = text.toLowerCase()
  return CODE_KEYWORDS.some((kw) => lower.includes(kw))
}

// ─── Main code-change pipeline ───────────────────────────────────────────────

async function handleCodeTask(chatId, task, ctx = {}) {
  await sendMessage(chatId, '⚙️ Понял! Читаю код и готовлю изменения...', ctx)

  let files
  try {
    files = await readProjectFiles(task)
  } catch (e) {
    await sendMessage(chatId, '❌ Не удалось прочитать файлы с GitHub.', ctx)
    return
  }

  await sendMessage(chatId, '🧠 Генерирую изменения...', ctx)

  let result
  try {
    result = await generateCodeChanges(task, files)
  } catch (e) {
    console.error('Code gen error:', e)
    await sendMessage(chatId, '❌ Ошибка при генерации кода. Попробуй ещё раз.', ctx)
    return
  }

  let committed = 0
  for (const file of result.files ?? []) {
    const existing = await ghGetFile(file.path)
    const ok = await ghPutFile(
      file.path,
      file.content,
      `bot: ${result.summary}`,
      existing?.sha,
    )
    if (ok) committed++
  }

  if (committed === 0) {
    await sendMessage(chatId, '❌ Не удалось применить изменения в GitHub.', ctx)
    return
  }

  await sendMessage(chatId,
    `✅ Готово! ${result.summary}\n\n` +
    `📝 Изменено файлов: ${committed}\n` +
    `🚀 Деплой запущен — через ~30 сек на сайте:\n${APP_URL}`,
    ctx
  )
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'TruePay Autonomous Bot 🤖', app: APP_URL })
  }

  try {
    const { message } = req.body ?? {}
    const chatId = message?.chat?.id
    if (!chatId) return res.status(200).json({ ok: true })

    // Thread context — keeps all replies inside the same thread
    const ctx = {
      threadId:  message.message_thread_id ?? null,
      replyToId: message.message_id ?? null,
    }

    const text  = message.text?.trim()
    const voice = message.voice

    // /start
    if (text === '/start') {
      await sendMessage(chatId,
        '🤖 TruePay Autonomous Bot\n\n' +
        'Я могу:\n' +
        '💬 Отвечать на вопросы о проекте\n' +
        '🎙 Понимать голосовые сообщения\n' +
        '⚡ Вносить изменения в код и деплоить автоматически\n\n' +
        'Примеры команд:\n' +
        '• "Сделай фон главного экрана тёмно-синим"\n' +
        '• "Добавь кнопку Настройки в профиль"\n' +
        '• "Измени приветствие на главном экране"\n\n' +
        `🔗 ${APP_URL}`, ctx
      )
      return res.status(200).json({ ok: true })
    }

    sendTyping(chatId, ctx)

    // Transcribe voice
    let userText = text
    if (!userText && voice) {
      try {
        userText = await transcribeVoice(voice.file_id)
        if (!userText) {
          await sendMessage(chatId, '🎙 Ничего не расслышал, попробуй ещё раз.', ctx)
          return res.status(200).json({ ok: true })
        }
        await sendMessage(chatId, `🎙 ${userText}`, ctx)
        sendTyping(chatId, ctx)
      } catch (e) {
        await sendMessage(chatId, '🎙 Не удалось расшифровать голосовое.', ctx)
        return res.status(200).json({ ok: true })
      }
    }

    if (!userText) return res.status(200).json({ ok: true })

    // Route: code task or chat
    if (isCodeTask(userText)) {
      await handleCodeTask(chatId, userText, ctx)
    } else {
      const reply = await chatReply(chatId, userText)
      await sendMessage(chatId, reply, ctx)
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Handler error:', err)
    return res.status(200).json({ ok: true })
  }
}
