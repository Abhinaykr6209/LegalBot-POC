import { useEffect, useRef, useState } from 'react'
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

export function ChatConsole() {
  const { token, user } = useAuth()
  const userId = user?.id ?? 'anonymous'
  const [messages, setMessages] = useState<Message[]>(() => loadMessages(userId))
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
    scrollToBottom()
  }, [messages])

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
    <div className="w-full max-w-2xl mx-auto flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && !error && (
          <div className="flex items-center justify-center h-full text-slate-400">
            <p>Start a conversation</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-sm px-4 py-3 rounded-2xl ${
                message.type === 'user'
                  ? 'bg-slate-900 text-white rounded-br-none'
                  : 'bg-slate-200 text-slate-900 rounded-bl-none'
              }`}
            >
              <p className="text-sm break-words">{message.text}</p>
              {message.type === 'ai' && message.decisionId && (
                <p className="text-xs text-slate-500 mt-2 font-mono">
                  Logged: {message.decisionId.slice(0, 8)}...
                </p>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-200 text-slate-900 px-4 py-3 rounded-2xl rounded-bl-none">
              <p className="text-sm text-slate-500">Thinking…</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="px-6 py-3 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="border-t border-slate-200 p-6">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg resize-none disabled:bg-slate-100 disabled:text-slate-400"
            rows={3}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed h-fit"
          >
            {isLoading ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
