import { Suspense } from 'react'
import MovieCard    from '@/components/MovieCard'
import Footer       from '@/components/Footer'
import { getWatchlist } from '@/lib/supabase/queries'

export const metadata = { title: 'My List' }

async function LibraryGrid() {
  const entries = await getWatchlist()

  if (!entries.length) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-16 h-16 rounded-full bg-strivo-surface border border-white/10
                        flex items-center justify-center text-3xl mb-6 text-white/20">
          +
        </div>
        <h2 className="text-xl font-semibold mb-2">Your list is empty</h2>
        <p className="text-white/40 text-sm max-w-xs leading-relaxed">
          Browse titles and tap <strong className="text-white font-semibold">+ My List</strong> on
          any card to save it here for later.
        </p>
      </div>
    )
  }

  const watchlistIds = new Set(entries.map(e => e.title_id))

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {entries.map((entry, i) => (
        <MovieCard key={entry.id} title={entry.titles} inWatchlist={watchlistIds.has(entry.title_id)}
                   priority={i < 6}/>
      ))}
    </div>
  )
}

export default function LibraryPage() {
  return (
    <>
      <main className="bg-strivo-bg min-h-screen pt-20">
        <div className="max-w-content mx-auto px-8 py-8">
          <h1 className="text-4xl font-black tracking-tight mb-1">My List</h1>
          <p className="text-white/40 text-sm mb-10">Saved titles, ready to watch</p>
          <Suspense fallback={
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-strivo-surface rounded-lg animate-pulse"
                     style={{ animationDelay: `${i * 50}ms` }}/>
              ))}
            </div>
          }>
            <LibraryGrid/>
          </Suspense>
        </div>
      </main>
      <Footer/>
    </>
  )
}
