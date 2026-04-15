import { useEffect } from 'react'

export default function Toast({ message, visible, onDismiss }) {
  useEffect(() => {
    if (!visible) return
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [visible, onDismiss])

  if (!visible || !message) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-4 bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+5.5rem))] z-[90] flex justify-center animate-fade-in"
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-auto max-w-sm rounded-2xl border border-sky-500/20 bg-[#0d1e2e]/95 px-5 py-3.5 text-center text-[14px] font-medium text-white shadow-2xl backdrop-blur-xl">
        {message}
      </div>
    </div>
  )
}
