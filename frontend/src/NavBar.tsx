import { useAuth } from './AuthContext'

export function NavBar() {
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <nav className="bg-slate-900 text-white px-6 py-4 shadow-lg">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">AI Audit Trail</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-300">
            Signed in as: <span className="font-medium text-white">{user.display_name}</span> ({user.role})
          </span>
          <button
            onClick={logout}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm font-medium transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
