'use client'

import { useState, useTransition } from 'react'
import type { LikeState } from '@/types/creators'

interface Props {
  videoId: string
  initial: LikeState
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K`
  return String(n)
}

export default function LikeDislikeBar({ videoId, initial }: Props) {
  const [state, setState] = useState<LikeState>(initial)
  const [isPending, startTransition] = useTransition()

  async function handleLike() {
    const wasLiked = state.liked
    setState(prev => ({
      liked: !prev.liked,
      disliked: false,
      like_count: prev.liked ? prev.like_count - 1 : prev.like_count + 1,
      dislike_count: prev.disliked ? prev.dislike_count - 1 : prev.dislike_count,
    }))
    startTransition(async () => {
      await fetch(`/api/creators/videos/${videoId}/like`, {
        method: 'POST',
        body: JSON.stringify({ value: wasLiked ? 0 : 1 }),
        headers: { 'Content-Type': 'application/json' },
      })
    })
  }

  async function handleDislike() {
    const wasDisliked = state.disliked
    setState(prev => ({
      liked: false,
      disliked: !prev.disliked,
      like_count: prev.liked ? prev.like_count - 1 : prev.like_count,
      dislike_count: prev.disliked ? prev.dislike_count - 1 : prev.dislike_count + 1,
    }))
    startTransition(async () => {
      await fetch(`/api/creators/videos/${videoId}/like`, {
        method: 'POST',
        body: JSON.stringify({ value: wasDisliked ? 0 : -1 }),
        headers: { 'Content-Type': 'application/json' },
      })
    })
  }

  const total = state.like_count + state.dislike_count
  const likeRatio = total > 0 ? state.like_count / total : 0

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={handleLike}
          disabled={isPending}
          aria-pressed={state.liked}
          aria-label={`Like video. ${formatCount(state.like_count)} likes`}
          className={[
            'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold',
            'transition-all duration-150 cursor-pointer min-h-[44px]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent',
            state.liked
              ? 'bg-cinema-accent text-white shadow-[0_0_12px_rgba(9,21,230,0.35)]'
              : 'bg-cinema-surface text-white/70 hover:text-white hover:bg-white/10',
          ].join(' ')}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" aria-hidden>
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
          </svg>
          {formatCount(state.like_count)}
        </button>

        <div className="w-px h-5 bg-white/10" aria-hidden />

        <button
          onClick={handleDislike}
          disabled={isPending}
          aria-pressed={state.disliked}
          aria-label={`Dislike video. ${formatCount(state.dislike_count)} dislikes`}
          className={[
            'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold',
            'transition-all duration-150 cursor-pointer min-h-[44px]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent',
            state.disliked
              ? 'bg-red-600/80 text-white'
              : 'bg-cinema-surface text-white/70 hover:text-white hover:bg-white/10',
          ].join(' ')}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" aria-hidden>
            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
            <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
          </svg>
          {formatCount(state.dislike_count)}
        </button>
      </div>

      {total > 0 && (
        <div className="h-1 bg-white/10 rounded-full overflow-hidden"
             role="meter" aria-label={`${Math.round(likeRatio * 100)}% positive`}
             aria-valuenow={Math.round(likeRatio * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-cinema-accent rounded-full transition-all duration-300"
               style={{ width: `${likeRatio * 100}%` }} />
        </div>
      )}
    </div>
  )
}