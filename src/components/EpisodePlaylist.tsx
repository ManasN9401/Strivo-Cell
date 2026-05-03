'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef } from 'react'

interface Episode {
  id: string
  number: number
  title: string
  description?: string | null
  duration_mins?: number | null
  thumbnail_path?: string | null
  seasons: {
    number: number
  }
}

interface Props {
  episodes: Episode[]
  currentEpisodeId: string
  showTitle: string
}

export default function EpisodePlaylist({ episodes, currentEpisodeId, showTitle }: Props) {
  const currentIndex = episodes.findIndex(e => e.id === currentEpisodeId)
  const nextEpisode = currentIndex >= 0 && currentIndex < episodes.length - 1
    ? episodes[currentIndex + 1]
    : null

  const currentRef = useRef<HTMLAnchorElement>(null)

  // Scroll the current episode into view on mount
  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [currentEpisodeId])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-white font-bold text-lg tracking-tight">Episodes</h2>
        <span className="text-white/40 text-sm">{episodes.length} episodes</span>
      </div>

      {/* Next episode button */}
      {nextEpisode && (
        <Link
          href={`/watch/episode/${nextEpisode.id}`}
          className="group flex items-center gap-3 bg-strivo-accent/10 hover:bg-strivo-accent/20
                     border border-strivo-accent/30 hover:border-strivo-accent/60
                     rounded-xl px-4 py-3 mb-5 transition-all duration-200 flex-shrink-0"
        >
          <div className="w-8 h-8 rounded-full bg-strivo-accent/20 flex items-center justify-center
                          group-hover:bg-strivo-accent/40 transition-colors flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" className="text-strivo-accent ml-0.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-strivo-accent text-[11px] font-semibold uppercase tracking-widest">Up Next</p>
            <p className="text-white text-sm font-medium truncate">
              S{nextEpisode.seasons.number}E{nextEpisode.number}: {nextEpisode.title}
            </p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" className="text-white/30 group-hover:text-strivo-accent ml-auto flex-shrink-0 transition-colors">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
      )}

      {/* Episode list */}
      <div className="overflow-y-auto flex-1 space-y-1 pr-1
                      [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]
                      [&::-webkit-scrollbar]:w-1
                      [&::-webkit-scrollbar-track]:bg-transparent
                      [&::-webkit-scrollbar-thumb]:bg-white/10
                      [&::-webkit-scrollbar-thumb]:rounded-full">
        {episodes.map(ep => {
          const isCurrent = ep.id === currentEpisodeId

          return (
            <Link
              key={ep.id}
              href={`/watch/episode/${ep.id}`}
              ref={isCurrent ? currentRef : undefined}
              className={`group flex gap-3 p-2.5 rounded-xl transition-all duration-150
                ${isCurrent
                  ? 'bg-white/10 border border-white/15'
                  : 'hover:bg-white/5 border border-transparent hover:border-white/10'
                }`}
            >
              {/* Thumbnail */}
              <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-strivo-surface flex-shrink-0">
                {ep.thumbnail_path ? (
                  <Image src={ep.thumbnail_path} alt={ep.title} fill className="object-cover" sizes="96px" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isCurrent ? (
                      <div className="flex gap-0.5 items-end">
                        {[3, 5, 4].map((h, i) => (
                          <span key={i} className="w-0.5 bg-strivo-accent rounded-full animate-pulse"
                            style={{ height: `${h * 3}px`, animationDelay: `${i * 150}ms` }} />
                        ))}
                      </div>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" className="text-white/20">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    )}
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute inset-0 ring-2 ring-strivo-accent/60 rounded-lg" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 py-0.5">
                <div className="flex items-start gap-1">
                  <span className={`text-[11px] font-semibold flex-shrink-0 mt-0.5
                    ${isCurrent ? 'text-strivo-accent' : 'text-white/40'}`}>
                    {ep.seasons.number}×{String(ep.number).padStart(2, '0')}
                  </span>
                </div>
                <p className={`text-sm font-medium truncate leading-snug
                  ${isCurrent ? 'text-white' : 'text-white/70 group-hover:text-white transition-colors'}`}>
                  {ep.title}
                </p>
                {ep.duration_mins && (
                  <p className="text-white/30 text-[10px] mt-0.5">{ep.duration_mins}m</p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
