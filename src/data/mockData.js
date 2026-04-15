// ─── Merchant registry ──────────────────────────────────────────────────────
export const MERCHANT_REGISTRY = {
  Apple:       { emoji: '🍎', bg: '#1c1c1e', category: 'Tech & Services' },
  Starbucks:   { emoji: '☕', bg: '#00704a', category: 'Food & Drink' },
  Netflix:     { emoji: '🎬', bg: '#e50914', category: 'Entertainment' },
  Spotify:     { emoji: '🎵', bg: '#1db954', category: 'Entertainment' },
  Amazon:      { emoji: '📦', bg: '#ff9900', category: 'Shopping' },
  Uber:        { emoji: '🚗', bg: '#000000', category: 'Transport' },
  Airbnb:      { emoji: '🏠', bg: '#ff5a5f', category: 'Travel' },
  Emirates:    { emoji: '✈️', bg: '#c6032a', category: 'Travel' },
  Salary:      { emoji: '💼', bg: '#0ea5e9', category: 'Income' },
  TopUp:       { emoji: '⚡', bg: '#0284c7', category: 'Top-up' },
  Transfer:    { emoji: '💸', bg: '#0369a1', category: 'Transfer' },
  Crypto:      { emoji: '₿', bg: '#f7931a', category: 'Crypto' },
  Restaurant:  { emoji: '🍽️', bg: '#b45309', category: 'Food & Drink' },
  Gym:         { emoji: '💪', bg: '#7c3aed', category: 'Health & Wellness' },
  Nobu:        { emoji: '🍣', bg: '#92400e', category: 'Food & Drink' },
  Equinox:     { emoji: '🏋️', bg: '#3b0764', category: 'Health & Wellness' },
  default:     { emoji: '💳', bg: '#1e293b', category: 'Other' },
}

export function getMerchantConfig(merchant) {
  return MERCHANT_REGISTRY[merchant] ?? MERCHANT_REGISTRY.default
}

// ─── Card data ───────────────────────────────────────────────────────────────
export const MOCK_CARD = {
  id: 'card_001',
  panRaw: '5374820190344829',
  panDisplay: '5374 8201 9034 4829',
  panMasked: '5374 82•• •••• 4829',
  expiry: '09/28',
  cvv: '042',
  holder: 'DENIS IVANOV',
  product: 'TruePay Debit',
  network: 'Visa',
  status: 'active',
  currency: 'USD',
  cardSlogan: 'TruePay — The simple way to pay®',
}

// ─── Balance ─────────────────────────────────────────────────────────────────
export const MOCK_BALANCE = {
  available: 12847.52,
  pending: 245.0,
  currency: 'USD',
}

// ─── Transactions ────────────────────────────────────────────────────────────
function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

let _txId = 100
export function nextTxId() {
  _txId += 1
  return `t${_txId}`
}

export const MOCK_TRANSACTIONS = [
  { id: 't1',  merchant: 'Apple',      title: 'Apple Services',  subtitle: 'Подписка iCloud+',       amountSigned: -9.99,   date: daysAgo(0), status: 'completed' },
  { id: 't2',  merchant: 'Starbucks',  title: 'Starbucks',       subtitle: 'Капучино, круассан',      amountSigned: -8.50,   date: daysAgo(0), status: 'completed' },
  { id: 't3',  merchant: 'Uber',       title: 'Uber',            subtitle: 'UberX · SoHo → JFK',     amountSigned: -34.20,  date: daysAgo(1), status: 'completed' },
  { id: 't4',  merchant: 'Netflix',    title: 'Netflix',         subtitle: 'Подписка Premium',        amountSigned: -22.99,  date: daysAgo(1), status: 'completed' },
  { id: 't5',  merchant: 'Salary',     title: 'Зарплата',        subtitle: 'Acme Corp · Март',        amountSigned: 5200.00, date: daysAgo(2), status: 'completed' },
  { id: 't6',  merchant: 'Amazon',     title: 'Amazon',          subtitle: 'Заказ #114-8823091',      amountSigned: -89.99,  date: daysAgo(2), status: 'completed' },
  { id: 't7',  merchant: 'Airbnb',     title: 'Airbnb',          subtitle: 'Milanese Apartment',      amountSigned: -312.00, date: daysAgo(3), status: 'completed' },
  { id: 't8',  merchant: 'Nobu',       title: 'Nobu Restaurant', subtitle: 'Ужин на двоих',           amountSigned: -145.00, date: daysAgo(3), status: 'completed' },
  { id: 't9',  merchant: 'Spotify',    title: 'Spotify',         subtitle: 'Premium Individual',      amountSigned: -9.99,   date: daysAgo(4), status: 'completed' },
  { id: 't10', merchant: 'Emirates',   title: 'Авиабилеты',      subtitle: 'EK 203 · NYC → DXB',     amountSigned: -428.00, date: daysAgo(5), status: 'completed' },
  { id: 't11', merchant: 'Equinox',    title: 'Equinox',         subtitle: 'Членство · Апрель',       amountSigned: -180.00, date: daysAgo(6), status: 'completed' },
  { id: 't12', merchant: 'Transfer',   title: 'Перевод',         subtitle: 'Анне К. · За ужин',      amountSigned: -250.00, date: daysAgo(7), status: 'completed' },
]

// ─── Spending chart ───────────────────────────────────────────────────────────
export const SPENDING_DATA = [
  { label: 'Пн', amount: 45 },
  { label: 'Вт', amount: 122 },
  { label: 'Ср', amount: 28 },
  { label: 'Чт', amount: 890 },
  { label: 'Пт', amount: 156 },
  { label: 'Сб', amount: 314 },
  { label: 'Вс', amount: 94 },
]

// ─── Group by date ────────────────────────────────────────────────────────────
export function groupByDate(transactions) {
  const todayMs = new Date().setHours(0, 0, 0, 0)
  const yesterdayMs = todayMs - 86400000

  const groups = new Map()

  for (const tx of transactions) {
    const txDayMs = new Date(tx.date).setHours(0, 0, 0, 0)
    let label
    if (txDayMs === todayMs) label = 'Сегодня'
    else if (txDayMs === yesterdayMs) label = 'Вчера'
    else {
      const d = new Date(tx.date)
      const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
      label = `${d.getDate()} ${months[d.getMonth()]}`
    }

    if (!groups.has(label)) groups.set(label, [])
    groups.get(label).push(tx)
  }

  return Array.from(groups.entries()).map(([date, txs]) => ({ date, transactions: txs }))
}

// ─── Utilities ────────────────────────────────────────────────────────────────
export function formatUsdParts(value) {
  const n = Math.max(0, Math.round(value * 100) / 100)
  const [intPart, decPart = '00'] = n.toFixed(2).split('.')
  const intWithSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return { intWithSep, decPart }
}

export function formatSignedUsd(amount) {
  const sign = amount >= 0 ? '+' : '−'
  const abs = Math.abs(amount)
  const { intWithSep, decPart } = formatUsdParts(abs)
  return `${sign}$${intWithSep}.${decPart}`
}

export function maskPan(rawDigits) {
  const d = rawDigits.replace(/\D/g, '')
  if (d.length < 13) return rawDigits
  return `${d.slice(0, 4)} ${d.slice(4, 6)}•• •••• ${d.slice(-4)}`
}
