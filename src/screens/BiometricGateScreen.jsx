import { useState } from 'react'
import { IconFaceId } from '../components/icons/index.jsx'

export default function BiometricGateScreen({ user, onUnlock }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const unlock = async () => {
    setLoading(true)
    setError('')
    await new Promise((r) => setTimeout(r, 1100))
    setLoading(false)
    onUnlock()
  }

  const initials = user?.name
    ?.split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'T'

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-surface px-8 animate-fade-in">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[45vh] bg-gradient-to-b from-sky-950/20 to-transparent" aria-hidden />

      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        {/* Avatar */}
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/[0.08] bg-surface-raised/60 text-2xl font-semibold text-white">
          {initials}
        </div>

        <div>
          <p className="text-[22px] font-semibold text-white">{user?.name}</p>
          <p className="mt-1 text-[14px] text-slate-500">{user?.email}</p>
        </div>

        {/* Face ID button */}
        <button
          type="button"
          onClick={unlock}
          disabled={loading}
          className="flex h-20 w-20 flex-col items-center justify-center gap-2 rounded-3xl border border-white/[0.08] bg-surface-raised/50 text-sky-400 transition hover:border-sky-500/30 hover:bg-sky-950/30 active:scale-95 disabled:opacity-70"
        >
          <IconFaceId className={`h-9 w-9 ${loading ? 'animate-pulse' : ''}`} />
        </button>

        <p className="text-[14px] text-slate-500">
          {loading ? 'Проверка…' : 'Нажмите для входа по Face ID'}
        </p>

        {error && (
          <p className="text-[13px] text-red-400">{error}</p>
        )}
      </div>
    </div>
  )
}
