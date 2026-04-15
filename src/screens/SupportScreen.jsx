import { useEffect, useRef, useState } from 'react'
import ScreenChrome from '../components/ui/ScreenChrome.jsx'

// ─── Bot intelligence (pattern matching) ─────────────────────────────────────

const PATTERNS = [
  {
    keys: ['пополн', 'topup', 'top up', 'deposit', 'баланс пополн'],
    reply: 'Для пополнения нажмите «Пополнить» на главном экране. Поддерживаются карты Visa / Mastercard, Apple Pay и банковский перевод (ACH). Зачисление — мгновенно. 💳',
  },
  {
    keys: ['карт', 'card', 'заморож', 'freeze', 'реквизит'],
    reply: 'Ваша карта TruePay активна. В разделе «Карта» можно заморозить / разморозить её одним нажатием, а также скопировать CVV и номер. Что именно вас интересует?',
  },
  {
    keys: ['лимит', 'limit', 'расход', 'снятие', 'atm'],
    reply: 'Настройте лимиты в Profile → Лимиты. Там есть слайдеры для дневного лимита покупок (до $10 000) и ATM (до $2 000). Изменения применяются мгновенно. 🎚',
  },
  {
    keys: ['перевод', 'transfer', 'отправ'],
    reply: 'Переводы доступны с главного экрана → «Перевести». Мин. сумма — $1, максимум — ваш доступный баланс. Средства обычно поступают в течение нескольких секунд. ⚡',
  },
  {
    keys: ['kyc', 'верификац', 'паспорт', 'document', 'verify'],
    reply: 'Верификация личности (KYC) проводится через Sumsub. Это занимает 1–5 минут. Перейдите в Profile → Верификация, чтобы пройти её прямо сейчас. 🪪',
  },
  {
    keys: ['крипто', 'bitcoin', 'eth', 'btc', 'crypto'],
    reply: 'Раздел Crypto пока в разработке. Мы планируем добавить покупку и хранение BTC, ETH и SOL через лицензированного провайдера. Следите за обновлениями! 🚀',
  },
  {
    keys: ['спасибо', 'thanks', 'отлично', 'хорошо', 'понял'],
    reply: 'Рады помочь! Если появятся ещё вопросы — мы всегда здесь. Хорошего дня! ☀️',
  },
]

const DEFAULT_REPLY =
  'Спасибо за обращение! Я создал тикет для нашей команды — ответ придёт в течение 2 часов в рабочие дни. Также вы можете написать нам на support@truepay.io 📩'

function getBotReply(text) {
  const lower = text.toLowerCase()
  for (const { keys, reply } of PATTERNS) {
    if (keys.some((k) => lower.includes(k))) return reply
  }
  return DEFAULT_REPLY
}

// ─── Quick-reply chips (shown only once, after greeting) ──────────────────────

const QUICK_REPLIES = [
  'Пополнить счёт',
  'Проблема с картой',
  'Лимиты трат',
  'Статус KYC',
]

// ─── Time formatting ──────────────────────────────────────────────────────────

function fmtTime(date) {
  return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(date)
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 animate-fade-in">
      <BotAvatar />
      <div className="flex h-9 items-center gap-1.5 rounded-2xl rounded-bl-sm border border-white/[0.06] bg-surface-card/80 px-4">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block h-2 w-2 rounded-full bg-slate-400 animate-pulse-glow"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function BotAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-600/30 border border-sky-500/30 text-[11px] font-bold text-sky-300">
      TP
    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function Bubble({ msg }) {
  const isBot = msg.from === 'bot'
  return (
    <div className={`flex items-end gap-2.5 animate-row-in ${isBot ? '' : 'flex-row-reverse'}`}>
      {isBot && <BotAvatar />}

      <div className="flex max-w-[78%] flex-col gap-1">
        <div
          className={`rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${
            isBot
              ? 'rounded-bl-sm border border-white/[0.07] bg-surface-card/80 text-slate-200'
              : 'rounded-br-sm bg-sky-600 text-white'
          }`}
        >
          {msg.text}
        </div>
        <span className={`text-[10px] text-slate-600 ${isBot ? 'pl-1' : 'pr-1 text-right'}`}>
          {fmtTime(msg.time)}
        </span>
      </div>
    </div>
  )
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function SupportScreen({ onBack, user }) {
  const firstName = user?.name?.split(' ')[0] ?? 'пользователь'

  const [messages, setMessages] = useState([
    {
      id: 'init',
      from: 'bot',
      text: `Здравствуйте, ${firstName}! Как я могу помочь вам с TruePay сегодня?`,
      time: new Date(),
    },
  ])
  const [quickShown, setQuickShown] = useState(true) // show quick-replies once
  const [input, setInput]           = useState('')
  const [typing, setTyping]         = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // Auto-scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const addBotReply = (text) => {
    setTyping(true)
    const delay = 900 + Math.random() * 500
    setTimeout(() => {
      setTyping(false)
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), from: 'bot', text, time: new Date() },
      ])
    }, delay)
  }

  const send = (text) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setQuickShown(false)
    setInput('')
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), from: 'user', text: trimmed, time: new Date() },
    ])
    addBotReply(getBotReply(trimmed))
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <ScreenChrome
      title="Поддержка"
      onBack={onBack}
      headerRight={
        <div className="flex items-center gap-1.5 pr-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[12px] font-medium text-emerald-400">Online</span>
        </div>
      }
    >
      {/* Message list */}
      <div className="flex flex-col gap-4 pb-28">
        {messages.map((msg) => (
          <Bubble key={msg.id} msg={msg} />
        ))}

        {/* Quick replies — shown once after greeting */}
        {quickShown && !typing && messages.length === 1 && (
          <div className="flex flex-wrap gap-2 pl-11 animate-row-in">
            {QUICK_REPLIES.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                className="rounded-full border border-sky-500/30 bg-sky-950/30 px-3.5 py-2 text-[13px] font-medium text-sky-300 transition hover:bg-sky-950/50 active:scale-[0.97]"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {typing && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* ── Input bar — pinned to bottom above TabBar ── */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.06] px-4 py-3"
        style={{
          background: 'rgba(7,10,15,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
          maxWidth: '28rem',
          margin: '0 auto',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
        }}
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напишите сообщение…"
            className="flex-1 resize-none rounded-2xl border border-white/[0.08] bg-surface-raised/60 px-4 py-3 text-[14px] text-white outline-none placeholder:text-slate-600 focus:border-sky-500/35 focus:ring-1 focus:ring-sky-500/25"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
          />
          <button
            type="button"
            onClick={() => send(input)}
            disabled={!input.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white transition hover:bg-sky-500 active:scale-95 disabled:opacity-35 disabled:pointer-events-none"
            aria-label="Отправить"
          >
            <svg className="h-5 w-5 -rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </ScreenChrome>
  )
}
