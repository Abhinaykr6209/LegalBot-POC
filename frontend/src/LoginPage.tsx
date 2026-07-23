import { useState } from 'react'
import { useAuth } from './AuthContext'

type Mode = 'login' | 'register'

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState('analyst')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { login } = useAuth()

  const switchMode = (next: Mode) => {
    setMode(next)
    setError('')
    if (next === 'register') {
      setSuccess('')
    }
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
          body: JSON.stringify({
            username: email.trim().toLowerCase(),
            password,
            display_name: displayName,
            role,
          }),
        })

        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          const detail = data.detail
          const message =
            typeof detail === 'string'
              ? detail
              : Array.isArray(detail)
                ? detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(', ')
                : 'Registration failed'
          throw new Error(message)
        }

        // Do not auto-login — send user to Sign in
        setPassword('')
        setDisplayName('')
        setMode('login')
        setSuccess('Registration successful. Please sign in with your email and password.')
        return
      }

      const res = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: email.trim().toLowerCase(),
          password,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const detail = data.detail
        const message =
          typeof detail === 'string'
            ? detail
            : Array.isArray(detail)
              ? detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(', ')
              : 'Login failed'
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          AI Audit Trail
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {mode === 'login' ? 'Sign in with your email' : 'Create a new account'}
        </p>

        <div className="mt-6 flex gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
              mode === 'login'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
              mode === 'register'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Display name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="Priya Reviewer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="analyst">Analyst</option>
                  <option value="compliance_officer">Compliance officer</option>
                  <option value="reviewer">Reviewer</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              placeholder={mode === 'login' ? 'you@company.com or priya' : 'you@company.com'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              placeholder="••••••••"
            />
          </div>

          {success && <p className="text-sm text-green-700">{success}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:bg-slate-400"
          >
            {isLoading
              ? mode === 'login'
                ? 'Signing in…'
                : 'Creating account…'
              : mode === 'login'
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>

        {mode === 'login' && (
          <p className="mt-4 text-xs text-slate-500 space-y-1">
            <span className="block">
              Demo: <span className="font-mono">alice</span> (compliance — Audit Trail) /{' '}
              <span className="font-mono">bob</span> (analyst — Chat only) /{' '}
              <span className="font-mono">priya</span> (reviewer — Audit Trail)
            </span>
            <span className="block">
              Password for all: <span className="font-mono">demo123</span>
            </span>
          </p>
        )}
      </div>
    </div>
  )
}
