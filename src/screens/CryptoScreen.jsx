import ScreenChrome from '../components/ui/ScreenChrome.jsx'

const CRYPTO_ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin',  emoji: '₿', price: '$68 240', change: '+2.4%', up: true,  balance: '0.0124 BTC' },
  { symbol: 'ETH', name: 'Ethereum', emoji: 'Ξ', price: '$3 420',  change: '-0.8%', up: false, balance: '0.41 ETH' },
  { symbol: 'SOL', name: 'Solana',   emoji: '◎', price: '$172',    change: '+5.1%', up: true,  balance: '2.3 SOL' },
  { symbol: 'USDT', name: 'Tether',  emoji: '₮', price: '$1.00',   change: '0.0%',  up: true,  balance: '150 USDT' },
]

export default function CryptoScreen({ onBack }) {
  return (
    <ScreenChrome title="Крипто" onBack={onBack}>
      {/* Coming soon banner */}
      <div className="mb-6 rounded-2xl border border-sky-500/25 bg-sky-950/20 p-4 text-center">
        <p className="text-[13px] font-semibold text-sky-400 uppercase tracking-wide">Скоро</p>
        <p className="mt-1 text-[14px] text-slate-400 leading-snug">
          Покупка, продажа и хранение криптовалют — в разработке.
          Интеграция с Fireblocks и лицензированными провайдерами.
        </p>
      </div>

      {/* Portfolio preview */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[15px] font-semibold text-white">Портфель (демо)</p>
          <span className="text-[13px] text-slate-500">$1 250.40</span>
        </div>

        <div className="space-y-2">
          {CRYPTO_ASSETS.map((asset) => (
            <div key={asset.symbol}
              className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-surface-raised/30 px-4 py-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-card/60 text-xl font-bold text-white border border-white/[0.06]">
                {asset.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-white">{asset.name}</p>
                <p className="text-[13px] text-slate-500">{asset.balance}</p>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-semibold text-white">{asset.price}</p>
                <p className={`text-[13px] font-medium ${asset.up ? 'text-emerald-400' : 'text-red-400'}`}>
                  {asset.change}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" className="tp-btn-accent flex-1 !py-3">
          Купить крипто
        </button>
        <button type="button" className="flex-1 rounded-2xl border border-white/[0.08] py-3 text-[15px] font-semibold text-white transition hover:bg-white/[0.05]">
          Продать
        </button>
      </div>
    </ScreenChrome>
  )
}
