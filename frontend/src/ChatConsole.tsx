import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldCheck, Lock, FileText, Send, Sparkles, 
  Paperclip, Loader2, CheckCircle2, ShieldAlert
} from 'lucide-react'
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
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40">
      
      {/* Conversation Header */}
      <header className="flex w-full shrink-0 items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Secure Audit Console</h2>
            <div className="mt-0.5 flex items-center gap-2 text-xs font-medium text-slate-500">
              <Lock className="h-3 w-3" />
              <span>End-to-end encrypted</span>
              <span className="h-1 w-1 rounded-full bg-slate-300"></span>
              <span>Model: General_Assistant_v1</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full border border-[#C8A96A]/30 bg-[#C8A96A]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#9E7A3B]">
            <ShieldCheck className="h-3.5 w-3.5" /> 
            Audit Logging Active
          </span>
        </div>
      </header>

      {/* Chat Messages Area */}
      <div
        ref={messagesContainerRef}
        className="min-h-0 w-full flex-1 overflow-y-auto bg-slate-50/50 p-6"
      >
        <div className={`mx-auto flex min-h-full w-full max-w-4xl flex-col space-y-6 ${isShort ? 'justify-center' : ''}`}>
          
          {/* Enterprise Empty State */}
          {messages.length === 0 && !error && !isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex w-full flex-col items-center justify-center text-center"
            >
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                <ShieldCheck className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Start a Secure Conversation</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                Every AI interaction is automatically verified, audited, and protected with cryptographic integrity.
              </p>
            </motion.div>
          )}

          {/* Messages */}
          <AnimatePresence initial={false}>
            {messages.map((message) => {
              const messageTime = formatMessageTime(message.id)

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex w-full flex-col ${message.type === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {message.type === 'user' ? (
                    // User Message Bubble
                    <div className="group relative max-w-2xl rounded-2xl rounded-tr-sm bg-gradient-to-br from-blue-600 to-blue-700 px-5 py-3.5 text-white shadow-md shadow-blue-900/10 transition-shadow hover:shadow-lg">
                      <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed tracking-wide">
                        {message.text}
                      </p>
                      {messageTime && (
                        <span className="mt-1.5 block text-right text-[10px] font-medium text-blue-100 opacity-80">
                          {messageTime}
                        </span>
                      )}
                    </div>
                  ) : (
                    // Enterprise AI Response Card
                    <div className="flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl rounded-tl-sm border border-slate-200/80 bg-white/70 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
                      
                      {/* AI Card Header */}
                      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-2.5">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                            AI Assistant
                          </span>
                          <span className="h-3 w-px bg-slate-300"></span>
                          <span className="flex items-center gap-1 font-semibold text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Verified
                          </span>
                          <span className="flex items-center gap-1 rounded bg-slate-200/50 px-1.5 py-0.5 font-medium text-slate-600">
                            <Lock className="h-3 w-3" />
                            SHA-256 Protected
                          </span>
                        </div>
                      </div>
                      
                      {/* AI Card Content */}
                      <div className="px-5 py-4">
                        <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-slate-800">
                          {message.text}
                        </p>
                      </div>

                      {/* AI Card Audit Footer */}
                      {message.decisionId && (
                        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/80 px-5 py-3">
                          <div className="flex items-center gap-4 text-[11px] font-medium text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <span className="uppercase tracking-wider text-slate-400">Decision ID</span>
                              <span className="font-mono text-slate-700">{message.decisionId}</span>
                            </div>
                            <div className="hidden h-3 w-px bg-slate-300 sm:block"></div>
                            <div className="hidden items-center gap-1.5 sm:flex">
                              <span className="uppercase tracking-wider text-slate-400">Integrity</span>
                              <span className="text-emerald-600">Intact</span>
                            </div>
                            <div className="hidden h-3 w-px bg-slate-300 sm:block"></div>
                            <span className="hidden sm:block">{messageTime}</span>
                          </div>
                          
                          <Link
                            to={`/certificate/${message.decisionId}`}
                            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-blue-300 hover:text-blue-600"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Export Certificate
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Premium Loading State */}
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl rounded-tl-sm border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-xl"
            >
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-sm font-semibold text-slate-700">Verifying policies & generating response...</span>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-2 w-full animate-pulse rounded-full bg-slate-100"></div>
                <div className="h-2 w-3/4 animate-pulse rounded-full bg-slate-100"></div>
                <div className="h-2 w-1/2 animate-pulse rounded-full bg-slate-100"></div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {error && (
        <div className="flex w-full shrink-0 items-center gap-2 border-t border-red-200 bg-red-50 px-6 py-3 text-sm font-medium text-red-600">
          <ShieldAlert className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Premium Message Composer */}
      <div className="w-full shrink-0 border-t border-slate-200 bg-white p-6">
        <div className="mx-auto max-w-4xl relative">
          <div className="relative flex w-full items-end gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-2 shadow-inner transition-colors focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
            <button className="mb-1 ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600">
              <Paperclip className="h-5 w-5" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              placeholder="Message the secure AI assistant..."
              className="max-h-48 min-h-[44px] w-full resize-none bg-transparent py-2.5 text-[15px] leading-relaxed text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed"
              rows={input.split('\n').length > 1 ? Math.min(input.split('\n').length, 5) : 1}
            />
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="mb-1 mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              <Send className="h-4 w-4 ml-0.5" />
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between px-1">
            <span className="text-xs text-slate-400">Protected by SHA-256 Integrity Hash</span>
            <span className="text-xs font-medium text-slate-400">
              <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans">Shift</kbd> + <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans">Enter</kbd> for new line
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}