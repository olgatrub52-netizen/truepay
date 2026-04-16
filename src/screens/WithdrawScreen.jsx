import { useState } from 'react'

const STEPS = ['amount', 'details', 'confirm', 'result']

const PRESET_AMOUNTS = [1000, 3000, 5000, 10000]

// Тестовые реквизиты для sandbox
const SANDBOX_PRESET = {
  recipientName:        'Иванов Иван Иванович',
  recipientAccount:     '40817810099910004312',
  recipientBik:         '044525225',
  recipientBankName:    'ПАО Сбербанк',
  recipientCorrAccount: '30101810400000000225',
  recipientInn:         '0',
  purpose:              'Перевод физическому лицу',
}

export default function WithdrawScreen({ onBack, balance, onSuccess }) {
  const [step, setStep]       = useState(0)
  const [amount, setAmount]   = useState('')
  const [form, setForm]       = useState(SANDBOX_PRESET)
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState('')

  const numAmount = Number(amount)
  const canProceed = numAmount >= 100 && numAmount <= (balance ?? 99999)

  async function handleConfirm() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/tbank', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'transfer', amount: numAmount, ...form }),
      })
      const data = await res.json()
      setResult(data)
      setStep(3)
      if (data.ok) onSuccess?.({ amount: numAmount, paymentId: data.paymentId })
    } catch (e) {
      setError('Ошибка соединения с T-Bank Sandbox')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface px-5 pt-14 pb-8">

      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <button onClick={onBack} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06]">
          <svg className="h-5 w-5 text-ink/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-[18px] font-semibold text-ink">Вывод средств</h1>
          <p className="text-[12px] text-ink/40">T-Bank Sandbox · Тестовый режим</p>
        </div>
        <span className="ml-auto rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-medium text-amber-400">
          SANDBOX
        </span>
      </div>

      {/* Step indicators */}
      <div className="mb-8 flex gap-2">
        {['Сумма', 'Реквизиты', 'Подтверждение', 'Готово'].map((label, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className={`h-1 w-full rounded-full transition-colors duration-300 ${
              i <= step ? 'bg-accent' : 'bg-white/[0.08]'
            }`} />
            <span className={`text-[10px] ${i === step ? 'text-accent' : 'text-ink/30'}`}>{label}</span>
          </div>
        ))}
      </div>

      {/* Step 0: Amount */}
      {step === 0 && (
        <div className="flex flex-1 flex-col">
          <p className="mb-2 text-[13px] text-ink/50">Доступно</p>
          <p className="mb-8 text-[32px] font-bold text-ink">
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

          <div className="mb-8 flex gap-2">
            {PRESET_AMOUNTS.map(v => (
              <button
                key={v}
                onClick={() => setAmount(String(v))}
                className={`flex-1 rounded-xl py-2 text-[13px] font-medium transition-colors ${
                  Number(amount) === v
                    ? 'bg-accent text-white'
                    : 'bg-white/[0.06] text-ink/60'
                }`}
              >
                {v.toLocaleString()}₽
              </button>
            ))}
          </div>

          <p className="mb-4 text-center text-[12px] text-ink/30">
            Мин. 100₽ · В тестовом режиме реальных списаний нет
          </p>

          <button
            onClick={() => canProceed && setStep(1)}
            disabled={!canProceed}
            className="w-full rounded-2xl bg-accent py-4 text-[16px] font-semibold text-white disabled:opacity-30"
          >
            Далее →
          </button>
        </div>
      )}

      {/* Step 1: Recipient details */}
      {step === 1 && (
        <div className="flex flex-1 flex-col">
          <div className="mb-4 rounded-2xl border border-accent/20 bg-accent/5 p-3">
            <p className="text-[12px] text-accent">
              🧪 Реквизиты заполнены тестовыми данными Sandbox. В продакшне пользователь вводит реальные данные.
            </p>
          </div>

          {[
            { key: 'recipientName',    label: 'ФИО получателя' },
            { key: 'recipientAccount', label: 'Номер счёта (20 цифр)' },
            { key: 'recipientBik',     label: 'БИК банка' },
            { key: 'recipientBankName',label: 'Название банка' },
            { key: 'purpose',          label: 'Назначение платежа' },
          ].map(({ key, label }) => (
            <div key={key} className="mb-3">
              <p className="mb-1 text-[11px] uppercase tracking-wider text-ink/40">{label}</p>
              <input
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full rounded-xl bg-white/[0.06] px-4 py-3 text-[14px] text-ink outline-none focus:ring-1 focus:ring-accent/40"
              />
            </div>
          ))}

          <div className="mt-auto flex gap-3 pt-4">
            <button onClick={() => setStep(0)} className="flex-1 rounded-2xl bg-white/[0.06] py-4 text-[15px] text-ink/60">
              ← Назад
            </button>
            <button onClick={() => setStep(2)} className="flex-1 rounded-2xl bg-accent py-4 text-[15px] font-semibold text-white">
              Проверить →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Confirm */}
      {step === 2 && (
        <div className="flex flex-1 flex-col">
          <div className="mb-6 rounded-2xl bg-white/[0.04] p-5">
            <p className="mb-4 text-[13px] uppercase tracking-wider text-ink/40">Детали перевода</p>
            {[
              ['Сумма',       `${numAmount.toLocaleString()} ₽`],
              ['Получатель',  form.recipientName],
              ['Счёт',        form.recipientAccount.replace(/(\d{4})/g, '$1 ').trim()],
              ['Банк',        form.recipientBankName],
              ['БИК',         form.recipientBik],
              ['Назначение',  form.purpose],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-white/[0.04] last:border-0">
                <span className="text-[13px] text-ink/50">{k}</span>
                <span className="max-w-[55%] text-right text-[13px] font-medium text-ink">{v}</span>
              </div>
            ))}
          </div>

          <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-950/15 p-3">
            <p className="text-[12px] text-amber-400">
              ⚠️ Это тестовый перевод в Sandbox T-Bank. Реальные деньги не списываются.
            </p>
          </div>

          {error && <p className="mb-4 text-center text-[13px] text-red-400">{error}</p>}

          <div className="mt-auto flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 rounded-2xl bg-white/[0.06] py-4 text-[15px] text-ink/60">
              ← Назад
            </button>
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

      {/* Step 3: Result */}
      {step === 3 && result && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          {result.ok ? (
            <>
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15">
                <svg className="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mb-2 text-[22px] font-bold text-ink">Принято!</h2>
              <p className="mb-1 text-[15px] text-ink/60">{numAmount.toLocaleString()} ₽ → {form.recipientName}</p>
              <p className="mb-6 text-[12px] text-ink/30">T-Bank Sandbox · ID: {result.paymentId}</p>
              <div className="w-full rounded-2xl bg-white/[0.04] p-4 text-left">
                <p className="mb-2 text-[11px] uppercase tracking-wider text-ink/40">Ответ Sandbox</p>
                <pre className="overflow-x-auto text-[11px] text-ink/50">
                  {JSON.stringify(result.raw, null, 2)}
                </pre>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/15">
                <svg className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="mb-2 text-[22px] font-bold text-ink">Ошибка</h2>
              <p className="mb-6 text-[13px] text-ink/50">{JSON.stringify(result.raw)}</p>
            </>
          )}
          <button onClick={onBack} className="mt-6 w-full rounded-2xl bg-accent py-4 text-[15px] font-semibold text-white">
            На главную
          </button>
        </div>
      )}

    </div>
  )
}
