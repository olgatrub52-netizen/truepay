/**
 * Bybit V5 API — browser-side client.
 * Requests are signed with HMAC-SHA256 via Web Crypto API and sent
 * directly to api.bybit.com (CORS allowed by Bybit for browser origins).
 */

const BASE        = 'https://api.bybit.com'
const API_KEY     = import.meta.env.VITE_BYBIT_API_KEY    ?? ''
const API_SECRET  = import.meta.env.VITE_BYBIT_API_SECRET ?? ''
const RECV_WINDOW = '5000'

async function hmac(secret, message) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig  = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function authHeaders(queryOrBody = '') {
  const ts   = Date.now().toString()
  const sign = await hmac(API_SECRET, `${ts}${API_KEY}${RECV_WINDOW}${queryOrBody}`)
  return {
    'X-BAPI-API-KEY':     API_KEY,
    'X-BAPI-TIMESTAMP':   ts,
    'X-BAPI-RECV-WINDOW': RECV_WINDOW,
    'X-BAPI-SIGN':        sign,
    'Content-Type':       'application/json',
  }
}

async function get(path, params = {}) {
  const qs  = new URLSearchParams(params).toString()
  const res = await fetch(`${BASE}${path}?${qs}`, { headers: await authHeaders(qs) })
  return res.json()
}

async function post(path, body = {}) {
  const bodyStr = JSON.stringify(body)
  const res = await fetch(`${BASE}${path}`, {
    method:  'POST',
    headers: await authHeaders(bodyStr),
    body:    bodyStr,
  })
  return res.json()
}

/** Баланс Unified кошелька */
export async function getBalance() {
  const data  = await get('/v5/account/wallet-balance', { accountType: 'UNIFIED' })
  const coins = data.result?.list?.[0]?.coin ?? []
  const usdt  = coins.find(c => c.coin === 'USDT')
  return {
    ok:   data.retCode === 0,
    usdt: usdt
      ? { available: parseFloat(usdt.availableToWithdraw ?? usdt.walletBalance ?? 0),
          total:     parseFloat(usdt.walletBalance ?? 0) }
      : { available: 0, total: 0 },
    coins,
    raw: data,
  }
}

/** Текущая цена пары (spot) */
export async function getPrice(symbol = 'BTCUSDT') {
  const data   = await fetch(`${BASE}/v5/market/tickers?category=spot&symbol=${symbol}`).then(r => r.json())
  const ticker = data.result?.list?.[0]
  return {
    ok:     data.retCode === 0,
    symbol,
    price:  parseFloat(ticker?.lastPrice ?? 0),
    change: parseFloat(ticker?.price24hPcnt ?? 0) * 100,
    raw:    data,
  }
}

/**
 * Симуляция покупки USDT за RUB через P2P.
 * Bybit убрал спот-пару USDTRUB из-за санкций — в реальности это P2P-сделка.
 * Используем живой курс RUB/USD из нашего /api/rates.
 */
export async function buyUSDT(amountRub) {
  // Получаем живой курс RUB/USD (1 USDT ≈ 1 USD)
  let rubPerUsdt = 92  // fallback
  let rateSource = 'fallback'
  try {
    const rateData = await fetch('/api/rates?from=RUB&to=USD').then(r => r.json())
    if (rateData.ok && rateData.inverse > 0) {
      // inverse = USD/RUB rate, т.е. сколько рублей за 1 USD
      rubPerUsdt = rateData.inverse
      rateSource = 'live'
    }
  } catch { /* fallback уже задан */ }

  // P2P наценка ~1% сверх рыночного курса (типичная для Bybit P2P)
  const p2pRate   = rubPerUsdt * 1.01
  const usdtAmount = (amountRub / p2pRate).toFixed(4)
  const orderId   = `P2P-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

  return {
    ok:         true,
    simulation: true,
    p2p:        true,
    orderId,
    usdtAmount,
    rubPerUsdt: p2pRate,
    rateSource,
    amountRub,
    retMsg:     'P2P order matched (simulation)',
  }
}

/** Симуляция вывода USDT на карту Бакай Банка */
export async function withdrawUSDT(amount, address = 'Bakai Bank · SWIFT BAKAKG22') {
  const withdrawId = `SIM-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  return {
    ok:          true,
    simulation:  true,
    withdrawId,
    amount:      parseFloat(amount),
    currency:    'USDT',
    destination: address,
    status:      'PENDING',
    message:     'Симуляция вывода. В продакшне — реальный SWIFT вывод на счёт Бакай Банка.',
  }
}
