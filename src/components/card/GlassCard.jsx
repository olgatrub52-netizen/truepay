import { IconContactless } from '../icons/index.jsx'
import { maskPan } from '../../data/mockData.js'

// Card face gradient — deep navy blue "Quiet Luxury"
const CARD_BG = `
  radial-gradient(ellipse 95% 75% at 48% 38%, rgba(55,120,180,0.32) 0%, transparent 55%),
  radial-gradient(ellipse 80% 60% at 72% 80%, rgba(20,50,90,0.45) 0%, transparent 45%),
  linear-gradient(165deg, #1a3a5c 0%, #142d4a 35%, #0f2438 70%, #0a1624 100%)
`.trim()

const NOISE_URL =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

// Frost noise SVG — higher base frequency = finer ice crystal texture
const FROST_NOISE_URL =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.55' numOctaves='6' seed='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0.7 0 0 0 0 0.85 0 0 0 0 1 0 0 0 0.45 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E\")"

function SilverChip() {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-[1mm] border border-white/30 shadow-md"
      style={{
        width: '14cqi',
        height: '17cqh',
        background: 'linear-gradient(135deg, #e2e6ed 0%, #9da3ae 38%, #c5cad3 58%, #787f8a 100%)',
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.75), inset 0 -2px 3px rgba(0,0,0,0.2), 0 2px 5px rgba(0,0,0,0.35)',
      }}
    >
      <div className="absolute inset-[0.55mm] rounded-[0.45mm] bg-gradient-to-br from-black/10 to-transparent" />
      <div className="absolute inset-x-[2mm] top-1/2 h-[0.22mm] -translate-y-1/2 bg-black/25" />
    </div>
  )
}

function VisaWordmark() {
  return (
    <svg viewBox="0 0 52 18" fill="none" aria-hidden preserveAspectRatio="xMaxYMid meet"
      style={{ height: '8.8cqh', width: 'auto' }}>
      <text x="0" y="14.5" fill="white"
        style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '16px', fontWeight: 900, fontStyle: 'italic', letterSpacing: '0.06em' }}>
        VISA
      </text>
    </svg>
  )
}

/**
 * Frost overlay — crystallizes over the card when frozen.
 * Placed *outside* the card content's opacity wrapper so the badge
 * stays fully opaque even as the card fades to grey.
 */
function FrostOverlay() {
  return (
    <div
      className="absolute inset-0 animate-freeze-in overflow-hidden"
      style={{ borderRadius: 'inherit' }}
      aria-label="Карта заморожена"
    >
      {/* Fine ice-crystal noise texture */}
      <div
        className="absolute inset-0 opacity-70"
        style={{ backgroundImage: FROST_NOISE_URL, backgroundSize: '256px' }}
      />

      {/* Blue-white gradient wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, rgba(148,210,255,0.35) 0%, rgba(220,240,255,0.2) 40%, rgba(170,220,255,0.3) 100%)',
        }}
      />

      {/* Diagonal ice-line hatching */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            repeating-linear-gradient(-52deg,
              rgba(255,255,255,0.07) 0px,
              rgba(255,255,255,0.07) 1px,
              transparent 1px, transparent 14px),
            repeating-linear-gradient(38deg,
              rgba(255,255,255,0.04) 0px,
              rgba(255,255,255,0.04) 1px,
              transparent 1px, transparent 14px)
          `,
        }}
      />

      {/* Corner snowflakes */}
      <span className="pointer-events-none absolute select-none text-white/55 animate-frost-pulse"
        style={{ left: '4cqw', top: '4cqh', fontSize: '7.5cqh' }}>❄</span>
      <span className="pointer-events-none absolute select-none text-white/45"
        style={{ right: '4cqw', top: '4.5cqh', fontSize: '5.5cqh' }}>❄</span>
      <span className="pointer-events-none absolute select-none text-white/38"
        style={{ left: '4cqw', bottom: '4cqh', fontSize: '5cqh' }}>❅</span>
      <span className="pointer-events-none absolute select-none text-white/38"
        style={{ right: '4cqw', bottom: '4cqh', fontSize: '5cqh' }}>❅</span>
      <span className="pointer-events-none absolute select-none text-white/25 -translate-x-1/2"
        style={{ left: '50%', bottom: '28cqh', fontSize: '4cqh' }}>❆</span>

      {/* Central "ЗАМОРОЖЕНА" badge */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="rounded-[2mm] border border-white/35 px-[7cqw] py-[3.5cqh]"
          style={{
            background: 'rgba(5, 15, 30, 0.55)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          <p
            className="font-bold uppercase tracking-[0.22em] text-white/90"
            style={{ fontSize: '5.2cqh' }}
          >
            ❄&nbsp;ЗАМОРОЖЕНА
          </p>
        </div>
      </div>
    </div>
  )
}

/** Full interactive card (used in Cards tab) */
export function FullCard({ card, frozen = false, onCopyPan, onCopyCvv, onNfcFlash, nfcFlash }) {
  const panMasked = maskPan(card.panRaw)
  const panGroups = panMasked.split(/\s+/).filter(Boolean)

  return (
    <div
      className="relative mx-auto overflow-hidden rounded-[3.48mm] ring-1"
      style={{
        width: 'min(85.6mm, calc(100vw - 2rem))',
        aspectRatio: '85.6 / 53.98',
        background: CARD_BG,
        boxShadow: frozen
          ? '0 3mm 18mm rgba(0,0,0,0.6), 0 0 0 1px rgba(148,210,255,0.25)'
          : '0 3mm 18mm rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
        containerType: 'size',
        transition: 'box-shadow 0.5s ease',
        // The ring changes from neutral to icy blue
        outline: frozen ? '1px solid rgba(148,210,255,0.3)' : '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Card noise */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: NOISE_URL }} />
      {/* Glow */}
      <div className="pointer-events-none absolute -right-12 -top-8 h-32 w-32 rounded-full bg-sky-400/15 blur-3xl" />

      {/* Card content — fades out when frozen */}
      <div
        className="relative grid h-full w-full px-[9cqw] pb-[3.4cqh] pt-[3cqh]"
        style={{
          gridTemplateRows: 'auto auto auto auto auto auto',
          alignContent: 'start',
          opacity: frozen ? 0.28 : 1,
          transition: 'opacity 0.45s ease',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-[2cqw]">
          <span className="font-bold leading-none tracking-tight text-white" style={{ fontSize: '7.6cqh', marginTop: '3mm' }}>
            TruePay
          </span>
          <button
            type="button"
            onClick={onNfcFlash}
            disabled={frozen}
            className={`flex items-center justify-center rounded-full transition active:scale-90 ${nfcFlash ? 'text-sky-300' : 'text-white/70'}`}
            style={{ width: '8.4cqh', height: '8.4cqh' }}
            aria-label="NFC"
          >
            <IconContactless style={{ width: '8.4cqh', height: '8.4cqh' }} />
          </button>
        </div>

        <div style={{ height: 'calc(5cqh + 9mm)' }} aria-hidden />

        {/* Chip + slogan */}
        <div className="flex items-start justify-between gap-[2.5cqw]" style={{ minHeight: '22cqh' }}>
          <SilverChip />
          <p className="max-w-[46cqw] pt-[0.3cqh] text-right font-normal leading-snug text-white/45" style={{ fontSize: '2.65cqh' }}>
            {card.cardSlogan}
          </p>
        </div>

        {/* PAN */}
        <button
          type="button"
          onClick={onCopyPan}
          disabled={frozen}
          title="Скопировать номер карты"
          className="tp-emboss flex w-full items-baseline justify-between gap-[1cqw] py-[0.35cqh] leading-none transition active:bg-white/5"
          style={{ fontFeatureSettings: '"tnum"', marginTop: '1.2cqh' }}
        >
          {panGroups.map((group, i) => (
            <span key={`g${i}`} className="font-mono font-semibold tabular-nums" style={{ fontSize: '9.2cqh', letterSpacing: '0.12em' }}>
              {group}
            </span>
          ))}
        </button>

        {/* Expiry */}
        <div className="flex items-end justify-between gap-[3cqw]" style={{ marginTop: 'calc(1.2cqh + 3mm)' }}>
          <div className="flex items-end gap-[1.1cqw]">
            <div className="tp-emboss flex flex-col leading-[1.05] font-semibold uppercase" style={{ fontSize: '2.35cqh', letterSpacing: '0.14em' }}>
              <span>GOOD</span>
              <span>THRU</span>
            </div>
            <span className="tp-emboss pb-[0.15cqh] leading-none" style={{ fontSize: '3cqh' }}>▶</span>
          </div>
          <span className="tp-emboss shrink-0 pb-[0.1cqh] font-mono font-semibold leading-none" style={{ fontSize: '6.4cqh', letterSpacing: '0.08em' }}>
            {card.expiry}
          </span>
        </div>

        {/* Holder + network */}
        <div className="flex items-end justify-between gap-[2cqw]" style={{ marginTop: '1.4cqh' }}>
          <p className="tp-emboss min-w-0 max-w-[58%] truncate font-mono font-semibold uppercase" style={{ fontSize: '6cqh', letterSpacing: '0.11em' }}>
            {card.holder}
          </p>
          <VisaWordmark />
        </div>
      </div>

      {/* Frost overlay — rendered on top of everything, not affected by content opacity */}
      {frozen && <FrostOverlay />}
    </div>
  )
}

/** Compact preview card for the Dashboard */
export function PreviewCard({ card, onPress, onNfcPress, nfcFlash }) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Открыть карту"
      onClick={onPress}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPress?.() } }}
      className="relative cursor-pointer overflow-hidden rounded-2xl shadow-card outline-none ring-1 ring-white/[0.08] transition hover:ring-2 hover:ring-sky-400/30 focus-visible:ring-2 focus-visible:ring-sky-400/50"
      style={{
        background: CARD_BG,
        boxShadow: '0 24px 48px -12px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      {/* Noise */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: NOISE_URL }} />
      {/* Glow spots */}
      <div className="pointer-events-none absolute -right-14 -top-10 h-36 w-36 rounded-full bg-sky-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-[#0a1624] blur-2xl" />

      <div className="relative z-10 flex flex-col gap-5 p-5">
        {/* Row 1: brand + NFC */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xl font-semibold tracking-tight text-white">TruePay</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onNfcPress?.() }}
            className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 transition hover:bg-white/15 active:scale-95 ${nfcFlash ? 'ring-2 ring-sky-400/70' : ''}`}
            aria-label="Бесконтактная оплата"
          >
            <IconContactless className="h-5 w-5 text-white/80" />
          </button>
        </div>

        {/* Chip */}
        <div className="flex items-start">
          <div
            className="relative h-11 w-[3.65rem] overflow-hidden rounded-md border border-white/30 shadow-md"
            style={{
              background: 'linear-gradient(135deg, #e2e6ed 0%, #9da3ae 38%, #c5cad3 58%, #787f8a 100%)',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.75), inset 0 -2px 3px rgba(0,0,0,0.2), 0 2px 5px rgba(0,0,0,0.35)',
            }}
          >
            <div className="absolute inset-[3px] rounded-sm bg-gradient-to-br from-black/10 to-transparent" />
            <div className="absolute inset-x-2 top-1/2 h-px -translate-y-1/2 bg-black/25" />
          </div>
        </div>

        {/* Masked PAN */}
        <div className="tp-emboss flex w-full items-baseline justify-between gap-2 font-mono text-[15px] font-semibold tabular-nums tracking-[0.12em]">
          <span>••••</span><span>••••</span><span>••••</span>
          <span>{card.panRaw.slice(-4)}</span>
        </div>
      </div>
    </div>
  )
}
