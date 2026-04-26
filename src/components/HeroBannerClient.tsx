'use client'

import Image       from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Title } from '@/types'

const ROTATION_MS = 7000

export default function HeroBannerClient({ titles }: { titles: Title[] }) {
  const router  = useRouter()
  const [current,   setCurrent]   = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  const goTo = useCallback((index: number) => {
    setIsVisible(false)
    setTimeout(() => { setCurrent(index); setIsVisible(true) }, 350)
  }, [])

  useEffect(() => {
    if (titles.length <= 1) return
    const id = setInterval(() => goTo((current + 1) % titles.length), ROTATION_MS)
    return () => clearInterval(id)
  }, [current, titles.length, goTo])

  if (!titles.length) return null
  const t = titles[current]

  return (
    <section
      className="relative w-full h-[88vh] min-h-[560px] flex items-end overflow-hidden"
      aria-label="Featured content"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: isVisible ? 1 : 0 }}
      >
        {t.backdrop_path && (
          <Image
            key={t.id}
            src={t.backdrop_path}
            alt=""
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-bg via-cinema-bg/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-cinema-bg/80 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div
        className="relative max-w-content mx-auto px-8 pb-20 w-full transition-opacity duration-500"
        style={{ opacity: isVisible ? 1 : 0 }}
      >
        {/* Genre + tag pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {t.genre?.slice(0, 2).map(g => (
            <span key={g} className="text-[11px] font-bold uppercase tracking-widest
                                      text-cinema-accent border border-cinema-accent/40
                                      px-2.5 py-1 rounded-full">
              {g}
            </span>
          ))}
          {t.tags?.includes('4K') && (
            <span className="text-[11px] font-bold uppercase tracking-widest
                              text-white/40 border border-white/20 px-2.5 py-1 rounded-full">
              4K HDR
            </span>
          )}
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter
                       text-white max-w-2xl leading-none mb-4">
          {t.title}
        </h1>
        <p className="text-white/70 max-w-xl text-sm sm:text-base leading-relaxed mb-8 line-clamp-3">
          {t.description}
        </p>

        {/* CTAs */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => router.push(`/watch/${t.id}`)}
            className="flex items-center gap-2.5 bg-white text-black font-bold
                       px-7 py-3.5 rounded-lg text-sm hover:bg-white/90
                       active:scale-[0.98] transition-all duration-150 cursor-pointer
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
              <path d="M4 2.5l10 5.5-10 5.5V2.5z"/>
            </svg>
            Play
          </button>
          <button
            onClick={() => router.push(`/titles/${t.id}`)}
            className="flex items-center gap-2.5 bg-white/20 hover:bg-white/30 text-white
                       font-bold px-7 py-3.5 rounded-lg text-sm backdrop-blur-sm
                       border border-white/20 active:scale-[0.98] transition-all duration-150
                       cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                 stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="8" cy="8" r="6"/>
              <path d="M8 5v3M8 10.5v.5"/>
            </svg>
            More info
          </button>
        </div>

        {/* Dot indicators */}
        {titles.length > 1 && (
          <div className="flex gap-2 mt-8" role="tablist" aria-label="Featured titles">
            {titles.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === current}
                aria-label={`Show featured title ${i + 1}`}
                onClick={() => goTo(i)}
                className={[
                  'h-0.5 rounded-full transition-all duration-300 cursor-pointer',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent',
                  i === current ? 'w-8 bg-cinema-accent' : 'w-4 bg-white/30 hover:bg-white/50',
                ].join(' ')}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
