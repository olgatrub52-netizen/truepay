/**
 * POST /api/tbank — прокси для T-Bank Sandbox API
 *
 * Действия (action):
 *   "statement"  — выписка по счёту (баланс)
 *   "transfer"   — перевод на счёт физического лица
 *   "status"     — статус платежа
 */

const TBANK_SANDBOX = 'https://business.tinkoff.ru/openapi/sandbox/api/v1'
const TBANK_TOKEN   = 'TBankSandboxToken'

// Тестовые реквизиты (sandbox)
const SANDBOX_ACCOUNT = '40817810099910004312'
const SANDBOX_FROM    = '40702810800000007671'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })

  const { action, ...params } = req.body ?? {}

  try {
    switch (action) {
      case 'statement': return await getStatement(res, params)
      case 'transfer':  return await makeTransfer(res, params)
      case 'status':    return await getStatus(res, params)
      default:
        return res.status(400).json({ ok: false, error: `Unknown action: ${action}` })
    }
  } catch (err) {
    console.error('TBank proxy error:', err)
    return res.status(500).json({ ok: false, error: err.message })
  }
}

// ─── Выписка / баланс ─────────────────────────────────────────────────────────

async function getStatement(res, { accountNumber, from, to } = {}) {
  const account = accountNumber ?? SANDBOX_ACCOUNT
  const dateFrom = from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const dateTo   = to   ?? new Date().toISOString().split('T')[0]

  const r = await fetch(
    `${TBANK_SANDBOX}/bank/statement?accountNumber=${account}&from=${dateFrom}&to=${dateTo}`,
    { headers: { Authorization: `Bearer ${TBANK_TOKEN}` } }
  )

  const text = await r.text()
  const data = text ? JSON.parse(text) : {}
  return res.status(200).json({ ok: r.ok, sandbox: true, httpStatus: r.status, raw: data })
}

// ─── Перевод на счёт физлица ──────────────────────────────────────────────────

async function makeTransfer(res, {
  amount,
  recipientName,
  recipientInn = '0',
  recipientAccount,
  recipientBik,
  recipientBankName,
  recipientCorrAccount,
  purpose = 'Перевод средств',
}) {
  if (!amount || !recipientAccount || !recipientBik) {
    return res.status(400).json({ ok: false, error: 'amount, recipientAccount, recipientBik required' })
  }

  const paymentId = `truepay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  const body = {
    id:      paymentId,
    from:    { accountNumber: SANDBOX_FROM },
    to: {
      name:              recipientName ?? 'Получатель',
      inn:               recipientInn,
      bik:               recipientBik,
      bankName:          recipientBankName ?? 'Банк получателя',
      corrAccountNumber: recipientCorrAccount ?? '30101810400000000225',
      accountNumber:     recipientAccount,
    },
    purpose,
    amount: Number(amount),
  }

  const r = await fetch(`${TBANK_SANDBOX}/payment/ruble-transfer/pay`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${TBANK_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  // Sandbox returns 201 with empty body — handle gracefully
  const text = await r.text()
  const data = text ? JSON.parse(text) : { status: 'QUEUED' }
  const ok   = r.status === 201 || r.ok
  return res.status(200).json({ ok, sandbox: true, paymentId, httpStatus: r.status, raw: data })
}

// ─── Статус платежа ───────────────────────────────────────────────────────────

async function getStatus(res, { paymentId }) {
  if (!paymentId) return res.status(400).json({ ok: false, error: 'paymentId required' })

  const r = await fetch(`${TBANK_SANDBOX}/payment/${paymentId}/status`, {
    headers: { Authorization: `Bearer ${TBANK_TOKEN}` },
  })

  const text = await r.text()
  const data = text ? JSON.parse(text) : {}
  return res.status(200).json({ ok: r.ok, sandbox: true, httpStatus: r.status, raw: data })
}
