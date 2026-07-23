import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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

export function AuditTrail() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [verifyResult, setVerifyResult] = useState<{
    valid: boolean
    broken_at_decision_id?: string
  } | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [filterSourceType, setFilterSourceType] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [error, setError] = useState('')
  const [reviews, setReviews] = useState<Record<string, AuditEntry[]>>({})
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [reviewComment, setReviewComment] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const { token } = useAuth()

  useEffect(() => {
    loadEntries()
  }, [])

  // Refresh when switching back to this tab / window so new chat logs appear
  useEffect(() => {
    const onFocus = () => loadEntries()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [token])

  const loadEntries = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch('http://localhost:8000/api/audit-logs?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Failed to load entries')
      const data = await response.json()
      setEntries(data)
      await hydrateReviewsFromEntries(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entries')
    } finally {
      setIsLoading(false)
    }
  }

  const hydrateReviewsFromEntries = async (loadedEntries: AuditEntry[]) => {
    const reviewEvents = loadedEntries.filter(
      (entry) => entry.source_type === 'review_event' && entry.parent_decision_id
    )

    const grouped: Record<string, AuditEntry[]> = {}
    for (const review of reviewEvents) {
      const parentId = review.parent_decision_id!
      if (!grouped[parentId]) grouped[parentId] = []
      grouped[parentId].push(review)
    }

    setReviews((prev) => ({ ...prev, ...grouped }))
  }

  const loadReviews = async (decisionId: string) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/audit-logs/${decisionId}/reviews`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.ok) {
        const data = await response.json()
        setReviews((prev) => ({ ...prev, [decisionId]: data }))
      }
    } catch (err) {
      console.error('Failed to load reviews:', err)
    }
  }

  const handleExpandRow = (entryId: number, decisionId: string) => {
    if (expandedId === entryId) {
      setExpandedId(null)
      setReviewingId(null)
    } else {
      setExpandedId(entryId)
      loadReviews(decisionId)
      setReviewingId(null)
      setReviewComment('')
    }
  }

  const submitReview = async (decisionId: string, status: 'approved' | 'flagged') => {
    if (!reviewComment.trim()) {
      setError('Please enter a comment')
      return
    }

    setIsSubmittingReview(true)
    setError('')

    try {
      const response = await fetch(
        `http://localhost:8000/api/audit-logs/${decisionId}/review`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status, comment: reviewComment }),
        }
      )

      if (!response.ok) throw new Error('Failed to submit review')

      setReviewComment('')
      setReviewingId(null)
      await loadReviews(decisionId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const verifyChain = async () => {
    setIsVerifying(true)
    setError('')
    try {
      const response = await fetch('http://localhost:8000/api/audit-logs/verify', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Failed to verify chain')
      const data = await response.json()
      setVerifyResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify chain')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleExport = async (format: 'json' | 'csv') => {
    const params = new URLSearchParams({ format })
    if (filterSourceType) params.append('source_type', filterSourceType)
    if (fromDate) params.append('from_date', fromDate)
    if (toDate) params.append('to_date', toDate)

    try {
      const response = await fetch(
        `http://localhost:8000/api/audit-logs/export?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-trail.${format}`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    }
  }

  const filteredEntries = entries
    .filter((entry) => entry.source_type !== 'review_event')
    .filter((entry) => {
      const matchesSearch =
        !searchText ||
        entry.input_text.toLowerCase().includes(searchText.toLowerCase()) ||
        entry.output_text.toLowerCase().includes(searchText.toLowerCase()) ||
        entry.downstream_action.toLowerCase().includes(searchText.toLowerCase())

      const matchesSourceType =
        !filterSourceType || entry.source_type === filterSourceType

      const matchesFromDate = !fromDate || entry.timestamp_utc >= fromDate
      const matchesToDate = !toDate || entry.timestamp_utc <= toDate

      return matchesSearch && matchesSourceType && matchesFromDate && matchesToDate
    })

  const sourceTypes = Array.from(
    new Set(entries.filter((e) => e.source_type !== 'review_event').map((e) => e.source_type))
  )

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts)
    return date.toLocaleString().replace(/\b(am|pm)\b/g, (match) => match.toUpperCase())
  }

  const truncateText = (text: string, maxLen: number = 60) => {
    return text.length > maxLen ? text.slice(0, maxLen) + '…' : text
  }

  const reviewedDecisionIds = useMemo(() => {
    return new Set(
      entries
        .filter((entry) => entry.source_type === 'review_event' && entry.parent_decision_id)
        .map((entry) => entry.parent_decision_id as string)
    )
  }, [entries])

  const getReviewStatus = (decisionId: string) => {
    if (reviewedDecisionIds.has(decisionId)) return true
    return (reviews[decisionId] || []).length > 0
  }

  const isBrokenChainEntry = (decisionId: string) =>
    verifyResult?.valid === false && verifyResult.broken_at_decision_id === decisionId

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      {/* Controls toolbar */}
      <div className="shrink-0 space-y-4 rounded-lg border border-line bg-paper p-4">
        <div className="flex flex-wrap items-start gap-2">
          <button
            onClick={loadEntries}
            disabled={isLoading}
            className="rounded border border-line bg-paper-raised px-4 py-2 font-medium text-ink transition-colors hover:bg-paper disabled:opacity-50"
          >
            {isLoading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            onClick={verifyChain}
            disabled={isVerifying}
            className="rounded bg-ink px-4 py-2 font-medium text-paper-raised transition-colors hover:bg-ink-2 disabled:opacity-50"
          >
            {isVerifying ? 'Verifying…' : 'Verify Chain Integrity'}
          </button>

          {verifyResult && (
            <div
              className={`min-w-[12rem] flex-1 rounded px-4 py-2 text-sm font-medium ${
                verifyResult.valid
                  ? 'border border-brass/25 bg-brass-tint text-brass-dark'
                  : 'border border-rust/20 bg-rust-tint text-rust'
              }`}
            >
              {verifyResult.valid ? (
                <span>✅ Chain verified — {filteredEntries.length} entries, no tampering detected</span>
              ) : (
                <span>
                  ❌ Chain broken at entry {verifyResult.broken_at_decision_id} — do not trust
                  records after this point
                </span>
              )}
            </div>
          )}
        </div>

        <p className="text-xs text-ink-soft">
          <span className="mr-3 inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full border-2 border-line-strong bg-paper-raised" />
            Unreviewed
          </span>
          <span className="mr-3 inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full border-2 border-brass bg-brass/20" />
            Reviewed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full border-2 border-rust bg-rust/10" />
            Chain break
          </span>
        </p>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Search (input/output)
              </label>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Filter by text…"
                className="w-full rounded border border-line bg-paper-raised px-3 py-2 text-sm text-ink focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/30"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Source Type
              </label>
              <select
                value={filterSourceType}
                onChange={(e) => setFilterSourceType(e.target.value)}
                className="w-full rounded border border-line bg-paper-raised px-3 py-2 text-sm text-ink focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/30"
              >
                <option value="">All types</option>
                {sourceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                From Date
              </label>
              <input
                type="datetime-local"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded border border-line bg-paper-raised px-3 py-2 text-sm text-ink focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/30"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                To Date
              </label>
              <input
                type="datetime-local"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded border border-line bg-paper-raised px-3 py-2 text-sm text-ink focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/30"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleExport('json')}
              className="rounded border border-line bg-paper-raised px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper"
            >
              Export JSON
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="rounded border border-line bg-paper-raised px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="shrink-0 rounded border border-rust/20 bg-rust-tint px-4 py-2 text-sm text-rust">
          {error}
        </div>
      )}

      {/* Ledger entries */}
      <div className="min-h-0 flex-1 overflow-y-auto pl-1">
        {isLoading ? (
          <p className="px-2 py-4 text-sm text-ink-soft">Loading entries…</p>
        ) : filteredEntries.length === 0 ? (
          <p className="px-2 py-4 text-sm text-ink-soft">No entries found</p>
        ) : (
          <div className="relative space-y-0 pb-2">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-4 bottom-4 left-[11px] w-px bg-line"
            />
            {filteredEntries.map((entry, index) => {
              const isLast = index === filteredEntries.length - 1
              const isExpanded = expandedId === entry.id
              const isReviewed = getReviewStatus(entry.decision_id)
              const isBroken = isBrokenChainEntry(entry.decision_id)

              return (
                <div key={entry.id} className="relative flex gap-4">
                  <div className="relative flex w-6 shrink-0 justify-center">
                    {!isLast && (
                      <div
                        aria-hidden="true"
                        className="absolute top-6 bottom-0 left-1/2 w-px -translate-x-1/2 bg-line"
                      />
                    )}
                    <div
                      aria-hidden="true"
                      className={`relative z-10 mt-3 h-3 w-3 shrink-0 rounded-full border-2 bg-paper-raised ${
                        isBroken
                          ? 'border-rust bg-rust/15'
                          : isReviewed
                            ? 'border-brass bg-brass/25'
                            : 'border-line-strong'
                      }`}
                    />
                  </div>

                  <div className="min-w-0 flex-1 pb-3">
                    <div className="rounded-lg border border-line bg-paper-raised transition-shadow hover:shadow-sm">
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() => handleExpandRow(entry.id, entry.decision_id)}
                        className="flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-paper/60"
                      >
                        <span className="min-w-0 flex-1 space-y-1.5">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-ink-soft">
                              {formatTimestamp(entry.timestamp_utc)}
                            </span>
                            <span className="font-medium text-ink">{entry.user_display_name}</span>
                            <span className="rounded-full bg-line px-2 py-0.5 text-xs font-medium text-ink">
                              {entry.source_type}
                            </span>
                            <Link
                              to={`/certificate/${entry.decision_id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-full bg-paper px-2 py-0.5 font-mono text-xs text-ink-soft transition-colors hover:bg-line hover:text-ink"
                            >
                              {entry.decision_id.slice(0, 8)}…
                            </Link>
                          </span>
                          <span className="block text-sm text-ink-soft">
                            <span className="text-ink-soft/80">{entry.ai_system}</span>
                            {' · '}
                            in: {truncateText(entry.input_text || entry.downstream_action, 40)}
                            {entry.source_type === 'chat_console' && entry.output_text && (
                              <>
                                {' '}
                                → out: {truncateText(entry.output_text, 40)}
                              </>
                            )}
                          </span>
                        </span>

                        <span className="flex shrink-0 items-center gap-2 self-center">
                          {isReviewed && (
                            <span className="rounded-full bg-emerald-tint px-2 py-0.5 text-xs font-medium text-emerald">
                              ✓ Reviewed
                            </span>
                          )}
                          {isBroken && (
                            <span className="rounded-full bg-rust-tint px-2 py-0.5 text-xs font-medium text-rust">
                              Broken
                            </span>
                          )}
                          <svg
                            aria-hidden="true"
                            className={`h-4 w-4 text-ink-soft transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
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
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="mx-4 mb-4 space-y-3 border-l-4 border-line-strong border-t border-line pt-3 pl-4 text-sm">
                          {/* Entry Details */}
                          <div className="space-y-1.5 border-b border-line pb-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs text-ink-soft">Decision ID:</span>{' '}
                              <Link
                                to={`/certificate/${entry.decision_id}`}
                                className="font-mono break-all text-ink underline decoration-line-strong underline-offset-2 hover:text-ink-2"
                              >
                                {entry.decision_id}
                              </Link>
                              <Link
                                to={`/certificate/${entry.decision_id}`}
                                className="rounded border border-line bg-paper px-2 py-0.5 text-xs font-medium text-ink transition-colors hover:bg-paper-raised"
                              >
                                View certificate
                              </Link>
                            </div>
                            <div>
                              <span className="font-mono text-xs text-ink-soft">Timestamp:</span>{' '}
                              <span className="font-body text-ink">
                                {formatTimestamp(entry.timestamp_utc)}
                              </span>
                            </div>
                            <div>
                              <span className="font-mono text-xs text-ink-soft">User:</span>{' '}
                              <span className="font-body text-ink">
                                {entry.user_display_name} ({entry.user_id})
                              </span>
                            </div>
                            <div>
                              <span className="font-mono text-xs text-ink-soft">AI System:</span>{' '}
                              <span className="font-body text-ink">{entry.ai_system}</span>
                            </div>
                            <div>
                              <span className="font-mono text-xs text-ink-soft">Model Version:</span>{' '}
                              <span className="font-body text-ink">{entry.model_version}</span>
                            </div>
                            <div>
                              <span className="font-mono text-xs text-ink-soft">Source Type:</span>{' '}
                              <span className="font-body text-ink">{entry.source_type}</span>
                            </div>
                            <div>
                              <span className="font-mono text-xs text-ink-soft">Input Source:</span>{' '}
                              <span className="font-body text-ink">{entry.input_source}</span>
                            </div>
                            <div>
                              <span className="font-mono text-xs text-ink-soft">Policy Invoked:</span>{' '}
                              <span className="font-body text-ink">{entry.policy_invoked}</span>
                            </div>
                            <div>
                              <span className="font-mono text-xs text-ink-soft">Input Text:</span>{' '}
                              <span className="font-body break-words text-ink">{entry.input_text}</span>
                            </div>
                            <div>
                              <span className="font-mono text-xs text-ink-soft">Output Text:</span>{' '}
                              <span className="font-body break-words text-ink">{entry.output_text}</span>
                            </div>
                            <div>
                              <span className="font-mono text-xs text-ink-soft">Reasoning:</span>{' '}
                              <span className="font-body break-words text-ink">
                                {entry.reasoning_summary}
                              </span>
                            </div>
                            <div>
                              <span className="font-mono text-xs text-ink-soft">Downstream Action:</span>{' '}
                              <span className="font-body text-ink">{entry.downstream_action}</span>
                            </div>
                            {entry.parent_decision_id && (
                              <div>
                                <span className="font-mono text-xs text-ink-soft">Parent Decision:</span>{' '}
                                <span className="font-body break-all text-ink">
                                  {entry.parent_decision_id}
                                </span>
                              </div>
                            )}
                            <div>
                              <span className="font-mono text-xs text-ink-soft">Integrity Hash:</span>{' '}
                              <span className="font-body break-all text-xs text-ink">
                                {entry.entry_hash}
                              </span>
                            </div>
                            <div>
                              <span className="font-mono text-xs text-ink-soft">Previous Hash:</span>{' '}
                              <span className="font-body break-all text-xs text-ink">
                                {entry.prev_hash}
                              </span>
                            </div>
                          </div>

                          {/* Reviews Section */}
                          {(reviews[entry.decision_id] || []).length > 0 && (
                            <div className="space-y-2 border-b border-line pb-3">
                              <p className="font-mono text-xs font-semibold text-ink-soft">Reviews:</p>
                              {(reviews[entry.decision_id] || []).map((review) => {
                                const isApproved = review.downstream_action.includes('approved')
                                return (
                                  <div key={review.id} className="space-y-1 pl-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      {isApproved ? (
                                        <span className="rounded-full bg-emerald-tint px-2 py-0.5 text-xs font-medium text-emerald">
                                          ✓ Approved
                                        </span>
                                      ) : (
                                        <span className="rounded-full bg-rust-tint px-2 py-0.5 text-xs font-medium text-rust">
                                          🚩 Flagged
                                        </span>
                                      )}
                                      <span className="font-body text-sm text-ink-soft">
                                        by {review.user_display_name}
                                      </span>
                                    </div>
                                    <div className="font-body break-words text-ink">
                                      {review.output_text}
                                    </div>
                                    <div className="font-mono text-xs text-ink-soft">
                                      {formatTimestamp(review.timestamp_utc)}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {/* Review Input */}
                          {!isReviewed && (
                            <div className="space-y-1 pt-1">
                              {reviewingId === entry.decision_id ? (
                                <div className="space-y-1">
                                  <textarea
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    placeholder="Enter review comment…"
                                    className="w-full resize-none rounded border border-line bg-paper px-2 py-1 text-xs text-ink focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/30"
                                    rows={2}
                                  />
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() =>
                                        submitReview(entry.decision_id, 'approved')
                                      }
                                      disabled={isSubmittingReview || !reviewComment.trim()}
                                      className="rounded bg-emerald px-2 py-0.5 text-xs font-medium text-paper-raised transition-colors hover:bg-emerald/90 disabled:opacity-50"
                                    >
                                      ✓ Approve
                                    </button>
                                    <button
                                      onClick={() =>
                                        submitReview(entry.decision_id, 'flagged')
                                      }
                                      disabled={isSubmittingReview || !reviewComment.trim()}
                                      className="rounded bg-rust px-2 py-0.5 text-xs font-medium text-paper-raised transition-colors hover:bg-rust/90 disabled:opacity-50"
                                    >
                                      🚩 Flag
                                    </button>
                                    <button
                                      onClick={() => {
                                        setReviewingId(null)
                                        setReviewComment('')
                                      }}
                                      className="rounded border border-line bg-paper px-2 py-0.5 text-xs text-ink transition-colors hover:bg-paper-raised"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setReviewingId(entry.decision_id)}
                                  className="text-xs text-ink-soft underline transition-colors hover:text-ink"
                                >
                                  Add review…
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <p className="shrink-0 text-sm text-ink-soft">
        Showing {filteredEntries.length} of {entries.filter(e => e.source_type !== 'review_event').length} entries
      </p>
    </div>
  )
}
