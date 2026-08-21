import { useEffect, useRef, useState } from 'react'
import { Bot, MessageSquare, Send, Sparkles } from 'lucide-react'
import { api } from '../api/client'

const SUGGESTIONS = [
  'What should I do this week?',
  'Summarize prior advising',
  'Draft an outreach message',
]

export default function StudentRagChat({ student }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const historyRef = useRef(null)
  const endRef = useRef(null)
  const autoScrollRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    autoScrollRef.current = false
    setLoading(true)
    setError('')
    api
      .getRagChat(student.id)
      .then((data) => {
        if (!cancelled) setMessages(data.messages ?? [])
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? 'Unable to load advising chat.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [student.id])

  useEffect(() => {
    if (!autoScrollRef.current) return
    const container = historyRef.current
    if (!container) return
    container.scrollTop = container.scrollHeight
  }, [messages, sending])

  async function sendQuestion(question) {
    const text = String(question ?? '').trim()
    if (!text || sending) return
    autoScrollRef.current = true
    setSending(true)
    setError('')
    setInput('')
    setMessages((current) => [...current, { role: 'user', content: text, createdAt: new Date().toISOString() }])
    try {
      const data = await api.askRagChat(student.id, text)
      setMessages(data.messages ?? [])
    } catch (err) {
      setError(err.message ?? 'Unable to generate a recommendation.')
    } finally {
      setSending(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    sendQuestion(input)
  }

  return (
    <div className="rag-chat">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B6E4F] to-[#064E3B] text-white shadow-sm">
          <Sparkles size={17} aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-text-primary">Personalized RAG advisor</h3>
          <p className="mt-0.5 text-sm text-text-secondary">
            Ask questions about {student.name}. Answers use live metrics and this student&apos;s advising history.
          </p>
        </div>
      </div>

      <div className="rag-chat-panel mt-5 overflow-hidden rounded-xl border border-border">
        <div className="flex items-center justify-between gap-2 border-b border-border bg-[#F9FAFB] px-4 py-2.5">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Conversation</h4>
          {!loading && messages.length > 0 ? (
            <span className="text-xs text-text-muted">{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
          ) : null}
        </div>

        <div ref={historyRef} className="rag-chat-history max-h-80 space-y-3 overflow-y-auto bg-[#F8FAFC] p-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Bot size={16} aria-hidden="true" />
              Loading advising history…
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-text-secondary">
              No messages yet. Type a question below to start advising for {student.name}.
            </p>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${message.createdAt}-${index}`}
                className={[
                  'max-w-[95%] rounded-xl px-3.5 py-2.5 text-sm whitespace-pre-wrap',
                  message.role === 'user'
                    ? 'ml-auto bg-[#0B6E4F] text-white shadow-sm'
                    : 'bg-white text-text-primary shadow-sm ring-1 ring-border',
                ].join(' ')}
              >
                <span
                  className={[
                    'mb-1 block text-[10px] font-semibold uppercase tracking-wide',
                    message.role === 'user' ? 'text-white/75' : 'text-primary-600',
                  ].join(' ')}
                >
                  {message.role === 'user' ? 'You' : 'Advisor'}
                </span>
                {message.content}
              </div>
            ))
          )}
          {sending ? (
            <p className="inline-flex items-center gap-2 text-xs text-text-muted">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary-500" />
              Generating a personalized answer…
            </p>
          ) : null}
          <div ref={endRef} />
        </div>

        <div className="rag-chat-compose border-t-2 border-primary-200/40">
          <label htmlFor={`rag-input-${student.id}`} className="rag-chat-compose-label">
            <MessageSquare size={15} aria-hidden="true" />
            Your question
          </label>
          <form onSubmit={handleSubmit} className="mt-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <textarea
                id={`rag-input-${student.id}`}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    sendQuestion(input)
                  }
                }}
                className="rag-chat-textarea min-h-[88px] flex-1 resize-y"
                placeholder={`e.g. What should I focus on this week for ${student.name}?`}
                disabled={sending}
                rows={3}
              />
              <button
                type="submit"
                className="btn-primary rag-chat-send shrink-0 sm:min-w-[7.5rem]"
                disabled={sending || !input.trim()}
              >
                <Send size={16} aria-hidden="true" />
                {sending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </form>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="self-center text-[11px] font-semibold uppercase tracking-wide text-text-muted">Try:</span>
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-800 transition-colors hover:border-primary-300 hover:bg-primary-100"
                onClick={() => sendQuestion(suggestion)}
                disabled={sending}
              >
                {suggestion}
              </button>
            ))}
          </div>

          {error ? <p className="mt-3 text-sm text-risk-critical">{error}</p> : null}
        </div>
      </div>
    </div>
  )
}
