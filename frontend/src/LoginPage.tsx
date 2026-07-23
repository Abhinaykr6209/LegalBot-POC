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
    <div className="min-h-screen flex">
      <aside
        className="relative hidden min-h-screen lg:flex lg:w-[45%] flex-col items-center justify-center bg-ink px-12 xl:px-16 bg-[repeating-linear-gradient(to_bottom,transparent,transparent_27px,rgba(255,255,255,0.05)_27px,rgba(255,255,255,0.05)_28px)]"
        aria-hidden="true"
      >
        <div className="relative w-full max-w-md">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-paper-raised xl:text-5xl">
            AI Audit Trail
          </h1>
          <p className="mt-5 text-base leading-relaxed text-paper-raised/75">
            A tamper-evident record of every AI decision your team makes.
          </p>
          <ul className="mt-8 space-y-3">
            <li className="flex items-start gap-2.5 text-sm leading-relaxed text-paper-raised/70">
              <svg
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-brass"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.5 8.5l2.5 2.5 6.5-6.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Every AI reply is cryptographically hashed
            </li>
            <li className="flex items-start gap-2.5 text-sm leading-relaxed text-paper-raised/70">
              <svg
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-brass"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.5 8.5l2.5 2.5 6.5-6.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Reviewers approve or flag entries
            </li>
            <li className="flex items-start gap-2.5 text-sm leading-relaxed text-paper-raised/70">
              <svg
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-brass"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.5 8.5l2.5 2.5 6.5-6.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Export a signed certificate for any record
            </li>
          </ul>
        </div>
      </aside>

      <main className="flex min-h-screen w-full flex-1 items-center justify-center bg-paper-raised px-6 py-10 lg:px-12">
        <div className="w-full max-w-md">
          <p className="text-sm text-ink-soft">
            {mode === 'login' ? 'Sign in with your email' : 'Create a new account'}
          </p>

          <div className="mt-6 flex gap-2 border-b border-line">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                mode === 'login'
                  ? 'border-brass text-ink'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                mode === 'register'
                  ? 'border-brass text-ink'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">
                    Display name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full rounded-lg border border-line px-3 py-2 text-ink transition-shadow focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/30"
                    placeholder="Priya Reviewer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">
                    Role
                  </label>
                  <div className="relative">
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-line bg-paper-raised px-3 py-2 pr-10 text-ink transition-shadow focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/30"
                    >
                      <option value="analyst">Analyst</option>
                      <option value="compliance_officer">Compliance officer</option>
                      <option value="reviewer">Reviewer</option>
                    </select>
                    <svg
                      aria-hidden="true"
                      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4 6l4 4 4-4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Email
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                className="w-full rounded-lg border border-line px-3 py-2 text-ink transition-shadow focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/30"
                placeholder={mode === 'login' ? 'you@company.com or priya' : 'you@company.com'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full rounded-lg border border-line px-3 py-2 text-ink transition-shadow focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/30"
                placeholder="••••••••"
              />
            </div>

            {success && <p className="text-sm text-emerald">{success}</p>}
            {error && <p className="text-sm text-rust">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-ink px-4 py-2 font-medium text-paper-raised transition-colors hover:bg-ink-2 disabled:bg-ink-soft"
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

        </div>
      </main>
    </div>
  )
}
