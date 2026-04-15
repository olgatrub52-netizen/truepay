import { IconChevronLeft } from '../icons/index.jsx'

export default function ScreenChrome({ title, subtitle, onBack, children, headerRight }) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col animate-fade-in bg-surface">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-gradient-to-b from-sky-950/[0.12] to-transparent"
        aria-hidden
      />
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-white/[0.05] bg-surface/90 px-2 backdrop-blur-xl"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))', paddingBottom: '0.75rem' }}
      >
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/[0.06] hover:text-white active:scale-95"
            aria-label="Назад"
          >
            <IconChevronLeft />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-[17px] font-semibold text-white">{title}</h1>
          {subtitle && <p className="text-[12px] text-slate-500">{subtitle}</p>}
        </div>
        {headerRight && <div className="shrink-0">{headerRight}</div>}
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-10 pt-6">
        {children}
      </div>
    </div>
  )
}
