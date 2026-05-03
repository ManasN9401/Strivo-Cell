import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import LikeDislikeBar from '@/components/creators/LikeDislikeBar'
import CommentsSection from '@/components/creators/CommentsSection'
import ChaptersList from '@/components/creators/ChaptersList'
import RecommendedSidebar from '@/components/creators/RecommendedSidebar'
import WatchPageClient from '@/components/creators/WatchPageClient'
import UpNext from '@/components/UpNext'
import VideoPlayerWrapper from '@/components/VideoPlayerWrapper'
import {
  getVideoById,
  getVideoComments,
  getVideoChapters,
  getRecommendedVideos,
  getLikeState,
} from '@/lib/supabase/creators/queries'
import {
  getTitle,
  getRelatedTitles,
  getProgress,
  getSeriesProgress,
  getFirstEpisode,
} from '@/lib/supabase/queries'
import type { Title } from '@/types'

interface Props {
  params: Promise<{ videoId: string }>
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K`
  return String(n)
}

export default async function WatchPage({ params }: Props) {
  const { videoId } = await params

  const title = await getTitle(videoId)
  if (!title) notFound()

  // If it's a series, redirect to the correct episode
  if (title.type === 'series') {
    const [seriesProgress, firstEpisode] = await Promise.all([
      getSeriesProgress(videoId),
      getFirstEpisode(videoId)
    ])

    if (seriesProgress?.episode_id) {
      redirect(`/watch/episode/${seriesProgress.episode_id}`)
    } else if (firstEpisode) {
      redirect(`/watch/episode/${firstEpisode.id}`)
    }
    // If no episodes, just continue as a movie (fallback)
  }

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [video, progress] = await Promise.all([
    getVideoById(videoId),
    getProgress(videoId),
  ])

  if (title) {
    const related = await getRelatedTitles(title.id, title.genre?.[0] ?? '')
    return renderTitleWatchPage(title, related, progress)
  }

  if (!video) notFound()

  const [comments, chapters, recommended, likeState] = await Promise.all([
    getVideoComments(videoId),
    getVideoChapters(videoId),
    getRecommendedVideos(videoId),
    user ? getLikeState(videoId, user.id) : null,
  ])

  return renderCreatorWatchPage(video, comments, chapters, recommended, likeState, user?.id ?? null)
}

function renderTitleWatchPage(
  title: Title,
  related: Title[],
  progress: Awaited<ReturnType<typeof getProgress>> | null,
) {
  return (
    <main className="bg-strivo-bg min-h-screen pt-20 pb-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 xl:grid-cols-[1.3fr,420px]">
          <div className="space-y-8">
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-[0_4px_40px_rgba(0,0,0,0.6)]">
              <VideoPlayerWrapper
                titleId={title.id}
                titleName={title.title}
                initialProgressSecs={progress?.progress_secs ?? 0}
              />
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-white text-3xl font-bold tracking-tight">
                    {title.title}
                  </h1>
                  <p className="text-white/50 text-sm mt-2">
                    {title.release_year}
                    {title.duration_mins ? ` · ${Math.floor(title.duration_mins / 60)}h ${title.duration_mins % 60}m` : ''}
                  </p>
                </div>
              </div>

              <p className="text-white/70 leading-relaxed max-w-3xl">
                {title.description ?? 'No description available.'}
              </p>

              <div className="flex flex-wrap gap-2">
                {(title.genre ?? []).map((genre) => (
                  <span
                    key={genre}
                    className="text-[11px] font-bold uppercase tracking-widest text-strivo-accent border border-strivo-accent/40 px-2.5 py-1 rounded-full"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-strivo-surface p-6 shadow-lg">
              <h2 className="text-white text-xl font-semibold mb-3">Up next</h2>
              <Suspense fallback={<RecommendedSkeleton />}>
                <UpNext titles={related} currentId={title.id} />
              </Suspense>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

function renderCreatorWatchPage(
  video: NonNullable<Awaited<ReturnType<typeof getVideoById>>>,
  comments: Awaited<ReturnType<typeof getVideoComments>>,
  chapters: Awaited<ReturnType<typeof getVideoChapters>>,
  recommended: Awaited<ReturnType<typeof getRecommendedVideos>>,
  likeState: Awaited<ReturnType<typeof getLikeState>> | null,
  currentUserId: string | null,
) {
  const channel = video.channel

  return (
    <main className="bg-strivo-bg min-h-screen pt-20 pb-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

          <div className="flex-1 min-w-0">
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-[0_4px_40px_rgba(0,0,0,0.6)]">
              <WatchPageClient videoUrl={video.url} chapters={chapters} />
            </div>

            <h1 className="text-white text-xl font-bold leading-snug mt-4">
              {video.title}
            </h1>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4 pb-4 border-b border-white/[0.06]">
              {channel && (
                <div className="flex items-center gap-3">
                  <a href={`/creators/channel/${channel.id}`}
                     className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strivo-accent rounded-full"
                     aria-label={`${channel.name}'s channel`}>
                    <div className="w-10 h-10 rounded-full bg-strivo-accent flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                      {channel.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={channel.avatar_url} alt={channel.name} className="w-full h-full object-cover" />
                      ) : (
                        channel.name[0]?.toUpperCase()
                      )}
                    </div>
                  </a>
                  <div>
                    <a href={`/creators/channel/${channel.id}`}
                       className="text-white text-sm font-semibold hover:text-white/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strivo-accent rounded">
                      {channel.name}
                    </a>
                    <p className="text-white/40 text-xs">
                      {formatCount(channel.subscribers)} subscribers
                    </p>
                  </div>
                  <SubscribeButton channelId={channel.id} />
                </div>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                <LikeDislikeBar
                  videoId={video.id}
                  initial={likeState ?? {
                    liked: false,
                    disliked: false,
                    like_count: video.like_count,
                    dislike_count: video.dislike_count,
                  }}
                />
                <SaveButton videoId={video.id} />
              </div>
            </div>

            <details className="mt-4 bg-strivo-surface rounded-xl group">
              <summary className="px-4 py-3 cursor-pointer text-white/60 text-sm hover:text-white transition-colors list-none flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strivo-accent rounded-xl">
                <span>
                  <span className="text-white font-medium">{formatCount(video.views)} views</span>
                  {' · '}
                  {new Date(video.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="transition-transform duration-200 group-open:rotate-180">
                  <path d="M2 4l5 5 5-5" />
                </svg>
              </summary>
              <div className="px-4 pb-4">
                <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line mt-1">
                  {video.description ?? 'No description provided.'}
                </p>
              </div>
            </details>

            {chapters.length > 0 && (
              <div className="mt-4 lg:hidden">
                <ChaptersList chapters={chapters} />
              </div>
            )}

            <div className="mt-8">
              <CommentsSection
                videoId={video.id}
                initialComments={comments}
                currentUserId={currentUserId}
              />
            </div>
          </div>

          <div className="lg:w-[360px] xl:w-[400px] shrink-0 space-y-6">
            {chapters.length > 0 && (
              <div className="hidden lg:block">
                <ChaptersList chapters={chapters} />
              </div>
            )}
            <Suspense fallback={<RecommendedSkeleton />}>
              <RecommendedSidebar videos={recommended} currentVideoId={video.id} />
            </Suspense>
          </div>

        </div>
      </div>
    </main>
  )
}

function SubscribeButton({ channelId }: { channelId: string }) {
  return (
    <button
      className="px-4 py-2 bg-white text-black text-xs font-bold rounded-full
                 hover:bg-white/90 transition-colors cursor-pointer min-h-[36px]
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strivo-accent"
    >
      Subscribe
    </button>
  )
}

function SaveButton({ videoId }: { videoId: string }) {
  return (
    <button
      className="flex items-center gap-2 px-4 py-2 bg-strivo-surface text-white/70
                 hover:text-white text-sm font-semibold rounded-full transition-colors
                 cursor-pointer min-h-[44px] focus-visible:outline-none
                 focus-visible:ring-2 focus-visible:ring-strivo-accent"
      aria-label="Save to playlist"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="2" aria-hidden>
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
      Save
    </button>
  )
}

function RecommendedSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="aspect-video w-40 bg-strivo-surface rounded-lg animate-pulse shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 bg-strivo-surface rounded animate-pulse" />
            <div className="h-3 bg-strivo-surface rounded animate-pulse w-3/4" />
            <div className="h-3 bg-strivo-surface rounded animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}