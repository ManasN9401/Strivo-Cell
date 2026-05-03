import Link from 'next/link'
import { signIn } from '@/lib/actions/auth'
import SubmitButton from '@/components/SubmitButton'

interface Props {
  searchParams: Promise<{
    error?: string
    next?: string
  }>
}

export const metadata = { title: 'Sign in' }

export default async function LoginPage({ searchParams }: Props) {
  const { error, next = '/' } = await searchParams

  return (
    <main className="min-h-screen bg-strivo-bg flex items-center justify-center px-4">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-64 left-1/2 -translate-x-1/2 w-[800px] h-[800px]
                        rounded-full bg-strivo-accent opacity-[0.07] blur-[120px]" />
      </div>

      <div className="relative w-full max-w-sm animate-scale-in">
        <p className="text-center text-2xl font-black tracking-tighter mb-10 bg-gradient-to-r from-blue-500 via-cyan-400 to-white text-transparent bg-clip-text drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
          STRIVO
        </p>

        <div className="bg-strivo-surface rounded-2xl p-8 border border-white/[0.06]">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Sign in</h1>
          <p className="text-white/50 text-sm mb-8">Welcome back</p>

          {error && (
            <div
              role="alert"
              className="mb-6 px-4 py-3 rounded-lg bg-red-500/10
                         border border-red-500/20 text-red-400 text-sm"
            >
              {decodeURIComponent(error)}
            </div>
          )}

          <form action={signIn} className="space-y-4" noValidate>
            <input type="hidden" name="next" value={next} />

            <div>
              <label htmlFor="email" className="block text-sm text-white/60 mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3
                           text-white placeholder:text-white/20 text-sm outline-none
                           focus:border-strivo-accent focus:ring-2 focus:ring-strivo-accent/20
                           transition-colors duration-200"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-white/60 mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3
                           text-white placeholder:text-white/20 text-sm outline-none
                           focus:border-strivo-accent focus:ring-2 focus:ring-strivo-accent/20
                           transition-colors duration-200"
              />
            </div>

            <SubmitButton
              pendingLabel="Signing in…"
              className="w-full bg-strivo-accent hover:bg-strivo-accent-hover text-white
                         font-semibold rounded-lg py-3 text-sm transition-colors duration-200
                         cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-strivo-accent focus-visible:ring-offset-2
                         focus-visible:ring-offset-strivo-surface"
            >
              Sign in
            </SubmitButton>
          </form>

          <p className="mt-6 text-center text-sm text-white/40">
            New to Strivo Cell?{' '}
            <Link href="/signup" className="text-strivo-accent hover:underline font-medium">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}