import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

interface Params { params: Promise<{ channelId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ subscribed: false })

  const { channelId } = await params

  const { data } = await supabase
    .from('subscriptions').select('id')
    .eq('channel_id', channelId).eq('user_id', user.id).single()

  return NextResponse.json({ subscribed: !!data })
}

export async function POST(_req: NextRequest, { params }: Params) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { channelId } = await params

  const { data: channel } = await supabase
    .from('channels').select('user_id').eq('id', channelId).single()

  if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
  if (channel.user_id === user.id) {
    return NextResponse.json({ error: 'Cannot subscribe to your own channel' }, { status: 422 })
  }

  const { data: existing } = await supabase
    .from('subscriptions').select('id')
    .eq('channel_id', channelId).eq('user_id', user.id).single()

  if (existing) {
    await Promise.all([
      supabase.from('subscriptions').delete().eq('id', existing.id),
      supabase.rpc('decrement_subscribers', { p_channel_id: channelId }),
    ])
    return NextResponse.json({ subscribed: false })
  } else {
    await Promise.all([
      supabase.from('subscriptions').insert({ channel_id: channelId, user_id: user.id }),
      supabase.rpc('increment_subscribers', { p_channel_id: channelId }),
    ])
    return NextResponse.json({ subscribed: true })
  }
}