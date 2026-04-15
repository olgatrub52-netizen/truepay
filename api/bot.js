/**
 * TruePay Telegram Bot — Vercel Serverless Function
 *
 * Handles:
 *  • Text messages  → Claude 3.5 Haiku
 *  • Voice messages → OpenAI Whisper (transcription) → Claude 3.5 Haiku
 */

const TELEGRAM_API   = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}`
const GROQ_BASE      = 'https://api.groq.com/openai/v1'
const GROQ_STT       = `${GROQ_BASE}/audio/transcriptions`
const GROQ_CHAT      = `${GROQ_BASE}/chat/completions`

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Ты — AI-ассистент проекта TruePay.

TruePay — финтех мобильное приложение в стиле "Quiet Luxury", React + Vite + Tailwind CSS.
Живая версия: https://truepay-kappa.vercel.app

Экраны и функционал:
• Home — баланс, GlassCard с анимацией подъёма, Area Chart расходов, быстрые действия
• Cards — карта с эффектом заморозки (FrostOverlay), копирование CVV и номера
• Payments — история транзакций со skeleton loading и staggered анимацией
• Profile — KYC верификация (Verified / Action Required), чат поддержки, биометрия
• KYC — верификация личности (биометрия + загрузка паспорта), 3 шага
• TopUp — пополнение счёта с анимацией успеха (зелёная галочка + bounce)
• Transfer — перевод средств
• Limits — слайдеры дневных лимитов покупок ($100–$10k) и ATM ($0–$2k) с пресетами
• Support — кастомный чат с quick reply chips и typing indicator

Технический стек:
• React 19, Vite 6, Tailwind CSS 3, Recharts
• Glassmorphism, кастомные keyframe-анимации
• Vercel Serverless Functions (этот бот)
• Clean Architecture: screens/, components/, services/, data/

Ты помогаешь Денису планировать и обсуждать задачи, отвечаешь на вопросы по архитектуре и коду, предлагаешь улучшения.
Отвечай кратко, по-русски. Эмодзи — умеренно.`

// ─── Per-chat conversation history (in-memory, сбрасывается при cold start) ──

const conversations = {}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function sendMessage(chatId, text) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
}

async function sendTyping(chatId) {
  await fetch(`${TELEGRAM_API}/sendChatAction`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
  })
}

// ─── OpenAI Whisper — voice → text ───────────────────────────────────────────

async function transcribeVoice(fileId) {
  // 1. Get the file path from Telegram
  const infoRes  = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`)
  const infoData = await infoRes.json()
  const filePath = infoData.result?.file_path
  if (!filePath) throw new Error('Cannot get file path from Telegram')

  // 2. Download the audio buffer
  const audioRes    = await fetch(`https://api.telegram.org/file/bot${process.env.TELEGRAM_TOKEN}/${filePath}`)
  const audioBuffer = await audioRes.arrayBuffer()

  // 3. Send to Whisper
  const form = new FormData()
  form.append('file', new Blob([audioBuffer], { type: 'audio/ogg' }), 'voice.ogg')
  form.append('model', 'whisper-large-v3-turbo')
  form.append('language', 'ru')
  form.append('response_format', 'json')

  const whisperRes  = await fetch(GROQ_STT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: form,
  })
  const whisperData = await whisperRes.json()

  if (!whisperRes.ok) {
    console.error('Whisper error:', whisperData)
    throw new Error('Whisper transcription failed')
  }

  return whisperData.text?.trim() ?? ''
}

// ─── Groq LLM (Llama 3.3 70B) — text → reply ────────────────────────────────

async function callAI(chatId, userMessage) {
  if (!conversations[chatId]) conversations[chatId] = []

  conversations[chatId].push({ role: 'user', content: userMessage })
  if (conversations[chatId].length > 20) {
    conversations[chatId] = conversations[chatId].slice(-20)
  }

  const res  = await fetch(GROQ_CHAT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...conversations[chatId],
      ],
    }),
  })
  const data = await res.json()

  if (!res.ok) {
    console.error('Groq LLM error:', data)
    return 'Ошибка AI. Попробуй ещё раз.'
  }

  const reply = data.choices?.[0]?.message?.content ?? 'Не удалось получить ответ.'
  conversations[chatId].push({ role: 'assistant', content: reply })
  return reply
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'TruePay Bot running 🚀', app: 'https://truepay-kappa.vercel.app' })
  }

  try {
    const { message } = req.body ?? {}
    const chatId      = message?.chat?.id
    if (!chatId) return res.status(200).json({ ok: true })

    const text  = message.text?.trim()
    const voice = message.voice

    // ── /start ──
    if (text === '/start') {
      await sendMessage(chatId,
        '👋 Привет, Денис!\n\n' +
        'Я AI-ассистент TruePay. Понимаю текст и голос 🎙\n\n' +
        '🔗 https://truepay-kappa.vercel.app\n\n' +
        'Пиши или говори — отвечу сразу.'
      )
      return res.status(200).json({ ok: true })
    }

    // ── /help ──
    if (text === '/help') {
      await sendMessage(chatId,
        '📋 Умею:\n\n' +
        '🎙 Голосовые сообщения — расшифрую и отвечу\n' +
        '💬 Текст — отвечаю через Claude AI\n' +
        '📱 Знаю весь код и архитектуру TruePay\n' +
        '🔗 https://truepay-kappa.vercel.app'
      )
      return res.status(200).json({ ok: true })
    }

    await sendTyping(chatId)

    // ── Voice message ──
    if (voice) {
      let transcribed
      try {
        transcribed = await transcribeVoice(voice.file_id)
      } catch (e) {
        console.error('Transcription error:', e)
        await sendMessage(chatId, '🎙 Не удалось расшифровать голосовое. Попробуй ещё раз.')
        return res.status(200).json({ ok: true })
      }

      if (!transcribed) {
        await sendMessage(chatId, '🎙 Ничего не расслышал, попробуй ещё раз.')
        return res.status(200).json({ ok: true })
      }

      // Echo transcription so user sees what was understood
      await sendMessage(chatId, `🎙 *${transcribed}*`)
      await sendTyping(chatId)

      const reply = await callAI(chatId, transcribed)
      await sendMessage(chatId, reply)
      return res.status(200).json({ ok: true })
    }

    // ── Text message ──
    if (text) {
      const reply = await callAI(chatId, text)
      await sendMessage(chatId, reply)
      return res.status(200).json({ ok: true })
    }

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Bot error:', error)
    return res.status(200).json({ ok: true })
  }
}
