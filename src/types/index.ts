export type Title = {
  id:            string
  title:         string
  description:   string | null
  type:          'movie' | 'series'
  genre:         string[]
  release_year:  number | null
  duration_mins: number | null
  is_featured:   boolean
  backdrop_path: string | null
  poster_path:   string | null
  rating:        string | null
  tags:          string[]
  created_at:    string
}

export type WatchlistEntry = {
  id:       string
  title_id: string
  titles:   Title
}

export type WatchProgress = {
  id:            string
  user_id:       string
  title_id:      string
  episode_id:    string | null
  progress_secs: number
  updated_at:    string
  titles:        Title
}

export type PartyRoom = {
  id:         string
  host_id:    string
  title_id:   string
  is_active:  boolean
  created_at: string
  titles:     Title
}
