// ─── Creators Mode — Type Definitions ────────────────────────────────────────

export interface Channel {
  id: string
  user_id: string
  name: string
  handle: string
  avatar_url: string | null
  banner_url: string | null
  description: string | null
  subscribers: number
  created_at: string
}

export interface Video {
  id: string
  channel_id: string
  channel?: Channel
  title: string
  description: string | null
  tags: string[]
  url: string
  thumbnail_url: string | null
  visibility: 'public' | 'unlisted' | 'private'
  duration: number
  views: number
  like_count: number
  dislike_count: number
  created_at: string
}

export interface Chapter {
  id: string
  video_id: string
  timestamp_seconds: number
  label: string
}

export interface Comment {
  id: string
  video_id: string
  user_id: string
  parent_id: string | null
  body: string
  created_at: string
  user_email?: string
  replies?: Comment[]
}

export interface Playlist {
  id: string
  user_id: string
  name: string
  video_count: number
  created_at: string
}

export interface VideoAnalytics {
  video_id: string
  date: string
  views: number
  watch_time_seconds: number
}

export interface LikeState {
  liked: boolean
  disliked: boolean
  like_count: number
  dislike_count: number
}