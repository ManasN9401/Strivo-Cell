import Image from 'next/image'
import Link from 'next/link'
import type { Title } from '@/types'

interface Item { title: Title; progress_secs: number; duration_mins: number | null }

export default function ContinueWatchingRow({ items }: { items: Item[] }) {
  if (!items.length) return null

  return (
    <section className="max-w-content mx-auto px-8 pt-10 pb-2">
      <h2 className="text-xl font-semibold tracking-tight mb-4">Continue Watching</h2>
      <div className="flex gap-4 overflow-x-auto pb-2
                      [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map(({ title, progress_secs, duration_mins }) => {
          const pct = duration_mins
            ? Math.min((progress_secs / (duration_mins * 60)) * 100, 100) : 0

          return (
            <Link
              key={title.id}
              href={`/watch/${title.id}`}
              className="group flex-shrink-0 w-[220px]
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-strivo-accent rounded-lg"
            >
              <div className="relative aspect-video rounded-lg overflow-hidden bg-strivo-surface
                              transition-transform duration-200 group-hover:scale-105">
                {title.poster_path && (
                  <Image src={title.poster_path} alt={title.title} fill
                    className="object-cover" sizes="220px" />
                )}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50
                                transition-colors flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm
                                  flex items-center justify-center
                                  opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="white" aria-hidden>
                      <path d="M3 1.5l9 5.5-9 5.5V1.5z" />
                    </svg>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-white/20">
                  <div className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-cyan-200 shadow-[0_0_8px_rgba(34,211,238,0.5)]" style={{ width: `${pct.toFixed(1)}%` }} />
                </div>
              </div>
              <div className="mt-2 px-0.5">
                <p className="text-white text-xs font-semibold truncate
                              group-hover:text-strivo-accent transition-colors">
                  {title.title}
                </p>
                <p className="text-white/40 text-[10px] mt-0.5">{Math.round(pct)}% watched</p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
