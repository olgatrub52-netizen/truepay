import { useState } from 'react'
import ScreenChrome from '../components/ui/ScreenChrome.jsx'
import Slider from '../components/ui/Slider.jsx'
import Toggle from '../components/ui/Toggle.jsx'

const usd = (v) => `$${v.toLocaleString('en-US')}`

// Preset chips rendered below each slider
function PresetChips({ presets, current, onSelect, format = usd }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {presets.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onSelect(p)}
          className={`rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition active:scale-[0.97] ${
            current === p
              ? 'border-sky-500/45 bg-sky-500/15 text-sky-300'
              : 'border-white/[0.08] bg-white/[0.04] text-slate-400 hover:border-white/15 hover:text-slate-200'
          }`}
        >
          {format(p)}
        </button>
      ))}
    </div>
  )
}

export default function LimitsScreen({ onBack, showToast }) {
  const [purchase, setPurchase] = useState(2500)
  const [atm, setAtm]           = useState(500)
  const [onlineOn, setOnlineOn] = useState(true)
  const [abroadOn, setAbroadOn] = useState(false)

  const handlePurchase = (v) => {
    setPurchase(v)
    showToast(`Лимит покупок: ${usd(v)}/день`)
  }
  const handleAtm = (v) => {
    setAtm(v)
    showToast(`Лимит ATM: ${usd(v)}/день`)
  }

  return (
    <ScreenChrome title="Лимиты" onBack={onBack}>
      <div className="space-y-4">

        {/* ── Daily Purchase Limit ───────────────────────────────── */}
        <section className="rounded-2xl border border-white/[0.06] bg-surface-raised/30 p-5">
          <p className="tp-label mb-5">Дневной лимит покупок</p>

          <Slider
            value={purchase}
            min={100}
            max={10000}
            step={100}
            onChange={handlePurchase}
            formatValue={usd}
            label="Покупки и переводы"
          />

          <PresetChips
            presets={[500, 1000, 2500, 5000]}
            current={purchase}
            onSelect={handlePurchase}
          />

          <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.05] bg-surface-card/50 px-4 py-2.5">
            <span className="text-[12px] text-slate-500">Доступно сегодня</span>
            <span className="text-[13px] font-semibold text-white tabular-nums">
              {usd(Math.max(0, purchase - 141))}
            </span>
          </div>
        </section>

        {/* ── Daily ATM Limit ────────────────────────────────────── */}
        <section className="rounded-2xl border border-white/[0.06] bg-surface-raised/30 p-5">
          <p className="tp-label mb-5">Лимит снятия наличных</p>

          <Slider
            value={atm}
            min={0}
            max={2000}
            step={50}
            onChange={handleAtm}
            formatValue={usd}
            label="Банкоматы (ATM)"
          />

          <PresetChips
            presets={[0, 200, 500, 1000]}
            current={atm}
            onSelect={handleAtm}
          />

          {atm === 0 && (
            <p className="mt-3 text-[12px] text-amber-400/80 animate-fade-in">
              ⚠ Снятие наличных отключено
            </p>
          )}
        </section>

        {/* ── Toggles ───────────────────────────────────────────── */}
        <section className="rounded-2xl border border-white/[0.06] bg-surface-raised/30 divide-y divide-white/[0.05]">
          <div className="px-5 py-4">
            <Toggle
              checked={onlineOn}
              onChange={() => {
                setOnlineOn((v) => !v)
                showToast(!onlineOn ? 'Онлайн-покупки разрешены' : 'Онлайн-покупки ограничены')
              }}
              label="Онлайн-покупки"
              description="E-commerce и подписки"
            />
          </div>
          <div className="px-5 py-4">
            <Toggle
              checked={abroadOn}
              onChange={() => {
                setAbroadOn((v) => !v)
                showToast(!abroadOn ? 'Зарубежные операции разрешены' : 'Только внутренние платежи')
              }}
              label="Зарубежные операции"
              description="Платежи за пределами США"
            />
          </div>
        </section>

        <p className="pb-2 text-center text-[12px] text-slate-700">
          Изменения применяются мгновенно. В продакшене синхронизируются с Core Banking.
        </p>
      </div>
    </ScreenChrome>
  )
}
