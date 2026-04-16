import { useMemo, useState } from 'react'
import { PreviewCard } from '../components/card/GlassCard.jsx'
import TransactionItem from '../components/transaction/TransactionItem.jsx'
import TxDetailSheet from '../components/transaction/TxDetailSheet.jsx'
import SpendingChart from '../components/ui/SpendingChart.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { IconPlus, IconArrow, IconBitcoin, IconSliders, IconBell } from '../components/icons/index.jsx'
import { formatUsdParts } from '../data/mockData.js'

const QUICK_ACTIONS = [
  { id: 'topup',    label: 'Пополнить!', Icon: IconPlus },
  { id: 'transfer', label: 'Перевести', Icon: IconArrow },
  { id: 'crypto',   label: 'Крипто',    Icon: IconBitcoin },
  { id: 'limits',   label: 'Лимиты',    Icon: IconSliders },
]

export default function HomeScreen({ user, balance, transactions, card, spendingData, onAction, onTabChange }) {
  const [detailTx, setDetailTx]       = useState(null)
  const [nfcFlash, setNfcFlash]       = useState(false)
  const [cardLifting, setCardLifting] = useState(false)
  const { intWithSep, decPart }       = formatUsdParts(balance)
  const recentTx = transactions.slice(0, 4)

  // Total shown next to the chart — recomputes whenever spendingData changes
  const weekTotal = useMemo(
    () => formatUsdParts(spendingData?.reduce((s, d) => s + d.amount, 0) ?? 0),
    [spendingData]
  )

  const handleNfc = (toast) => {
    setNfcFlash(true)
    toast('Бесконтактные платежи активны')
    setTimeout(() => setNfcFlash(false), 700)
  }

  // Lift the card briefly, then navigate — creates a satisfying "launch" feel
  const handleCardPress = () => {
    if (cardLifting) return
    setCardLifting(true)
    setTimeout(() => {
      setCardLifting(false)
      onTabChange('cards')
    }, 270)
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-surface animate-fade-in pb-tab">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[40vh] bg-gradient-to-b from-sky-950/[0.13] to-transparent" aria-hidden />

      {/* Header */}
      <header className="relative z-10 flex items-start justify-between gap-4 px-5"
        style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))' }}>
        <div>
          <p className="text-[12px] font-medium text-slate-500">Здравствуйте, Денис</p>
          <p className="mt-1 text-[13px] text-slate-600">Доступный баланс</p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-[2.25rem] font-semibold tracking-tight text-white tabular-nums">
              ${intWithSep}
            </span>
            <span className="text-2xl font-semibold text-slate-500 tabular-nums">.{decPart}</span>
          </div>
        </div>
        <button type="button" className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-surface-raised/60 text-slate-400 transition hover:text-white">
          <IconBell className="h-5 w-5" />
        </button>
      </header>

      <div className="relative z-10 mt-6 overflow-y-auto">
        {/* Card — wrapped in lift-animation container */}
        <div className="px-5">
          <div
            className="transition-[transform,box-shadow] will-change-transform"
            style={{
              transform: cardLifting ? 'scale(1.045) translateY(-6px)' : 'scale(1) translateY(0px)',
              transitionDuration: cardLifting ? '200ms' : '300ms',
              transitionTimingFunction: cardLifting ? 'cubic-bezier(0.34,1.56,0.64,1)' : 'cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            <PreviewCard
              card={card}
              onPress={handleCardPress}
              onNfcPress={() => handleNfc(onAction.toast)}
              nfcFlash={nfcFlash}
            />
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-6 grid grid-cols-4 gap-3 px-5">
          {QUICK_ACTIONS.map(({ id, label, Icon }) => (
            <button key={id} type="button" onClick={() => onAction.navigate(id)}
              className={`flex flex-col items-center gap-2.5 rounded-2xl border px-2 py-4 transition active:scale-[0.97] ${
                id === 'topup'
                  ? 'bg-sky-500 border-sky-400/30 hover:border-sky-300/40 hover:bg-sky-600'
                  : 'border-white/[0.06] bg-surface-raised/30 hover:border-sky-500/20 hover:bg-sky-950/20'
              }`}>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.06] bg-sky-950/40 text-white">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-[11px] font-medium leading-tight text-slate-300 text-center">{label}</span>
            </button>
          ))}
        </div>

        {/* Spending chart — data is reactive; recharts auto-animates on change */}
        <div className="mx-5 mt-6 rounded-2xl border border-white/[0.06] bg-surface-raised/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-white">Активность за неделю</p>
            <span className="rounded-full bg-sky-500/15 px-2.5 py-1 text-[11px] font-medium text-sky-400 tabular-nums transition-all duration-500">
              ${weekTotal.intWithSep}
            </span>
          </div>
          <SpendingChart data={spendingData} />
        </div>

        {/* Recent transactions */}
        <div className="mt-6 px-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-white">Последние операции</h3>
            <button type="button" onClick={() => onTabChange('payments')}
              className="text-[13px] font-medium text-sky-400/90 transition hover:text-sky-300">
              Все
            </button>
          </div>

          {recentTx.length === 0 ? (
            <EmptyState
              icon="✨"
              title="Ваша финансовая история начинается здесь"
              subtitle="Совершите первую операцию — и она появится здесь"
            />
          ) : (
            <ul className="space-y-2">
              {recentTx.map((tx) => (
                <li key={tx.id}>
                  <TransactionItem tx={tx} onClick={setDetailTx} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="h-4" />
      </div>

      <TxDetailSheet tx={detailTx} onClose={() => setDetailTx(null)} />
    </div>
  )
}
