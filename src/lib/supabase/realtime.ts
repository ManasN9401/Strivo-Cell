import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type PartyEventType = 'PLAY' | 'PAUSE' | 'SEEK' | 'SYNC'

export interface PartyEvent {
  type:      PartyEventType
  time:      number
  sender_id: string
  sent_at:   number
}

export interface PartyPresenceState {
  user_id:   string
  email:     string
  is_host:   boolean
  joined_at: string
}

export function createPartyChannel(roomId: string): RealtimeChannel {
  const supabase = createSupabaseBrowserClient()
  return supabase.channel(`party:${roomId}`, {
    config: {
      broadcast: { self: false },
      presence:  { key: roomId },
    },
  })
}

export function destroyPartyChannel(channel: RealtimeChannel): void {
  const supabase = createSupabaseBrowserClient()
  supabase.removeChannel(channel)
}
