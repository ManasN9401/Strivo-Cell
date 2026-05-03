'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Video } from '@/types/creators'

interface Props {
  video: Video
}

function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K`
  return String(n)
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  const weeks = Math.floor(days / 7)
  const months= Math.floor(days / 30)
  const years = Math.floor(days / 365)
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  <  7) return `${days}d ago`
  if (weeks <  5) return `${weeks}w ago`
  if (months< 12) return `${months}mo ago`
  return `${years}y ago`
}

export default function VideoCard({ video }: Props) {
  const channel = video.channel

  return (
    <article className="group flex flex-col gap-3">
      <Link
        href={`/watch/${video.id}`}
        className="block relative aspect-video bg-strivo-surface rounded-xl overflow-hidden
                   ring-0 focus-visible:ring-2 focus-visible:ring-strivo-accent"
        aria-label={`Watch ${video.title}`}
      >
        {video.thumbnail_url ? (
          <Image
            src={video.thumbnail_url}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-strivo-surface to-black/60
                          flex items-center justify-center">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="1.5" className="text-white/20" aria-hidden>
              <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/>
            </svg>
          </div>
        )}
        <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[11px]
                         font-mono font-semibold px-1.5 py-0.5 rounded pointer-events-none">
          {formatDuration(video.duration)}
        </span>
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100
                        transition-opacity duration-200 flex items-center justify-center
                        pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-strivo-accent/90 flex items-center justify-center
                          shadow-[0_0_20px_rgba(9,21,230,0.5)] scale-90 group-hover:scale-100
                          transition-transform duration-200">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden>
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
        </div>
      </Link>

      <div className="flex gap-3">
        {channel && (
          <Link
            href={`/creators/channel/${channel.id}`}
            className="shrink-0 focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-strivo-accent rounded-full"
          >
            <div className="w-9 h-9 rounded-full bg-strivo-accent flex items-center justify-center
                            overflow-hidden text-white text-xs font-bold shrink-0">
              {channel.avatar_url ? (
                <Image src={channel.avatar_url} alt={channel.name} width={36} height={36}
                       className="object-cover w-full h-full" />
              ) : (
                channel.name[0]?.toUpperCase()
              )}
            </div>
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <Link href={`/watch/${video.id}`}
                className="block focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-strivo-accent rounded">
            <h3 className="text-white text-sm font-semibold leading-snug line-clamp-2">
              {video.title}
            </h3>
          </Link>
          {channel && (
            <Link href={`/creators/channel/${channel.id}`}
                  className="text-white/50 text-xs hover:text-white/80 transition-colors mt-0.5 block">
              {channel.name}
            </Link>
          )}
          <p className="text-white/40 text-xs mt-0.5">
            {formatCount(video.views)} views · {timeAgo(video.created_at)}
          </p>
        </div>
      </div>
    </article>
  )
}

export function VideoCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-video bg-strivo-surface rounded-xl animate-pulse" />
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full bg-strivo-surface animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-strivo-surface rounded animate-pulse w-full" />
          <div className="h-3 bg-strivo-surface rounded animate-pulse w-2/3" />
          <div className="h-3 bg-strivo-surface rounded animate-pulse w-1/2" />
        </div>
      </div>
    </div>
  )
}