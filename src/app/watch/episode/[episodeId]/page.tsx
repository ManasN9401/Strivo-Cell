import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import VideoPlayerWrapper from '@/components/VideoPlayerWrapper'
import EpisodePlaylist from '@/components/EpisodePlaylist'
import { getEpisode, getAllEpisodes } from '@/lib/supabase/queries'

interface Props {
  params: Promise<{ episodeId: string }>
}

export default async function EpisodeWatchPage({ params }: Props) {
  const { episodeId } = await params

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  let progressSecs = 0
  if (user) {
    const { data: progress } = await supabase
      .from('watch_progress')
      .select('progress_secs')
      .eq('user_id', user.id)
      .eq('episode_id', episodeId)
      .maybeSingle()

    if (progress) progressSecs = progress.progress_secs
  }

  const episode = await getEpisode(episodeId)
  if (!episode) notFound()

  const title = episode.seasons?.titles
  const showName = title?.title ?? 'Series'
  const seasonNum = episode.seasons?.number ?? '?'
  const fullTitle = `S${seasonNum}E${episode.number}: ${episode.title}`

  const allEpisodes = episode.title_id ? await getAllEpisodes(episode.title_id) : []

  return (
    <main className="bg-strivo-bg min-h-screen pt-20 pb-16">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-white/40 mb-4">
          {title && (
            <>
              <Link href={`/titles/${episode.title_id}`}
                className="hover:text-white transition-colors">{showName}</Link>
              <span>›</span>
            </>
          )}
          <span className="text-white/60">{fullTitle}</span>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr,380px]">
          {/* ── Left: Player + info ── */}
          <div className="space-y-6">
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden
                            shadow-[0_4px_60px_rgba(0,0,0,0.7)]">
              <VideoPlayerWrapper
                titleId={episode.title_id}
                episodeId={episode.id}
                titleName={`${showName} — ${fullTitle}`}
                initialProgressSecs={progressSecs}
              />
            </div>

            {/* Episode info */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-strivo-accent text-xs font-semibold uppercase tracking-widest mb-1">
                    {showName} · Season {seasonNum}
                  </p>
                  <h1 className="text-white text-2xl sm:text-3xl font-bold tracking-tight">
                    {fullTitle}
                  </h1>
                  {episode.duration_mins && (
                    <p className="text-white/40 text-sm mt-1">{episode.duration_mins}m</p>
                  )}
                </div>

                {/* Next episode button (mobile / visible at top too) */}
                {allEpisodes.length > 0 && (() => {
                  const idx = allEpisodes.findIndex(e => e.id === episodeId)
                  const next = idx >= 0 && idx < allEpisodes.length - 1 ? allEpisodes[idx + 1] : null
                  if (!next) return null
                  return (
                    <Link
                      href={`/watch/episode/${next.id}`}
                      className="flex-shrink-0 flex items-center gap-2 bg-white/10 hover:bg-white/20
                                 border border-white/10 hover:border-white/20 rounded-lg px-4 py-2.5
                                 text-white text-sm font-medium transition-all"
                    >
                      Next
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5">
                        <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
                        <line x1="19" y1="5" x2="19" y2="19" />
                      </svg>
                    </Link>
                  )
                })()}
              </div>

              <p className="text-white/60 leading-relaxed max-w-3xl">
                {episode.description ?? 'No description available.'}
              </p>
            </div>
          </div>

          {/* ── Right: Episode playlist sidebar ── */}
          {allEpisodes.length > 0 && (
            <aside className="xl:max-h-[calc(100vh-120px)] xl:sticky xl:top-[88px]
                              bg-strivo-surface/40 backdrop-blur-sm border border-white/5
                              rounded-2xl p-4 flex flex-col">
              <EpisodePlaylist
                episodes={allEpisodes as any}
                currentEpisodeId={episodeId}
                showTitle={showName}
              />
            </aside>
          )}
        </div>
      </div>
    </main>
  )
}
