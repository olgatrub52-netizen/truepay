import { useState } from 'react'
import Toggle from '../components/ui/Toggle.jsx'
import {
  IconChevronRight,
  IconLogout,
  IconShield,
  IconFaceId,
  IconBell,
  IconQR,
} from '../components/icons/index.jsx'

// ─── Verification status block ────────────────────────────────────────────────

function VerificationBanner({ kycVerified, onKyc, onToggleKyc }) {
  return (
    <div>
      {kycVerified ? (
        /* ── Verified state ─────────────────────────── */
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/15 p-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/12 border border-emerald-500/20">
              <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="tp-label text-emerald-500/70">Статус верификации</p>
              <p className="mt-0.5 text-[16px] font-semibold text-white">Verified Resident</p>
              <p className="mt-0.5 text-[12px] text-slate-500">Личность подтверждена · Апрель 2026</p>
            </div>
            <div className="shrink-0 text-[22px]">✅</div>
          </div>
        </div>
      ) : (
        /* ── Action Required state ───────────────────── */
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/18 p-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/20">
              <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="tp-label text-amber-500/80">Action Required</p>
              <p className="mt-0.5 text-[16px] font-semibold text-white">Verify Identity</p>
              <p className="mt-1 text-[13px] text-slate-400 leading-snug">
                Аккаунт ограничен до завершения верификации KYC
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onKyc}
            className="mt-4 w-full rounded-xl border border-amber-500/30 bg-amber-500/15 py-3 text-[14px] font-semibold text-amber-300 transition hover:bg-amber-500/25 active:scale-[0.98]"
          >
            Верифицировать сейчас →
          </button>
        </div>
      )}

      {/* Dev toggle — small, unobtrusive */}
      <div className="mt-2 flex items-center justify-end gap-2 px-1">
        <span className="text-[10px] text-slate-700">DEV · KYC</span>
        <button
          type="button"
          onClick={() => onToggleKyc(!kycVerified)}
          className={`relative h-5 w-9 rounded-full border transition-colors ${
            kycVerified
              ? 'border-emerald-500/30 bg-emerald-500/20'
              : 'border-white/[0.1] bg-white/[0.07]'
          }`}
          aria-label="Toggle KYC status"
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              kycVerified ? 'translate-x-[18px]' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
    </div>
  )
}

// ─── Generic row ──────────────────────────────────────────────────────────────

function SettingRow({ icon, label, hint, hintColor = 'slate', onClick }) {
  const hintClass = hintColor === 'emerald' ? 'text-emerald-400' : 'text-slate-500'
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-white/[0.03] active:bg-white/[0.05]"
    >
      <span className="shrink-0 text-slate-400">{icon}</span>
      <span className="flex-1 text-[15px] text-white">{label}</span>
      {hint && <span className={`text-[13px] ${hintClass}`}>{hint}</span>}
      <IconChevronRight className="h-4 w-4 shrink-0 text-slate-600" />
    </button>
  )
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function ProfileScreen({
  user,
  onLogout,
  onKyc,
  onSupport,
  kycVerified,
  onKycToggle,
  showToast,
}) {
  const [biometrics, setBiometrics] = useState(true)
  const [pushNotif,  setPushNotif]  = useState(true)
  const [txAlerts,   setTxAlerts]   = useState(true)

  const initials =
    user?.name
      ?.split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? 'T'

  return (
    <div className="flex min-h-[100dvh] flex-col bg-surface animate-fade-in pb-tab">
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-48 bg-gradient-to-b from-sky-950/[0.1] to-transparent"
        aria-hidden
      />

      {/* Header */}
      <header
        className="relative z-10 px-5"
        style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
      >
        <p className="tp-label">Аккаунт</p>
        <h1 className="mt-1 text-[20px] font-semibold text-white">Профиль</h1>
      </header>

      <div className="relative z-10 mt-5 space-y-4 overflow-y-auto px-5">

        {/* User card */}
        <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-surface-raised/30 p-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-sky-950/50 text-lg font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-semibold text-white">{user?.name}</p>
            <p className="truncate text-[13px] text-slate-500">{user?.email}</p>
          </div>
          <div
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
              kycVerified
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-amber-500/15 text-amber-400'
            }`}
          >
            {kycVerified ? 'Verified' : 'Pending'}
          </div>
        </div>

        {/* ── Verification status ── */}
        <div>
          <p className="tp-label mb-2 px-1">Статус верификации</p>
          <VerificationBanner
            kycVerified={kycVerified}
            onKyc={onKyc}
            onToggleKyc={onKycToggle}
          />
        </div>

        {/* Notifications */}
        <div>
          <p className="tp-label mb-2 px-1">Уведомления</p>
          <div className="rounded-2xl border border-white/[0.06] bg-surface-raised/30 overflow-hidden divide-y divide-white/[0.05] px-4">
            <div className="py-4">
              <Toggle
                checked={pushNotif}
                onChange={() => {
                  setPushNotif((v) => !v)
                  showToast(!pushNotif ? 'Push включены' : 'Push выключены')
                }}
                label="Push-уведомления"
                description="Новости и обновления"
              />
            </div>
            <div className="py-4">
              <Toggle
                checked={txAlerts}
                onChange={() => {
                  setTxAlerts((v) => !v)
                  showToast(!txAlerts ? 'Алерты включены' : 'Алерты выключены')
                }}
                label="Оповещения о платежах"
                description="При каждой транзакции"
              />
            </div>
          </div>
        </div>

        {/* Security */}
        <div>
          <p className="tp-label mb-2 px-1">Безопасность</p>
          <div className="rounded-2xl border border-white/[0.06] bg-surface-raised/30 overflow-hidden divide-y divide-white/[0.05] px-4">
            <div className="py-4">
              <Toggle
                checked={biometrics}
                onChange={() => {
                  setBiometrics((v) => !v)
                  showToast(!biometrics ? 'Биометрия включена' : 'Биометрия выключена')
                }}
                label="Вход по биометрии"
                description="Face ID или Touch ID"
              />
            </div>
          </div>
        </div>

        {/* More */}
        <div>
          <p className="tp-label mb-2 px-1">Ещё</p>
          <div className="rounded-2xl border border-white/[0.06] bg-surface-raised/30 overflow-hidden divide-y divide-white/[0.05]">
            <SettingRow
              icon={<IconShield className="h-5 w-5" />}
              label="Лимиты"
              hint="Настроить"
              onClick={() => showToast('Перейдите в Settings → Лимиты')}
            />
            <SettingRow
              icon={<IconFaceId className="h-5 w-5" />}
              label="Биометрия"
              hint="Активна"
              hintColor="emerald"
              onClick={() => showToast('Face ID активен')}
            />
            <SettingRow
              icon={<IconQR className="h-5 w-5" />}
              label="QR для получения"
              onClick={() => showToast('QR-код — скоро')}
            />
          </div>
        </div>

        {/* ── Support button ── */}
        <button
          type="button"
          onClick={onSupport}
          className="group flex w-full items-center gap-4 rounded-2xl border border-sky-500/20 bg-sky-950/15 px-4 py-4 text-left transition hover:bg-sky-950/25 active:scale-[0.99]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-500/25 bg-sky-500/10 text-sky-400 transition group-hover:bg-sky-500/18">
            <IconBell className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-[15px] font-medium text-white">Поддержка</p>
            <p className="text-[12px] text-slate-500">Чат с командой TruePay</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <IconChevronRight className="h-4 w-4 shrink-0 text-slate-600" />
          </div>
        </button>

        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-2xl border border-red-500/20 bg-red-950/15 px-4 py-4 text-left transition hover:bg-red-950/25 active:scale-[0.99]"
        >
          <IconLogout className="h-5 w-5 shrink-0 text-red-400" />
          <span className="text-[15px] font-medium text-red-400">Выйти из аккаунта</span>
        </button>

        <p className="pb-2 text-center text-[11px] text-sky-500">
          TruePay v1.0.0-MVP · © 2026
        </p>
      </div>
    </div>
  )
}
