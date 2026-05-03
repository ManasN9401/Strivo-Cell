import Link from 'next/link'
import Image from 'next/image'
import type { Video } from '@/types/creators'

interface Props {
  videos: Video[]
  currentVideoId: string
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K`
  return String(n)
}

export default function RecommendedSidebar({ videos, currentVideoId }: Props) {
  const filtered = videos.filter(v => v.id !== currentVideoId).slice(0, 20)

  return (
    <aside aria-label="Recommended videos">
      <h2 className="text-white text-sm font-semibold mb-4">Up next</h2>
      <div className="space-y-3">
        {filtered.map(video => (
          <Link key={video.id} href={`/watch/${video.id}`}
                className="group flex gap-3 rounded-lg hover:bg-white/5 p-1.5 -mx-1.5
                           transition-colors duration-150 focus-visible:outline-none
                           focus-visible:ring-2 focus-visible:ring-strivo-accent">
            <div className="relative aspect-video w-40 shrink-0 bg-strivo-surface rounded-lg overflow-hidden">
              {video.thumbnail_url ? (
                <Image src={video.thumbnail_url} alt="" fill sizes="160px"
                       className="object-cover group-hover:scale-[1.03] transition-transform duration-300" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"
                       className="text-white/20" aria-hidden>
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                </div>
              )}
              <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px]
                               font-mono px-1 py-0.5 rounded pointer-events-none">
                {formatDuration(video.duration)}
              </span>
            </div>
            <div className="flex-1 min-w-0 py-0.5">
              <h3 className="text-white text-xs font-semibold leading-snug line-clamp-2">
                {video.title}
              </h3>
              {video.channel && (
                <p className="text-white/40 text-xs mt-1 truncate">{video.channel.name}</p>
              )}
              <p className="text-white/30 text-xs mt-0.5">{formatCount(video.views)} views</p>
            </div>
          </Link>
        ))}
      </div>
    </aside>
  )
}