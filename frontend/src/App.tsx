import { useState } from 'react'
import { useAuth } from './AuthContext'
import { LoginPage } from './LoginPage'
import { NavBar } from './NavBar'
import { ChatConsole } from './ChatConsole'
import { AuditTrail } from './AuditTrail'

type Tab = 'chat' | 'audit'

const AUDIT_ROLES = new Set(['compliance_officer', 'reviewer'])

function AppContent() {
  const { user } = useAuth()
  const canViewAudit = !!user && AUDIT_ROLES.has(user.role)
  const [activeTab, setActiveTab] = useState<Tab>('chat')

  const showTab = canViewAudit ? activeTab : 'chat'

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <div className="flex-1">
        <div className="border-b border-slate-200 bg-white">
          <div className="max-w-6xl mx-auto px-6 flex gap-4 items-center">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                showTab === 'chat'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Chat Console
            </button>
            {canViewAudit ? (
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  showTab === 'audit'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Audit Trail
              </button>
            ) : (
              <p className="ml-auto text-xs text-slate-500 py-3">
                Audit Trail is available to compliance officers and reviewers only
              </p>
            )}
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-6">
          <div
            className={`h-[600px] rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col ${
              showTab === 'chat' ? '' : 'hidden'
            }`}
          >
            <ChatConsole />
          </div>

          {canViewAudit && showTab === 'audit' && (
            <div>
              <AuditTrail />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function App() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return <AppContent />
}

export default App
