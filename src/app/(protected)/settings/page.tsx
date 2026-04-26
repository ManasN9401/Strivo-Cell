import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Footer from '@/components/Footer'
import { updateEmail, updatePassword } from '@/lib/actions/settings'
import { signOut } from '@/lib/actions/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const metadata = { title: 'Settings' }

interface Props {
  searchParams: Promise<{
    error?: string
    success?: string
  }>
}

const MESSAGES: Record<string, string> = {
  'email-updated': 'Email updated — check your inbox to confirm the change.',
  'password-updated': 'Password updated successfully.',
}

async function SettingsContent() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const email = user.email ?? ''

  return (
    <div className="max-w-2xl space-y-8">
      <section className="bg-cinema-surface rounded-2xl p-8 border border-white/[0.06]">
        <h2 className="text-lg font-semibold mb-1">Profile</h2>
        <p className="text-white/40 text-sm mb-6">Manage your account email address</p>

        <form action={updateEmail} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-white/60 mb-1.5">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={email}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3
                         text-white text-sm outline-none
                         focus:border-cinema-accent focus:ring-2 focus:ring-cinema-accent/20
                         transition-colors duration-200"
            />
          </div>
          <button
            type="submit"
            className="bg-cinema-accent hover:bg-cinema-accent-hover text-white
                       font-semibold px-6 py-2.5 rounded-lg text-sm
                       transition-colors cursor-pointer
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-cinema-accent"
          >
            Update email
          </button>
        </form>
      </section>

      <section className="bg-cinema-surface rounded-2xl p-8 border border-white/[0.06]">
        <h2 className="text-lg font-semibold mb-1">Password</h2>
        <p className="text-white/40 text-sm mb-6">Choose a strong password of at least 8 characters</p>

        <form action={updatePassword} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm text-white/60 mb-1.5">
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Min. 8 characters"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3
                         text-white placeholder:text-white/20 text-sm outline-none
                         focus:border-cinema-accent focus:ring-2 focus:ring-cinema-accent/20
                         transition-colors duration-200"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-sm text-white/60 mb-1.5">
              Confirm password
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Repeat new password"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3
                         text-white placeholder:text-white/20 text-sm outline-none
                         focus:border-cinema-accent focus:ring-2 focus:ring-cinema-accent/20
                         transition-colors duration-200"
            />
          </div>
          <button
            type="submit"
            className="bg-cinema-accent hover:bg-cinema-accent-hover text-white
                       font-semibold px-6 py-2.5 rounded-lg text-sm
                       transition-colors cursor-pointer
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-cinema-accent"
          >
            Update password
          </button>
        </form>
      </section>

      <section className="bg-cinema-surface rounded-2xl p-8 border border-white/[0.06]">
        <h2 className="text-lg font-semibold mb-1">Account</h2>
        <p className="text-white/40 text-sm mb-6">Session management</p>

        <form action={signOut}>
          <button
            type="submit"
            className="bg-white/10 hover:bg-white/20 text-white font-semibold
                       px-6 py-2.5 rounded-lg text-sm border border-white/10
                       transition-colors cursor-pointer
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-cinema-accent"
          >
            Sign out of all devices
          </button>
        </form>
      </section>

      <section className="bg-red-500/5 rounded-2xl p-8 border border-red-500/20">
        <h2 className="text-lg font-semibold text-red-400 mb-1">Danger zone</h2>
        <p className="text-white/40 text-sm mb-6">
          Deleting your account is permanent and cannot be undone.
        </p>
        <a
          href="mailto:support@cinema.example.com?subject=Account+deletion+request"
          className="inline-block bg-red-500/10 hover:bg-red-500/20 text-red-400
                     font-semibold px-6 py-2.5 rounded-lg text-sm border border-red-500/20
                     transition-colors focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-red-400"
        >
          Request account deletion
        </a>
      </section>
    </div>
  )
}

export default async function SettingsPage({ searchParams }: Props) {
  const { error, success } = await searchParams
  const successMsg = success ? MESSAGES[success] : null

  return (
    <>
      <main className="bg-cinema-bg min-h-screen pt-20">
        <div className="max-w-content mx-auto px-8 py-10">
          <h1 className="text-4xl font-black tracking-tight mb-2">Settings</h1>
          <p className="text-white/40 text-sm mb-10">Manage your account</p>

          {error && (
            <div
              role="alert"
              className="mb-8 px-5 py-4 rounded-xl bg-red-500/10 border border-red-500/20
                         text-red-400 text-sm max-w-2xl"
            >
              {decodeURIComponent(error)}
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              className="mb-8 px-5 py-4 rounded-xl bg-green-500/10 border border-green-500/20
                         text-green-400 text-sm max-w-2xl"
            >
              {successMsg}
            </div>
          )}

          <Suspense
            fallback={
              <div className="max-w-2xl space-y-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-52 bg-cinema-surface rounded-2xl animate-pulse" />
                ))}
              </div>
            }
          >
            <SettingsContent />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  )
}
