import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import ManageVideosTable from '@/components/creators/dashboard/ManageVideosTable'
import AnalyticsPanel from '@/components/creators/dashboard/AnalyticsPanel'
import {
  getChannelByUserId,
  getChannelVideos,
  getChannelAnalytics,
} from '@/lib/supabase/creators/queries'

interface Props {
  searchParams: Promise<{ tab?: string }>
}

export default async function DashboardPage({ searchParams }: Props) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { tab = 'videos' } = await searchParams

  const [channel, videos, analytics] = await Promise.all([
    getChannelByUserId(user.id),
    getChannelVideos(user.id),
    getChannelAnalytics(user.id),
  ])

  const tabs = [
    { id: 'videos',    label: 'My Videos' },
    { id: 'analytics', label: 'Analytics' },
  ]

  return (
    <main className="bg-cinema-bg min-h-screen pt-24 pb-20">
      <div className="max-w-content mx-auto px-6 sm:px-8">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-white text-2xl font-bold">Creator Dashboard</h1>
            {channel && (
              <p className="text-white/40 text-sm mt-1">{channel.name}</p>
            )}
          </div>

          <Link
            href="/creators/dashboard/upload"
            className="inline-flex items-center gap-2 bg-cinema-accent hover:bg-cinema-accent/90 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Upload video
          </Link>
        </div>

        <div role="tablist" aria-label="Dashboard sections" className="flex gap-1 border-b border-white/[0.06] mb-8">
          {tabs.map(t => (
            <Link
              key={t.id}
              href={`/creators/dashboard?tab=${t.id}`}
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id
                ? 'px-4 py-3 text-sm font-medium text-white border-b-2 border-cinema-accent -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent rounded-t'
                : 'px-4 py-3 text-sm font-medium text-white/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent rounded-t'
              }
            >
              {t.label}
            </Link>
          ))}
        </div>

        {tab === 'videos' && (
          <div role="tabpanel" aria-label="My videos">
            <ManageVideosTable initialVideos={videos} />
          </div>
        )}

        {tab === 'analytics' && (
          <div role="tabpanel" aria-label="Analytics">
            <AnalyticsPanel data={analytics} />
          </div>
        )}

      </div>
    </main>
  )
}