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

const CHAT_SYSTEM = `Ты — AI-ассистент и полный эксперт проекта TruePay. Ты знаешь ВЕСЬ код проекта наизусть.
Живой сайт: ${APP_URL}
GitHub: https://github.com/${GH_OWNER}/${GH_REPO}
Отвечай по-русски, кратко и конкретно. Если задача — изменить код, скажи что понял и что сделаешь.

══════════════════════════════════════════
ПОЛНОЕ ЗНАНИЕ ПРОЕКТА TRUEPAY
══════════════════════════════════════════

## Стек
- React 19 + Vite 6 + Tailwind CSS 3
- Recharts (Area Chart на главном экране)
- Vercel (хостинг + serverless functions)
- Clean Architecture: screens/, components/, services/, data/

## Дизайн-система
- Тема: тёмная, "Quiet Luxury"
- Цвета: surface (#07090f глубокий чёрный), accent (#0ea5e9 электрический синий), ink (белый)
- Шрифт: Inter
- Glassmorphism: backdrop-blur, rgba backgrounds, border white/[0.06]
- Анимации (keyframes в tailwind.config.js):
  • slide-in-right / slide-in-left — переходы между табами
  • card-lift — подъём карты при нажатии
  • freeze-in / freeze-out / frost-pulse — эффект заморозки карты
  • success-bounce / success-ripple / check-draw — анимация успеха TopUp
  • skeleton / row-in — skeleton loading в PaymentsScreen
  • fade-in, pulse-glow

## Файловая структура
src/
├── App.jsx                    — главный компонент, вся state машина
├── main.jsx                   — точка входа React
├── index.css                  — глобальные стили, .tp-skeleton, .tp-slider
├── screens/
│   ├── OnboardingScreen.jsx   — регистрация/вход (email + password)
│   ├── BiometricGateScreen.jsx — биометрический экран после регистрации
│   ├── HomeScreen.jsx         — главный экран (баланс, карта, chart, actions)
│   ├── CardsScreen.jsx        — экран карты с заморозкой
│   ├── PaymentsScreen.jsx     — история транзакций со skeleton loading
│   ├── ProfileScreen.jsx      — профиль, KYC статус, Support кнопка
│   ├── TopUpScreen.jsx        — пополнение счёта с анимацией успеха
│   ├── TransferScreen.jsx     — перевод средств
│   ├── LimitsScreen.jsx       — слайдеры лимитов
│   ├── KYCScreen.jsx          — верификация (3 шага: биометрия → документ → done)
│   ├── SupportScreen.jsx      — чат поддержки с AI-ботом (паттерн-матчинг)
│   └── CryptoScreen.jsx       — заглушка крипто
├── components/
│   ├── card/GlassCard.jsx     — PreviewCard + FullCard + FrostOverlay
│   ├── layout/TabBar.jsx      — нижний таббар (4 вкладки) с blur
│   ├── icons/index.jsx        — все SVG иконки
│   ├── transaction/
│   │   ├── TransactionItem.jsx
│   │   └── TxDetailSheet.jsx
│   └── ui/
│       ├── Slider.jsx         — кастомный range slider с заливкой трека
│       ├── SpendingChart.jsx  — Recharts AreaChart
│       ├── Toggle.jsx         — кастомный переключатель
│       ├── Toast.jsx          — всплывающее уведомление
│       ├── ScreenChrome.jsx   — обёртка экрана (заголовок + кнопка назад)
│       └── EmptyState.jsx
├── data/mockData.js           — MOCK_CARD, MOCK_TRANSACTIONS, MOCK_BALANCE, SPENDING_DATA
└── services/
    ├── authService.js         — localStorage сессия (readSession/writeSession/clearSession)
    └── apiService.js          — mock API стабы

api/
└── bot.js                     — этот Telegram бот (Vercel serverless)

## App.jsx — State машина
Состояния верхнего уровня:
- user: null | объект (из localStorage)
- showGate: bool — показать биометрический экран
- verifyDraft: null | объект — черновик после регистрации
- tab: 'home' | 'cards' | 'payments' | 'profile'
- slideDir: 1 | -1 — направление анимации таба
- modal: null | 'topup' | 'transfer' | 'limits' | 'crypto' | 'kyc' | 'support'
- balance: number (из MOCK_BALANCE.available = 8420.50)
- transactions: массив (из MOCK_TRANSACTIONS)
- spendingData: массив для Area Chart (динамически обновляется при TopUp)
- kycVerified: bool (dev toggle в ProfileScreen)

Логика навигации:
- TAB_ORDER = ['home', 'cards', 'payments', 'profile']
- handleTabChange вычисляет slideDir по индексу → slide-in-right или slide-in-left
- key={tab} на обёртке форсирует ремаунт и перезапуск анимации
- Модальные экраны рендерятся вместо всего лейаута (не поверх)

## HomeScreen.jsx
Props: user, balance, transactions, card, spendingData, onAction, onTabChange
Особенности:
- cardLifting state → handleCardPress → animate scale(1.045) translateY(-6px) → navigate to 'cards'
- PreviewCard нажимается → card-lift анимация → переход на CardsScreen
- nfcFlash state → мигание иконки NFC
- SpendingChart получает spendingData prop
- Кнопки: Пополнить (→modal topup), Перевести (→modal transfer), Лимиты (→modal limits), Крипто (→modal crypto)
- weekTotal считается через useMemo по spendingData

## CardsScreen.jsx
Props: card, showToast
Состояния: frozen (bool), freezing (bool — блокировка двойного нажатия)
Особенности:
- toggleFreeze → frozen state → передаётся в FullCard как prop
- Когда frozen=true: FullCard показывает FrostOverlay (иней поверх карты)
- ActionRow disabled когда frozen
- Кнопка "Заморозить/Разморозить" — анимированная, меняет стиль

## GlassCard.jsx (components/card/)
Экспортирует: PreviewCard, FullCard
FrostOverlay — накладывается поверх FullCard когда frozen=true:
- Fine ice-crystal noise texture
- Blue-white gradient wash
- Diagonal ice-line hatching
- Corner snowflakes с animate-frost-pulse
- Центральный badge "❄ ЗАМОРОЖЕНА" с glassmorphism

## PaymentsScreen.jsx
Props: transactions
Skeleton loading: loading state → useEffect с setTimeout 1300ms → потом fade-in транзакций
SkeletonRow + SkeletonGroup компоненты используют .tp-skeleton класс
Транзакции группируются по дате, каждая строка с animate-row-in + staggered delay

## ProfileScreen.jsx
Props: user, onLogout, onKyc, onSupport, kycVerified, onKycToggle, showToast
VerificationBanner компонент:
- kycVerified=false → янтарная плашка "Action Required / Verify Identity" + кнопка "Верифицировать сейчас →"
- kycVerified=true → зелёная плашка "✅ Verified Resident · Апрель 2026"
- DEV toggle (маленький) для переключения статуса
Support кнопка → onSupport() → modal 'support' → SupportScreen

## KYCScreen.jsx
Props: onBack, onComplete
3 шага: 0=bio, 1=passport, 2=done
- Step 0: runBio() → 1200ms delay → setStep(1)
- Step 1: fileRef для загрузки фото паспорта → finish() → setStep(2)
- Step 2: кнопка "На главную" → onComplete?.() + onBack()
onComplete вызывается когда KYC завершён → setKycVerified(true) в App.jsx

## TopUpScreen.jsx
Успешный флоу: ввод суммы → Confirm → pending=true → SuccessOverlay
SuccessOverlay: animate-success-ripple (3 кольца) + animate-success-bounce (круг) + animate-check-draw (SVG галочка)
useEffect auto-dismiss через 2200ms → onDone() → onSuccess({type:'topup', amount, method}) → App обновляет balance+transactions+spendingData

## LimitsScreen.jsx
Slider компонент (components/ui/Slider.jsx):
- CSS custom property --track-fill устанавливается inline style
- .tp-slider в index.css: -webkit-appearance:none, градиентный трек, белый thumb с box-shadow
- Пресеты (PresetChips): чипы с быстрым выбором значений
- Дневной лимит покупок: $100-$10000, шаг $100, дефолт $2500
- Лимит ATM: $0-$2000, шаг $50, дефолт $500
- Toggles: онлайн-покупки, зарубежные операции

## SupportScreen.jsx
Паттерн-матчинг ответов бота:
- 'пополн' → информация о пополнении
- 'карт' → информация о карте
- 'лимит' → перейди в Settings → Лимиты
- 'перевод', 'kyc', 'крипто', 'спасибо' — соответствующие ответы
TypingIndicator: 3 точки с animate-pulse-glow и staggered animationDelay
Быстрые ответы (QUICK_REPLIES): Пополнить счёт, Проблема с картой, Лимиты трат, Статус KYC
BotAvatar: "TP" инициалы в синем круге

## SpendingChart.jsx (components/ui/)
Recharts: ResponsiveContainer → AreaChart → Area (monotone, linearGradient fill)
CustomTooltip для hover
isAnimationActive=true → плавное обновление при изменении данных

## Slider.jsx (components/ui/)
Props: value, min, max, step, onChange, formatValue, label, showRange, accent
CSS var --track-fill передаётся через style prop для заполнения трека

## TabBar.jsx
4 таба: home (🏠), cards (💳), payments (📊), profile (👤)
backdrop-blur эффект снизу
active tab подсвечивается accent цветом

## mockData.js
MOCK_BALANCE = { available: 8420.50, pending: 150.00, currency: 'USD' }
MOCK_CARD = { id, last4: '4291', brand: 'Visa', holder: 'Denis I.', expiry: '09/28', color: '#0f172a' }
MOCK_TRANSACTIONS = массив из ~15 транзакций (Uber, Netflix, Starbucks, Apple, Amazon, Zara, TopUp...)
SPENDING_DATA = 7 точек для недельного Area Chart
formatUsdParts(amount) → { intWithSep, decPart }
nextTxId() → генерирует уникальный ID транзакции

## authService.js
localStorage ключ: 'truepay_session'
readSession() → JSON.parse или null
writeSession(user) → JSON.stringify
clearSession() → removeItem

## История разработки
Проект создан с нуля в Cursor IDE:
1. Базовая структура + дизайн-система (цвета, шрифты, Tailwind config)
2. Основные экраны (Onboarding, Home, Cards, Payments, Profile)
3. Навигация: direction-aware tab transitions, card-lift при нажатии
4. Эффект заморозки карты (FrostOverlay с инеем)
5. Skeleton loading в Payments, success анимация в TopUp
6. Динамический Area Chart (обновляется при пополнении)
7. Recharts интеграция
8. KYC экран (3 шага)
9. LimitsScreen со слайдерами
10. ProfileScreen с KYC статусом (Verified/Action Required)
11. SupportScreen чат-интерфейс
12. Telegram бот (этот файл) — голос + код + GitHub деплой
13. Деплой на Vercel: ${APP_URL}

Ты знаешь каждый файл, каждый компонент, каждое решение. Отвечай уверенно и конкретно.`

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

// ─── Maya directive approval / rejection ─────────────────────────────────────

async function readPending(id) {
  const path = `directives/pending_${id}.json`
  const res  = await fetch(`${GH_API}/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
    },
  })
  if (!res.ok) return null
  const data = await res.json()
  return {
    directive: JSON.parse(Buffer.from(data.content, 'base64').toString('utf8')),
    sha: data.sha,
  }
}

async function deletePending(id, sha) {
  const path = `directives/pending_${id}.json`
  await fetch(`${GH_API}/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ message: `maya: remove directive ${id}`, sha, branch: 'main' }),
  })
}

async function editMessageText(chatId, messageId, text) {
  await fetch(`${TELEGRAM_API}/editMessageText`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, reply_markup: { inline_keyboard: [] } }),
  })
}

async function handleMayaApproval(chatId, id, messageId) {
  // Update the approval message immediately
  await editMessageText(chatId, messageId, `⏳ Выполняю директиву Майи...`)

  const pending = await readPending(id)
  if (!pending) {
    await sendMessage(chatId, `❌ Директива ${id} не найдена или уже выполнена.`)
    return
  }

  const { directive, sha } = pending
  await deletePending(id, sha)

  // Execute as a code task
  await handleCodeTask(chatId, directive.task, {})

  // Update the original message to show it's done
  await editMessageText(chatId, messageId, `✅ Директива Майи выполнена:\n"${directive.description}"`)
}

async function rejectMayaDirective(chatId, id, messageId) {
  const pending = await readPending(id)
  if (pending) await deletePending(id, pending.sha)
  await editMessageText(chatId, messageId, `❌ Директива отклонена.`)
  await sendMessage(chatId, '👍 Ок, изменение отменено.')
}

// ─── Deduplication (module-level, survives warm Lambda re-use) ───────────────
// Prevents Telegram webhook retries from triggering the same task multiple times
const seenMsgIds = new Set()
setInterval(() => { if (seenMsgIds.size > 500) seenMsgIds.clear() }, 5 * 60 * 1000)

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'TruePay Autonomous Bot 🤖', app: APP_URL })
  }

  // Return 200 to Telegram IMMEDIATELY so it never retries
  res.status(200).json({ ok: true })

  try {
    const body = req.body ?? {}

    // ── Inline keyboard button pressed (approve/reject Maya directive) ──────
    if (body.callback_query) {
      const cq     = body.callback_query
      const chatId = cq.message?.chat?.id
      const data   = cq.data ?? ''

      fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ callback_query_id: cq.id }),
      })

      if (data.startsWith('approve_')) {
        const id = data.replace('approve_', '')
        await handleMayaApproval(chatId, id, cq.message?.message_id)
      } else if (data.startsWith('reject_')) {
        const id = data.replace('reject_', '')
        await rejectMayaDirective(chatId, id, cq.message?.message_id)
      }

      return
    }

    const { message } = body
    const chatId = message?.chat?.id
    if (!chatId) return

    // Deduplicate — ignore if we already processed this message_id
    const msgId = message.message_id
    if (msgId) {
      if (seenMsgIds.has(msgId)) return
      seenMsgIds.add(msgId)
    }

    // Thread context — keeps all replies inside the same thread
    const ctx = {
      threadId:  message.message_thread_id ?? null,
      replyToId: msgId ?? null,
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
      return
    }

    sendTyping(chatId, ctx)

    // Transcribe voice
    let userText = text
    if (!userText && voice) {
      try {
        userText = await transcribeVoice(voice.file_id)
        if (!userText) {
          await sendMessage(chatId, '🎙 Ничего не расслышал, попробуй ещё раз.', ctx)
          return
        }
        await sendMessage(chatId, `🎙 ${userText}`, ctx)
        sendTyping(chatId, ctx)
      } catch (e) {
        await sendMessage(chatId, '🎙 Не удалось расшифровать голосовое.', ctx)
        return
      }
    }

    if (!userText) return

    // Route: code task or chat
    if (isCodeTask(userText)) {
      await handleCodeTask(chatId, userText, ctx)
    } else {
      const reply = await chatReply(chatId, userText)
      await sendMessage(chatId, reply, ctx)
    }
  } catch (err) {
    console.error('Handler error:', err)
  }
}
