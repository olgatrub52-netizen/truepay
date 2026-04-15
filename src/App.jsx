import { useCallback, useMemo, useRef, useState } from 'react'

import { readSession, clearSession, writeSession } from './services/authService.js'
import { MOCK_CARD, MOCK_TRANSACTIONS, MOCK_BALANCE, SPENDING_DATA, formatUsdParts, nextTxId } from './data/mockData.js'

import TabBar from './components/layout/TabBar.jsx'
import Toast from './components/ui/Toast.jsx'

import OnboardingScreen from './screens/OnboardingScreen.jsx'
import BiometricGateScreen from './screens/BiometricGateScreen.jsx'
import HomeScreen from './screens/HomeScreen.jsx'
import CardsScreen from './screens/CardsScreen.jsx'
import PaymentsScreen from './screens/PaymentsScreen.jsx'
import ProfileScreen from './screens/ProfileScreen.jsx'
import TopUpScreen from './screens/TopUpScreen.jsx'
import TransferScreen from './screens/TransferScreen.jsx'
import LimitsScreen from './screens/LimitsScreen.jsx'
import CryptoScreen from './screens/CryptoScreen.jsx'
import KYCScreen from './screens/KYCScreen.jsx'
import SupportScreen from './screens/SupportScreen.jsx'

/**
 * Tab navigation order — used to compute slide direction.
 * Moving to a higher index → slide-in-right; lower → slide-in-left.
 */
const TAB_ORDER = ['home', 'cards', 'payments', 'profile']

/**
 * App-level state machine:
 *   auth:   null → 'verify' (post-register) → 'gate' (biometric) → user object
 *   tab:    'home' | 'cards' | 'payments' | 'profile'
 *   modal:  null | 'topup' | 'transfer' | 'limits' | 'crypto' | 'kyc'
 */
export default function App() {
  const [user, setUser]               = useState(() => readSession())
  const [showGate, setShowGate]       = useState(false)
  const [verifyDraft, setVerifyDraft] = useState(null)
  const [tab, setTab]                 = useState('home')
  const [slideDir, setSlideDir]       = useState(0) // 1 = from-right, -1 = from-left
  const [modal, setModal]             = useState(null)
  const [balance, setBalance]           = useState(MOCK_BALANCE.available)
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS)
  const [toast, setToast]               = useState('')
  // spendingData drives the Area Chart — mutable so top-ups animate the chart
  const [spendingData, setSpendingData] = useState(() => SPENDING_DATA.map((d) => ({ ...d })))
  const [kycVerified, setKycVerified]   = useState(false)

  const showToast    = useCallback((msg) => setToast(msg), [])
  const dismissToast = useCallback(() => setToast(''), [])

  // Direction-aware tab navigation
  const handleTabChange = useCallback((newTab) => {
    const newIdx = TAB_ORDER.indexOf(newTab)
    const curIdx = TAB_ORDER.indexOf(tab)
    setSlideDir(newIdx >= curIdx ? 1 : -1)
    setTab(newTab)
  }, [tab])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
    setTab('home')
    setModal(null)
    setShowGate(false)
    setVerifyDraft(null)
  }, [])

  // Called after email/password auth
  const handleAuthenticated = useCallback((u) => {
    setUser(u)
    setShowGate(false)
  }, [])

  // Called after registration — trigger biometric verification
  const handleVerify = useCallback((draft) => {
    setVerifyDraft(draft)
  }, [])

  // Called after biometric gate passes
  const handleGateUnlock = useCallback(() => {
    if (verifyDraft) {
      writeSession(verifyDraft)
      setUser(verifyDraft)
      setVerifyDraft(null)
    }
    setShowGate(false)
  }, [verifyDraft])

  // Handle TopUp / Transfer results
  const handleActionResult = useCallback((payload, err) => {
    if (err) { showToast(err); return }
    if (!payload) return

    if (payload.type === 'topup') {
      setBalance((b) => Math.round((b + payload.amount) * 100) / 100)

      const labels = { card: 'Карта', apple: 'Apple Pay', google: 'Google Pay', ach: 'ACH' }
      const { intWithSep, decPart } = formatUsdParts(payload.amount)

      setTransactions((prev) => [{
        id: nextTxId(), merchant: 'TopUp', title: 'Пополнение',
        subtitle: labels[payload.method] ?? 'Счёт', amountSigned: payload.amount,
        date: new Date(), status: 'completed',
      }, ...prev])

      // Bump today's bar (last item) on the spending chart.
      // Scale factor keeps the chart proportional for any amount entered.
      setSpendingData((prev) => {
        const next = prev.map((d) => ({ ...d }))
        const last = next[next.length - 1]
        last.amount = Math.round(Math.min(last.amount + payload.amount * 0.11, 970))
        return next
      })

      showToast(`Зачислено $${intWithSep}.${decPart}`)
      setModal(null)
    }

    if (payload.type === 'transfer') {
      setBalance((b) => Math.round((b - payload.amount) * 100) / 100)
      const note = payload.note ? ` · ${payload.note}` : ''
      const { intWithSep, decPart } = formatUsdParts(payload.amount)
      setTransactions((prev) => [{
        id: nextTxId(), merchant: 'Transfer', title: 'Перевод',
        subtitle: `${payload.to}${note}`, amountSigned: -payload.amount,
        date: new Date(), status: 'completed',
      }, ...prev])
      showToast(`Отправлено $${intWithSep}.${decPart}`)
      setModal(null)
    }
  }, [showToast])

  // Actions passed down to HomeScreen
  const homeActions = useMemo(() => ({
    navigate: (id) => setModal(id),
    toast: showToast,
  }), [showToast])

  // ─── Auth gates ──────────────────────────────────────────────────────────────
  if (!user && !verifyDraft) {
    return (
      <OnboardingScreen
        onAuthenticated={handleAuthenticated}
        onVerify={(draft) => {
          setVerifyDraft(draft)
          setShowGate(true)
        }}
      />
    )
  }

  if (showGate || verifyDraft) {
    return (
      <BiometricGateScreen
        user={verifyDraft ?? user}
        onUnlock={handleGateUnlock}
      />
    )
  }

  // ─── Modal screens (full-page overlays) ──────────────────────────────────────
  if (modal === 'topup') {
    return (
      <>
        <TopUpScreen onBack={() => setModal(null)} onSuccess={handleActionResult} />
        <Toast message={toast} visible={Boolean(toast)} onDismiss={dismissToast} />
      </>
    )
  }
  if (modal === 'transfer') {
    return (
      <>
        <TransferScreen balance={balance} onBack={() => setModal(null)} onSuccess={handleActionResult} />
        <Toast message={toast} visible={Boolean(toast)} onDismiss={dismissToast} />
      </>
    )
  }
  if (modal === 'limits') {
    return (
      <>
        <LimitsScreen onBack={() => setModal(null)} showToast={showToast} />
        <Toast message={toast} visible={Boolean(toast)} onDismiss={dismissToast} />
      </>
    )
  }
  if (modal === 'crypto') {
    return (
      <>
        <CryptoScreen onBack={() => setModal(null)} />
        <Toast message={toast} visible={Boolean(toast)} onDismiss={dismissToast} />
      </>
    )
  }
  if (modal === 'kyc') {
    return (
      <>
        <KYCScreen
          onBack={() => setModal(null)}
          onComplete={() => setKycVerified(true)}
        />
        <Toast message={toast} visible={Boolean(toast)} onDismiss={dismissToast} />
      </>
    )
  }
  if (modal === 'support') {
    return (
      <>
        <SupportScreen onBack={() => setModal(null)} user={user} />
        <Toast message={toast} visible={Boolean(toast)} onDismiss={dismissToast} />
      </>
    )
  }

  // Slide animation class for current tab
  const slideClass = slideDir > 0 ? 'animate-slide-in-right' : 'animate-slide-in-left'

  // ─── Main tab layout ─────────────────────────────────────────────────────────
  return (
    <div className="relative mx-auto max-w-md overflow-x-hidden">
      {/*
        key={tab} forces React to remount the wrapper on each tab change,
        which re-triggers the CSS animation reliably.
      */}
      <div key={tab} className={slideClass}>
        {tab === 'home' && (
          <HomeScreen
            user={user}
            balance={balance}
            transactions={transactions}
            card={MOCK_CARD}
            spendingData={spendingData}
            onAction={homeActions}
            onTabChange={handleTabChange}
          />
        )}
        {tab === 'cards' && (
          <CardsScreen card={MOCK_CARD} showToast={showToast} />
        )}
        {tab === 'payments' && (
          <PaymentsScreen transactions={transactions} />
        )}
        {tab === 'profile' && (
          <ProfileScreen
            user={user}
            onLogout={logout}
            onKyc={() => setModal('kyc')}
            onSupport={() => setModal('support')}
            kycVerified={kycVerified}
            onKycToggle={setKycVerified}
            showToast={showToast}
          />
        )}
      </div>

      <TabBar active={tab} onChange={handleTabChange} />
      <Toast message={toast} visible={Boolean(toast)} onDismiss={dismissToast} />
    </div>
  )
}
