import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// POST /api/creators/videos/upload
// Body: { filename, contentType, size, meta }
// Returns: { uploadUrl, videoPath, videoId }
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let body: {
    filename: string
    contentType: string
    size: number
    thumbnailFilename?: string
    thumbnailContentType?: string
    meta: {
      title: string
      description: string
      tags: string[]
      visibility: 'public' | 'unlisted' | 'private'
    }
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.meta?.title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 422 })
  }

  const MAX_SIZE = 10 * 1024 ** 3 // 10GB
  if (body.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large' }, { status: 422 })
  }

  // ── Ensure channel exists ──────────────────────────────────────────────────
  let channelId: string
  const { data: existingChannel } = await supabase
    .from('channels').select('id').eq('user_id', user.id).single()

  if (existingChannel) {
    channelId = existingChannel.id
  } else {
    const defaultName = user.email?.split('@')[0] ?? 'My Channel'
    const { data: newChannel, error: channelError } = await supabase
      .from('channels')
      .insert({
        user_id: user.id,
        name: defaultName,
        handle: defaultName.toLowerCase().replace(/[^a-z0-9]/g, ''),
        subscribers: 0,
      })
      .select('id')
      .single()
    if (channelError || !newChannel) {
      return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 })
    }
    channelId = newChannel.id
  }

  // ── Create signed upload URL for video ────────────────────────────────────
  const ext       = body.filename.split('.').pop() ?? 'mp4'
  const videoPath = `videos/${user.id}/${Date.now()}.${ext}`

  const { data: signedData, error: signedError } = await supabase.storage
    .from('creator-uploads')
    .createSignedUploadUrl(videoPath)

  if (signedError || !signedData) {
    console.error('Signed URL error:', signedError)
    return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 })
  }

  // ── Create signed upload URL for thumbnail (if provided) ──────────────────
  let thumbnailSignedUrl: string | null = null
  let thumbnailPath: string | null = null

  if (body.thumbnailFilename && body.thumbnailContentType) {
    const thumbExt  = body.thumbnailFilename.split('.').pop() ?? 'jpg'
    thumbnailPath   = `thumbnails/${user.id}/${Date.now()}.${thumbExt}`
    const { data: thumbSigned, error: thumbError } = await supabase.storage
      .from('creator-uploads')
      .createSignedUploadUrl(thumbnailPath, { upsert: false })
    if (thumbError) {
      console.error('Thumbnail signed URL error:', thumbError)
      return NextResponse.json({ error: 'Failed to create thumbnail upload URL' }, { status: 500 })
    }
    thumbnailSignedUrl = thumbSigned?.signedUrl ?? null
  }

  // ── Pre-create video record with pending status ────────────────────────────
  const visibility = ['public', 'unlisted', 'private'].includes(body.meta.visibility)
    ? body.meta.visibility : 'public'

  const { data: { publicUrl: videoPublicUrl } } = supabase.storage
    .from('creator-uploads')
    .getPublicUrl(videoPath)

  const { data: video, error: insertError } = await supabase
    .from('videos')
    .insert({
      channel_id:    channelId,
      title:         body.meta.title.trim(),
      description:   body.meta.description?.trim() ?? null,
      tags:          Array.isArray(body.meta.tags) ? body.meta.tags.slice(0, 10) : [],
      url:           videoPublicUrl,
      thumbnail_url: thumbnailPath
        ? supabase.storage.from('creator-uploads').getPublicUrl(thumbnailPath).data.publicUrl
        : null,
      visibility,
      duration:      0,
      views:         0,
      like_count:    0,
      dislike_count: 0,
    })
    .select('id')
    .single()

  if (insertError || !video) {
    console.error('Video insert error:', insertError)
    return NextResponse.json({ error: 'Failed to save video record' }, { status: 500 })
  }

  const uploadUrl = signedData.signedUrl

  console.log('Signed upload URL:', uploadUrl) // ← lets us see the URL in terminal

  return NextResponse.json({
    videoId:            video.id,
    uploadUrl,
    thumbnailUploadUrl: thumbnailSignedUrl,
})
}