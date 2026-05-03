'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Video } from '@/types/creators'

interface Props {
  initialVideos: Video[]
}

const VISIBILITY_LABELS: Record<Video['visibility'], { label: string; colour: string }> = {
  public:   { label: 'Public',   colour: 'text-green-400' },
  unlisted: { label: 'Unlisted', colour: 'text-yellow-400' },
  private:  { label: 'Private',  colour: 'text-white/40' },
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K`
  return String(n)
}

export default function ManageVideosTable({ initialVideos }: Props) {
  const [videos, setVideos]     = useState(initialVideos)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function deleteVideo(id: string) {
    if (!confirm('Delete this video? This cannot be undone.')) return
    setDeletingId(id)
    startTransition(async () => {
      await fetch(`/api/creators/videos/${id}`, { method: 'DELETE' })
      setVideos(prev => prev.filter(v => v.id !== id))
      setDeletingId(null)
    })
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-16 text-white/30 text-sm">
        No videos uploaded yet.{' '}
        <Link href="/creators/dashboard/upload" className="text-strivo-accent hover:underline">
          Upload your first video
        </Link>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
      <table className="w-full min-w-[640px] text-sm" aria-label="Your uploaded videos">
        <thead>
          <tr className="border-b border-white/[0.06]">
            {['Video', 'Visibility', 'Views', 'Date', ''].map(h => (
              <th key={h} scope="col"
                  className="px-4 py-3 text-left text-white/40 text-xs font-semibold uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {videos.map(video => {
            const vis = VISIBILITY_LABELS[video.visibility]
            const isDeleting = deletingId === video.id
            return (
              <tr key={video.id}
                  className={`group transition-colors hover:bg-white/[0.02] ${isDeleting ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative aspect-video w-24 bg-strivo-surface rounded-lg overflow-hidden shrink-0">
                      {video.thumbnail_url ? (
                        <Image src={video.thumbnail_url} alt="" fill sizes="96px" className="object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"
                               className="text-white/20" aria-hidden>
                            <polygon points="5 3 19 12 5 21 5 3"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link href={`/watch/${video.id}`}
                            className="text-white font-medium line-clamp-2 hover:text-strivo-accent
                                       transition-colors focus-visible:outline-none focus-visible:ring-2
                                       focus-visible:ring-strivo-accent rounded">
                        {video.title}
                      </Link>
                      {video.tags.length > 0 && (
                        <p className="text-white/30 text-xs mt-0.5 truncate">
                          {video.tags.map(t => `#${t}`).join(' ')}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${vis.colour}`}>{vis.label}</span>
                </td>
                <td className="px-4 py-3 text-white/60">{formatCount(video.views)}</td>
                <td className="px-4 py-3 text-white/40 text-xs whitespace-nowrap">
                  {new Date(video.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100
                                  focus-within:opacity-100 transition-opacity">
                    <Link href={`/creators/dashboard/edit/${video.id}`}
                          className="text-white/50 hover:text-white text-xs px-2 py-1 rounded
                                     transition-colors focus-visible:outline-none focus-visible:ring-2
                                     focus-visible:ring-strivo-accent">
                      Edit
                    </Link>
                    <button onClick={() => deleteVideo(video.id)} disabled={isPending}
                            aria-label={`Delete ${video.title}`}
                            className="text-white/30 hover:text-red-400 text-xs px-2 py-1 rounded
                                       transition-colors cursor-pointer disabled:cursor-not-allowed
                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strivo-accent">
                      {isDeleting ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}