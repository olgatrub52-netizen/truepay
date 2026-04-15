import { useEffect, useRef, useState } from 'react'
import TransactionItem from '../components/transaction/TransactionItem.jsx'
import TxDetailSheet from '../components/transaction/TxDetailSheet.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { groupByDate } from '../data/mockData.js'

// ─── Skeleton pieces ──────────────────────────────────────────────────────────

function SkeletonRow({ delay = 0 }) {
  return (
    <div
      className="flex items-center gap-4 rounded-2xl border border-white/[0.04] bg-surface-raised/20 px-4 py-3.5"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="h-11 w-11 shrink-0 rounded-xl tp-skeleton" />
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="h-[13px] w-3/4 rounded-full tp-skeleton" style={{ animationDelay: `${delay + 0.08}s` }} />
        <div className="h-[11px] w-2/5 rounded-full tp-skeleton" style={{ animationDelay: `${delay + 0.15}s` }} />
      </div>
      <div className="h-[13px] w-14 shrink-0 rounded-full tp-skeleton" style={{ animationDelay: `${delay + 0.2}s` }} />
    </div>
  )
}

function SkeletonGroup({ groupDelay = 0 }) {
  return (
    <div>
      <div className="mb-3 h-[11px] w-16 rounded-full tp-skeleton" style={{ animationDelay: `${groupDelay}s` }} />
      <div className="space-y-2">
        <SkeletonRow delay={groupDelay + 0.05} />
        <SkeletonRow delay={groupDelay + 0.1} />
      </div>
    </div>
  )
}

function SkeletonList() {
  return (
    <div className="space-y-5 animate-fade-in">
      <SkeletonGroup groupDelay={0} />
      <SkeletonGroup groupDelay={0.12} />
      <SkeletonGroup groupDelay={0.24} />
    </div>
  )
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function PaymentsScreen({ transactions }) {
  const [loading, setLoading]   = useState(true)
  const [detailTx, setDetailTx] = useState(null)
  const timerRef = useRef(null)

  // Simulate first-load fetch delay
  useEffect(() => {
    timerRef.current = setTimeout(() => setLoading(false), 1300)
    return () => clearTimeout(timerRef.current)
  }, [])

  const groups = groupByDate(transactions)

  return (
    <div className="flex min-h-[100dvh] flex-col bg-surface animate-fade-in pb-tab">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-48 bg-gradient-to-b from-sky-950/[0.1] to-transparent" aria-hidden />

      {/* Header */}
      <header className="relative z-10 px-5" style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}>
        <p className="tp-label">Кошелёк</p>
        <h1 className="mt-1 text-[20px] font-semibold text-white">Операции</h1>
      </header>

      <div className="relative z-10 mt-5 overflow-y-auto px-5">
        {loading ? (
          <SkeletonList />
        ) : transactions.length === 0 ? (
          <EmptyState
            icon="✨"
            title="Ваша финансовая история начинается здесь"
            subtitle="Все транзакции и переводы будут отображаться здесь"
          />
        ) : (
          /* Staggered group / row appearance */
          <div className="space-y-5">
            {groups.map((group, gIdx) => (
              <div key={group.date} className="animate-row-in"
                style={{ animationDelay: `${gIdx * 0.06}s` }}>
                <p className="mb-2.5 text-[13px] font-semibold text-slate-500">{group.date}</p>
                <ul className="space-y-2">
                  {group.transactions.map((tx, tIdx) => (
                    <li
                      key={tx.id}
                      className="animate-row-in"
                      style={{ animationDelay: `${gIdx * 0.06 + tIdx * 0.04}s` }}
                    >
                      <TransactionItem tx={tx} onClick={setDetailTx} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        <div className="h-4" />
      </div>

      <TxDetailSheet tx={detailTx} onClose={() => setDetailTx(null)} />
    </div>
  )
}
