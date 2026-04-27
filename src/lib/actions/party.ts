'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function createPartyRoom(titleId: string): Promise<void> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('party_rooms')
    .insert({ host_id: user.id, title_id: titleId })
    .select('id')
    .single()

  if (error || !data) throw new Error('Could not create room')

  redirect(`/party/${data.id}`)
}

export async function closePartyRoom(roomId: string): Promise<void> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  await supabase
    .from('party_rooms')
    .update({ is_active: false })
    .eq('id', roomId)
    .eq('host_id', user.id)

  redirect('/')
}