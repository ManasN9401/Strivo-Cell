'use client'

import { useState } from 'react'

export default function CopyLinkButton({ roomId }: { roomId: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(`${window.location.origin}/party/${roomId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-strivo-surface
                 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold
                 transition-colors cursor-pointer
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strivo-accent"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <rect x="4" y="4" width="8" height="8" rx="1.5" />
        <path d="M10 4V2.5A1.5 1.5 0 0 0 8.5 1H2.5A1.5 1.5 0 0 0 1 2.5v6A1.5 1.5 0 0 0 2.5 10H4" />
      </svg>

      {copied ? 'Copied!' : 'Copy invite link'}
    </button>
  )
}