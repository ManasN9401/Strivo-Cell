'use client'

import { useState, useRef, useCallback } from 'react'

interface Props {
  onFile: (file: File) => void
}

const ACCEPTED = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska']
const MAX_GB = 10

export default function UploadZone({ onFile }: Props) {
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function validate(file: File): string | null {
    if (!ACCEPTED.includes(file.type)) return 'Unsupported format. Use MP4, WebM, MOV or MKV.'
    if (file.size > MAX_GB * 1024 ** 3) return `File exceeds ${MAX_GB}GB limit.`
    return null
  }

  function handleFile(file: File) {
    const err = validate(file)
    if (err) { setError(err); return }
    setError(null)
    onFile(file)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={() => setDragging(false)}
        aria-label="Upload video — click or drag and drop"
        className={[
          'w-full flex flex-col items-center justify-center gap-4',
          'border-2 border-dashed rounded-2xl py-16 px-8 cursor-pointer',
          'transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent',
          dragging
            ? 'border-cinema-accent bg-cinema-accent/10 scale-[1.01]'
            : 'border-white/10 hover:border-white/20 bg-cinema-surface hover:bg-white/[0.03]',
        ].join(' ')}
      >
        <div className={[
          'w-16 h-16 rounded-full flex items-center justify-center transition-colors',
          dragging ? 'bg-cinema-accent/20' : 'bg-white/5',
        ].join(' ')}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1.8" className={dragging ? 'text-cinema-accent' : 'text-white/40'}
               aria-hidden>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <div className="text-center">
          <p className="text-white font-semibold">
            {dragging ? 'Drop to upload' : 'Drag & drop your video here'}
          </p>
          <p className="text-white/40 text-sm mt-1">or click to browse</p>
          <p className="text-white/25 text-xs mt-3">MP4, WebM, MOV, MKV · up to {MAX_GB}GB</p>
        </div>
      </button>

      {error && (
        <p role="alert" className="mt-3 text-red-400 text-sm flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor"
               strokeWidth="2" aria-hidden>
            <circle cx="7" cy="7" r="6"/>
            <path d="M7 4v3M7 10h.01"/>
          </svg>
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        className="sr-only"
        aria-hidden
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}