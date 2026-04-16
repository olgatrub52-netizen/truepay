import { useState } from 'react'

const PRESET_AMOUNTS = [5000, 10000, 25000, 50000]

const DESTINATIONS = [
  {
    id: 'sandbox',
    label: 'Тест (Sandbox)',
    flag: '🧪',
    description: 'Тестовый перевод T-Bank Sandbox',
    commission: '0%',
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
  {
    id: 'bakai',
    label: 'Бакай Банк',
    flag: '🇰🇬',
    description: 'Кыргызстан · RUB → USD',
    commission: '~1–2%',
    hint: 'Рубли поступают в Бакай Банк и конвертируются в USD по курсу дня. SWIFT: BAKAKG22',
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
      recipientAccount: 'Номер вашего счёта в Бакай Банке',
    },
  },
]

const FIELD_LABELS = {
  recipientName:        'ФИО получателя',
  recipientAccount:     'Номер счёта',
  recipientBik:         'БИК банка',
  recipientBankName:    'Банк получателя',
  purpose:              'Назначение платежа',
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
  const [step, setStep]     = useState(0) // 0=dest, 1=amount, 2=details, 3=confirm, 4=result
  const [dest, setDest]     = useState(null)
  const [amount, setAmount] = useState('')
  const [form, setForm]     = useState({})
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState('')

  const numAmount  = Number(amount)
  const canAmount  = numAmount >= 100
  const canDetails = (dest?.editableFields ?? []).every(f => form[f]?.trim())

  function selectDest(d) {
    setDest(d)
    setForm({ ...d.form })
    setStep(1)
  }

  async function handleConfirm() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/tbank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'transfer', amount: numAmount, ...form }),
      })
      const data = await res.json()
      setResult(data)
      setStep(4)
      if (data.ok) onSuccess?.({ amount: numAmount, paymentId: data.paymentId })
    } catch {
      setError('Ошибка соединения с T-Bank Sandbox')
    } finally {
      setLoading(false)
    }
  }

  const stepLabels = ['Куда', 'Сумма', 'Реквизиты', 'Проверка', 'Готово']

  return (
    <div className="flex min-h-screen flex-col bg-surface px-5 pt-14 pb-8">

      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <BackButton onClick={step === 0 ? onBack : () => setStep(s => s - 1)} />
        <div>
          <h1 className="text-[18px] font-semibold text-ink">Вывод средств</h1>
          <p className="text-[12px] text-ink/40">
            {dest ? `${dest.flag} ${dest.label}` : 'T-Bank Sandbox · Тестовый режим'}
          </p>
        </div>
        <span className="ml-auto rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-medium text-amber-400">
          SANDBOX
        </span>
      </div>

      {/* Progress */}
      {step > 0 && step < 4 && (
        <div className="mb-6 flex gap-2">
          {stepLabels.slice(1, 5).map((label, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className={`h-1 w-full rounded-full transition-colors duration-300 ${
                i < step ? 'bg-accent' : 'bg-white/[0.08]'
              }`} />
              <span className={`text-[10px] ${i + 1 === step ? 'text-accent' : 'text-ink/30'}`}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Step 0: Choose destination ───────────────────────────────────────── */}
      {step === 0 && (
        <div className="flex flex-1 flex-col">
          <p className="mb-4 text-[14px] text-ink/60">Выберите куда отправить:</p>
          <div className="flex flex-col gap-3">
            {DESTINATIONS.map(d => (
              <button
                key={d.id}
                onClick={() => selectDest(d)}
                className="flex items-center gap-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] p-4 text-left transition-all active:scale-[0.98]"
              >
                <span className="text-3xl">{d.flag}</span>
                <div className="flex-1">
                  <p className="text-[15px] font-semibold text-ink">{d.label}</p>
                  <p className="text-[12px] text-ink/50">{d.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-medium text-emerald-400">{d.commission}</p>
                  <p className="text-[11px] text-ink/30">комиссия</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 1: Amount ───────────────────────────────────────────────────── */}
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

          <div className="mb-6 flex gap-2">
            {PRESET_AMOUNTS.map(v => (
              <button
                key={v}
                onClick={() => setAmount(String(v))}
                className={`flex-1 rounded-xl py-2 text-[12px] font-medium transition-colors ${
                  numAmount === v ? 'bg-accent text-white' : 'bg-white/[0.06] text-ink/60'
                }`}
              >
                {v.toLocaleString()}₽
              </button>
            ))}
          </div>

          {dest?.hint && (
            <div className="mb-4 rounded-2xl border border-accent/20 bg-accent/5 p-3">
              <p className="text-[12px] text-accent/80">{dest.hint}</p>
            </div>
          )}

          <p className="mb-4 text-center text-[12px] text-ink/30">Мин. 100₽ · Реальных списаний нет</p>

          <button
            onClick={() => canAmount && setStep(2)}
            disabled={!canAmount}
            className="w-full rounded-2xl bg-accent py-4 text-[16px] font-semibold text-white disabled:opacity-30"
          >
            Далее →
          </button>
        </div>
      )}

      {/* ── Step 2: Details ──────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="flex flex-1 flex-col">
          {dest?.id === 'bakai' && (
            <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/15 p-3">
              <p className="text-[12px] font-medium text-emerald-400 mb-1">🇰🇬 Бакай Банк · Реквизиты</p>
              <p className="text-[11px] text-ink/50">БИК корр. банка и счёт заполнены автоматически. Введите только своё имя и номер счёта.</p>
            </div>
          )}

          {Object.keys(FIELD_LABELS).map(key => {
            const isEditable = dest?.editableFields?.includes(key) ?? true
            const placeholder = dest?.placeholders?.[key] ?? ''
            return (
              <div key={key} className="mb-3">
                <p className="mb-1 text-[11px] uppercase tracking-wider text-ink/40">{FIELD_LABELS[key]}</p>
                <input
                  value={form[key] ?? ''}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  readOnly={!isEditable}
                  className={`w-full rounded-xl px-4 py-3 text-[13px] outline-none ${
                    isEditable
                      ? 'bg-white/[0.06] text-ink focus:ring-1 focus:ring-accent/40'
                      : 'bg-white/[0.02] text-ink/40 cursor-default'
                  }`}
                />
              </div>
            )
          })}

          <div className="mt-auto flex gap-3 pt-4">
            <button onClick={() => setStep(1)} className="flex-1 rounded-2xl bg-white/[0.06] py-4 text-[15px] text-ink/60">← Назад</button>
            <button
              onClick={() => canDetails && setStep(3)}
              disabled={!canDetails}
              className="flex-1 rounded-2xl bg-accent py-4 text-[15px] font-semibold text-white disabled:opacity-30"
            >
              Проверить →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Confirm ──────────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="flex flex-1 flex-col">
          <div className="mb-6 rounded-2xl bg-white/[0.04] p-5">
            <p className="mb-4 text-[13px] uppercase tracking-wider text-ink/40">Детали перевода</p>
            {[
              ['Направление', `${dest?.flag} ${dest?.label}`],
              ['Сумма',       `${numAmount.toLocaleString()} ₽`],
              ['Получатель',  form.recipientName],
              ['Счёт',        form.recipientAccount],
              ['Банк',        form.recipientBankName],
              ['БИК',         form.recipientBik],
              ['Назначение',  form.purpose],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-white/[0.04] last:border-0">
                <span className="text-[13px] text-ink/50">{k}</span>
                <span className="max-w-[58%] text-right text-[13px] font-medium text-ink">{v}</span>
              </div>
            ))}
          </div>

          <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-950/15 p-3">
            <p className="text-[12px] text-amber-400">⚠️ Sandbox — реальные деньги не списываются</p>
          </div>

          {error && <p className="mb-4 text-center text-[13px] text-red-400">{error}</p>}

          <div className="mt-auto flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 rounded-2xl bg-white/[0.06] py-4 text-[15px] text-ink/60">← Назад</button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 rounded-2xl bg-accent py-4 text-[15px] font-semibold text-white disabled:opacity-50"
            >
              {loading ? '⏳ Отправка...' : 'Подтвердить'}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Result ───────────────────────────────────────────────────── */}
      {step === 4 && result && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          {result.ok ? (
            <>
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15">
                <svg className="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mb-1 text-[22px] font-bold text-ink">Принято!</h2>
              <p className="mb-1 text-[15px] text-ink/60">
                {numAmount.toLocaleString()} ₽ → {dest?.flag} {dest?.label}
              </p>
              {dest?.id === 'bakai' && (
                <p className="mb-4 text-[12px] text-emerald-400">Конвертация в USD произойдёт в Бакай Банке</p>
              )}
              <p className="mb-6 text-[11px] text-ink/30">ID: {result.paymentId}</p>
              <div className="w-full rounded-2xl bg-white/[0.04] p-4 text-left">
                <p className="mb-2 text-[11px] uppercase tracking-wider text-ink/40">Ответ T-Bank Sandbox</p>
                <pre className="overflow-x-auto text-[11px] text-ink/50 whitespace-pre-wrap">
                  {JSON.stringify(result.raw, null, 2) || `HTTP ${result.httpStatus} — перевод поставлен в очередь`}
                </pre>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/15">
                <svg className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="mb-2 text-[22px] font-bold text-ink">Ошибка</h2>
              <p className="mb-6 text-[13px] text-ink/50">{JSON.stringify(result.raw)}</p>
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
