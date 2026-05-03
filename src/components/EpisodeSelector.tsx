'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Episode {
  id: string
  number: number
  title: string
  description?: string | null
  duration_mins?: number | null
  thumbnail_path?: string | null
}

interface Season {
  id: string
  number: number
  episodes: Episode[]
}

interface Props {
  seasons: Season[]
}

export default function EpisodeSelector({ seasons }: Props) {
  const [activeSeasonId, setActiveSeasonId] = useState(seasons[0]?.id)
  
  if (!seasons || seasons.length === 0) return null

  const activeSeason = seasons.find(s => s.id === activeSeasonId)

  return (
    <div className="mt-12 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white tracking-tight">Episodes</h2>
        {seasons.length > 1 && (
          <select 
            value={activeSeasonId}
            onChange={(e) => setActiveSeasonId(e.target.value)}
            className="bg-strivo-surface text-white border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:border-strivo-accent focus:ring-1 focus:ring-strivo-accent transition-colors cursor-pointer"
          >
            {seasons.map(s => (
              <option key={s.id} value={s.id}>Season {s.number}</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid gap-4">
        {activeSeason?.episodes.map(episode => (
          <Link 
            key={episode.id} 
            href={`/watch/episode/${episode.id}`}
            className="group flex flex-col sm:flex-row gap-4 p-4 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strivo-accent"
          >
            <div className="relative w-full sm:w-48 aspect-video rounded-lg overflow-hidden bg-strivo-surface shrink-0">
              {episode.thumbnail_path ? (
                <Image
                  src={episode.thumbnail_path}
                  alt={episode.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, 192px"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white/20">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white" className="ml-1">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-white font-semibold text-lg truncate">
                  <span className="text-white/50 mr-2">{episode.number}.</span>
                  {episode.title}
                </h3>
                {episode.duration_mins && (
                  <span className="text-white/40 text-sm whitespace-nowrap">{episode.duration_mins}m</span>
                )}
              </div>
              <p className="text-white/60 text-sm mt-2 line-clamp-2 leading-relaxed">
                {episode.description ?? 'No description available.'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
