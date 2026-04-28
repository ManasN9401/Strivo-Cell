'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

const COMPLETION_PERCENT = 0.95
const COMPLETION_FINAL_SECONDS = 60
const MIN_CONTINUE_SECONDS = 30

export async function saveProgress(titleId: string, progressSecs: number) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  const safeProgressSecs = Math.max(0, Math.floor(progressSecs))
  const now = new Date().toISOString()

  const { data: title, error: titleError } = await supabase
    .from('titles')
    .select('duration_mins')
    .eq('id', titleId)
    .maybeSingle()

  if (titleError) {
    console.error('Failed to fetch title duration:', titleError)
    return
  }

  const durationSecs = title?.duration_mins
    ? title.duration_mins * 60
    : null

  const isCompleted =
    durationSecs !== null &&
    safeProgressSecs > MIN_CONTINUE_SECONDS &&
    (
      safeProgressSecs >= durationSecs * COMPLETION_PERCENT ||
      safeProgressSecs >= durationSecs - COMPLETION_FINAL_SECONDS
    )

  const { data: existing, error: existingError } = await supabase
    .from('watch_progress')
    .select('id, completed_at, watched_count, is_rewatching')
    .eq('user_id', user.id)
    .eq('title_id', titleId)
    .is('episode_id', null)
    .maybeSingle()

  if (existingError) {
    console.error('Failed to fetch existing progress:', existingError)
    return
  }

  if (!existing) {
    const { error } = await supabase
      .from('watch_progress')
      .insert({
        user_id: user.id,
        title_id: titleId,
        episode_id: null,
        progress_secs: safeProgressSecs,
        completed_at: isCompleted ? now : null,
        watched_count: isCompleted ? 1 : 0,
        is_rewatching: false,
        updated_at: now,
      })

    if (error) {
      console.error('Failed to insert watch progress:', error)
    }

    return
  }

  const wasCompleted = Boolean(existing.completed_at)
  const wasRewatching = Boolean(existing.is_rewatching)

  const updateData: Record<string, unknown> = {
    progress_secs: safeProgressSecs,
    updated_at: now,
  }

  if (!wasCompleted) {
    if (isCompleted) {
      updateData.completed_at = now
      updateData.watched_count = Math.max(existing.watched_count ?? 0, 1)
      updateData.is_rewatching = false
    }
  } else {
    if (isCompleted && wasRewatching) {
      updateData.completed_at = now
      updateData.watched_count = (existing.watched_count ?? 1) + 1
      updateData.is_rewatching = false
    } else if (!isCompleted) {
      updateData.is_rewatching = safeProgressSecs > MIN_CONTINUE_SECONDS
    }
  }

  const { error } = await supabase
    .from('watch_progress')
    .update(updateData)
    .eq('id', existing.id)

  if (error) {
    console.error('Failed to update watch progress:', error)
  }
}