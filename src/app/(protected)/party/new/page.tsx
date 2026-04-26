import Image from 'next/image'
import TopNavBar from '@/components/TopNavBar'
import Footer from '@/components/Footer'
import { createPartyRoom } from '@/lib/actions/party'
import { getNewTitles, getTitlesByGenre } from '@/lib/supabase/queries'

export const metadata = { title: 'Start a Watch Party' }

interface Props {
  searchParams: Promise<{
    title?: string
  }>
}

export default async function NewPartyPage({ searchParams }: Props) {
  const { title: titleId } = await searchParams

  if (titleId) {
    await createPartyRoom(titleId)
    return null
  }

  const [newTitles, action, scifi, drama] = await Promise.all([
    getNewTitles(12),
    getTitlesByGenre('Action', 8),
    getTitlesByGenre('Sci-Fi', 8),
    getTitlesByGenre('Drama', 8),
  ])

  const titles = [
    ...new Map(
      [...newTitles, ...action, ...scifi, ...drama].map((t) => [t.id, t])
    ).values(),
  ].slice(0, 24)

  return (
    <>
      <TopNavBar />

      <main className="bg-cinema-bg min-h-screen pt-20">
        <div className="max-w-content mx-auto px-8 py-12">
          <div className="mb-10">
            <h1 className="text-4xl font-black tracking-tight mb-2">
              Start a Watch Party
            </h1>
            <p className="text-white/40">
              Pick a title — you'll get a shareable link to invite friends in.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {titles.map((title) => (
              <form key={title.id} action={createPartyRoom.bind(null, title.id)}>
                <button
                  type="submit"
                  className="group w-full text-left cursor-pointer
                             focus-visible:outline-none focus-visible:ring-2
                             focus-visible:ring-cinema-accent rounded-lg"
                >
                  <div
                    className="relative aspect-[2/3] rounded-lg overflow-hidden bg-cinema-surface
                               transition-transform duration-200 group-hover:scale-105"
                  >
                    {title.poster_path && (
                      <Image
                        src={title.poster_path}
                        alt={title.title}
                        fill
                        className="object-cover"
                        sizes="200px"
                      />
                    )}

                    <div
                      className="absolute inset-0 bg-cinema-accent/0 group-hover:bg-cinema-accent/20
                                 transition-colors duration-200 flex items-center justify-center"
                    >
                      <div
                        className="w-11 h-11 rounded-full bg-cinema-accent flex items-center justify-center
                                   opacity-0 group-hover:opacity-100 transition-opacity shadow-xl"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="white" aria-hidden>
                          <path d="M4 1.5l10 6.5-10 6.5V1.5z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <p
                    className="mt-2 text-white text-xs font-semibold truncate px-0.5
                               group-hover:text-cinema-accent transition-colors"
                  >
                    {title.title}
                  </p>

                  <p className="text-white/30 text-[10px] px-0.5">
                    {title.genre?.[0] ?? 'Unknown'}
                  </p>
                </button>
              </form>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}