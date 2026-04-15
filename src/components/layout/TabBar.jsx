import { IconHome, IconCard, IconPayments, IconProfile } from '../icons/index.jsx'

const TABS = [
  { id: 'home',     label: 'Главная',  Icon: IconHome },
  { id: 'cards',    label: 'Карта',    Icon: IconCard },
  { id: 'payments', label: 'Операции', Icon: IconPayments },
  { id: 'profile',  label: 'Профиль',  Icon: IconProfile },
]

export default function TabBar({ active, onChange }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06]"
      style={{
        background: 'rgba(7,10,15,0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex h-[60px] items-stretch">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`flex flex-1 flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                isActive ? 'text-white' : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              <div className={`rounded-xl p-1.5 transition-colors ${isActive ? 'bg-sky-500/15' : ''}`}>
                <Icon className={`h-[22px] w-[22px] transition-all ${isActive ? 'stroke-[2]' : 'stroke-[1.75]'}`} />
              </div>
              <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'text-white' : 'text-slate-600'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
