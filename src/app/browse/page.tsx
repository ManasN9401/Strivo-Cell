import { Suspense } from 'react'
import ContentRow from '@/components/ContentRow'
import Footer from '@/components/Footer'
import { getAllGenres, getTitlesByGenre, getWatchlistIds } from '@/lib/supabase/queries'

export const metadata = { title: 'Browse' }

interface Props {
  searchParams: Promise<{
    genre?: string
  }>
}

async function BrowseContent({ genre }: { genre?: string }) {
  const allGenres = await getAllGenres()
  const targets = genre ? [genre] : allGenres

  const [rows, watchlistIds] = await Promise.all([
    Promise.all(targets.map((g) => getTitlesByGenre(g).then((titles) => ({ genre: g, titles })))),
    getWatchlistIds(),
  ])

  return (
    <>
      {rows.map(({ genre: g, titles }) =>
        titles.length ? (
          <ContentRow
            key={g}
            heading={g}
            titles={titles}
            watchlistIds={watchlistIds}
            browseHref={`/browse?genre=${encodeURIComponent(g)}`}
          />
        ) : null
      )}
    </>
  )
}

export default async function BrowsePage({ searchParams }: Props) {
  const { genre } = await searchParams

  return (
    <>
      <main className="bg-strivo-bg min-h-screen pt-20">
        <div className="max-w-content mx-auto px-8 py-8">
          <h1 className="text-4xl font-black tracking-tight mb-2">Browse</h1>
          {genre && (
            <p className="text-white/40 text-sm mb-8">
              Showing: <span className="text-white font-semibold">{genre}</span>
            </p>
          )}
        </div>

        <Suspense
          fallback={
            <div className="max-w-content mx-auto px-8">
              <div className="h-6 w-32 bg-strivo-surface rounded animate-pulse mb-6" />
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[2/3] bg-strivo-surface rounded-lg animate-pulse"
                    style={{ animationDelay: `${i * 40}ms` }}
                  />
                ))}
              </div>
            </div>
          }
        >
          <BrowseContent genre={genre} />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
