import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

interface Params { params: Promise<{ videoId: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { videoId } = await params

  const { data: video } = await supabase
    .from('videos')
    .select('id, url, thumbnail_url, channel:channels!inner(user_id)')
    .eq('id', videoId)
    .single()

  if (!video) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const channel = Array.isArray(video.channel) ? video.channel[0] : video.channel
  if (!channel || channel.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const storageDeletes: Promise<unknown>[] = []
  if (video.url) {
    const videoPath = video.url.split('/creator-uploads/')[1]
    if (videoPath) storageDeletes.push(supabase.storage.from('creator-uploads').remove([videoPath]))
  }
  if (video.thumbnail_url) {
    const thumbPath = video.thumbnail_url.split('/creator-uploads/')[1]
    if (thumbPath) storageDeletes.push(supabase.storage.from('creator-uploads').remove([thumbPath]))
  }

  await Promise.all([...storageDeletes, supabase.from('videos').delete().eq('id', videoId)])
  return NextResponse.json({ deleted: true })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { videoId } = await params

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { data: video } = await supabase
    .from('videos')
    .select('id, channel:channels!inner(user_id)')
    .eq('id', videoId)
    .single()

  if (!video) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const channel = Array.isArray(video.channel) ? video.channel[0] : video.channel
  if (!channel || channel.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const allowed = ['title', 'description', 'tags', 'visibility'] as const
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if ('visibility' in updates && !['public', 'unlisted', 'private'].includes(updates.visibility as string)) {
    return NextResponse.json({ error: 'Invalid visibility value' }, { status: 422 })
  }
  if ('title' in updates && !(updates.title as string)?.trim()) {
    return NextResponse.json({ error: 'Title cannot be empty' }, { status: 422 })
  }

  const { data: updated, error } = await supabase
    .from('videos').update(updates).eq('id', videoId).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ video: updated })
}