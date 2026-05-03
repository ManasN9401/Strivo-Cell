'use client'

import { useEffect, useState }       from 'react'
import type { RealtimeChannel }      from '@supabase/supabase-js'
import type { PartyPresenceState }   from '@/lib/supabase/realtime'

interface Props {
  channel:       RealtimeChannel
  currentUserId: string
  userEmail:     string
  isHost:        boolean
}

function avatarColor(userId: string): string {
  const palette = [
    'bg-violet-500', 'bg-blue-500', 'bg-teal-500',
    'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
  ]
  let hash = 0
  for (const ch of userId) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff
  return palette[Math.abs(hash) % palette.length]
}

function initials(email: string): string {
  return email.split('@')[0].split(/[._-]/).slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '').join('')
}

export default function PartyPresence({ channel, currentUserId, userEmail, isHost }: Props) {
  const [members, setMembers] = useState<PartyPresenceState[]>([])

  useEffect(() => {
    channel.track({ user_id: currentUserId, email: userEmail, is_host: isHost,
                    joined_at: new Date().toISOString() } satisfies PartyPresenceState)

    channel.on('presence', { event: 'sync' }, () => {
      const flat = Object.values(channel.presenceState<PartyPresenceState>()).flat()
      setMembers(flat)
    })

    return () => { channel.untrack() }
  }, [channel, currentUserId, userEmail, isHost])

  return (
    <div className="flex items-center gap-2" aria-label="Party members">
      <div className="flex -space-x-2">
        {members.slice(0, 7).map((m, i) => (
          <div
            key={m.user_id}
            title={`${m.email}${m.is_host ? ' (host)' : ''}`}
            style={{ zIndex: members.length - i }}
            aria-label={m.email}
            className={`relative w-7 h-7 rounded-full flex items-center justify-center
                        text-white text-[10px] font-bold border-2 border-strivo-bg
                        ${avatarColor(m.user_id)}`}
          >
            {initials(m.email)}
            {m.is_host && (
              <span className="absolute -top-1.5 -right-0.5 text-[8px] leading-none"
                    aria-label="host">👑</span>
            )}
          </div>
        ))}
        {members.length > 7 && (
          <div className="w-7 h-7 rounded-full bg-strivo-surface border-2 border-strivo-bg
                          flex items-center justify-center text-white/50 text-[10px] font-bold">
            +{members.length - 7}
          </div>
        )}
      </div>
      <span className="text-white/30 text-xs hidden sm:block">
        {members.length} watching
      </span>
    </div>
  )
}
