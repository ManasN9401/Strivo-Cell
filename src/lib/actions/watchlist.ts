'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function toggleWatchlist(
  titleId: string,
  currentlyInList: boolean
): Promise<{ success: boolean; inList: boolean }> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, inList: currentlyInList }

  const { error } = currentlyInList
    ? await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('title_id', titleId)
    : await supabase
        .from('watchlist')
        .insert({ user_id: user.id, title_id: titleId })

  if (error) {
    console.error('Failed to toggle watchlist:', error)
    return { success: false, inList: currentlyInList }
  }

  revalidatePath('/')
  revalidatePath('/library')

  return { success: true, inList: !currentlyInList }
}