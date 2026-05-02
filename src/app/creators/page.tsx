import { Suspense } from 'react'
import Link from 'next/link'
import VideoGrid, { VideoGridSkeleton } from '@/components/creators/VideoGrid'
import { getCreatorsFeedVideos } from '@/lib/supabase/creators/queries'

async function FeedContent() {
  const videos = await getCreatorsFeedVideos()
  return <VideoGrid videos={videos} />
}

export default function CreatorsPage() {
  return (
    <main className="bg-cinema-bg min-h-screen pt-24 pb-20">
      <div className="max-w-content mx-auto px-6 sm:px-8">

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold tracking-tight">Creators</h1>
            <p className="text-white/40 text-sm mt-1">Videos from your community</p>
          </div>

          <Link
            href="/creators/dashboard/upload"
            className="flex items-center gap-2 bg-cinema-accent hover:bg-cinema-accent/90
                       text-white text-sm font-semibold px-4 py-2 rounded-lg
                       transition-colors duration-150 focus-visible:outline-none
                       focus-visible:ring-2 focus-visible:ring-cinema-accent"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2.5" aria-hidden>
              <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
            </svg>
            Upload
          </Link>
        </div>

        {/* Category filter tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {['All', 'Gaming', 'Music', 'Tech', 'Vlogs', 'Education', 'Comedy', 'Art'].map((cat, i) => (
            <button
              key={cat}
              className={[
                'shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent',
                'cursor-pointer',
                i === 0
                  ? 'bg-white text-black'
                  : 'bg-cinema-surface text-white/60 hover:text-white hover:bg-white/10',
              ].join(' ')}
            >
              {cat}
            </button>
          ))}
        </div>

        <Suspense fallback={<VideoGridSkeleton count={12} />}>
          <FeedContent />
        </Suspense>
      </div>
    </main>
  )
}