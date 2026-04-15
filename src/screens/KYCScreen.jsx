import { useRef, useState } from 'react'
import ScreenChrome from '../components/ui/ScreenChrome.jsx'
import { IconPassport, IconFaceId, IconShield, IconCheck } from '../components/icons/index.jsx'

const STEPS = [
  { id: 'bio',      label: 'Биометрия',      icon: <IconFaceId className="h-6 w-6" />, description: 'Face ID или Touch ID для подтверждения личности' },
  { id: 'passport', label: 'Документ',        icon: <IconPassport className="h-6 w-6" />, description: 'Разворот паспорта с фото и данными' },
  { id: 'done',     label: 'Подтверждение',   icon: <IconShield className="h-6 w-6" />, description: 'Проверка данных оператором (до 24 ч.)' },
]

export default function KYCScreen({ onBack, onComplete }) {
  const [step, setStep] = useState(0)
  const [bioLoading, setBioLoading] = useState(false)
  const [passportFile, setPassportFile] = useState(null)
  const fileRef = useRef(null)

  const runBio = async () => {
    setBioLoading(true)
    await new Promise((r) => setTimeout(r, 1200))
    setBioLoading(false)
    setStep(1)
  }

  const finish = () => {
    if (!passportFile) return
    setStep(2)
  }

  return (
    <ScreenChrome title="KYC — Верификация" onBack={onBack}>
      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-sky-500' : 'bg-white/10'}`} />
        ))}
      </div>

      {/* Step 0: Biometrics */}
      {step === 0 && (
        <div className="flex flex-col gap-5 animate-fade-in">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/[0.06] bg-surface-raised/50 text-sky-400">
              <IconFaceId className="h-10 w-10" />
            </div>
            <h2 className="text-[20px] font-semibold text-white">Подтвердите личность</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-slate-500">
              Используйте Face ID, Touch ID или биометрию устройства.<br />
              В демо — имитация; в продакшене здесь WebAuthn или нативный SDK.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-surface-raised/30 p-4 space-y-2">
            <InfoRow emoji="🔒" text="Данные не покидают устройство" />
            <InfoRow emoji="⚡" text="Проверка занимает несколько секунд" />
            <InfoRow emoji="🛡️" text="Соответствует стандарту FIDO2 / WebAuthn" />
          </div>

          <button type="button" onClick={runBio} disabled={bioLoading} className="tp-btn-accent">
            {bioLoading ? 'Проверка…' : 'Подтвердить биометрию'}
          </button>
        </div>
      )}

      {/* Step 1: Passport scan */}
      {step === 1 && (
        <div className="flex flex-col gap-5 animate-fade-in">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/[0.06] bg-surface-raised/50 text-sky-400">
              <IconPassport className="h-10 w-10" />
            </div>
            <h2 className="text-[20px] font-semibold text-white">Загрузите документ</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-slate-500">
              Сфотографируйте разворот паспорта с фотографией. Файл не отправляется на сервер в этом демо.
            </p>
          </div>

          {/* Scan frame */}
          <div
            className="relative mx-auto flex items-center justify-center rounded-2xl border-2 border-dashed border-sky-500/40 bg-sky-950/15"
            style={{ width: '100%', aspectRatio: '3/2' }}
            onClick={() => fileRef.current?.click()}
          >
            {/* Corner marks */}
            {['-top-px -left-px', '-top-px -right-px', '-bottom-px -left-px', '-bottom-px -right-px'].map((pos, i) => (
              <div key={i} className={`absolute ${pos} h-5 w-5 ${i < 2 ? 'border-t-2' : 'border-b-2'} ${i % 2 === 0 ? 'border-l-2' : 'border-r-2'} border-sky-400 rounded-sm`} />
            ))}

            {passportFile ? (
              <div className="flex flex-col items-center gap-2 text-center p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
                  <IconCheck className="h-6 w-6" />
                </div>
                <p className="text-[14px] font-medium text-white">Файл выбран</p>
                <p className="truncate max-w-[200px] text-[12px] text-slate-500">{passportFile.name}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 p-6 text-center">
                <div className="text-3xl">📷</div>
                <p className="text-[15px] font-medium text-white">Нажмите для загрузки</p>
                <p className="text-[13px] text-slate-500">JPG, PNG, HEIC — до 10 МБ</p>
              </div>
            )}
          </div>

          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only"
            onChange={(e) => setPassportFile(e.target.files?.[0] ?? null)} />

          <button type="button" onClick={() => fileRef.current?.click()}
            className="tp-btn-accent">
            {passportFile ? 'Заменить фото' : 'Снять или загрузить фото'}
          </button>

          <button type="button" onClick={finish} disabled={!passportFile} className="tp-btn-primary">
            Продолжить
          </button>
        </div>
      )}

      {/* Step 2: Done */}
      {step === 2 && (
        <div className="flex flex-col items-center gap-5 animate-fade-in text-center py-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-emerald-500/30 bg-emerald-950/30 text-emerald-400">
            <IconCheck className="h-12 w-12" />
          </div>
          <div>
            <h2 className="text-[22px] font-semibold text-white">Данные отправлены</h2>
            <p className="mt-2 max-w-[280px] text-[14px] leading-relaxed text-slate-500">
              Проверка документов занимает до 24 часов. Вы получите уведомление о результате.
            </p>
          </div>

          <div className="w-full rounded-2xl border border-white/[0.06] bg-surface-raised/30 p-4 space-y-2 text-left">
            <InfoRow emoji="✅" text="Биометрия подтверждена" />
            <InfoRow emoji="📄" text="Документ загружен" />
            <InfoRow emoji="⏳" text="Ожидание проверки оператором" />
          </div>

          <button
            type="button"
            onClick={() => { onComplete?.(); onBack() }}
            className="tp-btn-primary mt-2"
          >
            На главную
          </button>
        </div>
      )}
    </ScreenChrome>
  )
}

function InfoRow({ emoji, text }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-base">{emoji}</span>
      <span className="text-[13px] text-slate-400">{text}</span>
    </div>
  )
}
