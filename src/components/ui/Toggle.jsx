export default function Toggle({ checked, onChange, label, description, size = 'md' }) {
  const w = size === 'sm' ? 'w-11 h-6' : 'w-14 h-8'
  const thumb = size === 'sm' ? 'h-4 w-4 top-1' : 'h-6 w-6 top-1'
  const onLeft = size === 'sm' ? 'left-6' : 'left-7'
  const offLeft = size === 'sm' ? 'left-1' : 'left-1'

  return (
    <div className="flex items-center justify-between gap-3">
      {(label || description) && (
        <div className="min-w-0 flex-1">
          {label && <p className="text-[15px] font-medium text-white">{label}</p>}
          {description && <p className="mt-0.5 text-[13px] text-slate-500">{description}</p>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative shrink-0 rounded-full transition-colors ${w} ${checked ? 'bg-sky-600' : 'bg-slate-700/80'}`}
      >
        <span
          className={`absolute ${thumb} rounded-full bg-white shadow-md transition-all ${checked ? onLeft : offLeft}`}
        />
      </button>
    </div>
  )
}
