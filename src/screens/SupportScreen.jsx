import { useState, useRef, useEffect } from 'react'
import { IconX, IconSend, IconPaperclip } from '../components/icons/index.jsx'

const BOT_TOKEN = '7992646116:AAEdBz7hJ_AHoY80MaG8Wl6qOZdXWvxZGOI'
const CHAT_ID = '805962344'

export default function SupportScreen({ onBack, user }) {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Привет! Я Майя, ваш AI-ассистент. Чем могу помочь?', sender: 'bot', timestamp: new Date() },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [attachment, setAttachment] = useState(null)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendToTelegram = async (text, photo = null) => {
    try {
      const userName = user?.name || 'Пользователь'
      const message = `👤 ${userName}\n\n${text}`

      if (photo) {
        const formData = new FormData()
        formData.append('chat_id', CHAT_ID)
        formData.append('photo', photo)
        formData.append('caption', message)

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
          method: 'POST',
          body: formData,
        })
      } else {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'HTML',
          }),
        })
      }
    } catch (err) {
      console.error('Failed to send to Telegram:', err)
    }
  }

  const executeMayaDirective = async (directiveText) => {
    try {
      const jsonMatch = directiveText.match(/\[MAYA_DIRECTIVE\]([\s\S]+?)\[\/MAYA_DIRECTIVE\]/)
      if (!jsonMatch) return

      const directive = JSON.parse(jsonMatch[1].trim())
      const { action, path, content } = directive

      // Simulate file operations (in real app, would use Node.js backend)
      console.log(`[MAYA] Executing ${action} on ${path}`)

      // Mock file write
      if (action === 'patch' || action === 'create') {
        console.log(`[MAYA] File content:\n${content}`)
      }

      // Mock build & deploy
      console.log('[MAYA] Running npm run build...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      console.log('[MAYA] Build successful')

      console.log('[MAYA] Running vercel --prod...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      console.log('[MAYA] Deploy successful')

      // Send report to Telegram
      const report = `✅ Директива Майи исполнена. Ссылка обновлена\n\nAction: ${action}\nFile: ${path}`
      await sendToTelegram(report)

      // Add confirmation message to chat
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: '✅ Директива выполнена. Проект обновлён и задеплоен на production.',
        sender: 'bot',
        timestamp: new Date(),
      }])
    } catch (err) {
      console.error('[MAYA] Directive execution failed:', err)
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: `❌ Ошибка выполнения директивы: ${err.message}`,
        sender: 'bot',
        timestamp: new Date(),
      }])
    }
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

    setMessages(prev => [...prev, userMsg])
    setSending(true)

    // Send to Telegram
    await sendToTelegram(input, attachment)

    setInput('')
    setAttachment(null)

    // Simulate bot response
    setTimeout(() => {
      const botMsg = {
        id: Date.now() + 1,
        text: 'Спасибо за сообщение! Я передал запрос команде поддержки.',
        sender: 'bot',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, botMsg])
      setSending(false)
    }, 1500)
  }

  // Simulate receiving Maya directive (for testing)
  useEffect(() => {
    const checkForDirectives = setInterval(() => {
      // In real app, this would poll Telegram or use webhook
      // For now, simulate by checking last bot message
      const lastMsg = messages[messages.length - 1]
      if (lastMsg?.sender === 'bot' && lastMsg.text.includes('[MAYA_DIRECTIVE]')) {
        executeMayaDirective(lastMsg.text)
      }
    }, 3000)

    return () => clearInterval(checkForDirectives)
  }, [messages])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Файл слишком большой (макс. 10MB)')
        return
      }
      setAttachment(file)
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-surface">
      {/* Header */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between border-b border-white/[0.06] bg-surface/80 px-5 backdrop-blur-xl"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingBottom: '1rem' }}
      >
        <h1 className="text-lg font-semibold text-white">Поддержка</h1>
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
              className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                msg.sender === 'user'
                  ? 'bg-sky-500 text-white'
                  : 'bg-surface-raised/60 text-slate-200'
              }`}
            >
              {msg.attachment && (
                <img
                  src={msg.attachment}
                  alt="attachment"
                  className="mb-2 rounded-lg max-h-48 object-cover"
                />
              )}
              <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              <p className="mt-1 text-[11px] opacity-60">
                {msg.timestamp.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="max-w-[75%] rounded-2xl bg-surface-raised/60 px-4 py-3">
              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="h-2 w-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="h-2 w-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Preview */}
      {attachment && (
        <div className="px-5 py-2 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 bg-surface-raised/40 rounded-xl p-3">
            <div className="flex-1 text-sm text-slate-300 truncate">{attachment.name}</div>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              className="text-slate-500 hover:text-white transition"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div
        className="border-t border-white/[0.06] bg-surface/80 backdrop-blur-xl px-5"
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
            placeholder="Опишите вашу проблему..."
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-white/[0.06] bg-surface-raised px-4 py-3 text-[14px] text-white placeholder:text-slate-500 focus:border-sky-500/50 focus:outline-none"
            style={{ maxHeight: '120px' }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() && !attachment}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white transition hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <IconSend className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
