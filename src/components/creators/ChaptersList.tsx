'use client'

import { useState } from 'react'
import type { Chapter } from '@/types/creators'

interface Props {
  chapters: Chapter[]
  currentTime?: number
  onSeek?: (seconds: number) => void
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function ChaptersList({ chapters, currentTime = 0, onSeek }: Props) {
  const [expanded, setExpanded] = useState(true)
  if (chapters.length === 0) return null

  const activeIndex = chapters.reduce((acc, ch, i) =>
    currentTime >= ch.timestamp_seconds ? i : acc, 0)

  return (
    <section aria-label="Video chapters" className="bg-strivo-surface rounded-xl overflow-hidden">
      <button onClick={() => setExpanded(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 cursor-pointer
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strivo-accent
                         hover:bg-white/5 transition-colors"
              aria-expanded={expanded}>
        <span className="text-white text-sm font-semibold">
          Chapters <span className="text-white/40 font-normal">({chapters.length})</span>
        </span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"
             strokeWidth="2" aria-hidden
             className={`text-white/40 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
          <path d="M3 6l5 5 5-5"/>
        </svg>
      </button>
      {expanded && (
        <ul className="divide-y divide-white/[0.04]">
          {chapters.map((ch, i) => {
            const isActive = i === activeIndex
            return (
              <li key={ch.id}>
                <button onClick={() => onSeek?.(ch.timestamp_seconds)}
                        className={[
                          'w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer',
                          'transition-colors duration-150 hover:bg-white/5',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strivo-accent',
                          isActive ? 'bg-strivo-accent/10' : '',
                        ].join(' ')}
                        aria-current={isActive ? 'true' : undefined}>
                  <div className={`w-1 h-6 rounded-full shrink-0 transition-colors ${isActive ? 'bg-strivo-accent' : 'bg-transparent'}`} aria-hidden />
                  <span className="text-strivo-accent font-mono text-xs shrink-0 w-10">
                    {formatTime(ch.timestamp_seconds)}
                  </span>
                  <span className={`text-sm truncate transition-colors ${isActive ? 'text-white font-medium' : 'text-white/60'}`}>
                    {ch.label}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}