import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const videoId = req.nextUrl.searchParams.get('videoId')

  const playlistsPromise = supabase
    .from('playlists')
    .select('*, video_count:playlist_videos(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const savedIdsPromise = videoId
    ? (async () => {
        const { data: playlistRows } = await supabase
          .from('playlists')
          .select('id')
          .eq('user_id', user.id)

        const playlistIds = (playlistRows ?? []).map((row: { id: string }) => row.id)

        if (playlistIds.length === 0) {
          return { data: [] as { playlist_id: string }[] | null }
        }

        return await supabase
          .from('playlist_videos')
          .select('playlist_id')
          .eq('video_id', videoId)
          .in('playlist_id', playlistIds)
      })()
    : Promise.resolve({ data: [] } as { data: { playlist_id: string }[] | null })

  const [{ data: playlists }, { data: savedRows }] = await Promise.all([
    playlistsPromise,
    savedIdsPromise,
  ])

  const savedIds = (savedRows ?? []).map((r: { playlist_id: string }) => r.playlist_id)
  return NextResponse.json({ playlists: playlists ?? [], savedIds })
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let body: { name: unknown }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 422 })
  if (name.length > 100) return NextResponse.json({ error: 'Name too long' }, { status: 422 })

  const { data: playlist, error } = await supabase
    .from('playlists')
    .insert({ user_id: user.id, name })
    .select('*, video_count:playlist_videos(count)')
    .single()

  if (error || !playlist) return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 })
  return NextResponse.json({ playlist }, { status: 201 })
}