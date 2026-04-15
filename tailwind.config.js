/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'SF Pro Text',
          'Segoe UI',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SF Mono',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      colors: {
        surface: {
          DEFAULT: '#070a0f',
          raised: '#0d141c',
          card: '#101820',
          overlay: '#0a0e14',
        },
        accent: {
          DEFAULT: '#0ea5e9',
          muted: '#0c8fc8',
          dim: 'rgba(14,165,233,0.15)',
          glow: 'rgba(14,165,233,0.25)',
        },
        ink: {
          DEFAULT: '#ffffff',
          secondary: '#94a3b8',
          tertiary: '#475569',
          disabled: '#2d3748',
        },
      },
      boxShadow: {
        card: '0 24px 56px -12px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.08)',
        'card-hover': '0 32px 64px -16px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.12)',
        chip: '0 2px 8px rgba(0,0,0,0.4)',
        glow: '0 0 24px rgba(14,165,233,0.3)',
        sheet: '0 -4px 48px rgba(0,0,0,0.6)',
      },
      borderRadius: {
        card: '20px',
        'card-sm': '16px',
      },
      backdropBlur: {
        tab: '24px',
      },
      animation: {
        'fade-in':          'fadeIn 0.22s ease-out both',
        'slide-up':         'slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-up-fast':    'slideUp 0.2s cubic-bezier(0.22, 1, 0.36, 1) both',
        'scale-in':         'scaleIn 0.18s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pulse-glow':       'pulseGlow 2s ease-in-out infinite',
        'shimmer':          'shimmer 1.8s ease-in-out infinite',
        // Tab transitions
        'slide-in-right':   'slideInRight 0.26s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-in-left':    'slideInLeft 0.26s cubic-bezier(0.22, 1, 0.36, 1) both',
        // Card tap lift
        'card-lift':        'cardLift 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        // Frost overlay
        'freeze-in':        'freezeIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'freeze-out':       'freezeOut 0.3s ease-in both',
        // Freeze button pulse
        'frost-pulse':      'frostPulse 2.4s ease-in-out infinite',
        // TopUp success
        'success-bounce':   'successBounce 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'success-ripple':   'successRipple 1.1s ease-out both',
        'check-draw':       'checkDraw 0.4s ease-out 0.18s both',
        // Skeleton shimmer
        'skeleton':         'skeletonShimmer 1.6s ease-in-out infinite',
        // Staggered row appear
        'row-in':           'rowIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(100%)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        // Tab slide transitions
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(28px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-28px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        // Card tap lift
        cardLift: {
          '0%':   { transform: 'scale(1) translateY(0px)' },
          '55%':  { transform: 'scale(1.045) translateY(-5px)' },
          '100%': { transform: 'scale(1) translateY(0px)' },
        },
        // Frost crystallization
        freezeIn: {
          '0%':   { opacity: '0', transform: 'scale(1.06)', filter: 'blur(6px)' },
          '50%':  { filter: 'blur(1px)' },
          '100%': { opacity: '1', transform: 'scale(1)',    filter: 'blur(0px)' },
        },
        freezeOut: {
          from: { opacity: '1', transform: 'scale(1)' },
          to:   { opacity: '0', transform: 'scale(0.96)' },
        },
        frostPulse: {
          '0%, 100%': { opacity: '1',   transform: 'scale(1)' },
          '50%':      { opacity: '0.75', transform: 'scale(0.98)' },
        },
        // TopUp success animations
        successBounce: {
          '0%':   { transform: 'scale(0)',    opacity: '0' },
          '55%':  { transform: 'scale(1.12)', opacity: '1' },
          '75%':  { transform: 'scale(0.93)' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        successRipple: {
          '0%':   { transform: 'scale(0.6)', opacity: '0.5' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        checkDraw: {
          from: { strokeDashoffset: '32' },
          to:   { strokeDashoffset: '0' },
        },
        // Skeleton shimmer (side-to-side highlight)
        skeletonShimmer: {
          '0%':   { backgroundPosition: '-300px 0' },
          '100%': { backgroundPosition: '300px 0' },
        },
        // Staggered row appear
        rowIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
