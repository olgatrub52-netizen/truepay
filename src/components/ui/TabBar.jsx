import { IconHome, IconWallet, IconTransfer, IconProfile } from '../icons/index.jsx'

const tabs = [
  { id: 'home', label: 'Главная', icon: IconHome },
  { id: 'wallet', label: 'Кошелек', icon: IconWallet },
  { id: 'transfer', label: 'Переводы', icon: IconTransfer },
  { id: 'profile', label: 'Профиль', icon: IconProfile },
]

export default function TabBar({ activeTab, onTabChange }) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t border-white/[0.06] bg-surface/80 backdrop-blur-xl">
      <div
        className="flex items-center justify-around"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id
          const isProfileTab = id === 'profile'
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className="flex flex-col items-center gap-1 px-4 py-3 transition-colors"
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={`h-6 w-6 transition-colors ${
                  isActive
                    ? isProfileTab
                      ? 'text-emerald-400'
                      : 'text-sky-400'
                    : 'text-slate-500'
                }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? 'text-white' : 'text-slate-500'
                }`}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
