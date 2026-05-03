'use client'

import Link from 'next/link'
import { useRef, useState, useCallback, useEffect } from 'react'
import MovieCard from './MovieCard'
import type { Title } from '@/types'

interface Props {
  heading: string
  titles: Title[]
  watchlistIds?: Set<string>
  watchedTitleIds?: Set<string>
  browseHref?: string
}

export default function ContentRow({
  heading,
  titles,
  watchlistIds = new Set(),
  watchedTitleIds = new Set(),
  browseHref,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(true)

  const sync = useCallback(() => {
    const el = scrollRef.current
    if (!el) return

    setCanLeft(el.scrollLeft > 8)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    sync()

    el.addEventListener('scroll', sync, { passive: true })

    const ro = new ResizeObserver(sync)
    ro.observe(el)

    return () => {
      el.removeEventListener('scroll', sync)
      ro.disconnect()
    }
  }, [sync])

  function scroll(dir: 'left' | 'right') {
    const el = scrollRef.current
    if (!el) return

    el.scrollBy({
      left: el.clientWidth * 0.8 * (dir === 'left' ? -1 : 1),
      behavior: 'smooth',
    })
  }

  if (!titles.length) return null

  const ArrowBtn = ({ dir }: { dir: 'left' | 'right' }) => (
    <button
      onClick={() => scroll(dir)}
      aria-label={`Scroll ${dir}`}
      className="w-9 h-9 rounded-full bg-black/70 hover:bg-strivo-accent
                 border border-white/20 hover:border-strivo-accent
                 text-white flex items-center justify-center
                 transition-colors duration-150 cursor-pointer
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strivo-accent"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        {dir === 'left' ? (
          <path d="M10 3L5 8L10 13" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M6 3L11 8L6 13" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  )

  return (
    <section className="group/row py-4">
      <div className="flex items-baseline gap-4 px-8 mb-3 max-w-content mx-auto">
        <h2 className="text-xl font-semibold tracking-tight">{heading}</h2>

        {browseHref && (
          <Link
            href={browseHref}
            className="text-xs font-medium text-blue-400 hover:underline
                       opacity-0 group-hover/row:opacity-100 transition-opacity
                       focus-visible:opacity-100 focus-visible:outline-none drop-shadow-[0_0_4px_rgba(34,211,238,0.3)]"
          >
            See all →
          </Link>
        )}
      </div>

      <div className="relative">
        <div
          className={`absolute left-0 top-0 bottom-4 w-20 z-10 pointer-events-none
                      bg-gradient-to-r from-strivo-bg to-transparent
                      flex items-center justify-start pl-2 transition-opacity duration-200
                      ${canLeft
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
            }`}
        >
          <ArrowBtn dir="left" />
        </div>

        <div
          ref={scrollRef}
          role="list"
          aria-label={`${heading} titles`}
          className="flex gap-3 overflow-x-auto scroll-smooth px-8 pb-4
                     [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {titles.map((title, i) => (
            <div key={title.id} role="listitem">
              <MovieCard
                title={title}
                inWatchlist={watchlistIds.has(title.id)}
                watched={watchedTitleIds.has(title.id)}
                priority={i < 4}
              />
            </div>
          ))}
        </div>

        <div
          className={`absolute right-0 top-0 bottom-4 w-20 z-10
                      bg-gradient-to-l from-strivo-bg to-transparent
                      flex items-center justify-end pr-2 transition-opacity duration-200
                      ${canRight
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
            }`}
        >
          <ArrowBtn dir="right" />
        </div>
      </div>
    </section>
  )
}