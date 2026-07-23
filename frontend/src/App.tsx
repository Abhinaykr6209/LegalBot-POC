import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { LoginPage } from './LoginPage'
import { NavBar } from './NavBar'
import { ChatConsole } from './ChatConsole'
import { AuditTrail } from './AuditTrail'
import { Certificate } from './Certificate'

type Tab = 'chat' | 'audit'

const AUDIT_ROLES = new Set(['compliance_officer', 'reviewer'])

function AppContent() {
  const { user } = useAuth()
  const canViewAudit = !!user && AUDIT_ROLES.has(user.role)
  const [activeTab, setActiveTab] = useState<Tab>('chat')

  const showTab = canViewAudit ? activeTab : 'chat'

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <NavBar />
      <div className="shrink-0 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6">
          <button
            onClick={() => setActiveTab('chat')}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
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
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                showTab === 'audit'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Audit Trail
            </button>
          ) : (
            <p className="ml-auto py-3 text-xs text-slate-500">
              Audit Trail is available to compliance officers and reviewers only
            </p>
          )}
        </div>
      </div>

      <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col p-6">
        <div
          className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${
            showTab === 'chat' ? '' : 'hidden'
          }`}
        >
          <ChatConsole />
        </div>

        {canViewAudit && showTab === 'audit' && (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <AuditTrail />
          </div>
        )}
      </main>
    </div>
  )
}

function App() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <Routes>
      <Route path="/" element={<AppContent />} />
      <Route path="/certificate/:decision_id" element={<Certificate />} />
    </Routes>
  )
}

export default App
