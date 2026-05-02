import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

interface Params { params: Promise<{ playlistId: string }> }

async function assertOwner(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  playlistId: string,
  userId: string
) {
  const { data } = await supabase
    .from('playlists').select('id').eq('id', playlistId).eq('user_id', userId).single()
  return !!data
}

export async function POST(req: NextRequest, { params }: Params) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { playlistId } = await params

  let body: { video_id: unknown }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const videoId = typeof body.video_id === 'string' ? body.video_id : null
  if (!videoId) return NextResponse.json({ error: 'video_id required' }, { status: 422 })

  const [isOwner, { data: lastItem }] = await Promise.all([
    assertOwner(supabase, playlistId, user.id),
    supabase.from('playlist_videos').select('position')
      .eq('playlist_id', playlistId).order('position', { ascending: false }).limit(1).single(),
  ])

  if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const nextPosition = ((lastItem as { position: number } | null)?.position ?? 0) + 1

  const { error } = await supabase
    .from('playlist_videos')
    .upsert(
      { playlist_id: playlistId, video_id: videoId, position: nextPosition },
      { onConflict: 'playlist_id,video_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ added: true }, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { playlistId } = await params

  let body: { video_id: unknown }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const videoId = typeof body.video_id === 'string' ? body.video_id : null
  if (!videoId) return NextResponse.json({ error: 'video_id required' }, { status: 422 })

  const isOwner = await assertOwner(supabase, playlistId, user.id)
  if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase
    .from('playlist_videos')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('video_id', videoId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ removed: true })
}