import Link from 'next/link'
import { signUp } from '@/lib/actions/auth'
import SubmitButton from '@/components/SubmitButton'

interface Props {
  searchParams: Promise<{
    error?: string
    success?: string
  }>
}

export const metadata = { title: 'Create account' }

export default async function SignupPage({ searchParams }: Props) {
  const { error, success } = await searchParams

  if (success === 'check-email') {
    return (
      <main className="min-h-screen bg-strivo-bg flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center animate-fade-up">
          <p className="text-2xl font-black tracking-tighter mb-8 bg-gradient-to-r from-blue-500 via-cyan-400 to-white text-transparent bg-clip-text drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">STRIVO</p>
          <div className="bg-strivo-surface rounded-2xl p-8 border border-white/[0.06]">
            <div className="w-14 h-14 bg-strivo-accent/10 rounded-full flex items-center justify-center mx-auto mb-5 text-strivo-accent text-2xl">
              ✓
            </div>
            <h1 className="text-xl font-bold mb-2">Check your email</h1>
            <p className="text-white/50 text-sm leading-relaxed">
              We sent a confirmation link to your inbox. Click it to activate your account.
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-strivo-bg flex items-center justify-center px-4">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-64 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-strivo-accent opacity-[0.07] blur-[120px]" />
      </div>

      <div className="relative w-full max-w-sm animate-scale-in">
        <p className="text-center text-2xl font-black tracking-tighter mb-10 bg-gradient-to-r from-blue-500 via-cyan-400 to-white text-transparent bg-clip-text drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
          STRIVO
        </p>

        <div className="bg-strivo-surface rounded-2xl p-8 border border-white/[0.06]">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Create account</h1>
          <p className="text-white/50 text-sm mb-8">Start watching today</p>

          {error && (
            <div
              role="alert"
              className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              {decodeURIComponent(error)}
            </div>
          )}

          <form action={signUp} className="space-y-4" noValidate>
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
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 text-sm outline-none focus:border-strivo-accent focus:ring-2 focus:ring-strivo-accent/20 transition-colors duration-200"
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
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="Min. 8 characters"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 text-sm outline-none focus:border-strivo-accent focus:ring-2 focus:ring-strivo-accent/20 transition-colors duration-200"
              />
            </div>

            <SubmitButton
              pendingLabel="Creating account…"
              className="w-full bg-strivo-accent hover:bg-strivo-accent-hover text-white font-semibold rounded-lg py-3 text-sm transition-colors duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strivo-accent focus-visible:ring-offset-2 focus-visible:ring-offset-strivo-surface"
            >
              Create account
            </SubmitButton>
          </form>

          <p className="mt-6 text-center text-sm text-white/40">
            Already a member?{' '}
            <Link href="/login" className="text-strivo-accent hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}