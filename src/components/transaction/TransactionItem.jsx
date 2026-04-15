import { getMerchantConfig, formatSignedUsd } from '../../data/mockData.js'

export default function TransactionItem({ tx, onClick }) {
  const cfg = getMerchantConfig(tx.merchant)
  const isPositive = tx.amountSigned > 0

  return (
    <button
      type="button"
      onClick={() => onClick?.(tx)}
      className="flex w-full items-center gap-4 rounded-2xl border border-white/[0.06] bg-surface-raised/30 px-4 py-3.5 text-left transition hover:border-sky-500/20 hover:bg-sky-950/15 active:scale-[0.99]"
    >
      {/* Brand icon */}
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ring-1 ring-white/[0.08]"
        style={{ backgroundColor: cfg.bg + '33' }}
      >
        <span role="img" aria-label={tx.merchant}>{cfg.emoji}</span>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-white">{tx.title}</p>
        <p className="truncate text-[13px] text-slate-500">{tx.subtitle}</p>
      </div>

      {/* Amount */}
      <span className={`shrink-0 text-[15px] font-semibold tabular-nums ${isPositive ? 'text-emerald-400' : 'text-slate-200'}`}>
        {formatSignedUsd(tx.amountSigned)}
      </span>
    </button>
  )
}
