const SESSION_KEY = 'truepay_session_v2'
const ACCOUNTS_KEY = 'truepay_accounts_v2'

export function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const u = JSON.parse(raw)
    return typeof u?.email === 'string' && typeof u?.name === 'string' ? u : null
  } catch {
    return null
  }
}

export function writeSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

function loadAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function saveAccounts(list) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list))
}

export function findAccount(email, password) {
  const em = email.trim().toLowerCase()
  return loadAccounts().find((a) => a.email === em && a.password === password) ?? null
}

export function createAccount({ name, email, password }) {
  const accounts = loadAccounts()
  const em = email.trim().toLowerCase()
  if (accounts.some((a) => a.email === em)) {
    throw new Error('EMAIL_TAKEN')
  }
  const user = { name: name.trim(), email: em, password, createdAt: Date.now() }
  accounts.push(user)
  saveAccounts(accounts)
  return { name: user.name, email: user.email }
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}
