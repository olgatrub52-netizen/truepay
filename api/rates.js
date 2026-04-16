/**
 * GET /api/rates?from=RUB&to=USD
 * Возвращает живой курс валют через открытый бесплатный API.
 * Кешируется на 30 минут через заголовки.
 */

const CACHE_TTL = 30 * 60 // 30 минут

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=60`)

  const from = (req.query?.from ?? 'RUB').toUpperCase()
  const to   = (req.query?.to   ?? 'USD').toUpperCase()

  try {
    // Бесплатный API без ключа, лимит 1500 запросов/месяц
    const r    = await fetch(`https://open.er-api.com/v6/latest/${from}`)
    const data = await r.json()

    if (!r.ok || data.result !== 'success') {
      throw new Error(data['error-type'] ?? 'Rate fetch failed')
    }

    const rate = data.rates?.[to]
    if (!rate) throw new Error(`No rate for ${to}`)

    return res.status(200).json({
      ok:        true,
      from,
      to,
      rate,
      // сколько USD получишь за 1 рубль
      rateLabel: `1 ${from} = ${rate.toFixed(6)} ${to}`,
      // обратный курс — сколько рублей в 1 USD
      inverse:   1 / rate,
      updatedAt: data.time_last_update_utc,
    })
  } catch (err) {
    console.error('Rates error:', err.message)
    // Фолбек на приблизительный курс если внешний API недоступен
    const FALLBACK = { RUB_USD: 0.0108 }
    const fallbackRate = from === 'RUB' && to === 'USD' ? FALLBACK.RUB_USD : null

    if (fallbackRate) {
      return res.status(200).json({
        ok: true, from, to,
        rate: fallbackRate,
        rateLabel: `1 ${from} ≈ ${fallbackRate} ${to} (приблизительно)`,
        inverse: 1 / fallbackRate,
        fallback: true,
      })
    }

    return res.status(500).json({ ok: false, error: err.message })
  }
}
