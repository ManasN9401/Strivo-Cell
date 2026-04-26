'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="bg-[#0e0e0e] text-white font-sans antialiased">
        <main className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-5xl font-black tracking-tighter text-[#0915e6]/30 mb-4">
              Oops
            </p>
            <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
            <p className="text-white/40 text-sm mb-6 max-w-xs">
              {error.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={reset}
              className="bg-[#0915e6] hover:bg-[#0712c4] text-white font-semibold
                         px-6 py-2.5 rounded-lg text-sm transition-colors cursor-pointer"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  )
}
