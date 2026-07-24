import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  CircleCheck,
  Eye,
  EyeOff,
  FileCheck2,
  Link2,
  LockKeyhole,
  Mail,
  Shield,
  Sparkles,
  User,
  UsersRound,
} from 'lucide-react'
import { useAuth } from './AuthContext'

type Mode = 'login' | 'register'

const ease = [0.16, 1, 0.3, 1] as const
const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }

const features = [
  { icon: Link2, title: 'Cryptographic chain', copy: 'Every decision is linked and tamper-evident.' },
  { icon: UsersRound, title: 'Human accountability', copy: 'Review, approve, and flag AI outcomes.' },
  { icon: FileCheck2, title: 'Compliance evidence', copy: 'Export an audit-ready record when needed.' },
]

const stats = [
  ['AI records', 'Verified'],
  ['SHA-256', 'Protected'],
  ['Review', 'Ready'],
  ['Enterprise', 'Grade'],
]

function NetworkGraphic() {
  const nodes = [
    { cx: '15%', cy: '28%', r: 3, delay: 0 },
    { cx: '34%', cy: '16%', r: 4, delay: 0.5 },
    { cx: '51%', cy: '37%', r: 3, delay: 1 },
    { cx: '72%', cy: '20%', r: 4, delay: 1.5 },
    { cx: '82%', cy: '52%', r: 3, delay: 0.8 },
    { cx: '61%', cy: '72%', r: 4, delay: 1.2 },
    { cx: '29%', cy: '71%', r: 3, delay: 0.3 },
  ]

  return (
    <div className="network-graphic" aria-hidden="true">
      <svg viewBox="0 0 600 400" preserveAspectRatio="none">
        <defs>
          <linearGradient id="network-line" x1="0" x2="1">
            <stop offset="0" stopColor="#6d88bd" stopOpacity=".08" />
            <stop offset=".5" stopColor="#9bb8f5" stopOpacity=".68" />
            <stop offset="1" stopColor="#c3a15d" stopOpacity=".12" />
          </linearGradient>
          <radialGradient id="network-glow"><stop stopColor="#85a6e8" stopOpacity=".2" /><stop offset="1" stopColor="#85a6e8" stopOpacity="0" /></radialGradient>
        </defs>
        <circle cx="320" cy="175" r="150" fill="url(#network-glow)" />
        <g stroke="url(#network-line)" strokeWidth="1">
          <path d="M90 112 204 64 306 148 432 80 492 208 366 288 174 284 90 112Z" />
          <path d="M204 64 366 288M306 148 174 284M432 80 306 148M492 208 306 148" />
        </g>
        {nodes.map((node) => (
          <motion.circle key={node.cx} cx={node.cx} cy={node.cy} r={node.r} fill="#b9cdf5" initial={{ opacity: 0.35 }} animate={{ opacity: [0.35, 1, 0.35], scale: [1, 1.5, 1] }} transition={{ duration: 3.4, delay: node.delay, repeat: Infinity, ease: 'easeInOut' }} />
        ))}
      </svg>
      <div className="network-core"><Shield size={20} strokeWidth={1.5} /><span>VERIFIED</span></div>
    </div>
  )
}

function FloatingLabelField({ id, label, icon: Icon, children }: { id: string; label: string; icon: typeof Mail; children: React.ReactNode }) {
  return (
    <div className="field-shell">
      <Icon className="field-icon" size={17} strokeWidth={1.7} aria-hidden="true" />
      {children}
      <label htmlFor={id}>{label}</label>
    </div>
  )
}

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState('analyst')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()

  const switchMode = (next: Mode) => {
    setMode(next)
    setError('')
    setShowPassword(false)
    if (next === 'register') setSuccess('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      if (mode === 'register') {
        const res = await fetch('http://localhost:8000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: email.trim().toLowerCase(), password, display_name: displayName, role }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          const detail = data.detail
          const message = typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(', ') : 'Registration failed'
          throw new Error(message)
        }
        setPassword('')
        setDisplayName('')
        setMode('login')
        setSuccess('Registration successful. Please sign in with your email and password.')
        return
      }

      const res = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email.trim().toLowerCase(), password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const detail = data.detail
        const message = typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(', ') : 'Login failed'
        throw new Error(message)
      }
      login(data.user, data.token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="aurora aurora-one" aria-hidden="true" />
      <div className="aurora aurora-two" aria-hidden="true" />
      <div className="noise-layer" aria-hidden="true" />

      <section className="auth-hero" aria-labelledby="hero-title">
        <div className="hero-orbit hero-orbit-one" aria-hidden="true" />
        <div className="hero-orbit hero-orbit-two" aria-hidden="true" />
        <NetworkGraphic />
        <motion.div className="hero-content" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.07 } } }}>
          <motion.div variants={fadeUp} transition={{ duration: 0.45, ease }} className="hero-brand"><span className="brand-symbol"><Shield size={19} /></span><span>AI Audit Trail</span></motion.div>
          <motion.div variants={fadeUp} transition={{ duration: 0.45, ease }} className="hero-eyebrow"><Sparkles size={14} /> ENTERPRISE AI GOVERNANCE</motion.div>
          <motion.h1 id="hero-title" variants={fadeUp} transition={{ duration: 0.5, ease }}>Make every AI decision<br /><em>accountable.</em></motion.h1>
          <motion.p variants={fadeUp} transition={{ duration: 0.5, ease }} className="hero-copy">Every AI interaction is securely recorded, cryptographically verified, and ready for compliance review.</motion.p>

          <motion.div variants={fadeUp} transition={{ duration: 0.5, ease }} className="trust-card"><div className="trust-card-icon"><BadgeCheck size={20} /></div><div><strong>Integrity by design</strong><span>Verified hash chain · Live protection</span></div><CircleCheck className="trust-check" size={18} /></motion.div>
          <motion.div className="hero-feature-list" variants={fadeUp} transition={{ duration: 0.5, ease }}>{features.map(({ icon: FeatureIcon, title, copy }) => <div className="hero-feature" key={title}><FeatureIcon size={16} /><span><strong>{title}</strong><small>{copy}</small></span></div>)}</motion.div>
          <motion.div className="hero-stats" variants={fadeUp} transition={{ duration: 0.5, ease }}>{stats.map(([top, bottom], index) => <div key={top} className="hero-stat"><motion.strong initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 + index * 0.1 }}>{top}</motion.strong><span>{bottom}</span></div>)}</motion.div>
        </motion.div>
        <div className="hero-footer"><span><Check size={14} /> Built for accountable AI operations</span><span>SECURE · AUDITABLE · READY</span></div>
      </section>

      <main className="auth-stage">
        <motion.section className="auth-card" initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.45, ease }} aria-labelledby="auth-title">
          <div className="card-heading"><div className="card-shield"><Shield size={20} /></div><div><p className="card-kicker">SECURE WORKSPACE</p><h2 id="auth-title">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2><p>{mode === 'login' ? 'Sign in to access your audit workspace.' : 'Set up secure access to your audit workspace.'}</p></div></div>

          <div className="auth-tabs" role="tablist" aria-label="Authentication mode"><span className={`auth-tab-indicator ${mode === 'register' ? 'register' : ''}`} aria-hidden="true" /><button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => switchMode('login')}>Sign in</button><button type="button" role="tab" aria-selected={mode === 'register'} onClick={() => switchMode('register')}>Register</button></div>

          <motion.form onSubmit={handleSubmit} className="auth-form" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } } }}>
            {mode === 'register' && <>
              <motion.div variants={fadeUp} transition={{ duration: 0.3, ease }}><FloatingLabelField id="display-name" label="Display name" icon={User}><input id="display-name" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required placeholder=" " autoComplete="name" /></FloatingLabelField></motion.div>
              <motion.div variants={fadeUp} transition={{ duration: 0.3, ease }} className="field-group"><label className="select-label" htmlFor="role">Role</label><div className="select-shell"><UsersRound size={17} aria-hidden="true" /><select id="role" value={role} onChange={(e) => setRole(e.target.value)}><option value="analyst">Analyst</option><option value="compliance_officer">Compliance officer</option><option value="reviewer">Reviewer</option></select><ChevronDown size={16} aria-hidden="true" /></div></motion.div>
            </>}
            <motion.div variants={fadeUp} transition={{ duration: 0.3, ease }}><FloatingLabelField id="email" label="Email address" icon={Mail}><input id="email" type="text" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" placeholder=" " /></FloatingLabelField></motion.div>
            <motion.div variants={fadeUp} transition={{ duration: 0.3, ease }}><div className="field-label-row"><span>Password</span>{mode === 'login' && <span className="forgot-text">Forgot password?</span>}</div><div className="field-shell"><LockKeyhole className="field-icon" size={17} strokeWidth={1.7} aria-hidden="true" /><input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder=" " aria-label="Password" /><label htmlFor="password">Password</label><button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></motion.div>

            {success && <motion.p className="form-message success-message" role="status" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}><CircleCheck size={16} />{success}</motion.p>}
            {error && <motion.p className="form-message error-message" role="alert" initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}><Shield size={16} />{error}</motion.p>}
            <motion.button type="submit" disabled={isLoading} className="auth-submit" whileHover={!isLoading ? { y: -2 } : undefined} whileTap={!isLoading ? { scale: 0.985 } : undefined}>{isLoading ? <><span className="loading-spinner" aria-hidden="true" />{mode === 'login' ? 'Signing in…' : 'Creating account…'}</> : <>{mode === 'login' ? 'Sign in securely' : 'Create account'}<ArrowRight size={17} /></>}</motion.button>
          </motion.form>
          <div className="card-footer"><LockKeyhole size={13} /> Secure access for authorised users only.</div>
        </motion.section>
        <p className="stage-note">AI Audit Trail · Cryptographically verifiable records for modern teams</p>
      </main>
    </div>
  )
}
