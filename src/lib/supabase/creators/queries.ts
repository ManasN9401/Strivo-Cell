import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Video, Channel, Comment, Chapter, Playlist, VideoAnalytics, LikeState } from '@/types/creators'

// ── Feed ──────────────────────────────────────────────────────────────────────

export async function getCreatorsFeedVideos(): Promise<Video[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('videos')
    .select('*, channel:channels(*)')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(48)
  return (data ?? []) as Video[]
}

// ── Video ─────────────────────────────────────────────────────────────────────

export async function getVideoById(id: string): Promise<Video | null> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('videos')
    .select('*, channel:channels(*)')
    .eq('id', id)
    .single()

  if (data) {
    supabase.rpc('increment_video_views', { p_video_id: id }).then(() => {})
  }

  return data as Video | null
}

export async function getRecommendedVideos(currentVideoId: string): Promise<Video[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('videos')
    .select('*, channel:channels(*)')
    .eq('visibility', 'public')
    .neq('id', currentVideoId)
    .order('views', { ascending: false })
    .limit(20)
  return (data ?? []) as Video[]
}

// ── Chapters ──────────────────────────────────────────────────────────────────

export async function getVideoChapters(videoId: string): Promise<Chapter[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('chapters')
    .select('*')
    .eq('video_id', videoId)
    .order('timestamp_seconds', { ascending: true })
  return (data ?? []) as Chapter[]
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function getVideoComments(videoId: string): Promise<Comment[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('comments')
    .select('*')
    .eq('video_id', videoId)
    .is('parent_id', null)
    .order('created_at', { ascending: false })
    .limit(100)

  const topLevel = (data ?? []) as Comment[]
  const ids = topLevel.map(c => c.id)
  if (ids.length === 0) return topLevel

  const { data: replies } = await supabase
    .from('comments')
    .select('*')
    .in('parent_id', ids)
    .order('created_at', { ascending: true })

  const replyMap = new Map<string, Comment[]>()
  for (const r of (replies ?? []) as Comment[]) {
    if (!r.parent_id) continue
    if (!replyMap.has(r.parent_id)) replyMap.set(r.parent_id, [])
    replyMap.get(r.parent_id)!.push(r)
  }

  return topLevel.map(c => ({ ...c, replies: replyMap.get(c.id) ?? [] }))
}

// ── Likes ─────────────────────────────────────────────────────────────────────

export async function getLikeState(videoId: string, userId: string): Promise<LikeState> {
  const supabase = await createSupabaseServerClient()
  const [{ data: like }, { data: counts }] = await Promise.all([
    supabase.from('likes').select('value').eq('video_id', videoId).eq('user_id', userId).single(),
    supabase.from('videos').select('like_count, dislike_count').eq('id', videoId).single(),
  ])
  return {
    liked:         like?.value === 1,
    disliked:      like?.value === -1,
    like_count:    counts?.like_count ?? 0,
    dislike_count: counts?.dislike_count ?? 0,
  }
}

// ── Playlists ─────────────────────────────────────────────────────────────────

export async function getUserPlaylists(userId: string): Promise<Playlist[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('playlists')
    .select('*, video_count:playlist_videos(count)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return (data ?? []) as Playlist[]
}

// ── Channel ───────────────────────────────────────────────────────────────────

export async function getChannelByUserId(userId: string): Promise<Channel | null> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('channels')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data as Channel | null
}

export async function getChannelVideos(userId: string): Promise<Video[]> {
  const supabase = await createSupabaseServerClient()
  const channel = await getChannelByUserId(userId)
  if (!channel) return []
  const { data } = await supabase
    .from('videos')
    .select('*')
    .eq('channel_id', channel.id)
    .order('created_at', { ascending: false })
  return (data ?? []) as Video[]
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export async function getChannelAnalytics(userId: string): Promise<VideoAnalytics[]> {
  const supabase = await createSupabaseServerClient()
  const channel = await getChannelByUserId(userId)
  if (!channel) return []

  const { data: videos } = await supabase
    .from('videos')
    .select('id')
    .eq('channel_id', channel.id)

  if (!videos || videos.length === 0) return []

  const videoIds = videos.map(v => v.id)
  const { data } = await supabase
    .from('video_analytics')
    .select('*')
    .in('video_id', videoIds)
    .order('date', { ascending: true })

  const byDate = new Map<string, VideoAnalytics>()
  for (const row of (data ?? []) as VideoAnalytics[]) {
    const existing = byDate.get(row.date)
    if (existing) {
      existing.views              += row.views
      existing.watch_time_seconds += row.watch_time_seconds
    } else {
      byDate.set(row.date, { ...row })
    }
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date))
}