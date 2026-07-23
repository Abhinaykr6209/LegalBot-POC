import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './AuthContext'

type Message = {
  id: string
  type: 'user' | 'ai'
  text: string
  decisionId?: string
}

function storageKey(userId: string) {
  return `chat_console_messages_${userId}`
}

function loadMessages(userId: string): Message[] {
  try {
    const raw = sessionStorage.getItem(storageKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function formatMessageTime(id: string) {
  const ts = Number(id.replace('msg-', ''))
  if (!Number.isFinite(ts)) return ''
  return new Date(ts)
    .toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    .replace(/\b(am|pm)\b/g, (match) => match.toUpperCase())
}

function EmptyStateIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-10 w-10 text-line-strong"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 12a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4h-10l-6 4v-4H12a4 4 0 0 1-4-4v-8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ChatConsole() {
  const { token, user } = useAuth()
  const userId = user?.id ?? 'anonymous'
  const [messages, setMessages] = useState<Message[]>(() => loadMessages(userId))
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [isShort, setIsShort] = useState(true)

  useEffect(() => {
    setMessages(loadMessages(userId))
  }, [userId])

  useEffect(() => {
    sessionStorage.setItem(storageKey(userId), JSON.stringify(messages))
  }, [messages, userId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const updateLayout = () => {
      setIsShort(container.scrollHeight <= container.clientHeight)
    }

    updateLayout()
    const observer = new ResizeObserver(updateLayout)
    observer.observe(container)

    return () => observer.disconnect()
  }, [messages, isLoading, error])

  useEffect(() => {
    if (!isShort) {
      scrollToBottom()
    }
  }, [messages, isLoading, isShort])

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setError('')
    setIsLoading(true)

    const userMsgId = `msg-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        type: 'user',
        text: userMessage,
      },
    ])

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage,
          policy_id: 'general_assistant_v1',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to get response')
      }

      const data = await response.json()

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          type: 'ai',
          text: data.reply,
          decisionId: data.decision_id,
        },
      ])
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to send message'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <header className="w-full shrink-0 border-b border-line bg-paper px-6 py-3">
        <h2 className="font-semibold text-ink">Chat Console</h2>
        <p className="text-xs text-ink-soft">
          Every message and response is logged to the audit trail
        </p>
      </header>

      <div
        ref={messagesContainerRef}
        className="min-h-0 w-full flex-1 overflow-y-auto bg-paper"
      >
        <div
          className={`flex min-h-full w-full flex-col space-y-4 p-6 ${
            isShort ? 'justify-center' : ''
          }`}
        >
          {messages.length === 0 && !error && !isLoading && (
            <div className="flex w-full flex-col items-center justify-center gap-3 text-center text-ink-soft">
              <EmptyStateIcon />
              <p className="text-sm">Start a conversation</p>
            </div>
          )}

          {messages.map((message) => {
            const messageTime = formatMessageTime(message.id)

            return (
            <div
              key={message.id}
              className={`flex w-full flex-col ${
                message.type === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-sm px-5 py-3.5 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-ink text-paper-raised rounded-br-none'
                    : 'rounded-bl-none border border-line bg-paper-raised text-ink shadow-sm'
                }`}
              >
                <p className="text-sm break-words">{message.text}</p>
                {message.type === 'ai' && message.decisionId && (
                  <Link
                    to={`/certificate/${message.decisionId}`}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brass-tint px-2 py-0.5 text-xs font-medium text-brass-dark transition-colors hover:bg-brass/20"
                  >
                    <svg
                      aria-hidden="true"
                      className="h-3 w-3 shrink-0"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="6" cy="6" r="4.75" stroke="currentColor" strokeWidth="1" />
                      <path
                        d="M3.75 6l1.25 1.25 2.75-2.75"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="font-mono">{message.decisionId.slice(0, 8)}…</span>
                  </Link>
                )}
              </div>
              {messageTime && (
                <span className="mt-1 font-mono text-xs text-ink-soft">{messageTime}</span>
              )}
            </div>
            )
          })}

          {isLoading && (
            <div className="flex w-full flex-col items-start">
              <div className="max-w-sm rounded-2xl rounded-bl-none border border-line bg-paper-raised px-5 py-3.5 text-ink shadow-sm">
                <p className="text-sm text-ink-soft">Thinking…</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {error && (
        <div className="w-full shrink-0 border-t border-rust/20 bg-rust-tint px-6 py-3">
          <p className="text-sm text-rust">{error}</p>
        </div>
      )}

      <div className="w-full shrink-0 border-t border-line bg-paper-raised p-6">
        <div className="flex w-full gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="flex-1 resize-none rounded-lg border border-line px-4 py-3 text-ink transition-shadow focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/30 disabled:bg-paper disabled:text-ink-soft"
            rows={3}
          />
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="h-fit rounded-lg bg-ink px-6 py-3 font-medium text-paper-raised transition-colors hover:bg-ink-2 disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-ink-soft disabled:hover:bg-line-strong"
          >
            {isLoading ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
