import { notFound } from 'next/navigation'
import TopNavBar from '@/components/TopNavBar'
import CopyLinkButton from '@/components/CopyLinkButton'
import WatchPartyPlayerLoader from '@/components/WatchPartyPlayerLoader'
import { closePartyRoom } from '@/lib/actions/party'
import { getPartyRoom } from '@/lib/supabase/party-queries'
import { getProgress } from '@/lib/supabase/queries'
import { createSupabaseServerClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{
    room_id: string
  }>
}

export default async function PartyRoomPage({ params }: Props) {
  const { room_id } = await params

  const supabase = await createSupabaseServerClient()

  const [
    room,
    {
      data: { user },
    },
  ] = await Promise.all([
    getPartyRoom(room_id),
    supabase.auth.getUser(),
  ])

  if (!room || !user) notFound()

  const title = room.titles as any
  const isHost = user.id === room.host_id
  const progress = await getProgress(title.id)

  return (
    <>
      <TopNavBar />

      <main className="bg-cinema-bg min-h-screen pt-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-white/30 text-xs uppercase tracking-widest mb-1">
                Watch Party
              </p>
              <h1 className="text-2xl font-black tracking-tight">{title.title}</h1>
            </div>

            <div className="flex items-center gap-3">
              <CopyLinkButton roomId={room_id} />

              {isHost && (
                <form action={closePartyRoom.bind(null, room_id)}>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20
                               text-red-400 text-sm font-semibold border border-red-500/20
                               transition-colors cursor-pointer
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  >
                    End party
                  </button>
                </form>
              )}
            </div>
          </div>

          <WatchPartyPlayerLoader
            titleId={title.id}
            titleName={title.title}
            roomId={room_id}
            isHost={isHost}
            currentUserId={user.id}
            userEmail={user.email ?? ''}
            initialProgressSecs={progress?.progress_secs ?? 0}
          />

          {!isHost && (
            <p className="mt-3 text-white/20 text-xs text-center">
              Playback is controlled by the host · Volume is yours to adjust
            </p>
          )}
        </div>
      </main>
    </>
  )
}