/**
 * POST /api/bybit — Bybit Testnet API прокси
 *
 * Действия (action):
 *   "balance"   — баланс кошелька (USDT и др.)
 *   "price"     — текущая цена пары (напр. BTCUSDT)
 *   "buy"       — симуляция покупки USDT за RUB (маркет ордер)
 *   "withdraw"  — симуляция вывода USDT/USD на карту
 */

import crypto from 'crypto'

const BASE = 'https://api.bytick.com'

function sign(apiKey, apiSecret, timestamp, recvWindow, body) {
  const str = `${timestamp}${apiKey}${recvWindow}${body}`
  return crypto.createHmac('sha256', apiSecret).update(str).digest('hex')
}

function headers(apiKey, apiSecret, body = '') {
  const timestamp  = Date.now().toString()
  const recvWindow = '5000'
  return {
    'X-BAPI-API-KEY':     apiKey,
    'X-BAPI-TIMESTAMP':   timestamp,
    'X-BAPI-RECV-WINDOW': recvWindow,
    'X-BAPI-SIGN':        sign(apiKey, apiSecret, timestamp, recvWindow, body),
    'Content-Type':       'application/json',
    'User-Agent':         'Mozilla/5.0 (compatible; TruePay/1.0)',
    'Referer':            'https://truepay-kappa.vercel.app',
  }
}

async function bybitGet(path, params, apiKey, apiSecret) {
  const qs  = new URLSearchParams(params).toString()
  const url = `${BASE}${path}?${qs}`
  const r   = await fetch(url, { headers: headers(apiKey, apiSecret, qs) })
  const text = await r.text()
  try { return JSON.parse(text) } catch { throw new Error(`Bybit GET ${path} (${r.status}): ${text.slice(0, 200)}`) }
}

async function bybitPost(path, body, apiKey, apiSecret) {
  const bodyStr = JSON.stringify(body)
  const r = await fetch(`${BASE}${path}`, {
    method:  'POST',
    headers: headers(apiKey, apiSecret, bodyStr),
    body:    bodyStr,
  })
  const text = await r.text()
  try { return JSON.parse(text) } catch { throw new Error(`Bybit POST ${path} (${r.status}): ${text.slice(0, 200)}`) }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' })

  const apiKey    = process.env.BYBIT_API_KEY
  const apiSecret = process.env.BYBIT_API_SECRET

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ ok: false, error: 'BYBIT_API_KEY / BYBIT_API_SECRET not set' })
  }

  const { action, ...params } = req.body ?? {}

  try {
    switch (action) {

      // ── Баланс USDT кошелька ───────────────────────────────────────────────
      case 'balance': {
        const data = await bybitGet('/v5/account/wallet-balance',
          { accountType: 'UNIFIED' }, apiKey, apiSecret)
        const coins = data.result?.list?.[0]?.coin ?? []
        const usdt  = coins.find(c => c.coin === 'USDT')
        return res.status(200).json({
          ok: true,
          usdt: usdt ? {
            available: parseFloat(usdt.availableToWithdraw ?? usdt.walletBalance),
            total:     parseFloat(usdt.walletBalance),
          } : { available: 0, total: 0 },
          raw: data,
        })
      }

      // ── Цена пары ──────────────────────────────────────────────────────────
      case 'price': {
        const symbol = params.symbol ?? 'USDTRUB'
        const data = await bybitGet('/v5/market/tickers',
          { category: 'spot', symbol }, apiKey, apiSecret)
        const ticker = data.result?.list?.[0]
        return res.status(200).json({
          ok:    true,
          symbol,
          price: parseFloat(ticker?.lastPrice ?? 0),
          raw:   data,
        })
      }

      // ── Симуляция покупки USDT (маркет ордер USDT/RUB) ────────────────────
      case 'buy': {
        const { amountRub } = params
        if (!amountRub) return res.status(400).json({ ok: false, error: 'amountRub required' })

        // Сначала получаем текущую цену RUB/USDT
        const tickerData = await bybitGet('/v5/market/tickers',
          { category: 'spot', symbol: 'USDTRUB' }, apiKey, apiSecret)
        const rubPerUsdt = parseFloat(tickerData.result?.list?.[0]?.lastPrice ?? 90)
        const usdtAmount = (amountRub / rubPerUsdt).toFixed(4)

        // Размещаем маркет ордер на покупку USDT
        const order = await bybitPost('/v5/order/create', {
          category:  'spot',
          symbol:    'USDTRUB',
          side:      'Buy',
          orderType: 'Market',
          qty:       usdtAmount,
        }, apiKey, apiSecret)

        return res.status(200).json({
          ok:          order.retCode === 0,
          orderId:     order.result?.orderId,
          usdtAmount,
          rubPerUsdt,
          amountRub,
          retMsg:      order.retMsg,
          raw:         order,
        })
      }

      // ── Симуляция вывода на карту Бакай Банка ─────────────────────────────
      case 'withdraw': {
        const { amount, address } = params
        if (!amount) return res.status(400).json({ ok: false, error: 'amount required' })

        // В testnet реальный вывод недоступен — симулируем ответ
        const withdrawId = `SIM-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        return res.status(200).json({
          ok:         true,
          simulation: true,
          withdrawId,
          amount:     parseFloat(amount),
          currency:   'USDT',
          destination: address ?? 'Bakai Bank · SWIFT BAKAKG22',
          status:     'PENDING',
          message:    'Симуляция вывода. В продакшне — реальный SWIFT вывод на счёт Бакай Банка.',
        })
      }

      default:
        return res.status(400).json({ ok: false, error: `Unknown action: ${action}` })
    }
  } catch (err) {
    console.error('Bybit error:', err)
    return res.status(500).json({ ok: false, error: err.message })
  }
}
