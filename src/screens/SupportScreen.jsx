import { useState, useRef, useEffect } from 'react'
import { IconX, IconSend, IconPaperclip } from '../components/icons/index.jsx'

// Messages flow:
//   User types in app → POST /api/support → bot forwards to Maya in Telegram
//   Maya replies via Telegram → bot processes directive → commits code → deploys

export default function SupportScreen({ onBack, user }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Привет! Я Майя, ваш AI-ассистент TruePay. Чем могу помочь?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ])
  const [input, setInput]         = useState('')
  const [sending, setSending]     = useState(false)
  const [attachment, setAttachment] = useState(null)
  const messagesEndRef = useRef(null)
  const fileInputRef   = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Send message through our secure backend (token stays server-side)
  const sendToSupport = async (text, file = null) => {
    const form = new FormData()
    form.append('text', text)
    form.append('userName', user?.name ?? 'Пользователь')
    if (file) form.append('photo', file)

    const res = await fetch('/api/support', { method: 'POST', body: form })
    return res.ok
  }

  const handleSend = async () => {
    if (!input.trim() && !attachment) return

    const userMsg = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
      attachment: attachment ? URL.createObjectURL(attachment) : null,
    }

    setMessages((prev) => [...prev, userMsg])
    setSending(true)
    const text = input
    const file = attachment

    setInput('')
    setAttachment(null)

    try {
      await sendToSupport(text, file)
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: '✅ Сообщение передано Майе. Отвечу как только получу ответ.',
            sender: 'bot',
            timestamp: new Date(),
          },
        ])
        setSending(false)
      }, 800)
    } catch {
      setSending(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      alert('Файл слишком большой (макс. 10 MB)')
      return
    }
    setAttachment(file)
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-surface">
      {/* Header */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between border-b border-white/[0.06] bg-surface/80 px-5 backdrop-blur-xl"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingBottom: '1rem' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-600/30 border border-sky-500/30 text-[11px] font-bold text-sky-300">
            M
          </div>
          <div>
            <p className="text-[15px] font-semibold text-white">Майя</p>
            <p className="text-[11px] text-emerald-400">● Online</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          <IconX className="h-5 w-5" />
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-3 ${
                msg.sender === 'user'
                  ? 'rounded-br-sm bg-sky-600 text-white'
                  : 'rounded-bl-sm border border-white/[0.07] bg-surface-card/80 text-slate-200'
              }`}
            >
              {msg.attachment && (
                <img
                  src={msg.attachment}
                  alt="attachment"
                  className="mb-2 rounded-lg max-h-48 w-full object-cover"
                />
              )}
              <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              <p className="mt-1 text-[10px] opacity-50">
                {msg.timestamp.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm border border-white/[0.07] bg-surface-card/80 px-4 py-3">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-2 w-2 rounded-full bg-slate-400 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment preview */}
      {attachment && (
        <div className="px-5 py-2 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 rounded-xl bg-surface-raised/40 p-3">
            <p className="flex-1 truncate text-[13px] text-slate-300">{attachment.name}</p>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              className="text-slate-500 transition hover:text-white"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div
        className="border-t border-white/[0.06] bg-surface/80 px-5 backdrop-blur-xl"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-end gap-3 py-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-raised text-slate-400 transition hover:text-white"
          >
            <IconPaperclip className="h-5 w-5" />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Напишите Майе..."
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-white/[0.08] bg-surface-raised px-4 py-3 text-[14px] text-white placeholder:text-slate-500 outline-none focus:border-sky-500/40"
            style={{ maxHeight: '120px' }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() && !attachment}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-600 text-white transition hover:bg-sky-500 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          >
            <IconSend className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
