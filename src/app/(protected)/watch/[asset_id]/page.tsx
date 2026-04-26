import { notFound }        from 'next/navigation'
import TopNavBar           from '@/components/TopNavBar'
import UpNext              from '@/components/UpNext'
import VideoPlayerWrapper  from '@/components/VideoPlayerWrapper'
import { getTitle, getRelatedTitles, getProgress } from '@/lib/supabase/queries'

interface Props {
  params: Promise<{
    asset_id: string
  }>
}

export async function generateMetadata({ params }: Props) {
  const { asset_id } = await params

  const title = await getTitle(asset_id)

  if (!title) return {}

  return { title: `Watch ${title.title}` }
}

export default async function WatchPage({ params }: Props) {
  const { asset_id } = await params

  const [title, progress] = await Promise.all([
    getTitle(asset_id),
    getProgress(asset_id),
  ])
  
  if (!title) notFound()

  const related     = await getRelatedTitles(asset_id, title.genre[0])
  const initialSecs = progress?.progress_secs ?? 0
  const resumeLabel = initialSecs > 60
    ? `Resuming from ${Math.floor(initialSecs / 60)}m ${initialSecs % 60}s`
    : null

  return (
    <>
      <TopNavBar/>
      <main className="bg-cinema-bg min-h-screen pt-16">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 min-w-0">
              <VideoPlayerWrapper titleId={asset_id} titleName={title.title}
                                  initialProgressSecs={initialSecs}/>
              {resumeLabel && <p className="mt-2 text-white/30 text-xs">{resumeLabel}</p>}
              <div className="mt-6 pb-6 border-b border-white/[0.06]">
                <div className="flex flex-wrap gap-2 mb-3">
                  {title.genre.map(g => (
                    <span key={g} className="text-[10px] font-bold uppercase tracking-widest
                                             text-cinema-accent border border-cinema-accent/30
                                             px-2 py-0.5 rounded-full">{g}</span>
                  ))}
                  {title.tags.map(tag => (
                    <span key={tag} className="text-[10px] font-bold uppercase tracking-widest
                                               text-white/30 border border-white/10
                                               px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">{title.title}</h1>
                <p className="text-white/60 text-sm leading-relaxed max-w-2xl">{title.description}</p>
                <div className="mt-4 flex gap-4 text-xs text-white/30">
                  {title.release_year && <span>{title.release_year}</span>}
                  {title.duration_mins && <span>{Math.floor(title.duration_mins/60)}h {title.duration_mins%60}m</span>}
                  {title.rating && <span>{title.rating}</span>}
                </div>
              </div>
            </div>
            <div className="lg:w-80 xl:w-96 flex-shrink-0">
              <UpNext titles={related} currentId={asset_id}/>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}