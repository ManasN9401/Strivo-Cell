'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter }  from 'next/navigation'
import Image          from 'next/image'
import type { Title } from '@/types'

export default function NavSearch() {
  const [open,    setOpen]    = useState(false)
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<Title[]>([])
  const [, startTransition]   = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const router   = useRouter()

  // Fetch results whenever query changes
  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return }
    const id = setTimeout(() => {
      startTransition(async () => {
        const res  = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.titles ?? [])
      })
    }, 250)
    return () => clearTimeout(id)
  }, [query])

  function openSearch() {
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function closeSearch() {
    setOpen(false)
    setQuery('')
    setResults([])
  }

  function navigate(id: string) {
    closeSearch()
    router.push(`/titles/${id}`)
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeSearch()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!open) {
    return (
      <button
        onClick={openSearch}
        aria-label="Search titles"
        className="text-white/60 hover:text-white transition-colors cursor-pointer
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent rounded"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
             stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="7.5" cy="7.5" r="5.5"/>
          <path d="M13 13l3 3" strokeLinecap="round"/>
        </svg>
      </button>
    )
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-cinema-surface border border-white/10
                      rounded-lg px-3 py-1.5 animate-scale-in">
        <svg width="14" height="14" viewBox="0 0 18 18" fill="none"
             stroke="currentColor" strokeWidth="2" className="text-white/40 shrink-0" aria-hidden>
          <circle cx="7.5" cy="7.5" r="5.5"/>
          <path d="M13 13l3 3" strokeLinecap="round"/>
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search titles…"
          className="bg-transparent text-white text-sm placeholder:text-white/30
                     outline-none w-40 sm:w-56"
          aria-label="Search titles"
          autoComplete="off"
        />
        <button
          onClick={closeSearch}
          aria-label="Close search"
          className="text-white/40 hover:text-white transition-colors cursor-pointer shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
               stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M1 1l12 12M13 1L1 13"/>
          </svg>
        </button>
      </div>

      {/* Results dropdown */}
      {results.length > 0 && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-cinema-surface
                        border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50
                        animate-scale-in">
          <ul role="listbox" aria-label="Search results">
            {results.map(t => (
              <li key={t.id} role="option">
                <button
                  onClick={() => navigate(t.id)}
                  className="w-full flex items-center gap-3 px-4 py-3
                             hover:bg-white/5 transition-colors cursor-pointer text-left
                             focus-visible:outline-none focus-visible:bg-white/5"
                >
                  <div className="relative w-10 aspect-[2/3] rounded overflow-hidden bg-black shrink-0">
                    {t.poster_path && (
                      <Image src={t.poster_path} alt="" fill className="object-cover" sizes="40px"/>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{t.title}</p>
                    <p className="text-white/40 text-xs">
                      {t.release_year} · {t.genre[0]}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {query.trim().length >= 2 && results.length === 0 && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-cinema-surface
                        border border-white/10 rounded-xl px-4 py-6 text-center
                        shadow-2xl z-50 animate-scale-in">
          <p className="text-white/40 text-sm">No results for "{query}"</p>
        </div>
      )}
    </div>
  )
}
