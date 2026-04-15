/**
 * Custom range slider with a reactive fill track.
 *
 * Usage:
 *   <Slider value={2500} min={100} max={10000} step={100}
 *     onChange={setVal} formatValue={(v) => `$${v.toLocaleString()}`} />
 */
export default function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  formatValue = (v) => String(v),
  label,
  showRange = true,
  accent = '#0ea5e9',
}) {
  const pct = ((value - min) / (max - min)) * 100

  // Build the two-stop gradient that fills the track left of the thumb
  const trackFill = [
    `linear-gradient(to right,`,
    `  ${accent} 0%,`,
    `  ${accent} ${pct}%,`,
    `  rgba(255,255,255,0.1) ${pct}%,`,
    `  rgba(255,255,255,0.1) 100%`,
    `)`,
  ].join(' ')

  return (
    <div className="select-none">
      {/* Value badge — animates numerically */}
      <div className="mb-4 flex items-end justify-between gap-2">
        {label && <span className="text-[13px] text-slate-400">{label}</span>}
        <span
          className="text-[28px] font-semibold tabular-nums text-white transition-all duration-100"
          aria-live="polite"
          aria-atomic="true"
        >
          {formatValue(value)}
        </span>
      </div>

      {/* Track */}
      <input
        type="range"
        className="tp-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        style={{ '--track-fill': trackFill }}
      />

      {/* Min / max labels */}
      {showRange && (
        <div className="mt-2 flex justify-between">
          <span className="text-[11px] text-slate-600">{formatValue(min)}</span>
          <span className="text-[11px] text-slate-600">{formatValue(max)}</span>
        </div>
      )}
    </div>
  )
}
