'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

interface Props {
  value: File | string | null
  onChange: (val: File | string | null) => void
  videoFile?: File | null
}

export default function ThumbnailPicker({ value, onChange }: Props) {
  const [generating, setGenerating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const previewUrl = value instanceof File
    ? URL.createObjectURL(value)
    : value ?? null

  async function autoGenerate() {
    setGenerating(true)
    try {
      const res = await fetch('/api/creators/thumbnails/generate', { method: 'POST' })
      const data = await res.json()
      if (data.url) onChange(data.url)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div>
      <p className="text-white/70 text-sm font-medium mb-3" id="thumbnail-label">
        Thumbnail
      </p>
      <div className="flex flex-col sm:flex-row gap-4" role="group" aria-labelledby="thumbnail-label">
        {/* Preview */}
        <div className="relative aspect-video w-full sm:w-56 bg-strivo-surface rounded-xl
                        overflow-hidden border border-white/10 shrink-0">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Thumbnail preview"
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="1.5" className="text-white/20" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span className="text-white/25 text-xs">No thumbnail</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3 justify-center">
          <button type="button" onClick={() => inputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-strivo-surface hover:bg-white/10
                             border border-white/10 text-white/70 hover:text-white text-sm font-medium
                             rounded-lg transition-colors cursor-pointer
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strivo-accent">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" aria-hidden>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Upload image
          </button>

          <button type="button" onClick={autoGenerate} disabled={generating}
                  className="flex items-center gap-2 px-4 py-2.5 bg-strivo-surface hover:bg-white/10
                             border border-white/10 text-white/70 hover:text-white text-sm font-medium
                             rounded-lg transition-colors cursor-pointer disabled:opacity-50
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strivo-accent">
            {generating ? (
              <>
                <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <circle cx="12" cy="12" r="10" strokeOpacity=".3"/>
                  <path d="M12 2a10 10 0 0 1 10 10"/>
                </svg>
                Generating…
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="2" aria-hidden>
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2"/>
                </svg>
                Auto-generate
              </>
            )}
          </button>

          {value && (
            <button type="button" onClick={() => onChange(null)}
                    className="text-white/30 hover:text-red-400 text-xs transition-colors cursor-pointer
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strivo-accent rounded">
              Remove thumbnail
            </button>
          )}
          <p className="text-white/25 text-xs">JPG, PNG or WebP · max 2MB</p>
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
             className="sr-only" aria-hidden
             onChange={e => {
               const file = e.target.files?.[0]
               if (!file) return
               if (file.size > 2 * 1024 * 1024) return
               onChange(file)
               e.target.value = ''
             }} />
    </div>
  )
}