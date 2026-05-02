import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let body: { video_id?: string; timestamp_seconds?: number } = {}
  try { body = await req.json() } catch { /* body is optional */ }

  const { video_id, timestamp_seconds = 5 } = body

  // ── Option A: Mux ──────────────────────────────────────────────────────────
  // const thumbnailUrl = `https://image.mux.com/${muxPlaybackId}/thumbnail.jpg?time=${timestamp_seconds}`
  // return NextResponse.json({ url: thumbnailUrl })

  // ── Option B: Supabase Edge Function ──────────────────────────────────────
  // const { data } = await supabase.functions.invoke('extract-thumbnail', {
  //   body: { video_id, timestamp_seconds },
  // })
  // return NextResponse.json({ url: data.url })

  if (video_id) {
    const { data: video } = await supabase
      .from('videos').select('thumbnail_url').eq('id', video_id).single()
    if (video?.thumbnail_url) return NextResponse.json({ url: video.thumbnail_url })
  }

  const placeholderUrl = `https://placehold.co/1280x720/1a1a1a/ffffff?text=Thumbnail+at+${timestamp_seconds}s`
  return NextResponse.json({ url: placeholderUrl })
}