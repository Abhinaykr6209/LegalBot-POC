import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ShieldCheck, Activity } from 'lucide-react'
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
    <div className="flex h-screen flex-col bg-[#F4F7FB] font-body selection:bg-blue-200 selection:text-blue-900">
      <NavBar />
      
      {/* Workspace Header */}
      <div className="sticky top-0 z-40 shrink-0 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-col px-6 lg:px-10">
          <div className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                AI Governance Workspace
              </h1>
              <p className="mt-1.5 text-sm font-medium text-slate-500">
                Cryptographically verifiable records and compliance controls
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-sm font-semibold text-emerald-700 shadow-sm">
              <ShieldCheck className="h-4 w-4" />
              Live Protection Active
            </div>
          </div>
          
          {/* Enterprise Tabs */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('chat')}
              className={`relative pb-4 text-sm font-semibold transition-colors ${
                showTab === 'chat'
                  ? 'text-blue-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Chat Console
              </div>
              {showTab === 'chat' && (
                <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-t-full bg-blue-600" />
              )}
            </button>
            {canViewAudit ? (
              <button
                onClick={() => setActiveTab('audit')}
                className={`relative pb-4 text-sm font-semibold transition-colors ${
                  showTab === 'audit'
                    ? 'text-blue-600'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Audit Trail
                </div>
                {showTab === 'audit' && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-t-full bg-blue-600" />
                )}
              </button>
            ) : (
              <p className="ml-auto pb-4 text-xs font-medium text-slate-400">
                Audit Trail restricted to Compliance Officers
              </p>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col p-6 lg:p-10">
        <div
          className={`flex min-h-0 flex-1 flex-col overflow-hidden ${
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