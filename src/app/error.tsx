'use client'

import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
        <p className="text-white/40 text-sm mb-6 max-w-xs">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-cinema-accent hover:bg-cinema-accent-hover text-white
                       font-semibold px-5 py-2.5 rounded-lg text-sm
                       transition-colors cursor-pointer
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent"
          >
            Try again
          </button>
          <Link
            href="/"
            className="bg-white/10 hover:bg-white/20 text-white font-semibold
                       px-5 py-2.5 rounded-lg text-sm border border-white/10
                       transition-colors focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-cinema-accent"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  )
}
