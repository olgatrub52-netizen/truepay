export default function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon && (
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/[0.06] bg-surface-raised/60 text-4xl">
          {icon}
        </div>
      )}
      <p className="text-[17px] font-semibold text-white">{title}</p>
      {subtitle && (
        <p className="mt-2 max-w-[280px] text-[14px] leading-relaxed text-slate-500">
          {subtitle}
        </p>
      )}
    </div>
  )
}
