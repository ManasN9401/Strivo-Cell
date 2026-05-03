import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-strivo-bg flex items-center justify-center px-4">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[600px] h-[600px] rounded-full bg-strivo-accent
                        opacity-[0.04] blur-[100px]"/>
      </div>

      <div className="relative text-center animate-fade-up">
        <p className="text-8xl font-black tracking-tighter text-strivo-accent/20 mb-4
                      select-none leading-none">
          404
        </p>
        <h1 className="text-2xl font-bold tracking-tight mb-3">Page not found</h1>
        <p className="text-white/40 text-sm mb-8 max-w-xs">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="bg-strivo-accent hover:bg-strivo-accent-hover text-white
                       font-semibold px-6 py-2.5 rounded-lg text-sm
                       transition-colors focus-visible:outline-none
                       focus-visible:ring-2 focus-visible:ring-strivo-accent"
          >
            Go home
          </Link>
          <Link
            href="/browse"
            className="bg-white/10 hover:bg-white/20 text-white font-semibold
                       px-6 py-2.5 rounded-lg text-sm border border-white/10
                       transition-colors focus-visible:outline-none
                       focus-visible:ring-2 focus-visible:ring-strivo-accent"
          >
            Browse titles
          </Link>
        </div>
      </div>
    </main>
  )
}
