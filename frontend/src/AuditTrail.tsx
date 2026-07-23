import { useEffect, useState } from 'react'
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entries')
    } finally {
      setIsLoading(false)
    }
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
    return date.toLocaleString()
  }

  const truncateText = (text: string, maxLen: number = 60) => {
    return text.length > maxLen ? text.slice(0, maxLen) + '…' : text
  }

  const getReviewStatus = (decisionId: string) => {
    const entryReviews = reviews[decisionId] || []
    return entryReviews.length > 0
  }

  return (
    <div className="w-full space-y-4">
      {/* Verify Chain Button and Status */}
      <div className="flex gap-2 items-start">
        <button
          onClick={loadEntries}
          disabled={isLoading}
          className="px-4 py-2 bg-slate-100 text-slate-900 rounded font-medium hover:bg-slate-200 disabled:bg-slate-50"
        >
          {isLoading ? 'Refreshing…' : 'Refresh'}
        </button>
        <button
          onClick={verifyChain}
          disabled={isVerifying}
          className="px-4 py-2 bg-slate-900 text-white rounded font-medium hover:bg-slate-800 disabled:bg-slate-400"
        >
          {isVerifying ? 'Verifying…' : 'Verify Chain Integrity'}
        </button>

        {verifyResult && (
          <div
            className={`flex-1 px-4 py-2 rounded text-sm font-medium ${
              verifyResult.valid
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
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

      {error && (
        <div className="px-4 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3 bg-white p-4 rounded-lg border border-slate-200">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Search (input/output)
            </label>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Filter by text…"
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Source Type
            </label>
            <select
              value={filterSourceType}
              onChange={(e) => setFilterSourceType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
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
            <label className="block text-sm font-medium text-slate-700 mb-1">
              From Date
            </label>
            <input
              type="datetime-local"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              To Date
            </label>
            <input
              type="datetime-local"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleExport('json')}
            className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded font-medium"
          >
            Export JSON
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded font-medium"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Log Console */}
      <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-sm overflow-auto max-h-96 space-y-1 border border-slate-700">
        {isLoading ? (
          <p className="text-slate-400">Loading entries…</p>
        ) : filteredEntries.length === 0 ? (
          <p className="text-slate-400">No entries found</p>
        ) : (
          filteredEntries.map((entry) => (
            <div key={entry.id}>
              <button
                onClick={() => handleExpandRow(entry.id, entry.decision_id)}
                className="w-full text-left hover:bg-slate-800 px-2 py-1 rounded transition-colors cursor-pointer flex items-center justify-between"
              >
                <span>
                  <span className="text-slate-400">[{formatTimestamp(entry.timestamp_utc)}]</span>{' '}
                  <span className="text-green-300">{entry.user_display_name}</span> |{' '}
                  <span className="text-blue-300">{entry.ai_system}</span> |{' '}
                  <span className="text-yellow-300">{entry.source_type}</span> |{' '}
                  <span className="text-slate-300">
                    in: {truncateText(entry.input_text || entry.downstream_action, 40)}
                  </span>
                  {entry.source_type === 'chat_console' && entry.output_text && (
                    <span className="text-cyan-300">
                      {' '}
                      → out: {truncateText(entry.output_text, 40)}
                    </span>
                  )}
                </span>
                {getReviewStatus(entry.decision_id) && (
                  <span className="text-green-400 text-xs ml-2">✓ Reviewed</span>
                )}
              </button>

              {expandedId === entry.id && (
                <div className="bg-slate-800 mt-1 p-3 rounded text-slate-100 space-y-2 text-xs border-l-2 border-slate-600 ml-2">
                  {/* Entry Details */}
                  <div className="space-y-1 pb-2 border-b border-slate-700">
                    <div>
                      <span className="text-slate-400">Decision ID:</span>{' '}
                      <span className="text-slate-200 font-mono">{entry.decision_id}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Timestamp:</span>{' '}
                      <span className="text-slate-200">{entry.timestamp_utc}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">User:</span>{' '}
                      <span className="text-slate-200">
                        {entry.user_display_name} ({entry.user_id})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">AI System:</span>{' '}
                      <span className="text-slate-200">{entry.ai_system}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Model Version:</span>{' '}
                      <span className="text-slate-200">{entry.model_version}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Source Type:</span>{' '}
                      <span className="text-slate-200">{entry.source_type}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Input Source:</span>{' '}
                      <span className="text-slate-200">{entry.input_source}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Policy Invoked:</span>{' '}
                      <span className="text-slate-200">{entry.policy_invoked}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Input Text:</span>{' '}
                      <span className="text-slate-200 break-words">{entry.input_text}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Output Text:</span>{' '}
                      <span className="text-slate-200 break-words">{entry.output_text}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Reasoning:</span>{' '}
                      <span className="text-slate-200 break-words">{entry.reasoning_summary}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Downstream Action:</span>{' '}
                      <span className="text-slate-200">{entry.downstream_action}</span>
                    </div>
                    {entry.parent_decision_id && (
                      <div>
                        <span className="text-slate-400">Parent Decision:</span>{' '}
                        <span className="text-slate-200 font-mono">{entry.parent_decision_id}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-400">Integrity Hash:</span>{' '}
                      <span className="text-slate-200 font-mono text-xs break-all">
                        {entry.entry_hash}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Previous Hash:</span>{' '}
                      <span className="text-slate-200 font-mono text-xs break-all">
                        {entry.prev_hash}
                      </span>
                    </div>
                  </div>

                  {/* Reviews Section */}
                  {(reviews[entry.decision_id] || []).length > 0 && (
                    <div className="space-y-1 pb-2 border-b border-slate-700">
                      <p className="text-slate-400 font-semibold">Reviews:</p>
                      {(reviews[entry.decision_id] || []).map((review) => {
                        const isApproved = review.downstream_action.includes('approved')
                        return (
                          <div key={review.id} className="pl-2 space-y-0.5">
                            <div className="flex items-center gap-1">
                              {isApproved ? (
                                <span className="text-green-400">✓ Approved</span>
                              ) : (
                                <span className="text-red-400">🚩 Flagged</span>
                              )}
                              <span className="text-slate-400">by {review.user_display_name}</span>
                            </div>
                            <div className="text-slate-300 break-words">
                              {review.output_text}
                            </div>
                            <div className="text-slate-500">
                              {formatTimestamp(review.timestamp_utc)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Review Input */}
                  {!getReviewStatus(entry.decision_id) && (
                    <div className="space-y-1 pt-1">
                      {reviewingId === entry.decision_id ? (
                        <div className="space-y-1">
                          <textarea
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Enter review comment…"
                            className="w-full px-2 py-1 bg-slate-700 text-slate-100 border border-slate-600 rounded text-xs resize-none"
                            rows={2}
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() =>
                                submitReview(entry.decision_id, 'approved')
                              }
                              disabled={isSubmittingReview || !reviewComment.trim()}
                              className="px-2 py-0.5 text-xs bg-green-600 hover:bg-green-500 disabled:bg-slate-600 rounded text-white font-medium"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() =>
                                submitReview(entry.decision_id, 'flagged')
                              }
                              disabled={isSubmittingReview || !reviewComment.trim()}
                              className="px-2 py-0.5 text-xs bg-red-600 hover:bg-red-500 disabled:bg-slate-600 rounded text-white font-medium"
                            >
                              🚩 Flag
                            </button>
                            <button
                              onClick={() => {
                                setReviewingId(null)
                                setReviewComment('')
                              }}
                              className="px-2 py-0.5 text-xs bg-slate-700 hover:bg-slate-600 rounded text-white"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReviewingId(entry.decision_id)}
                          className="text-xs text-slate-400 hover:text-slate-200 underline"
                        >
                          Add review…
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <p className="text-sm text-slate-500">
        Showing {filteredEntries.length} of {entries.filter(e => e.source_type !== 'review_event').length} entries
      </p>
    </div>
  )
}
