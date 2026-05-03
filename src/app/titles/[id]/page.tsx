import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import ContentRow from '@/components/ContentRow'
import Footer from '@/components/Footer'
import EpisodeSelector from '@/components/EpisodeSelector'
import { 
  getTitle, 
  getRelatedTitles, 
  getWatchlistIds, 
  getSeasons, 
  getEpisodes,
  getSeriesProgress,
  getFirstEpisode
} from '@/lib/supabase/queries'
import { toggleWatchlist } from '@/lib/actions/watchlist'
import { createPartyRoom } from '@/lib/actions/party'

interface Props {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const title = await getTitle(id)

  if (!title) return {}

  return {
    title: title.title,
    description: title.description ?? undefined,
  }
}

export default async function TitleDetailPage({ params }: Props) {
  const { id } = await params

  const [title, watchlistIds] = await Promise.all([
    getTitle(id),
    getWatchlistIds(),
  ])

  if (!title) notFound()

  const primaryGenre = title.genre?.[0]
  const related = primaryGenre ? await getRelatedTitles(id, primaryGenre) : []
  const inWatchlist = watchlistIds.has(title.id)
  const duration = title.duration_mins
    ? `${Math.floor(title.duration_mins / 60)}h ${title.duration_mins % 60}m`
    : null

  let seasonsWithEpisodes = []
  if (title.type === 'series') {
    const seasonsData = await getSeasons(id)
    seasonsWithEpisodes = await Promise.all(
      seasonsData.map(async (season) => {
        const episodes = await getEpisodes(season.id)
        return { ...season, episodes }
      })
    )
  }

  let playLink = `/watch/${title.id}`
  let playText = 'Play'

  if (title.type === 'series') {
    const [seriesProgress, firstEpisode] = await Promise.all([
      getSeriesProgress(id),
      getFirstEpisode(id)
    ])

    if (seriesProgress?.episodes) {
      const ep = seriesProgress.episodes as any
      playLink = `/watch/episode/${ep.id}`
      playText = `Continue Watching S${ep.seasons?.number}E${ep.number}`
    } else if (firstEpisode) {
      const ep = firstEpisode as any
      playLink = `/watch/episode/${ep.id}`
      playText = `Play S${ep.seasons?.number}E${ep.number}`
    }
  }

  return (
    <>
      <main className="bg-strivo-bg min-h-screen">
        <section className="relative h-[60vh] min-h-[400px] overflow-hidden">
          {title.backdrop_path && (
            <Image
              src={title.backdrop_path}
              alt=""
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-strivo-bg via-strivo-bg/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-strivo-bg/60 to-transparent" />
        </section>

        <div className="max-w-content mx-auto px-8 -mt-48 relative z-10 pb-20">
          <div className="flex flex-col md:flex-row gap-10">
            <div
              className="relative w-40 sm:w-52 flex-shrink-0 aspect-[2/3] rounded-xl
                         overflow-hidden bg-strivo-surface shadow-2xl self-start"
            >
              {title.poster_path && (
                <Image
                  src={title.poster_path}
                  alt={title.title}
                  fill
                  className="object-cover"
                  sizes="208px"
                  priority
                />
              )}
            </div>

            <div className="flex-1 pt-2">
              <div className="flex flex-wrap gap-2 mb-4">
                {(title.genre ?? []).map((g) => (
                  <Link
                    key={g}
                    href={`/browse?genre=${encodeURIComponent(g)}`}
                    className="text-[11px] font-bold uppercase tracking-widest
                               text-strivo-accent border border-strivo-accent/40
                               px-2.5 py-1 rounded-full hover:bg-strivo-accent/10
                               transition-colors focus-visible:outline-none
                               focus-visible:ring-2 focus-visible:ring-strivo-accent"
                  >
                    {g}
                  </Link>
                ))}
                {(title.tags ?? []).map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-bold uppercase tracking-widest
                               text-white/40 border border-white/20
                               px-2.5 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-3">
                {title.title}
              </h1>

              <div className="flex flex-wrap gap-4 text-sm text-white/40 mb-6">
                {title.release_year && <span>{title.release_year}</span>}
                {duration && <span>{duration}</span>}
                {title.rating && (
                  <span className="border border-white/20 px-2 py-0.5 rounded text-xs">
                    {title.rating}
                  </span>
                )}
                <span className="capitalize">{title.type}</span>
              </div>

              <p className="text-white/70 leading-relaxed max-w-2xl mb-8">
                {title.description}
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={playLink}
                  className="flex items-center gap-2.5 bg-white text-black font-bold
                             px-8 py-3.5 rounded-lg text-sm hover:bg-white/90
                             transition-colors focus-visible:outline-none
                             focus-visible:ring-2 focus-visible:ring-white"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                    <path d="M4 2.5l10 5.5-10 5.5V2.5z" />
                  </svg>
                  {playText}
                </Link>

                <form
                  action={async () => {
                    'use server'
                    await toggleWatchlist(title.id, inWatchlist)
                  }}
                >
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20
                               text-white font-semibold px-6 py-3.5 rounded-lg text-sm
                               border border-white/10 transition-colors cursor-pointer
                               focus-visible:outline-none focus-visible:ring-2
                               focus-visible:ring-strivo-accent"
                  >
                    <span aria-hidden>{inWatchlist ? '✓' : '+'}</span>
                    {inWatchlist ? 'In My List' : 'Add to My List'}
                  </button>
                </form>

                <form action={createPartyRoom.bind(null, title.id)}>
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-strivo-accent/10
                               hover:bg-strivo-accent/20 text-strivo-accent font-semibold
                               px-6 py-3.5 rounded-lg text-sm border border-strivo-accent/30
                               transition-colors cursor-pointer
                               focus-visible:outline-none focus-visible:ring-2
                               focus-visible:ring-strivo-accent"
                  >
                    ◈ Watch Party
                  </button>
                </form>
              </div>
            </div>
          </div>

          {title.type === 'series' && seasonsWithEpisodes.length > 0 && (
            <EpisodeSelector seasons={seasonsWithEpisodes} />
          )}

          {related.length > 0 && (
            <div className="mt-16">
              <Suspense fallback={null}>
                <ContentRow heading="More like this" titles={related} watchlistIds={watchlistIds} />
              </Suspense>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
