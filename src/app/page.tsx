import { Suspense } from 'react'
import HeroBanner from '@/components/HeroBanner'
import ContentRow from '@/components/ContentRow'
import ContinueWatchingRow from '@/components/ContinueWatchingRow'
import Footer from '@/components/Footer'
import {
  getTitlesByGenre,
  getNewTitles,
  getWatchlistIds,
  getContinueWatching,
  getWatchedTitleIds,
} from '@/lib/supabase/queries'

function RowSkeleton() {
  return (
    <section className="py-4 max-w-content mx-auto px-8">
      <div className="h-6 w-40 bg-strivo-surface rounded animate-pulse mb-4" />
      <div className="flex gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-[200px] aspect-[2/3] bg-strivo-surface rounded-lg animate-pulse"
            style={{ animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
    </section>
  )
}

async function HomeRows() {
  const [
    action,
    scifi,
    drama,
    thriller,
    horror,
    newTitles,
    watchlistIds,
    watchedTitleIds,
    continueItems,
  ] = await Promise.all([
    getTitlesByGenre('Action'),
    getTitlesByGenre('Sci-Fi'),
    getTitlesByGenre('Drama'),
    getTitlesByGenre('Thriller'),
    getTitlesByGenre('Horror'),
    getNewTitles(),
    getWatchlistIds(),
    getWatchedTitleIds(),
    getContinueWatching(),
  ])

  const rows = [
    { heading: 'New on Strivo Cell', titles: newTitles, genre: null },
    { heading: 'Action', titles: action, genre: 'Action' },
    { heading: 'Science Fiction', titles: scifi, genre: 'Sci-Fi' },
    { heading: 'Drama', titles: drama, genre: 'Drama' },
    { heading: 'Thriller', titles: thriller, genre: 'Thriller' },
    { heading: 'Horror', titles: horror, genre: 'Horror' },
  ]

  return (
    <>
      <ContinueWatchingRow items={continueItems} />

      {rows.map(({ heading, titles, genre }) =>
        titles.length ? (
          <ContentRow
            key={heading}
            heading={heading}
            titles={titles}
            watchlistIds={watchlistIds}
            watchedTitleIds={watchedTitleIds}
            browseHref={genre ? `/browse?genre=${genre}` : '/browse'}
          />
        ) : null
      )}
    </>
  )
}

export default function HomePage() {
  return (
    <>
      <main className="bg-strivo-bg min-h-screen">
        <Suspense fallback={<div className="h-[88vh] bg-strivo-surface/20 animate-pulse" />}>
          <HeroBanner />
        </Suspense>

        <div className="pb-20">
          <Suspense fallback={<><RowSkeleton /><RowSkeleton /><RowSkeleton /></>}>
            <HomeRows />
          </Suspense>
        </div>
      </main>

      <Footer />
    </>
  )
}