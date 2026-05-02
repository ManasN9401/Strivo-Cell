import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/auth'
import NavSearch from './NavSearch'
import { NavLinks } from './NavLinks'
import ModeToggle from './creators/ModeToggle'

interface Props {
  activePath?: string
}

export default async function TopNavBar({ activePath: _activePath }: Props) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-cinema-bg/60 backdrop-blur-xl border-b border-white/[0.06]">
      <nav
        className="max-w-content mx-auto px-6 sm:px-8 h-16 flex items-center justify-between gap-6"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-black tracking-tighter text-cinema-accent shrink-0
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent rounded"
        >
          CINEMA
        </Link>

        {/* Animated nav links — hidden on mobile */}
        <NavLinks />

        <ModeToggle />

        {/* Right side */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <NavSearch />

          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/party/new"
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold
                           text-cinema-accent border border-cinema-accent/30
                           hover:bg-cinema-accent/10 px-3 py-1.5 rounded-full
                           transition-colors duration-150
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent"
              >
                ◈ Watch Party
              </Link>

              <Link
                href="/settings"
                aria-label="Account settings"
                className="w-8 h-8 rounded-full bg-cinema-accent flex items-center justify-center
                           text-white text-xs font-bold hover:bg-cinema-accent-hover
                           transition-colors duration-150
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent"
              >
                {user.email?.[0]?.toUpperCase() ?? 'U'}
              </Link>

              <form action={signOut}>
                <button
                  type="submit"
                  className="hidden sm:block text-xs text-white/50 hover:text-white
                             transition-colors cursor-pointer
                             focus-visible:outline-none focus-visible:ring-2
                             focus-visible:ring-cinema-accent rounded px-1"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-cinema-accent hover:bg-cinema-accent-hover text-white
                         text-sm font-semibold px-4 py-2 rounded-lg
                         transition-colors duration-150
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}