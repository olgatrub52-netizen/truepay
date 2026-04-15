import { useCallback, useEffect, useId, useState } from 'react'
import ScreenChrome from '../components/ui/ScreenChrome.jsx'
import { formatUsdParts } from '../data/mockData.js'

const METHODS = [
  { id: 'card',   label: 'Банковская карта',       emoji: '💳' },
  { id: 'apple',  label: 'Apple Pay',               emoji: '🍎' },
  { id: 'google', label: 'Google Pay',              emoji: '🟢' },
  { id: 'ach',    label: 'ACH / Банковский счёт',   emoji: '🏦' },
]
const PRESETS = [50, 100, 250, 500]

// ─── Success overlay ─────────────────────────────────────────────────────────

function SuccessOverlay({ amount, onDone }) {
  const { intWithSep, decPart } = formatUsdParts(amount)

  // Auto-dismiss after animation settles (2.2s total feels satisfying)
  useEffect(() => {
    const t = setTimeout(onDone, 2200)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-surface animate-fade-in"
      style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 45%, rgba(16,70,40,0.18) 0%, #070a0f 65%)' }}>

      {/* Concentric ripple rings */}
      <div className="relative flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute rounded-full border border-emerald-500/25 animate-success-ripple"
            style={{
              width:  `${88 + i * 52}px`,
              height: `${88 + i * 52}px`,
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}

        {/* Main circle — bounces in */}
        <div className="relative flex h-[88px] w-[88px] items-center justify-center rounded-full border border-emerald-500/35 bg-emerald-500/12 animate-success-bounce">
          <CheckmarkSVG />
        </div>
      </div>

      {/* Amount text — slides up after the bounce */}
      <div className="mt-9 text-center animate-row-in" style={{ animationDelay: '0.28s' }}>
        <p className="text-[32px] font-semibold tabular-nums text-white leading-none">
          +${intWithSep}<span className="text-slate-400">.{decPart}</span>
        </p>
        <p className="mt-2 text-[15px] text-slate-500">Зачислено на счёт</p>
      </div>

      {/* Dismiss hint */}
      <p className="absolute bottom-[max(2rem,env(safe-area-inset-bottom))] text-[12px] text-slate-700 animate-fade-in"
        style={{ animationDelay: '0.8s' }}>
        Возврат на главную…
      </p>
    </div>
  )
}

/** SVG checkmark with animated stroke-dashoffset draw */
function CheckmarkSVG() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-11 w-11 text-emerald-400"
    >
      <path
        d="M4.5 12.75 l6 6 9-13.5"
        strokeDasharray="32"
        className="animate-check-draw"
        style={{ fill: 'none' }}
      />
    </svg>
  )
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function TopUpScreen({ onBack, onSuccess }) {
  const [amountStr, setAmountStr] = useState('')
  const [method, setMethod]       = useState('card')
  const [open, setOpen]           = useState(false)
  const [pending, setPending]     = useState(null)   // set when animating
  const [error, setError]         = useState('')
  const id = useId()

  const parsed         = parseFloat(amountStr.replace(',', '.')) || 0
  const selectedMethod = METHODS.find((m) => m.id === method)

  const handleDone = useCallback(() => {
    if (pending) onSuccess(pending)
  }, [pending, onSuccess])

  const submit = () => {
    setError('')
    if (parsed <= 0)       { setError('Введите сумму больше нуля'); return }
    if (parsed > 50_000)   { setError('Максимум $50 000 за операцию'); return }
    // Show success animation; onDone will call onSuccess when it auto-dismisses
    setPending({ type: 'topup', amount: parsed, method })
  }

  return (
    // `relative` needed so the success overlay fills this screen
    <div className="relative">
      <ScreenChrome title="Пополнить баланс" onBack={onBack}>
        {/* Method selector */}
        <div className="mb-7">
          <p className="tp-label mb-2">Способ пополнения</p>
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-sky-500/40 bg-sky-950/25 px-4 py-3.5 text-left transition hover:border-sky-400/50 active:scale-[0.99]">
            <div className="flex items-center gap-3">
              <span className="text-xl">{selectedMethod?.emoji}</span>
              <span className="text-[15px] font-medium text-white">{selectedMethod?.label}</span>
            </div>
            <span className="rounded-full bg-sky-500/15 px-2.5 py-1 text-[11px] font-semibold text-sky-300">
              {open ? 'Свернуть' : 'Изменить'}
            </span>
          </button>

          {open && (
            <div className="mt-2 space-y-2 animate-fade-in" role="radiogroup">
              {METHODS.map((m) => (
                <label key={m.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3.5 transition ${
                    method === m.id
                      ? 'border-sky-500/40 bg-sky-500/10'
                      : 'border-white/[0.06] bg-surface-raised/30 hover:border-white/10'
                  }`}>
                  <input type="radio" name={id} className="h-4 w-4 accent-sky-500"
                    checked={method === m.id}
                    onChange={() => { setMethod(m.id); setOpen(false) }} />
                  <span className="text-xl">{m.emoji}</span>
                  <span className="text-[15px] text-white">{m.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Amount input */}
        <p className="tp-label mb-2">Сумма (USD)</p>
        <div className="flex items-baseline gap-1 rounded-2xl border border-white/[0.08] bg-surface-raised/40 px-4 py-4">
          <span className="text-2xl font-semibold text-slate-500">$</span>
          <input
            inputMode="decimal"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-3xl font-semibold tracking-tight text-white outline-none placeholder:text-slate-600"
            placeholder="0"
            value={amountStr}
            onChange={(e) => { setAmountStr(e.target.value.replace(/[^\d.,]/g, '')); setError('') }}
          />
        </div>

        {/* Preset chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p} type="button"
              onClick={() => { setAmountStr(String(p)); setError('') }}
              className={`rounded-full border px-4 py-2 text-[13px] font-medium transition active:scale-[0.98] ${
                parsed === p
                  ? 'border-sky-500/40 bg-sky-500/15 text-sky-200'
                  : 'border-white/10 bg-white/[0.04] text-zinc-200 hover:border-white/20 hover:bg-white/[0.08]'
              }`}>
              ${p}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="mt-4 rounded-xl border border-red-500/25 bg-red-950/30 px-3 py-2.5 text-[13px] text-red-300 animate-fade-in" role="alert">
            {error}
          </p>
        )}

        {/* Confirm */}
        <button
          type="button"
          onClick={submit}
          disabled={parsed <= 0}
          className="tp-btn-primary mt-10 disabled:opacity-35 disabled:pointer-events-none"
        >
          {parsed > 0 ? `Подтвердить · $${formatUsdParts(parsed).intWithSep}.${formatUsdParts(parsed).decPart}` : 'Введите сумму'}
        </button>
      </ScreenChrome>

      {/* Success overlay — rendered on top when pending is set */}
      {pending && <SuccessOverlay amount={pending.amount} onDone={handleDone} />}
    </div>
  )
}
