'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function saveProgress(
  titleId: string,
  progressSecs: number,
  episodeId?: string
): Promise<void> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  const { error } = await supabase
    .from('watch_progress')
    .upsert(
      {
        user_id: user.id,
        title_id: titleId,
        episode_id: episodeId ?? null,
        progress_secs: Math.floor(progressSecs),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: episodeId
          ? 'user_id,title_id,episode_id'
          : 'user_id,title_id',
      }
    )

  if (error) {
    console.error('Failed to save progress:', error)
  }
}