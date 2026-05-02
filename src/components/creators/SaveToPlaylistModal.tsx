'use client'

import { useState, useEffect, useTransition } from 'react'
import type { Playlist } from '@/types/creators'

interface Props {
  videoId: string
  isOpen: boolean
  onClose: () => void
}

export default function SaveToPlaylistModal({ videoId, isOpen, onClose }: Props) {
  const [playlists, setPlaylists]    = useState<Playlist[]>([])
  const [saved, setSaved]            = useState<Set<string>>(new Set())
  const [newName, setNewName]        = useState('')
  const [creating, setCreating]      = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!isOpen) return
    fetch(`/api/creators/playlists?videoId=${videoId}`)
      .then(r => r.json())
      .then(data => {
        setPlaylists(data.playlists ?? [])
        setSaved(new Set(data.savedIds ?? []))
      })
  }, [isOpen, videoId])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    if (isOpen) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  function togglePlaylist(playlistId: string) {
    const isSaved = saved.has(playlistId)
    setSaved(prev => { const next = new Set(prev); isSaved ? next.delete(playlistId) : next.add(playlistId); return next })
    startTransition(async () => {
      await fetch(`/api/creators/playlists/${playlistId}/videos`, {
        method: isSaved ? 'DELETE' : 'POST',
        body: JSON.stringify({ video_id: videoId }),
        headers: { 'Content-Type': 'application/json' },
      })
    })
  }

  async function createPlaylist() {
    if (!newName.trim()) return
    const res = await fetch('/api/creators/playlists', {
      method: 'POST',
      body: JSON.stringify({ name: newName.trim() }),
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    if (data.playlist) {
      setPlaylists(prev => [data.playlist, ...prev])
      togglePlaylist(data.playlist.id)
      setNewName('')
      setCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label="Save to playlist"
           className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-full max-w-sm bg-cinema-surface border border-white/10
                      rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-white text-base font-semibold">Save to playlist</h2>
          <button onClick={onClose} aria-label="Close"
                  className="text-white/40 hover:text-white transition-colors cursor-pointer
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent rounded">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor"
                 strokeWidth="2" aria-hidden>
              <path d="M1 1l16 16M17 1L1 17"/>
            </svg>
          </button>
        </div>
        <ul className="max-h-64 overflow-y-auto divide-y divide-white/[0.04]">
          {playlists.map(pl => {
            const isSaved = saved.has(pl.id)
            return (
              <li key={pl.id}>
                <button onClick={() => togglePlaylist(pl.id)} disabled={isPending}
                        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/5
                                   transition-colors cursor-pointer text-left
                                   focus-visible:outline-none focus-visible:bg-white/5">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${isSaved ? 'bg-cinema-accent border-cinema-accent' : 'border-white/20'}`} aria-hidden>
                    {isSaved && (
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="white" strokeWidth="2.5">
                        <path d="M1.5 5.5l3 3 5-5"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-white text-sm">{pl.name}</span>
                  <span className="text-white/30 text-xs ml-auto">{pl.video_count}</span>
                </button>
              </li>
            )
          })}
        </ul>
        <div className="px-5 py-4 border-t border-white/[0.06]">
          {creating ? (
            <div className="flex gap-2">
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                     onKeyDown={e => e.key === 'Enter' && createPlaylist()}
                     placeholder="Playlist name" autoFocus
                     className="flex-1 bg-cinema-bg border border-white/10 rounded-lg px-3 py-2
                                text-white text-sm placeholder:text-white/30 outline-none
                                focus:border-cinema-accent/50 transition-colors"
                     aria-label="New playlist name" />
              <button onClick={createPlaylist} disabled={!newName.trim()}
                      className="px-3 py-2 bg-cinema-accent text-white text-xs font-semibold
                                 rounded-lg cursor-pointer disabled:opacity-50
                                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent">
                Create
              </button>
            </div>
          ) : (
            <button onClick={() => setCreating(true)}
                    className="flex items-center gap-2 text-cinema-accent text-sm font-medium
                               hover:text-white transition-colors cursor-pointer
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent rounded">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"
                   strokeWidth="2" aria-hidden>
                <path d="M8 2v12M2 8h12" strokeLinecap="round"/>
              </svg>
              New playlist
            </button>
          )}
        </div>
      </div>
    </>
  )
}