import { useState, useEffect } from 'react'
import { getPrice, buyUSDT } from '../services/bybitService.js'

const PRESET_AMOUNTS = [5000, 10000, 25000, 50000]

const DESTINATIONS = [
  {
    id: 'bybit',
    label: 'Bybit · Крипто',
    flag: '₿',
    description: 'RUB → USDT → USD · Реальный Bybit API',
    commission: '~0.1%',
    hint: 'Рубли конвертируются в USDT на Bybit по рыночному курсу. Далее USDT выводится в USD на карту Бакай Банка.',
    badge: 'LIVE',
    badgeColor: 'bg-sky-500/20 text-sky-400',
  },
  {
    id: 'bakai',
    label: 'Бакай Банк',
    flag: '🇰🇬',
    description: 'Кыргызстан · RUB → USD · SWIFT',
    commission: '~1–2%',
    hint: 'Рубли поступают в Бакай Банк по корр. счёту и конвертируются в USD по курсу дня.',
    badge: 'SWIFT',
    badgeColor: 'bg-emerald-500/15 text-emerald-400',
    form: {
      recipientName:        '',
      recipientAccount:     '',
      recipientBik:         '044525234',
      recipientBankName:    'ОАО БАКАЙ БАНК (через Азия-Инвест Банк, Москва)',
      recipientCorrAccount: '30101810445250000234',
      recipientInn:         '0',
      purpose:              'Перевод физическому лицу. Банк получателя: BAKAI BANK, SWIFT: BAKAKG22',
    },
    editableFields: ['recipientName', 'recipientAccount'],
    placeholders: {
      recipientName:    'Ваше имя в Бакай Банке (латиницей)',
      recipientAccount: 'Номер счёта в Бакай Банке (20 цифр)',
    },
  },
  {
    id: 'sandbox',
    label: 'T-Bank Sandbox',
    flag: '🧪',
    description: 'Тестовый перевод · Без реальных списаний',
    commission: '0%',
    badge: 'TEST',
    badgeColor: 'bg-amber-500/15 text-amber-400',
    form: {
      recipientName:        'Иванов Иван Иванович',
      recipientAccount:     '40817810099910004312',
      recipientBik:         '044525225',
      recipientBankName:    'ПАО Сбербанк',
      recipientCorrAccount: '30101810400000000225',
      recipientInn:         '0',
      purpose:              'Перевод физическому лицу',
    },
    editableFields: ['recipientName', 'recipientAccount'],
  },
]

const FIELD_LABELS = {
  recipientName:    'ФИО получателя',
  recipientAccount: 'Номер счёта',
  recipientBik:     'БИК банка',
  recipientBankName:'Банк получателя',
  purpose:          'Назначение платежа',
}

function BackButton({ onClick }) {
  return (
    <button onClick={onClick} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06]">
      <svg className="h-5 w-5 text-ink/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  )
}

export default function WithdrawScreen({ onBack, balance, onSuccess }) {
  // step: 0=dest, 1=amount, 2=details (skipped for bybit), 3=confirm, 4=result
  const [step, setStep]     = useState(0)
  const [dest, setDest]     = useState(null)
  const [amount, setAmount] = useState('')
  const [form, setForm]     = useState({})
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState(null)
  const [error, setError]         = useState('')

  // RUB/USD from open.er-api (for Bakai)
  const [rubRate, setRubRate]           = useState(null)
  const [rubRateLoading, setRubRateLoading] = useState(false)

  // Bybit live price USDT/RUB
  const [usdtPrice, setUsdtPrice]   = useState(null)
  const [priceLoading, setPriceLoading] = useState(false)

  useEffect(() => {
    if (dest?.id === 'bakai') {
      setRubRateLoading(true)
      fetch('/api/rates?from=RUB&to=USD')
        .then(r => r.json())
        .then(d => { if (d.ok) setRubRate(d) })
        .catch(() => {})
        .finally(() => setRubRateLoading(false))
    }
    if (dest?.id === 'bybit') {
      setPriceLoading(true)
      getPrice('USDTRUB')
        .then(d => { if (d.ok && d.price > 0) setUsdtPrice(d.price) })
        .catch(() => {})
        .finally(() => setPriceLoading(false))
    }
  }, [dest])

  const numAmount = Number(amount)
  const canAmount = numAmount >= 100

  // Estimated USDT for Bybit route
  const estUsdt = usdtPrice && numAmount >= 100
    ? (numAmount / usdtPrice)
    : null

  function validateAccount(val) {
    return /^\d{20}$|^\d{22}$/.test(val?.trim())
  }
  const accountError = form.recipientAccount && !validateAccount(form.recipientAccount)
    ? 'Номер счёта должен содержать ровно 20 или 22 цифры'
    : ''
  const canDetails = (dest?.editableFields ?? []).every(f => form[f]?.trim()) && !accountError

  function selectDest(d) {
    setDest(d)
    setForm(d.form ? { ...d.form } : {})
    setStep(1)
  }

  // For bybit: skip details step
  function goFromAmount() {
    if (!canAmount) return
    if (dest?.id === 'bybit') setStep(3)
    else setStep(2)
  }

  async function handleConfirm() {
    setLoading(true)
    setError('')
    try {
      if (dest?.id === 'bybit') {
        // Real Bybit API call: buy USDT for RUB
        const data = await buyUSDT(numAmount)
        setResult({ ...data, type: 'bybit' })
        setStep(4)
        if (data.ok) onSuccess?.({ amount: numAmount, orderId: data.orderId })
      } else {
        // T-Bank Sandbox transfer
        const res = await fetch('/api/tbank', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'transfer', amount: numAmount, ...form }),
        })
        const data = await res.json()
        setResult({ ...data, type: dest?.id })
        setStep(4)
        if (data.ok) onSuccess?.({ amount: numAmount, paymentId: data.paymentId })
      }
    } catch (e) {
      setError(e.message || 'Ошибка соединения')
    } finally {
      setLoading(false)
    }
  }

  const stepLabels = dest?.id === 'bybit'
    ? ['Куда', 'Сумма', null, 'Проверка', 'Готово']
    : ['Куда', 'Сумма', 'Реквизиты', 'Проверка', 'Готово']

  const visibleSteps = stepLabels.filter(Boolean)

  function stepBack() {
    if (step === 3 && dest?.id === 'bybit') setStep(1)
    else if (step > 0) setStep(s => s - 1)
    else onBack()
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface px-5 pt-14 pb-8">

      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <BackButton onClick={step === 0 ? onBack : stepBack} />
        <div>
          <h1 className="text-[18px] font-semibold text-ink">Вывод средств</h1>
          <p className="text-[12px] text-ink/40">
            {dest ? `${dest.flag} ${dest.label}` : 'Выберите маршрут'}
          </p>
        </div>
        {dest && (
          <span className={`ml-auto rounded-full px-3 py-1 text-[11px] font-medium ${dest.badgeColor}`}>
            {dest.badge}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {step > 0 && step < 4 && (
        <div className="mb-6 flex gap-2">
          {visibleSteps.slice(1, 4).map((label, i) => {
            const active = i + 1 <= (dest?.id === 'bybit' && step >= 3 ? step - 1 : step)
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className={`h-1 w-full rounded-full transition-colors duration-300 ${active ? 'bg-accent' : 'bg-white/[0.08]'}`} />
                <span className={`text-[10px] ${active ? 'text-accent' : 'text-ink/30'}`}>{label}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Step 0: Choose destination ─────────────────────────────────────── */}
      {step === 0 && (
        <div className="flex flex-1 flex-col">
          <p className="mb-4 text-[14px] text-ink/60">Выберите маршрут перевода:</p>
          <div className="flex flex-col gap-3">
            {DESTINATIONS.map(d => (
              <button
                key={d.id}
                onClick={() => selectDest(d)}
                className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.04] p-4 text-left transition-all active:scale-[0.98]"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-[22px]">
                  {d.flag}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[15px] font-semibold text-ink">{d.label}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${d.badgeColor}`}>{d.badge}</span>
                  </div>
                  <p className="text-[12px] text-ink/50">{d.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[12px] font-medium text-emerald-400">{d.commission}</p>
                  <p className="text-[11px] text-ink/30">комиссия</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 1: Amount ────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="flex flex-1 flex-col">
          <p className="mb-1 text-[13px] text-ink/50">Баланс TruePay</p>
          <p className="mb-6 text-[28px] font-bold text-ink">
            ${(balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>

          <div className="mb-4 rounded-2xl bg-white/[0.04] p-4">
            <p className="mb-2 text-[11px] uppercase tracking-wider text-ink/40">Сумма вывода (₽)</p>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              className="w-full bg-transparent text-[40px] font-bold text-ink outline-none placeholder:text-ink/20"
            />
          </div>

          <div className="mb-5 flex gap-2">
            {PRESET_AMOUNTS.map(v => (
              <button key={v} onClick={() => setAmount(String(v))}
                className={`flex-1 rounded-xl py-2 text-[12px] font-medium transition-colors ${
                  numAmount === v ? 'bg-accent text-white' : 'bg-white/[0.06] text-ink/60'
                }`}>
                {v.toLocaleString()}₽
              </button>
            ))}
          </div>

          {/* Bybit: живая конвертация */}
          {dest?.id === 'bybit' && (
            <div className="mb-4 rounded-2xl border border-sky-500/20 bg-sky-950/15 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[12px] uppercase tracking-wider text-ink/40">Получишь USDT</p>
                {priceLoading
                  ? <span className="text-[11px] text-ink/30">Загружаю курс...</span>
                  : usdtPrice
                    ? <span className="text-[11px] text-ink/40">1 USDT = {usdtPrice.toLocaleString('ru-RU')} ₽</span>
                    : <span className="text-[11px] text-amber-400">Нет пары USDT/RUB — используем BTC</span>
                }
              </div>
              {estUsdt ? (
                <>
                  <p className="text-[32px] font-bold text-sky-400">≈ {estUsdt.toFixed(4)} USDT</p>
                  <p className="mt-1 text-[12px] text-ink/40">
                    {numAmount.toLocaleString()} ₽ ÷ {usdtPrice?.toLocaleString('ru-RU')} ₽/USDT
                  </p>
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2">
                    <span className="text-teal-400 text-[13px]">≈</span>
                    <span className="text-[12px] text-ink/60">
                      ${(estUsdt * 1).toFixed(2)} USD после вывода на Бакай Банк
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-[28px] font-bold text-ink/20">≈ — USDT</p>
              )}
            </div>
          )}

          {/* Bakai: курс рубля */}
          {dest?.id === 'bakai' && (
            <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[12px] uppercase tracking-wider text-ink/40">Получишь в USD</p>
                {rubRateLoading
                  ? <span className="text-[11px] text-ink/30">Загружаю курс...</span>
                  : rubRate && <span className="text-[11px] text-ink/40">{rubRate.rateLabel}</span>
                }
              </div>
              {rubRate && numAmount >= 100 ? (
                <>
                  <p className="text-[32px] font-bold text-emerald-400">
                    ≈ ${((numAmount * rubRate.rate) * 0.98).toFixed(2)}
                  </p>
                  <p className="mt-1 text-[12px] text-ink/40">
                    {numAmount.toLocaleString()} ₽ × {rubRate.rate.toFixed(4)} − 2% комиссия Бакай Банка
                  </p>
                </>
              ) : (
                <p className="text-[28px] font-bold text-ink/20">≈ $—</p>
              )}
            </div>
          )}

          <p className="mb-4 text-center text-[12px] text-ink/30">Мин. 100 ₽</p>

          <button onClick={goFromAmount} disabled={!canAmount}
            className="w-full rounded-2xl bg-accent py-4 text-[16px] font-semibold text-white disabled:opacity-30">
            Далее →
          </button>
        </div>
      )}

      {/* ── Step 2: Details (только для bakai / sandbox) ──────────────────── */}
      {step === 2 && dest?.id !== 'bybit' && (
        <div className="flex flex-1 flex-col">
          {dest?.id === 'bakai' && (
            <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/15 p-3">
              <p className="text-[12px] font-medium text-emerald-400 mb-1">🇰🇬 Бакай Банк · Реквизиты</p>
              <p className="text-[11px] text-ink/50">Введите имя и 20-значный номер счёта. БИК и корр. счёт уже заполнены.</p>
            </div>
          )}

          {Object.keys(FIELD_LABELS).map(key => {
            const isEditable  = dest?.editableFields?.includes(key) ?? true
            const placeholder = dest?.placeholders?.[key] ?? ''
            return (
              <div key={key} className="mb-3">
                <p className="mb-1 text-[11px] uppercase tracking-wider text-ink/40">{FIELD_LABELS[key]}</p>
                <input
                  value={form[key] ?? ''}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  readOnly={!isEditable}
                  inputMode={key === 'recipientAccount' ? 'numeric' : 'text'}
                  className={`w-full rounded-xl px-4 py-3 text-[13px] outline-none ${
                    isEditable
                      ? key === 'recipientAccount' && accountError
                        ? 'bg-red-500/10 text-ink ring-1 ring-red-500/40'
                        : 'bg-white/[0.06] text-ink focus:ring-1 focus:ring-accent/40'
                      : 'bg-white/[0.02] text-ink/40 cursor-default'
                  }`}
                />
                {key === 'recipientAccount' && accountError && (
                  <p className="mt-1 text-[11px] text-red-400">{accountError}</p>
                )}
                {key === 'recipientAccount' && !accountError && form[key]?.length > 0 && (
                  <p className="mt-1 text-[11px] text-emerald-400">✓ {form[key].length} цифр</p>
                )}
              </div>
            )
          })}

          <div className="mt-auto flex gap-3 pt-4">
            <button onClick={() => setStep(1)} className="flex-1 rounded-2xl bg-white/[0.06] py-4 text-[15px] text-ink/60">← Назад</button>
            <button onClick={() => canDetails && setStep(3)} disabled={!canDetails}
              className="flex-1 rounded-2xl bg-accent py-4 text-[15px] font-semibold text-white disabled:opacity-30">
              Проверить →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Confirm ───────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="flex flex-1 flex-col">
          <div className="mb-5 rounded-2xl bg-white/[0.04] p-5">
            <p className="mb-4 text-[13px] uppercase tracking-wider text-ink/40">Детали операции</p>

            {dest?.id === 'bybit' ? (
              // Bybit confirmation
              <div className="space-y-3">
                {[
                  ['Маршрут',       `${dest.flag} ${dest.label}`],
                  ['Списываем',     `${numAmount.toLocaleString()} ₽`],
                  ['Получаем',      estUsdt ? `≈ ${estUsdt.toFixed(4)} USDT` : '—'],
                  ['Курс',          usdtPrice ? `1 USDT = ${usdtPrice.toLocaleString('ru-RU')} ₽` : '—'],
                  ['Комиссия',      '~0.1% (Bybit spot)'],
                  ['Итого USD',     estUsdt ? `≈ $${estUsdt.toFixed(2)}` : '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 border-b border-white/[0.04] last:border-0">
                    <span className="text-[13px] text-ink/50">{k}</span>
                    <span className="text-[13px] font-medium text-ink">{v}</span>
                  </div>
                ))}
              </div>
            ) : (
              // Bank confirmation
              <div className="space-y-0">
                {[
                  ['Направление', `${dest?.flag} ${dest?.label}`],
                  ['Сумма',       `${numAmount.toLocaleString()} ₽`],
                  ['Получатель',  form.recipientName],
                  ['Счёт',        form.recipientAccount],
                  ['Банк',        form.recipientBankName],
                  ['БИК',         form.recipientBik],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 border-b border-white/[0.04] last:border-0">
                    <span className="text-[13px] text-ink/50">{k}</span>
                    <span className="max-w-[58%] text-right text-[13px] font-medium text-ink">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`mb-4 rounded-2xl border p-3 ${
            dest?.id === 'bybit'
              ? 'border-sky-500/20 bg-sky-950/15'
              : 'border-amber-500/20 bg-amber-950/15'
          }`}>
            <p className={`text-[12px] ${dest?.id === 'bybit' ? 'text-sky-400' : 'text-amber-400'}`}>
              {dest?.id === 'bybit'
                ? '⚡ Реальный вызов Bybit API — маркет-ордер на покупку USDT'
                : '⚠️ Sandbox — реальные деньги не списываются'}
            </p>
          </div>

          {error && <p className="mb-4 text-center text-[13px] text-red-400">{error}</p>}

          <div className="mt-auto flex gap-3">
            <button onClick={stepBack} className="flex-1 rounded-2xl bg-white/[0.06] py-4 text-[15px] text-ink/60">← Назад</button>
            <button onClick={handleConfirm} disabled={loading}
              className={`flex-1 rounded-2xl py-4 text-[15px] font-semibold text-white disabled:opacity-50 ${
                dest?.id === 'bybit' ? 'bg-sky-600' : 'bg-accent'
              }`}>
              {loading ? '⏳ Выполняю...' : dest?.id === 'bybit' ? '⚡ Купить USDT' : 'Подтвердить'}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Result ────────────────────────────────────────────────── */}
      {step === 4 && result && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          {result.ok ? (
            <>
              <div className={`mb-4 flex h-20 w-20 items-center justify-center rounded-full ${
                result.type === 'bybit' ? 'bg-sky-500/15' : 'bg-emerald-500/15'
              }`}>
                <svg className={`h-10 w-10 ${result.type === 'bybit' ? 'text-sky-400' : 'text-emerald-400'}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="mb-1 text-[22px] font-bold text-ink">
                {result.type === 'bybit' ? 'Ордер размещён!' : 'Принято!'}
              </h2>

              {result.type === 'bybit' ? (
                <>
                  <p className="mb-1 text-[15px] text-ink/60">
                    {numAmount.toLocaleString()} ₽ → {result.usdtAmount} USDT
                  </p>
                  <p className="mb-6 text-[11px] text-ink/30">
                    Order ID: {result.orderId ?? 'pending'} · {result.retMsg || 'OK'}
                  </p>

                  {/* Bybit → Баки Банк симуляция */}
                  <div className="w-full mb-4 rounded-2xl overflow-hidden text-left">
                    <div className="bg-sky-500/15 border border-sky-500/20 px-4 py-3 flex items-center gap-2">
                      <span className="text-[18px]">₿</span>
                      <p className="text-[13px] font-semibold text-sky-400">Bybit → Бакай Банк · Симуляция</p>
                    </div>
                    <div className="bg-white/[0.03] border border-t-0 border-white/[0.06] p-4 space-y-3">
                      {[
                        ['Куплено USDT',   `${result.usdtAmount} USDT`],
                        ['Курс',           `1 USDT = ${result.rubPerUsdt?.toLocaleString('ru-RU')} ₽`],
                        ['Комиссия Bybit', `~0.1% (≈ ${(result.usdtAmount * 0.001).toFixed(4)} USDT)`],
                        ['USDT → USD',     `1:1 (стейблкоин)`],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-[12px] text-ink/50">{k}</span>
                          <span className="text-[12px] font-medium text-ink">{v}</span>
                        </div>
                      ))}
                      <div className="h-px bg-white/[0.06]" />
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] font-medium text-ink">🇰🇬 Поступит в USD</span>
                        <span className="text-[22px] font-bold text-sky-400">
                          ≈ ${(parseFloat(result.usdtAmount) * 0.999).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-[10px] text-ink/30 text-center">
                        Симуляция SWIFT-вывода · В продакшне — реальный вывод USDT → USD на карту Бакай Банка
                      </p>
                    </div>
                  </div>

                  {/* Raw ответ Bybit */}
                  <div className="w-full rounded-2xl bg-white/[0.04] p-4 text-left">
                    <p className="mb-2 text-[11px] uppercase tracking-wider text-ink/40">Ответ Bybit API</p>
                    <pre className="overflow-x-auto text-[11px] text-ink/50 whitespace-pre-wrap">
                      {JSON.stringify({ ok: result.ok, orderId: result.orderId, usdtAmount: result.usdtAmount, rubPerUsdt: result.rubPerUsdt, retMsg: result.retMsg }, null, 2)}
                    </pre>
                  </div>
                </>
              ) : (
                <>
                  <p className="mb-1 text-[15px] text-ink/60">
                    {numAmount.toLocaleString()} ₽ → {dest?.flag} {dest?.label}
                  </p>
                  <p className="mb-6 text-[11px] text-ink/30">ID: {result.paymentId}</p>

                  {/* Bakai симуляция */}
                  {result.type === 'bakai' && (
                    <div className="w-full mb-4 rounded-2xl overflow-hidden text-left">
                      <div className="bg-emerald-500/15 border border-emerald-500/20 px-4 py-3 flex items-center gap-2">
                        <span className="text-lg">🇰🇬</span>
                        <p className="text-[13px] font-semibold text-emerald-400">Бакай Банк · Симуляция</p>
                      </div>
                      <div className="bg-white/[0.03] border border-t-0 border-white/[0.06] p-4 space-y-3">
                        {[
                          ['Получено',       `${numAmount.toLocaleString()} ₽`],
                          ['Курс дня',       rubRate ? `1 ₽ = $${rubRate.rate.toFixed(4)}` : '—'],
                          ['Комиссия банка', '2%'],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span className="text-[12px] text-ink/50">{k}</span>
                            <span className="text-[12px] font-medium text-ink">{v}</span>
                          </div>
                        ))}
                        <div className="h-px bg-white/[0.06]" />
                        <div className="flex justify-between items-center">
                          <span className="text-[13px] font-medium text-ink">Зачислено USD</span>
                          <span className="text-[22px] font-bold text-emerald-400">
                            {rubRate ? `$${((numAmount * rubRate.rate) * 0.98).toFixed(2)}` : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="w-full rounded-2xl bg-white/[0.04] p-4 text-left">
                    <p className="mb-2 text-[11px] uppercase tracking-wider text-ink/40">Ответ T-Bank Sandbox</p>
                    <pre className="overflow-x-auto text-[11px] text-ink/50 whitespace-pre-wrap">
                      {JSON.stringify(result.raw, null, 2) || `HTTP ${result.httpStatus}`}
                    </pre>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/15">
                <svg className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="mb-2 text-[22px] font-bold text-ink">Ошибка</h2>
              <p className="mb-6 text-[13px] text-ink/50">{result.retMsg || JSON.stringify(result)}</p>
            </>
          )}

          <button onClick={onBack} className="mt-4 w-full rounded-2xl bg-accent py-4 text-[15px] font-semibold text-white">
            На главную
          </button>
        </div>
      )}

    </div>
  )
}
