/**
 * POST /api/exchange — Московская биржа (MOEX) · Обмен валюты
 *
 * Действия (action):
 *   "rate"     — текущий курс USD/RUB с MOEX (live)
 *   "convert"  — симуляция покупки USD за рубли
 */

const MOEX_URL = 'https://iss.moex.com/iss/engines/currency/markets/selt/boards/CETS/securities/USD000UTSTOM.json?iss.meta=off&iss.only=marketdata,securities'

// Комиссия банка за конвертацию (типичная ~0.7%)
const BANK_SPREAD = 0.007

async function fetchMoexRate() {
  const r    = await fetch(MOEX_URL)
  const data = await r.json()

  const mdCols = data.marketdata?.columns ?? []
  const mdRows = data.marketdata?.data    ?? []
  const scCols = data.securities?.columns ?? []
  const scRows = data.securities?.data    ?? []

  const md = mdRows[0] ? Object.fromEntries(mdCols.map((c, i) => [c, mdRows[0][i]])) : {}
  const sc = scRows[0] ? Object.fromEntries(scCols.map((c, i) => [c, scRows[0][i]])) : {}

  // LAST — последняя сделка, если торги идут; иначе PREVPRICE (вчерашнее закрытие)
  const moexLast  = parseFloat(md.LAST ?? md.MARKETPRICE ?? sc.PREVPRICE ?? 0)
  const moexOpen  = parseFloat(md.OPEN  ?? 0)
  const moexHigh  = parseFloat(md.HIGH  ?? 0)
  const moexLow   = parseFloat(md.LOW   ?? 0)
  const moexClose = parseFloat(sc.PREVPRICE ?? 0)
  const change    = moexClose > 0 ? ((moexLast - moexClose) / moexClose) * 100 : 0

  // Торги на MOEX идут с 10:00 до 19:00 МСК
  const trading = moexLast > 0

  return {
    rate:       moexLast || moexClose,
    buyRate:    (moexLast || moexClose) * (1 + BANK_SPREAD), // покупка USD (дороже)
    sellRate:   (moexLast || moexClose) * (1 - BANK_SPREAD), // продажа USD (дешевле)
    open:       moexOpen,
    high:       moexHigh,
    low:        moexLow,
    prevClose:  moexClose,
    change:     change,
    trading,
    source:     'MOEX CETS USD000UTSTOM',
    updatedAt:  md.UPDATETIME ?? md.TRADETIME ?? null,
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Cache-Control', 'public, s-maxage=30')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')    return res.status(405).json({ ok: false, error: 'POST only' })

  const { action, amountRub } = req.body ?? {}

  try {
    const rateData = await fetchMoexRate()

    // ── Текущий курс ──────────────────────────────────────────────────────────
    if (action === 'rate') {
      return res.status(200).json({
        ok: true,
        ...rateData,
        spread: `${(BANK_SPREAD * 100).toFixed(1)}%`,
      })
    }

    // ── Симуляция покупки USD ─────────────────────────────────────────────────
    if (action === 'convert') {
      const amount = Number(amountRub)
      if (!amount || amount < 100) {
        return res.status(400).json({ ok: false, error: 'amountRub >= 100 required' })
      }

      const rate       = rateData.buyRate           // покупаем USD по курсу продажи биржи
      const usdAmount  = amount / rate
      const commission = amount * BANK_SPREAD        // комиссия в рублях
      const orderId    = `MOEX-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

      return res.status(200).json({
        ok:          true,
        simulation:  true,
        orderId,
        amountRub:   amount,
        usdAmount:   parseFloat(usdAmount.toFixed(2)),
        rate:        parseFloat(rate.toFixed(4)),
        moexRate:    rateData.rate,
        commission:  parseFloat(commission.toFixed(2)),
        spread:      `${(BANK_SPREAD * 100).toFixed(1)}%`,
        source:      rateData.source,
        trading:     rateData.trading,
        status:      'EXECUTED',
        message:     rateData.trading
          ? 'Обмен выполнен по биржевому курсу MOEX'
          : 'Обмен выполнен по курсу закрытия MOEX (торги завершены)',
      })
    }

    return res.status(400).json({ ok: false, error: `Unknown action: ${action}` })

  } catch (err) {
    console.error('Exchange error:', err)
    return res.status(500).json({ ok: false, error: err.message })
  }
}
