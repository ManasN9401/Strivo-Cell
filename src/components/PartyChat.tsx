'use client'

import {
  useEffect, useRef, useState,
} from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id:        string
  user_id:   string
  email:     string
  is_host:   boolean
  text:      string
  sent_at:   number   // Date.now()
}

interface ReactionEvent {
  emoji:   string
  user_id: string
  sent_at: number
}

// Floating reaction that animates up from the bottom
interface FloatingReaction {
  id:    string
  emoji: string
  x:     number   // % from left
}

const REACTIONS = ['👍', '❤️', '😂', '😮']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(email: string) {
  return email.split('@')[0].split(/[._-]/).slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '').join('')
}

function avatarColor(userId: string) {
  const palette = [
    'bg-violet-500', 'bg-blue-500', 'bg-teal-500',
    'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
  ]
  let hash = 0
  for (const ch of userId) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff
  return palette[Math.abs(hash) % palette.length]
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// ─── Component ───────────────────────────────────────────────────────────────

interface PartyChatProps {
  channel:       RealtimeChannel
  currentUserId: string
  userEmail:     string
  isHost:        boolean
  isFullscreen:  boolean
}

export default function PartyChat({
  channel, currentUserId, userEmail, isHost, isFullscreen,
}: PartyChatProps) {
  const [messages,  setMessages]  = useState<ChatMessage[]>([])
  const [floating,  setFloating]  = useState<FloatingReaction[]>([])
  const [input,     setInput]     = useState('')
  const [chatOpen,  setChatOpen]  = useState(true)   // fullscreen toggle
  const [unread,    setUnread]    = useState(0)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLInputElement>(null)
  const isAtBottom = useRef(true)

  // ── Subscribe to chat + reaction events ────────────────────────────────────
  useEffect(() => {
    let active = true

    channel.on('broadcast', { event: 'chat' }, ({ payload }) => {
      if (!active || !payload) return

      const msg = payload as ChatMessage

      setMessages(prev => {
        if (prev.some(existing => existing.id === msg.id)) {
          return prev
        }

        return [...prev.slice(-199), msg]
      })

      if (isFullscreen && !chatOpen && msg.user_id !== currentUserId) {
        setUnread(n => n + 1)
      }
    })

    channel.on('broadcast', { event: 'reaction' }, ({ payload }) => {
      if (!active || !payload) return

      const ev = payload as ReactionEvent

      // Already shown optimistically by the sender.
      if (ev.user_id === currentUserId) return

      const id = `${ev.sent_at}-${Math.random()}`
      const x = 10 + Math.random() * 80

      setFloating(prev => [...prev, { id, emoji: ev.emoji, x }])

      setTimeout(() => {
        if (!active) return
        setFloating(prev => prev.filter(f => f.id !== id))
      }, 2500)
    })

    return () => {
      active = false
    }
  }, [channel, isFullscreen, chatOpen, currentUserId])

  // ── Auto-scroll to bottom when new messages arrive ─────────────────────────
  useEffect(() => {
    if (isAtBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // ── Track whether user has scrolled up ────────────────────────────────────
  function onScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    isAtBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40
  }

  // ── Send a chat message ────────────────────────────────────────────────────
  function sendMessage() {
    const text = input.trim()
    if (!text) return

    const msg: ChatMessage = {
      id:      `${Date.now()}-${currentUserId}`,
      user_id: currentUserId,
      email:   userEmail,
      is_host: isHost,
      text,
      sent_at: Date.now(),
    }

    // Optimistically add to local state
    setMessages(prev => {
      if (prev.some(existing => existing.id === msg.id)) {
        return prev
      }

      return [...prev.slice(-199), msg]
    })
    setInput('')

    // Broadcast to everyone else
    channel.send({ type: 'broadcast', event: 'chat', payload: msg })
    inputRef.current?.focus()
  }

  // ── Send a reaction ────────────────────────────────────────────────────────
  function sendReaction(emoji: string) {
    const ev: ReactionEvent = { emoji, user_id: currentUserId, sent_at: Date.now() }
    // Show locally
    const id = `${ev.sent_at}-local`
    const x  = 10 + Math.random() * 80
    setFloating(prev => [...prev, { id, emoji, x }])
    setTimeout(() => setFloating(prev => prev.filter(f => f.id !== id)), 2500)
    // Broadcast
    channel.send({ type: 'broadcast', event: 'reaction', payload: ev })
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  function openChat() { setChatOpen(true); setUnread(0) }

  // ─── Floating reactions (absolutely positioned, animate via CSS) ───────────
  const FloatingLayer = (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-10" aria-hidden>
      {floating.map(f => (
        <span
          key={f.id}
          className="absolute text-2xl animate-float-up select-none"
          style={{ left: `${f.x}%`, bottom: '80px' }}
        >
          {f.emoji}
        </span>
      ))}
    </div>
  )

  // ─── Chat panel ───────────────────────────────────────────────────────────
  const ChatPanel = (
    <div className={[
      'flex flex-col bg-cinema-surface border border-white/[0.06] rounded-xl overflow-hidden',
      isFullscreen
        ? 'fixed bottom-20 right-4 w-72 h-96 z-[110] shadow-2xl animate-scale-in'
        : 'h-full min-h-0',
    ].join(' ')}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3
                      border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
          <p className="text-white text-sm font-semibold">Party Chat</p>
        </div>
        {isFullscreen && (
          <button
            onClick={() => setChatOpen(false)}
            aria-label="Close chat"
            className="text-white/40 hover:text-white transition-colors cursor-pointer
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent rounded"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                 stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M1 1l12 12M13 1L1 13"/>
            </svg>
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-3 py-3 space-y-3
                   [scrollbar-width:thin] [scrollbar-color:#2a2a2a_transparent]"
        onScroll={onScroll}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 && (
          <p className="text-white/20 text-xs text-center py-8">
            No messages yet. Say hello!
          </p>
        )}
        {messages.map(msg => {
          const isSelf = msg.user_id === currentUserId

          return (
            <div
              key={msg.id}
              className={`flex gap-2 ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {!isSelf && (
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center
                            text-white text-[9px] font-bold shrink-0 mt-0.5
                            ${avatarColor(msg.user_id)}`}
                >
                  {initials(msg.email)}
                </div>
              )}

              <div
                className={`flex flex-col gap-0.5 max-w-[78%] ${
                  isSelf ? 'items-end' : 'items-start'
                }`}
              >
                {!isSelf && (
                  <div className="flex items-center gap-1 leading-none">
                    <span className="text-white/40 text-[10px] leading-none">
                      {msg.email.split('@')[0]}
                    </span>

                    {msg.is_host && (
                      <span
                        title="Host"
                        aria-label="Host"
                        className="text-yellow-400 inline-flex h-3 w-3 items-center justify-center
                                  text-[9px] leading-none translate-y-[-0.5px]"
                      >
                        🜲
                      </span>
                    )}

                    <span className="text-white/20 text-[9px] leading-none">
                      {formatTime(msg.sent_at)}
                    </span>
                  </div>
                )}

                <div
                  className={[
                    'px-3 py-1.5 rounded-2xl text-sm leading-snug break-words',
                    isSelf
                      ? 'bg-cinema-accent text-white rounded-tr-sm'
                      : 'bg-white/10 text-white rounded-tl-sm',
                  ].join(' ')}
                >
                  {msg.text}
                </div>

                {isSelf && (
                  <span className="text-white/20 text-[9px]">
                    {formatTime(msg.sent_at)}
                  </span>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef}/>
      </div>

      {/* Reactions bar */}
      <div className="flex items-center gap-1 px-3 py-2 border-t border-white/[0.06] shrink-0">
        {REACTIONS.map(emoji => (
          <button
            key={emoji}
            onClick={() => sendReaction(emoji)}
            aria-label={`Send ${emoji}`}
            className="text-lg hover:scale-125 active:scale-95 transition-transform
                       cursor-pointer focus-visible:outline-none rounded
                       focus-visible:ring-2 focus-visible:ring-cinema-accent"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 px-3 pb-3 shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          maxLength={300}
          placeholder="Say something…"
          aria-label="Chat message"
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2
                     text-white placeholder:text-white/20 text-sm outline-none
                     focus:border-cinema-accent focus:ring-1 focus:ring-cinema-accent/30
                     transition-colors duration-150"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          aria-label="Send message"
          className="w-9 h-9 rounded-lg bg-cinema-accent hover:bg-cinema-accent-hover
                     disabled:opacity-30 disabled:cursor-not-allowed
                     flex items-center justify-center transition-colors cursor-pointer
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent
                     shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
               stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M12 2L2 7l4 2 1 4 5-11z" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )

  // ─── Fullscreen: floating toggle button when chat is closed ───────────────
  const FullscreenToggle = isFullscreen && !chatOpen ? (
    <button
      onClick={openChat}
      aria-label={`Open chat${unread > 0 ? ` (${unread} unread)` : ''}`}
      className="fixed bottom-20 right-4 z-[110] w-11 h-11 rounded-full
                 bg-cinema-surface border border-white/10 shadow-xl
                 flex items-center justify-center
                 hover:bg-white/10 transition-colors cursor-pointer
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent
                 animate-scale-in"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
           stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M15 2H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3l3 3 3-3h3a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/>
      </svg>
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cinema-accent
                         text-white text-[9px] font-bold flex items-center justify-center">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  ) : null

  return (
    <>
      {FloatingLayer}
      {isFullscreen ? (
        <>
          {chatOpen && ChatPanel}
          {FullscreenToggle}
        </>
      ) : (
        ChatPanel
      )}
    </>
  )
}
