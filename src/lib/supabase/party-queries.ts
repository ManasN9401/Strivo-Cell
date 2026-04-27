import 'server-only'

import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function getPartyRoom(roomId: string) {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('party_rooms')
    .select('id, host_id, is_active, titles(*)')
    .eq('id', roomId)
    .single()

  if (error || !data || !data.is_active) return null

  return data
}