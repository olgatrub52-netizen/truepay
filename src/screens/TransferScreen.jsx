import { useState } from 'react'
import ScreenChrome from '../components/ui/ScreenChrome.jsx'
import { formatUsdParts } from '../data/mockData.js'

const RECENT_CONTACTS = [
  { id: 'c1', name: 'Анна К.',   emoji: '👩' },
  { id: 'c2', name: 'Макс М.',   emoji: '👨' },
  { id: 'c3', name: 'Лера В.',   emoji: '👱‍♀️' },
  { id: 'c4', name: 'Дима С.',   emoji: '🧑' },
]

export default function TransferScreen({ onBack, balance, onSuccess }) {
  const [to, setTo] = useState('')
  const [amountStr, setAmountStr] = useState('')
  const [note, setNote] = useState('')
  const parsed = parseFloat(amountStr.replace(',', '.')) || 0
  const { intWithSep, decPart } = formatUsdParts(balance)

  const submit = () => {
    const name = to.trim()
    if (name.length < 2) { onSuccess(null, 'Укажите получателя'); return }
    if (parsed <= 0) { onSuccess(null, 'Введите сумму'); return }
    if (parsed > balance) { onSuccess(null, 'Недостаточно средств'); return }
    onSuccess({ type: 'transfer', amount: parsed, to: name, note: note.trim() })
  }

  return (
    <ScreenChrome title="Перевод" onBack={onBack}>
      {/* Recent contacts */}
      <p className="tp-label mb-3">Недавние</p>
      <div className="mb-7 flex gap-3 overflow-x-auto hide-scrollbar pb-1">
        {RECENT_CONTACTS.map((c) => (
          <button key={c.id} type="button" onClick={() => setTo(c.name)}
            className={`flex shrink-0 flex-col items-center gap-1.5 rounded-2xl border px-4 py-3 transition ${
              to === c.name ? 'border-sky-500/40 bg-sky-950/25' : 'border-white/[0.06] bg-surface-raised/30 hover:border-white/10'
            }`}>
            <span className="text-2xl">{c.emoji}</span>
            <span className="text-[12px] font-medium text-slate-300 whitespace-nowrap">{c.name}</span>
          </button>
        ))}
      </div>

      {/* Recipient */}
      <p className="tp-label mb-2">Получатель</p>
      <input
        className="tp-input mb-6"
        placeholder="Имя или @никнейм"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        autoComplete="name"
      />

      {/* Amount */}
      <p className="tp-label mb-2">Сумма (USD)</p>
      <div className="flex items-baseline gap-1 rounded-2xl border border-white/[0.08] bg-surface-raised/40 px-4 py-4 mb-1">
        <span className="text-xl font-semibold text-slate-500">$</span>
        <input inputMode="decimal"
          className="min-w-0 flex-1 bg-transparent text-2xl font-semibold text-white outline-none placeholder:text-slate-600"
          placeholder="0.00" value={amountStr}
          onChange={(e) => setAmountStr(e.target.value.replace(/[^\d.,]/g, ''))} />
      </div>
      <p className="mb-6 text-[12px] text-slate-500">
        Доступно: <span className="text-white">${intWithSep}.{decPart}</span>
      </p>

      {/* Note */}
      <p className="tp-label mb-2">Комментарий (необязательно)</p>
      <input
        className="tp-input mb-8"
        placeholder="Например: за ужин"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <button type="button" onClick={submit} className="tp-btn-primary">
        Перевести
      </button>
    </ScreenChrome>
  )
}
