import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

interface Params { params: Promise<{ videoId: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { videoId } = await params

  let body: { value: unknown }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const value = body.value
  if (value !== 1 && value !== -1 && value !== 0) {
    return NextResponse.json({ error: 'value must be 1, -1 or 0' }, { status: 422 })
  }

  const { data: existing } = await supabase
    .from('likes').select('value').eq('video_id', videoId).eq('user_id', user.id).single()

  const oldValue = (existing?.value ?? 0) as 0 | 1 | -1
  if (oldValue === value) return NextResponse.json({ ok: true })

  const likeDelta    = (value === 1 ? 1 : 0)  - (oldValue === 1 ? 1 : 0)
  const dislikeDelta = (value === -1 ? 1 : 0) - (oldValue === -1 ? 1 : 0)

  const likeOp = value === 0
    ? supabase.from('likes').delete().eq('video_id', videoId).eq('user_id', user.id)
    : supabase.from('likes').upsert(
        { video_id: videoId, user_id: user.id, value },
        { onConflict: 'video_id,user_id' }
      )

  await Promise.all([
    likeOp,
    supabase.rpc('update_video_like_counts', {
      p_video_id: videoId, p_like_delta: likeDelta, p_dislike_delta: dislikeDelta,
    }),
  ])

  const { data: video } = await supabase
    .from('videos').select('like_count, dislike_count').eq('id', videoId).single()

  return NextResponse.json({
    liked:         value === 1,
    disliked:      value === -1,
    like_count:    video?.like_count ?? 0,
    dislike_count: video?.dislike_count ?? 0,
  })
}