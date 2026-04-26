import Image from 'next/image'
import Link  from 'next/link'
import type { Title } from '@/types'

export default function UpNext({ titles, currentId }: { titles: Title[]; currentId: string }) {
  const items = titles.filter(t => t.id !== currentId).slice(0, 6)
  if (!items.length) return null

  return (
    <aside aria-label="Up next">
      <h2 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-4">Up Next</h2>
      <ul className="space-y-2">
        {items.map(t => (
          <li key={t.id}>
            <Link
              href={`/watch/${t.id}`}
              className="flex gap-3 group/up rounded-lg p-2 -mx-2
                         hover:bg-cinema-surface transition-colors duration-150
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent"
            >
              <div className="relative w-28 aspect-video flex-shrink-0 rounded-md overflow-hidden bg-cinema-surface">
                {t.poster_path && (
                  <Image src={t.poster_path} alt="" fill className="object-cover" sizes="112px"/>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/up:opacity-100
                                transition-opacity flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="white" aria-hidden>
                    <path d="M4 2l12 7-12 7V2z"/>
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                <p className="text-white text-sm font-semibold truncate
                              group-hover/up:text-cinema-accent transition-colors">{t.title}</p>
                <p className="text-white/40 text-xs mt-0.5">
                  {t.release_year} · {t.genre[0]}
                  {t.duration_mins && ` · ${Math.floor(t.duration_mins/60)}h ${t.duration_mins%60}m`}
                </p>
                {t.tags.includes('4K') && (
                  <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider
                                   border border-white/20 text-white/40 px-1.5 py-0.5 rounded">4K</span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  )
}
