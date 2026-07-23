import { useAuth } from './AuthContext'

function SealRingIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 shrink-0 text-brass"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="10" cy="10" r="4.75" stroke="currentColor" strokeWidth="0.75" strokeOpacity="0.55" />
      <circle cx="10" cy="10" r="1.25" fill="currentColor" />
    </svg>
  )
}

export function NavBar() {
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <nav className="bg-ink px-6 py-4 shadow-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-2.5">
          <SealRingIcon />
          <h1 className="font-display text-lg font-semibold tracking-tight text-paper-raised">
            <span className="border-b-2 border-paper-raised/30 pb-0.5">AI Audit Trail</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-paper-raised/70">
            Signed in as:{' '}
            <span className="font-medium text-paper-raised">{user.display_name}</span>
          </span>
          <span className="rounded-full bg-line px-2.5 py-0.5 text-xs font-medium capitalize text-ink">
            {user.role.replace(/_/g, ' ')}
          </span>
          <button
            onClick={logout}
            className="rounded border border-paper-raised/30 px-3 py-1 text-sm font-medium text-paper-raised transition-colors hover:border-paper-raised/60 hover:bg-ink-2"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
