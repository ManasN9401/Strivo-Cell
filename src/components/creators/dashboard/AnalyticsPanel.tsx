'use client'

import { useMemo } from 'react'
import type { VideoAnalytics } from '@/types/creators'

interface Props {
  data: VideoAnalytics[]
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K`
  return String(n)
}

function formatWatchTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const mins  = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

function Sparkline({ values, color, label }: { values: number[]; color: string; label: string }) {
  const max = Math.max(...values, 1)
  const H = 48
  const W = 200
  const step = W / Math.max(values.length - 1, 1)

  const points = values.map((v, i) => `${i * step},${H - (v / max) * H}`).join(' ')
  const area = [
    `0,${H}`,
    ...values.map((v, i) => `${i * step},${H - (v / max) * H}`),
    `${(values.length - 1) * step},${H}`,
  ].join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-12" aria-label={label} role="img">
      <polygon points={area} fill={color} fillOpacity="0.12" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
      {values.length > 0 && (
        <circle cx={(values.length - 1) * step}
                cy={H - (values[values.length - 1] / max) * H}
                r="3" fill={color} />
      )}
    </svg>
  )
}

export default function AnalyticsPanel({ data }: Props) {
  const last30 = data.slice(-30)

  const totals = useMemo(() => ({
    views:     data.reduce((s, d) => s + d.views, 0),
    watchTime: data.reduce((s, d) => s + d.watch_time_seconds, 0),
    avgPerDay: last30.length > 0
      ? Math.round(last30.reduce((s, d) => s + d.views, 0) / last30.length)
      : 0,
  }), [data, last30])

  const viewSeries  = last30.map(d => d.views)
  const watchSeries = last30.map(d => Math.floor(d.watch_time_seconds / 60))

  const stats = [
    { label: 'Total views',      value: formatCount(totals.views),           sub: `~${formatCount(totals.avgPerDay)}/day` },
    { label: 'Total watch time', value: formatWatchTime(totals.watchTime),    sub: 'all time' },
    { label: 'Days tracked',     value: String(data.length),                  sub: 'since upload' },
  ]

  return (
    <section aria-label="Video analytics" className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-strivo-surface rounded-xl px-5 py-4">
            <p className="text-white/40 text-xs font-medium uppercase tracking-wide">{s.label}</p>
            <p className="text-white text-2xl font-bold mt-1">{s.value}</p>
            <p className="text-white/30 text-xs mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {last30.length === 0 ? (
        <div className="text-white/30 text-sm py-8 text-center">
          No analytics data yet. Views will appear here once the video gets watched.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-strivo-surface rounded-xl p-5">
            <p className="text-white/60 text-xs font-medium mb-3">Views — last 30 days</p>
            <Sparkline values={viewSeries} color="#0915e6" label="Daily views sparkline" />
            <div className="flex justify-between mt-2 text-white/25 text-xs">
              <span>{last30[0]?.date?.slice(5)}</span>
              <span>{last30[last30.length - 1]?.date?.slice(5)}</span>
            </div>
          </div>
          <div className="bg-strivo-surface rounded-xl p-5">
            <p className="text-white/60 text-xs font-medium mb-3">Watch time (min) — last 30 days</p>
            <Sparkline values={watchSeries} color="#22c55e" label="Daily watch time sparkline" />
            <div className="flex justify-between mt-2 text-white/25 text-xs">
              <span>{last30[0]?.date?.slice(5)}</span>
              <span>{last30[last30.length - 1]?.date?.slice(5)}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}