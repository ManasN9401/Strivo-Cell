'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import UploadZone from '@/components/creators/dashboard/UploadZone'
import VideoMetaForm, { type VideoMeta } from '@/components/creators/dashboard/VideoMetaForm'
import ThumbnailPicker from '@/components/creators/dashboard/ThumbnailPicker'

type UploadStep = 'select' | 'details' | 'uploading' | 'done'

const DEFAULT_META: VideoMeta = {
  title: '',
  description: '',
  tags: [],
  visibility: 'public',
}

export default function UploadPage() {
  const router = useRouter()
  const [step, setStep]           = useState<UploadStep>('select')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbnail, setThumbnail] = useState<File | string | null>(null)
  const [meta, setMeta]           = useState<VideoMeta>(DEFAULT_META)
  const [progress, setProgress]   = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [error, setError]         = useState<string | null>(null)

  function handleFile(file: File) {
    setVideoFile(file)
    if (!meta.title) {
      setMeta(m => ({ ...m, title: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ') }))
    }
    setStep('details')
  }

  async function handleSubmit() {
    if (!videoFile || !meta.title.trim()) return
    setError(null)
    setStep('uploading')
    setProgress(0)
    setProgressLabel('Preparing upload…')

    try {
      // ── Step 1: Get signed URLs from our API ───────────────────────────────
      const prepBody: Record<string, unknown> = {
        filename:    videoFile.name,
        contentType: videoFile.type,
        size:        videoFile.size,
        meta,
      }

      if (thumbnail instanceof File) {
        prepBody.thumbnailFilename    = thumbnail.name
        prepBody.thumbnailContentType = thumbnail.type
      }

      const prepRes = await fetch('/api/creators/videos/upload', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(prepBody),
      })

      if (!prepRes.ok) {
        const data = await prepRes.json()
        throw new Error(data.error ?? 'Failed to prepare upload')
      }

      const { uploadUrl, thumbnailUploadUrl } = await prepRes.json()

      // ── Step 2: Upload thumbnail directly to Supabase (if file) ───────────
      if (thumbnail instanceof File && thumbnailUploadUrl) {
        setProgressLabel('Uploading thumbnail…')
        setProgress(5)
        const thumbnailRes = await fetch(thumbnailUploadUrl, {
          method:  'PUT',
          headers: { 'Content-Type': thumbnail.type },
          body:    thumbnail,
        })
        if (!thumbnailRes.ok) {
          throw new Error(`Thumbnail upload failed: ${thumbnailRes.status} ${thumbnailRes.statusText}`)
        }
      }

      // ── Step 3: Upload video directly to Supabase with progress ───────────
      setProgressLabel('Uploading video…')
      setProgress(10)

      setProgressLabel('Uploading video…')
      setProgress(10)

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: videoFile,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`)
      }

      setProgress(100)
      setProgressLabel('Complete!')
      setStep('done')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
      setStep('details')
    }
  }

  // ── Select file ─────────────────────────────────────────────────────────────
  if (step === 'select') {
    return (
      <main className="bg-strivo-bg min-h-screen pt-24 pb-20">
        <div className="max-w-2xl mx-auto px-6">
          <BackLink />
          <h1 className="text-white text-2xl font-bold mb-8">Upload video</h1>
          <UploadZone onFile={handleFile} />
        </div>
      </main>
    )
  }

  // ── Uploading ───────────────────────────────────────────────────────────────
  if (step === 'uploading') {
    return (
      <main className="bg-strivo-bg min-h-screen pt-24 pb-20 flex items-center justify-center">
        <div className="text-center space-y-6 px-6 max-w-sm w-full">
          <div className="w-16 h-16 rounded-full bg-strivo-accent/20 flex items-center justify-center mx-auto">
            <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24"
                 fill="none" stroke="#0915e6" strokeWidth="2" aria-hidden>
              <circle cx="12" cy="12" r="10" strokeOpacity=".3"/>
              <path d="M12 2a10 10 0 0 1 10 10"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-lg">{progressLabel}</p>
            <p className="text-white/40 text-sm mt-1">{meta.title}</p>
          </div>
          <div className="space-y-2">
            <div className="h-2 bg-strivo-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-strivo-accent rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Upload progress: ${progress}%`}
              />
            </div>
            <p className="text-white/30 text-xs text-right">{progress}%</p>
          </div>
        </div>
      </main>
    )
  }

  // ── Done ────────────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <main className="bg-strivo-bg min-h-screen pt-24 pb-20 flex items-center justify-center">
        <div className="text-center space-y-6 px-6 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e"
                 strokeWidth="2.5" aria-hidden>
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-xl">Upload complete!</p>
            <p className="text-white/40 text-sm mt-1">
              Your video is being processed and will be live shortly.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/creators/dashboard')}
              className="w-full bg-strivo-accent hover:bg-strivo-accent/90 text-white
                         font-semibold py-3 rounded-xl transition-colors cursor-pointer
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strivo-accent"
            >
              Go to dashboard
            </button>
            <button
              onClick={() => {
                setStep('select')
                setVideoFile(null)
                setMeta(DEFAULT_META)
                setThumbnail(null)
                setProgress(0)
              }}
              className="w-full bg-strivo-surface hover:bg-white/10 text-white/70 hover:text-white
                         font-semibold py-3 rounded-xl transition-colors cursor-pointer
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strivo-accent"
            >
              Upload another
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ── Details form ────────────────────────────────────────────────────────────
  return (
    <main className="bg-strivo-bg min-h-screen pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-6">
        <BackLink onClick={() => setStep('select')} />
        <h1 className="text-white text-2xl font-bold mb-8">Video details</h1>

        {videoFile && (
          <div className="flex items-center gap-3 bg-strivo-surface rounded-xl px-4 py-3 mb-8
                          border border-white/[0.06]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0915e6"
                 strokeWidth="2" aria-hidden>
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2"/>
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{videoFile.name}</p>
              <p className="text-white/40 text-xs">
                {(videoFile.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
            <button
              onClick={() => setStep('select')}
              className="text-white/30 hover:text-white text-xs transition-colors cursor-pointer
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strivo-accent rounded"
            >
              Change
            </button>
          </div>
        )}

        <div className="space-y-8">
          <ThumbnailPicker value={thumbnail} onChange={setThumbnail} videoFile={videoFile} />
          <VideoMetaForm value={meta} onChange={setMeta} />
        </div>

        {error && (
          <p role="alert" className="mt-6 text-red-400 text-sm flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor"
                 strokeWidth="2" aria-hidden>
              <circle cx="7" cy="7" r="6"/>
              <path d="M7 4v3M7 10h.01"/>
            </svg>
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!meta.title.trim()}
          className="mt-8 w-full bg-strivo-accent hover:bg-strivo-accent/90 text-white
                     font-bold py-3.5 rounded-xl transition-colors cursor-pointer
                     disabled:opacity-50 disabled:cursor-not-allowed
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strivo-accent"
        >
          Publish video
        </button>
      </div>
    </main>
  )
}

function BackLink({ onClick }: { onClick?: () => void }) {
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm
                   transition-colors mb-6 cursor-pointer focus-visible:outline-none
                   focus-visible:ring-2 focus-visible:ring-strivo-accent rounded"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"
             strokeWidth="2" aria-hidden>
          <path d="M10 3L5 8l5 5"/>
        </svg>
        Back
      </button>
    )
  }
  return (
    <a
      href="/creators/dashboard"
      className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm
                 transition-colors mb-6 focus-visible:outline-none
                 focus-visible:ring-2 focus-visible:ring-strivo-accent rounded"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"
           strokeWidth="2" aria-hidden>
        <path d="M10 3L5 8l5 5"/>
      </svg>
      Dashboard
    </a>
  )
}