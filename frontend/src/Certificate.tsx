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
    return (
      <div className="min-h-screen bg-paper p-8 text-center text-ink-soft">
        Loading audit entry…
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-paper p-8">
        <div className="mb-4 text-rust">{error}</div>
        <button
          onClick={() => navigate('/')}
          className="rounded bg-ink px-4 py-2 text-paper-raised transition-colors hover:bg-ink-2"
        >
          Back to Audit Trail
        </button>
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-paper p-8 text-center text-ink-soft">
        Entry not found
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper p-6 md:p-8">
      <div className="certificate-document mx-auto max-w-4xl border-4 border-line-strong p-1">
        <div className="certificate-inner border border-line-strong bg-paper-raised p-8 md:p-12 lg:p-14">
          {/* Header */}
          <div className="mb-10 border-b border-line pb-8">
            <div className="flex items-start gap-5">
              <svg
                aria-hidden="true"
                className="certificate-seal h-14 w-14 shrink-0 text-brass"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" />
                <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
                <path
                  d="M16 24.5l5 5 11-12"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div>
                <h1 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">
                  Certificate of Record
                </h1>
                <p className="mt-1 text-ink-soft">Official Record of AI System Activity</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="no-print mt-5 text-sm text-ink-soft underline transition-colors hover:text-ink"
            >
              ← Back to Audit Trail
            </button>
          </div>

          {/* Certificate Content */}
          <div className="space-y-6">
            {/* Identity Section */}
            <div className="rounded-lg border border-line p-6">
              <h2 className="font-display mb-4 text-lg font-semibold text-ink">Entry Identity</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-ink-soft">Decision ID</p>
                  <p className="mt-1 break-all font-mono text-base text-ink">
                    {entry.decision_id}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-ink-soft">Timestamp (UTC)</p>
                  <p className="mt-1 text-base text-ink">
                    {new Date(entry.timestamp_utc).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* User & System Section */}
            <div className="rounded-lg border border-line p-6">
              <h2 className="font-display mb-4 text-lg font-semibold text-ink">User & System</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-ink-soft">User ID</p>
                  <p className="mt-1 text-base text-ink">{entry.user_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-ink-soft">User Display Name</p>
                  <p className="mt-1 text-base text-ink">{entry.user_display_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-ink-soft">AI System</p>
                  <p className="mt-1 text-base text-ink">{entry.ai_system}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-ink-soft">Model Version</p>
                  <p className="mt-1 text-base text-ink">{entry.model_version}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-ink-soft">Source Type</p>
                  <p className="mt-1 text-base text-ink">{entry.source_type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-ink-soft">Input Source</p>
                  <p className="mt-1 text-base text-ink">{entry.input_source}</p>
                </div>
              </div>
            </div>

            {/* Policy Section */}
            <div className="rounded-lg border border-line p-6">
              <h2 className="font-display mb-4 text-lg font-semibold text-ink">
                Policy & Governance
              </h2>
              <div>
                <p className="text-sm font-medium text-ink-soft">Policy Invoked</p>
                <p className="mt-1 text-base text-ink">{entry.policy_invoked}</p>
              </div>
            </div>

            {/* Content Section */}
            <div className="space-y-4 rounded-lg border border-line p-6">
              <h2 className="font-display text-lg font-semibold text-ink">Content</h2>

              <div>
                <p className="mb-2 text-sm font-medium text-ink-soft">Input Text</p>
                <p className="whitespace-pre-wrap rounded border border-line bg-paper p-4 text-base text-ink">
                  {entry.input_text}
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-ink-soft">Output Text</p>
                <p className="whitespace-pre-wrap rounded border border-line bg-paper p-4 text-base text-ink">
                  {entry.output_text}
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-ink-soft">Reasoning Summary</p>
                <p className="whitespace-pre-wrap rounded border border-line bg-paper p-4 text-base text-ink">
                  {entry.reasoning_summary}
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-ink-soft">Downstream Action</p>
                <p className="whitespace-pre-wrap rounded border border-line bg-paper p-4 text-base text-ink">
                  {entry.downstream_action}
                </p>
              </div>
            </div>

            {/* Integrity Section */}
            <div className="space-y-4 rounded-lg border border-line border-l-4 border-l-brass bg-brass-tint/40 p-6">
              <h2 className="font-display text-lg font-semibold text-ink">
                Integrity Verification
              </h2>

              <div>
                <p className="mb-2 text-sm font-medium text-ink-soft">Entry Hash (SHA-256)</p>
                <p className="break-all rounded border border-line bg-paper-raised p-3 font-mono text-xs text-ink">
                  {entry.entry_hash}
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-ink-soft">Previous Hash (SHA-256)</p>
                <p className="break-all rounded border border-line bg-paper-raised p-3 font-mono text-xs text-ink">
                  {entry.prev_hash}
                </p>
              </div>

              {entry.parent_decision_id && (
                <div>
                  <p className="mb-2 text-sm font-medium text-ink-soft">Parent Decision ID</p>
                  <p className="break-all font-mono text-xs text-ink">
                    {entry.parent_decision_id}
                  </p>
                </div>
              )}

              <p className="pt-2 text-xs text-ink-soft">
                This entry is part of an immutable hash chain. Each entry&apos;s hash incorporates the
                previous entry&apos;s hash, creating a tamper-evident audit trail.
              </p>
            </div>

            {/* Footer */}
            <div className="mt-10 border-t border-line pt-6 text-center text-sm text-ink-soft">
              <p>Generated: {new Date().toLocaleString()} UTC</p>
              <p className="mt-2 text-xs">
                This certificate is generated from immutable audit records. Suitable for sharing with
                outside counsel and regulatory bodies.
              </p>
              <button
                onClick={() => window.print()}
                className="no-print mt-4 rounded bg-ink px-4 py-2 text-sm font-medium text-paper-raised transition-colors hover:bg-ink-2"
              >
                Print / Export as PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
          }
          .certificate-document,
          .certificate-inner,
          .certificate-seal {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .certificate-document {
            border-color: #c3cad9;
            padding: 0;
          }
          .certificate-inner {
            border-color: #c3cad9;
            padding: 2rem;
          }
          button,
          .no-print {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
