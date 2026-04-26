'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import type { MouseEvent } from 'react'
import { toggleWatchlist } from '@/lib/actions/watchlist'
import type { Title } from '@/types'

interface Props {
  title: Title
  inWatchlist?: boolean
  priority?: boolean
}

function fmt(mins: number | null, type: string) {
  if (!mins) return type === 'series' ? 'Series' : '—'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function MovieCard({
  title,
  inWatchlist = false,
  priority = false,
}: Props) {
  const [isInList, setIsInList] = useState(inWatchlist)
  const [isPending, startTransition] = useTransition()

  function handleWatchlist(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.stopPropagation()

    setIsInList((p) => !p)

    startTransition(async () => {
      const res = await toggleWatchlist(title.id, isInList)
      if (!res.success) setIsInList(isInList)
    })
  }

  return (
    <article
      className="group relative flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px]
                 rounded-lg overflow-hidden
                 transition-transform duration-200 ease-in-out
                 hover:scale-105 hover:z-10 focus-within:scale-105 focus-within:z-10"
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] bg-cinema-surface">
        {title.poster_path ? (
          <Image
            src={title.poster_path}
            alt={title.title}
            fill
            sizes="(max-width:640px) 160px, (max-width:768px) 180px, 200px"
            className="object-cover"
            priority={priority}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center
                       text-white/20 text-xs text-center p-3"
          >
            {title.title}
          </div>
        )}

        {/* Main poster click area. This is a sibling, not a parent, of the action links. */}
        <Link
          href={`/titles/${title.id}`}
          aria-label={`View details for ${title.title}`}
          className="absolute inset-0 z-10"
        >
          <span className="sr-only">View details for {title.title}</span>
        </Link>

        {/* Rating badge */}
        <span
          className="absolute top-2 left-2 z-20 bg-black/60 text-white/80
                     text-[10px] font-semibold px-1.5 py-0.5 rounded pointer-events-none"
        >
          {title.rating}
        </span>

        {/* Hover overlay */}
        <div
          className="absolute inset-0 z-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent
                     opacity-0 group-hover:opacity-100 transition-opacity duration-200
                     flex flex-col justify-end p-3 gap-2 pointer-events-none"
        >
          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {(title.tags ?? []).slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[9px] font-bold tracking-wider text-white/80
                           border border-white/30 rounded px-1.5 py-0.5 uppercase"
              >
                {tag}
              </span>
            ))}
          </div>

          <p className="text-white/50 text-[10px]">
            {fmt(title.duration_mins, title.type)}
          </p>

          {/* Action buttons */}
          <div className="flex gap-1.5 flex-wrap pointer-events-auto">
            <Link
              href={`/watch/${title.id}`}
              className="flex items-center gap-1 bg-white text-black text-[10px] font-bold
                         px-2 py-1.5 rounded-md transition-colors hover:bg-white/90
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" aria-hidden>
                <path d="M1 1l6 3-6 3V1z" />
              </svg>
              Play
            </Link>

            <button
              onClick={handleWatchlist}
              disabled={isPending}
              aria-label={
                isInList
                  ? `Remove ${title.title} from My List`
                  : `Add ${title.title} to My List`
              }
              className="flex items-center gap-1 bg-white/10 hover:bg-white/20
                         text-white text-[10px] font-semibold px-2 py-1.5 rounded-md
                         transition-colors disabled:opacity-50 cursor-pointer
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent"
            >
              <span aria-hidden>{isInList ? '✓' : '+'}</span>
              {isInList ? 'Saved' : 'My List'}
            </button>

            <Link
              href={`/party/new?title=${title.id}`}
              className="flex items-center gap-1 bg-cinema-accent/20 hover:bg-cinema-accent/40
                         text-cinema-accent text-[10px] font-semibold px-2 py-1.5 rounded-md
                         transition-colors focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-cinema-accent"
            >
              ◈ Party
            </Link>
          </div>
        </div>
      </div>

      {/* Card footer */}
      <Link
        href={`/titles/${title.id}`}
        className="block bg-cinema-surface px-2.5 py-2 focus-visible:outline-none
                   focus-visible:ring-2 focus-visible:ring-cinema-accent"
      >
        <p className="text-white text-xs font-semibold truncate">{title.title}</p>
        <p className="text-white/40 text-[10px] mt-0.5">
          {title.release_year} · {title.genre?.[0] ?? 'Unknown'}
        </p>
      </Link>
    </article>
  )
}