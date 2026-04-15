import { useId, useState } from 'react'
import { IconFaceId } from '../components/icons/index.jsx'
import { findAccount, createAccount, writeSession, validateEmail } from '../services/authService.js'

export default function OnboardingScreen({ onAuthenticated, onVerify }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const id = useId()

  const switchMode = (m) => { setMode(m); setError('') }

  const submit = (e) => {
    e.preventDefault()
    setError('')

    if (!validateEmail(email)) { setError('Укажите корректный email'); return }
    if (password.length < 6) { setError('Пароль — минимум 6 символов'); return }

    if (mode === 'register') {
      if (name.trim().length < 2) { setError('Введите имя'); return }
      if (password !== confirm) { setError('Пароли не совпадают'); return }
      try {
        const user = createAccount({ name, email, password })
        onVerify(user)
      } catch (err) {
        if (err.message === 'EMAIL_TAKEN') setError('Этот email уже зарегистрирован')
        else setError('Ошибка регистрации')
      }
      return
    }

    const acc = findAccount(email, password)
    if (!acc) { setError('Неверный email или пароль'); return }
    const user = { name: acc.name, email: acc.email }
    writeSession(user)
    onAuthenticated(user)
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-surface px-5 pb-10 animate-fade-in"
      style={{ paddingTop: 'max(2.5rem, env(safe-area-inset-top))' }}>
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[45vh] bg-gradient-to-b from-sky-950/25 via-surface/60 to-transparent" aria-hidden />

      <div className="relative z-10 mx-auto flex w-full max-w-sm flex-1 flex-col">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-surface-raised/60">
            <span className="text-2xl font-bold tracking-tight text-white">T</span>
          </div>
          <p className="tp-label">TruePay</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {mode === 'login' ? 'Добро пожаловать' : 'Создать аккаунт'}
          </h1>
          <p className="mt-1.5 text-center text-[14px] text-slate-500 max-w-[240px] leading-snug">
            {mode === 'login'
              ? 'Войдите для доступа к карте и балансу'
              : 'Регистрация займёт меньше минуты'}
          </p>
        </div>

        {/* Mode switcher */}
        <div className="flex rounded-2xl border border-white/[0.07] bg-surface-raised/40 p-1 mb-7">
          {['login', 'register'].map((m) => (
            <button key={m} type="button" onClick={() => switchMode(m)}
              className={`flex-1 rounded-xl py-2.5 text-[14px] font-medium transition ${
                mode === m ? 'bg-sky-500/20 text-white ring-1 ring-sky-400/30' : 'text-slate-400 hover:text-slate-300'
              }`}>
              {m === 'login' ? 'Вход' : 'Регистрация'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          {mode === 'register' && (
            <Field id={`${id}-name`} label="Имя" type="text" autoComplete="name"
              value={name} onChange={setName} placeholder="Ваше имя" />
          )}
          <Field id={`${id}-email`} label="Email" type="email" autoComplete="email"
            value={email} onChange={setEmail} placeholder="you@example.com" />
          <Field id={`${id}-pass`} label="Пароль" type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password} onChange={setPassword} placeholder="••••••••" />
          {mode === 'register' && (
            <Field id={`${id}-confirm`} label="Пароль ещё раз" type="password" autoComplete="new-password"
              value={confirm} onChange={setConfirm} placeholder="Повторите пароль" />
          )}

          {error && (
            <p className="rounded-xl border border-red-500/25 bg-red-950/30 px-3 py-2.5 text-[13px] text-red-300" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="tp-btn-accent mt-2">
            {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        {/* Face ID hint */}
        <div className="mt-auto pt-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.06] bg-surface-raised/40 text-slate-600">
            <IconFaceId className="h-6 w-6" />
          </div>
          <p className="text-[12px] text-slate-600">Face ID / Touch ID — после входа</p>
        </div>
      </div>
    </div>
  )
}

function Field({ id, label, type, value, onChange, placeholder, autoComplete }) {
  return (
    <div>
      <label htmlFor={id} className="tp-label">{label}</label>
      <input id={id} type={type} autoComplete={autoComplete}
        value={value} onChange={(e) => onChange(e.target.value)}
        className="tp-input mt-1.5" placeholder={placeholder} />
    </div>
  )
}
