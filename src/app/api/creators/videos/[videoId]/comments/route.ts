import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

interface Params { params: Promise<{ videoId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = await createSupabaseServerClient()
  const { videoId } = await params

  const [{ data: topLevel }, { data: replies }] = await Promise.all([
    supabase.from('comments').select('*')
      .eq('video_id', videoId).is('parent_id', null)
      .order('created_at', { ascending: false }).limit(100),
    supabase.from('comments').select('*')
      .eq('video_id', videoId).not('parent_id', 'is', null)
      .order('created_at', { ascending: true }),
  ])

  const replyMap = new Map<string, typeof replies>()
  for (const r of replies ?? []) {
    if (!r.parent_id) continue
    if (!replyMap.has(r.parent_id)) replyMap.set(r.parent_id, [])
    replyMap.get(r.parent_id)!.push(r)
  }

  const comments = (topLevel ?? []).map(c => ({
    ...c,
    replies: replyMap.get(c.id) ?? [],
  }))

  return NextResponse.json({ comments })
}

export async function POST(req: NextRequest, { params }: Params) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { videoId } = await params

  let body: { body: unknown; parent_id?: unknown }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const text = typeof body.body === 'string' ? body.body.trim() : ''
  if (!text) return NextResponse.json({ error: 'Comment body required' }, { status: 422 })
  if (text.length > 2000) return NextResponse.json({ error: 'Comment too long' }, { status: 422 })

  const parentId = typeof body.parent_id === 'string' ? body.parent_id : null

  if (parentId) {
    const { data: parent } = await supabase
      .from('comments').select('id').eq('id', parentId).eq('video_id', videoId).single()
    if (!parent) return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 })
  }

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({ video_id: videoId, user_id: user.id, parent_id: parentId, body: text })
    .select().single()

  if (error || !comment) return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 })

  return NextResponse.json({ comment: { ...comment, user_email: user.email, replies: [] } }, { status: 201 })
}