import { getMerchantConfig, formatSignedUsd } from '../../data/mockData.js'
import { IconCheck } from '../icons/index.jsx'

export default function TxDetailSheet({ tx, onClose }) {
  if (!tx) return null

  const cfg = getMerchantConfig(tx.merchant)
  const isPositive = tx.amountSigned > 0

  const dateStr = tx.date
    ? new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(tx.date))
    : ''

  return (
    <div
      className="fixed inset-0 z-[60] flex animate-fade-in flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
    >
      <button type="button" className="flex-1" aria-label="Закрыть" onClick={onClose} />

      <div className="animate-slide-up rounded-t-3xl border border-white/[0.08] bg-surface-card p-6 shadow-sheet"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* Handle */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-slate-700" />

        {/* Icon + name */}
        <div className="flex items-start gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ring-1 ring-white/[0.08]"
            style={{ backgroundColor: cfg.bg + '33' }}
          >
            <span role="img" aria-label={tx.merchant}>{cfg.emoji}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[18px] font-semibold text-white">{tx.title}</h2>
            <p className="mt-0.5 text-[14px] text-slate-500">{tx.subtitle}</p>
            <p className="mt-1 text-[12px] text-slate-600">{dateStr}</p>
          </div>
        </div>

        {/* Amount */}
        <p className={`mt-6 text-3xl font-semibold tabular-nums ${isPositive ? 'text-emerald-400' : 'text-white'}`}>
          {formatSignedUsd(tx.amountSigned)}
        </p>

        {/* Status badge */}
        <div className="mt-3 flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <IconCheck className="h-3 w-3" />
          </span>
          <span className="text-[13px] font-medium text-emerald-400">Выполнено</span>
        </div>

        {/* Details */}
        <div className="mt-5 space-y-3 rounded-2xl border border-white/[0.06] bg-surface-raised/40 p-4">
          <Row label="Категория" value={cfg.category} />
          <Row label="Карта" value="TruePay •••• 4829" />
          {tx.merchant !== 'Salary' && tx.merchant !== 'TopUp' && (
            <Row label="Статус" value="Авторизован" />
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-2xl border border-white/[0.08] py-3.5 text-[15px] font-medium text-zinc-200 transition hover:bg-white/[0.05]"
        >
          Закрыть
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[13px] text-slate-500">{label}</span>
      <span className="text-[13px] font-medium text-white">{value}</span>
    </div>
  )
}
