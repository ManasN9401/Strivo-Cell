'use client'

import { useRef, useState, useCallback } from 'react'
import type { Chapter } from '@/types/creators'

interface Props {
  videoUrl: string
  chapters: Chapter[]
}

export default function WatchPageClient({ videoUrl }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [, setCurrentTime] = useState(0)

  const handleSeek = useCallback((seconds: number) => {
    if (!videoRef.current) return
    videoRef.current.currentTime = seconds
    videoRef.current.play().catch(() => {})
  }, [])

  return (
    <video
      ref={videoRef}
      src={videoUrl}
      controls
      className="w-full h-full object-contain bg-black"
      onTimeUpdate={() => setCurrentTime(Math.floor(videoRef.current?.currentTime ?? 0))}
      aria-label="Video player"
    />
  )
}