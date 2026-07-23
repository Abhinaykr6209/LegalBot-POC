import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

type AuditEntry = {
  id: number
  decision_id: string
  timestamp_utc: string
  source_type: string
  user_id: string
  user_display_name: string
  ai_system: string
  model_version: string
  input_text: string
  input_source: string
  policy_invoked: string
  reasoning_summary: string
  output_text: string
  downstream_action: string
  parent_decision_id: string | null
  prev_hash: string
  entry_hash: string
}

export function Certificate() {
  const { decision_id } = useParams()
  const navigate = useNavigate()
  const [entry, setEntry] = useState<AuditEntry | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const { token, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/')
      return
    }

    const loadEntry = async () => {
      setIsLoading(true)
      setError('')
      try {
        const response = await fetch(
          `http://localhost:8000/api/audit-logs/${decision_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        if (!response.ok) throw new Error('Entry not found')
        const data = await response.json()
        setEntry(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load entry')
      } finally {
        setIsLoading(false)
      }
    }

    loadEntry()
  }, [decision_id, token, isAuthenticated, navigate])

  if (isLoading) {
    return <div className="p-8 text-center">Loading audit entry…</div>
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800"
        >
          Back to Audit Trail
        </button>
      </div>
    )
  }

  if (!entry) {
    return <div className="p-8 text-center">Entry not found</div>
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 pb-8 border-b border-slate-200">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Audit Certificate</h1>
          <p className="text-slate-600">Official Record of AI System Activity</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-sm text-slate-600 hover:text-slate-900 underline"
          >
            ← Back to Audit Trail
          </button>
        </div>

        {/* Certificate Content */}
        <div className="space-y-6">
          {/* Identity Section */}
          <div className="border border-slate-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Entry Identity</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-slate-600">Decision ID</p>
                <p className="text-base font-mono text-slate-900 break-all">
                  {entry.decision_id}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Timestamp (UTC)</p>
                <p className="text-base text-slate-900">
                  {new Date(entry.timestamp_utc).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* User & System Section */}
          <div className="border border-slate-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">User & System</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-slate-600">User ID</p>
                <p className="text-base text-slate-900">{entry.user_id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">User Display Name</p>
                <p className="text-base text-slate-900">{entry.user_display_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">AI System</p>
                <p className="text-base text-slate-900">{entry.ai_system}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Model Version</p>
                <p className="text-base text-slate-900">{entry.model_version}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Source Type</p>
                <p className="text-base text-slate-900">{entry.source_type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Input Source</p>
                <p className="text-base text-slate-900">{entry.input_source}</p>
              </div>
            </div>
          </div>

          {/* Policy Section */}
          <div className="border border-slate-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Policy & Governance</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-600">Policy Invoked</p>
                <p className="text-base text-slate-900">{entry.policy_invoked}</p>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="border border-slate-200 rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Content</h2>

            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Input Text</p>
              <p className="text-base text-slate-900 whitespace-pre-wrap bg-slate-50 p-4 rounded border border-slate-200">
                {entry.input_text}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Output Text</p>
              <p className="text-base text-slate-900 whitespace-pre-wrap bg-slate-50 p-4 rounded border border-slate-200">
                {entry.output_text}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Reasoning Summary</p>
              <p className="text-base text-slate-900 whitespace-pre-wrap bg-slate-50 p-4 rounded border border-slate-200">
                {entry.reasoning_summary}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Downstream Action</p>
              <p className="text-base text-slate-900 whitespace-pre-wrap bg-slate-50 p-4 rounded border border-slate-200">
                {entry.downstream_action}
              </p>
            </div>
          </div>

          {/* Integrity Section */}
          <div className="border border-slate-200 rounded-lg p-6 space-y-4 bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Integrity Verification</h2>

            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Entry Hash (SHA-256)</p>
              <p className="text-xs font-mono text-slate-900 break-all bg-white p-3 rounded border border-slate-200">
                {entry.entry_hash}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Previous Hash (SHA-256)</p>
              <p className="text-xs font-mono text-slate-900 break-all bg-white p-3 rounded border border-slate-200">
                {entry.prev_hash}
              </p>
            </div>

            {entry.parent_decision_id && (
              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">Parent Decision ID</p>
                <p className="text-xs font-mono text-slate-900 break-all">
                  {entry.parent_decision_id}
                </p>
              </div>
            )}

            <p className="text-xs text-slate-600 pt-2">
              This entry is part of an immutable hash chain. Each entry's hash incorporates the
              previous entry's hash, creating a tamper-evident audit trail.
            </p>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-slate-200 text-center text-sm text-slate-600">
            <p>Generated: {new Date().toLocaleString()} UTC</p>
            <p className="mt-2 text-xs">
              This certificate is generated from immutable audit records. Suitable for sharing with
              outside counsel and regulatory bodies.
            </p>
            <button
              onClick={() => window.print()}
              className="mt-4 px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 text-sm font-medium"
            >
              Print / Export as PDF
            </button>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
          }
          button {
            display: none;
          }
          .no-print {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
