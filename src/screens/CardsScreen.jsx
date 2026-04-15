import { useState } from 'react'
import { FullCard } from '../components/card/GlassCard.jsx'

export default function CardsScreen({ card, showToast }) {
  const [nfcFlash, setNfcFlash] = useState(false)
  const [frozen, setFrozen]     = useState(false)
  const [freezing, setFreezing] = useState(false) // animation lock

  const copyPan = async () => {
    if (frozen) { showToast('Разморозьте карту для копирования'); return }
    try {
      await navigator.clipboard.writeText(card.panRaw)
      showToast('Номер карты скопирован')
    } catch {
      showToast('Не удалось скопировать')
    }
  }

  const copyCvv = async () => {
    if (frozen) { showToast('Разморозьте карту для копирования'); return }
    try {
      await navigator.clipboard.writeText(card.cvv)
      showToast('CVV скопирован')
    } catch {
      showToast('Не удалось скопировать')
    }
  }

  const handleNfc = () => {
    if (frozen) { showToast('Карта заморожена — NFC недоступен'); return }
    setNfcFlash(true)
    showToast('Бесконтактные платежи активны')
    setTimeout(() => setNfcFlash(false), 700)
  }

  const toggleFreeze = () => {
    if (freezing) return
    setFreezing(true)
    const next = !frozen
    setFrozen(next)
    showToast(next ? 'Карта заморожена' : 'Карта разморожена')
    setTimeout(() => setFreezing(false), 550)
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-surface animate-fade-in pb-tab">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-52 bg-gradient-to-b from-sky-950/[0.12] to-transparent" aria-hidden />

      {/* Header */}
      <header className="relative z-10 px-5 text-center"
        style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}>
        <p className="tp-label">Моя карта</p>
        <h1 className="mt-1 text-[20px] font-semibold text-white">Виртуальная карта</h1>
      </header>

      {/* Card — with smooth freeze transition */}
      <div className="relative z-10 mt-6 flex flex-col items-center px-4">
        <FullCard
          card={card}
          frozen={frozen}
          onCopyPan={copyPan}
          onCopyCvv={copyCvv}
          onNfcFlash={handleNfc}
          nfcFlash={nfcFlash}
        />

        {/* Status dot */}
        <div className="mt-3 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {!frozen && (
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/50" />
            )}
            <span
              className={`relative inline-flex h-2 w-2 rounded-full transition-colors duration-500 ${
                frozen ? 'bg-sky-300' : 'bg-emerald-400'
              }`}
            />
          </span>
          <span
            className={`text-[12px] font-semibold uppercase tracking-[0.2em] transition-colors duration-500 ${
              frozen ? 'text-sky-300' : 'text-white'
            }`}
          >
            {frozen ? 'Заморожена' : 'Активна'}
          </span>
        </div>
      </div>

      {/* ── Freeze / Unfreeze pill button ── */}
      <div className="relative z-10 mt-5 px-5">
        <button
          type="button"
          onClick={toggleFreeze}
          disabled={freezing}
          className={`
            group relative w-full overflow-hidden rounded-2xl border px-5 py-4
            text-[15px] font-semibold transition-all duration-300 active:scale-[0.98]
            ${frozen
              ? 'border-sky-400/40 bg-sky-950/40 text-sky-200 hover:bg-sky-950/60'
              : 'border-red-500/25 bg-red-950/20 text-red-300 hover:bg-red-950/35'
            }
            ${freezing ? 'opacity-70 pointer-events-none' : ''}
          `}
        >
          {/* Animated shimmer on hover */}
          <span
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background: frozen
                ? 'linear-gradient(105deg, transparent 40%, rgba(148,210,255,0.08) 50%, transparent 60%)'
                : 'linear-gradient(105deg, transparent 40%, rgba(255,100,100,0.06) 50%, transparent 60%)',
            }}
          />
          <span className="relative flex items-center justify-center gap-2">
            <span className="text-lg">{frozen ? '🔓' : '🔒'}</span>
            {frozen ? 'Разморозить карту' : 'Заморозить карту'}
          </span>
          {!frozen && (
            <p className="relative mt-0.5 text-center text-[12px] font-normal text-red-400/70">
              Временная блокировка всех операций
            </p>
          )}
          {frozen && (
            <p className="relative mt-0.5 text-center text-[12px] font-normal text-sky-400/70">
              Нажмите, чтобы возобновить платежи
            </p>
          )}
        </button>
      </div>

      {/* Action rows */}
      <div className="relative z-10 mt-3 space-y-2 px-5">
        <ActionRow emoji="📋" label="Скопировать CVV"
          hint="•••" onClick={copyCvv} disabled={frozen} />
        <ActionRow emoji="📋" label="Скопировать номер карты"
          hint={`•••• ${card.panRaw.slice(-4)}`} onClick={copyPan} disabled={frozen} />
      </div>

      {/* Card details */}
      <div className="relative z-10 mx-5 mt-3 rounded-2xl border border-white/[0.06] bg-surface-raised/30 p-4 space-y-3">
        <p className="tp-label mb-1">Реквизиты</p>
        <DetailRow label="Держатель"      value={card.holder} />
        <DetailRow label="Срок действия"  value={card.expiry} />
        <DetailRow label="Платёжная сеть" value={card.network} />
        <DetailRow label="Валюта"         value={card.currency} />
        <DetailRow label="Продукт"        value={card.product} />
      </div>

      <div className="h-4" />
    </div>
  )
}

function ActionRow({ emoji, label, hint, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border border-white/[0.06] bg-surface-raised/30 px-4 py-3.5 text-left transition active:scale-[0.99] hover:border-sky-500/20 hover:bg-sky-950/15 ${disabled ? 'pointer-events-none opacity-35' : ''}`}
    >
      <span className="text-xl">{emoji}</span>
      <span className="flex-1 text-[15px] font-medium text-white">{label}</span>
      <span className="text-[13px] text-slate-500">{hint}</span>
    </button>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-slate-500">{label}</span>
      <span className="text-[13px] font-medium text-white">{value}</span>
    </div>
  )
}
