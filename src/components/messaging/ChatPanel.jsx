import { useState, useEffect, useRef } from 'react'
import { Send } from 'lucide-react'
import { useMessagingStore } from '../../store/useMessagingStore'
import { format, isToday, isYesterday } from 'date-fns'
import { fr } from 'date-fns/locale'

function timeLabel(dateStr) {
  const d = new Date(dateStr)
  if (isToday(d))     return format(d, 'HH:mm')
  if (isYesterday(d)) return `Hier ${format(d, 'HH:mm')}`
  return format(d, 'd MMM HH:mm', { locale: fr })
}

export default function ChatPanel({ convId, senderType, senderId, senderName }) {
  const messages     = useMessagingStore((s) => s.messages[convId] ?? [])
  const loadMessages = useMessagingStore((s) => s.loadMessages)
  const sendMessage  = useMessagingStore((s) => s.sendMessage)
  const markRead     = useMessagingStore((s) => s.markRead)

  const [text, setText]     = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!convId) return
    loadMessages(convId)
    if (senderType === 'manager') markRead(convId)
  }, [convId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const isMyMessage = (msg) =>
    msg.senderType === senderType &&
    (senderType === 'manager' || msg.senderId === senderId)

  const handleSend = async () => {
    const content = text.trim()
    if (!content || sending) return
    setSending(true)
    setText('')
    await sendMessage(convId, content, senderType, senderId, senderName)
    setSending(false)
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-10">
            Aucun message. Démarrez la conversation !
          </p>
        )}
        {messages.map((msg) => {
          const mine = isMyMessage(msg)
          return (
            <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] flex flex-col gap-0.5 ${mine ? 'items-end' : 'items-start'}`}>
                {!mine && (
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-1">
                    {msg.senderName}
                  </p>
                )}
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  mine
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
                <p className="text-[10px] text-slate-400 px-1">{timeLabel(msg.createdAt)}</p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-slate-100 dark:border-slate-800 p-3 flex gap-2 bg-white dark:bg-slate-900">
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
          }}
          placeholder="Votre message…"
          className="flex-1 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          style={{ maxHeight: 100 }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="self-end p-2.5 bg-primary text-white rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
