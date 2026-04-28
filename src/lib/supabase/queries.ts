import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Title, WatchlistEntry } from '@/types'

// ─── Featured / Hero ─────────────────────────────────────────────────────────

export async function getFeaturedTitles(): Promise<Title[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('titles')
    .select('*')
    .eq('is_featured', true)
    .limit(6)
  if (error) throw error
  return (data ?? []) as Title[]
}

// ─── Browse / Genre ───────────────────────────────────────────────────────────

export async function getTitlesByGenre(genre: string, limit = 16): Promise<Title[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('titles')
    .select('*')
    .contains('genre', [genre])
    .limit(limit)
  if (error) throw error
  return (data ?? []) as Title[]
}

export async function getNewTitles(limit = 16): Promise<Title[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('titles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as Title[]
}

export async function getAllGenres(): Promise<string[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('titles').select('genre')
  if (!data) return []
  const genres = new Set(data.flatMap(row => row.genre ?? []))
  return Array.from(genres).sort()
}

export async function searchTitles(query: string): Promise<Title[]> {
  const q = query.trim()
  if (!q) return []

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('titles')
    .select('*')
    .ilike('title', `%${q}%`)
    .limit(12)

  if (error) {
    console.error('Failed to search titles:', error)
    return []
  }

  return (data ?? []) as Title[]
}
// ─── Single title ─────────────────────────────────────────────────────────────

export async function getTitle(id: string): Promise<Title | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('titles')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data as Title
}

export async function getRelatedTitles(titleId: string, genre: string, limit = 8): Promise<Title[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('titles')
    .select('*')
    .contains('genre', [genre])
    .neq('id', titleId)
    .limit(limit)
  return (data ?? []) as Title[]
}

// ─── Watchlist ────────────────────────────────────────────────────────────────

export async function getWatchlist(): Promise<WatchlistEntry[]> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('watchlist')
    .select('id, title_id, titles(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as WatchlistEntry[]
}

export async function getWatchlistIds(): Promise<Set<string>> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Set()

  const { data } = await supabase
    .from('watchlist')
    .select('title_id')
    .eq('user_id', user.id)
  return new Set((data ?? []).map(r => r.title_id))
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export async function getProgress(
  titleId: string
): Promise<{
  progress_secs: number
  completed_at: string | null
  is_rewatching: boolean
  watched_count: number
} | null> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('watch_progress')
    .select('progress_secs, completed_at, is_rewatching, watched_count')
    .eq('user_id', user.id)
    .eq('title_id', titleId)
    .is('episode_id', null)
    .maybeSingle()

  if (error) {
    console.error('Failed to get progress:', error)
    return null
  }

  return data
}

export async function getContinueWatching() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('watch_progress')
    .select('progress_secs, updated_at, completed_at, is_rewatching, titles(*)')
    .eq('user_id', user.id)
    .is('episode_id', null)
    .gt('progress_secs', 30)
    .or('completed_at.is.null,is_rewatching.eq.true')
    .order('updated_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Failed to get continue watching:', error)
    return []
  }

  return (data ?? []).map((row: any) => ({
    title: row.titles as Title,
    progress_secs: row.progress_secs as number,
    duration_mins: (row.titles?.duration_mins ?? null) as number | null,
  }))
}

export async function getWatchedTitleIds() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return new Set<string>()

  const { data, error } = await supabase
    .from('watch_progress')
    .select('title_id')
    .eq('user_id', user.id)
    .is('episode_id', null)
    .not('completed_at', 'is', null)

  if (error) {
    console.error('Failed to get watched title ids:', error)
    return new Set<string>()
  }

  type WatchedTitleRow = {
    title_id: string | null
  }

  return new Set<string>(
    ((data ?? []) as WatchedTitleRow[])
      .map((row) => row.title_id)
      .filter((id): id is string => Boolean(id))
  )
}