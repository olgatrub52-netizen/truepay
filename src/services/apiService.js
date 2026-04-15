/**
 * TruePay API Service — Sandbox stubs
 *
 * In production these will call real endpoints.
 * Replace BASE_URL and add Authorization headers from your auth token.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'https://api-sandbox.truepay.io/v1'

async function request(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('truepay_access_token') ?? ''}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw Object.assign(new Error(err.message ?? 'API Error'), { status: res.status, code: err.code })
  }
  return res.json()
}

// ─── Account ─────────────────────────────────────────────────────────────────
export const accountApi = {
  getBalance: () => request('GET', '/account/balance'),
  getProfile: () => request('GET', '/account/profile'),
}

// ─── Cards ───────────────────────────────────────────────────────────────────
export const cardApi = {
  list: () => request('GET', '/cards'),
  freeze: (cardId) => request('POST', `/cards/${cardId}/freeze`),
  unfreeze: (cardId) => request('POST', `/cards/${cardId}/unfreeze`),
  getSensitiveData: (cardId) => request('GET', `/cards/${cardId}/sensitive`),
}

// ─── Transactions ─────────────────────────────────────────────────────────────
export const transactionApi = {
  list: (params) =>
    request('GET', '/transactions?' + new URLSearchParams(params).toString()),
  get: (txId) => request('GET', `/transactions/${txId}`),
}

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentApi = {
  topUp: (payload) => request('POST', '/payments/topup', payload),
  transfer: (payload) => request('POST', '/payments/transfer', payload),
}

// ─── KYC (Sumsub integration) ─────────────────────────────────────────────────
export const kycApi = {
  getStatus: () => request('GET', '/kyc/status'),
  createApplicant: (payload) => request('POST', '/kyc/applicant', payload),
  getAccessToken: () => request('POST', '/kyc/access-token'),
}
