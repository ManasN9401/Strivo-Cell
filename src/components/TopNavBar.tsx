import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/auth'
import NavSearch from './NavSearch'
import { NavLinks } from './NavLinks'
import ModeToggle from './creators/ModeToggle'
import UserMenu from './UserMenu'

interface Props {
  activePath?: string
}

export default async function TopNavBar({ activePath: _activePath }: Props) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-strivo-bg/60 backdrop-blur-xl border-b border-white/[0.06]">
      <nav
        className="max-w-content mx-auto px-6 sm:px-8 h-16 flex items-center justify-between gap-6"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-black tracking-tighter shrink-0
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strivo-accent rounded
                     bg-gradient-to-r from-blue-500 via-cyan-400 to-white text-transparent bg-clip-text drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]"
        >
          STRIVO
        </Link>

        {/* Animated nav links — hidden on mobile */}
        <NavLinks />

        <ModeToggle />

        {/* Right side */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <NavSearch />

          {user && (
            <Link
              href="/party/new"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold
                        text-strivo-accent border border-strivo-accent/30
                        hover:bg-strivo-accent/10 px-3 py-1.5 rounded-full
                        transition-colors duration-150
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strivo-accent"
            >
              ◈ Watch Party
            </Link>
          )}

          {user ? (
            <UserMenu email={user.email ?? ''} profile={profile} />
          ) : (
            <Link
              href="/login"
              className="bg-strivo-accent hover:bg-strivo-accent/90 text-white
                        text-sm font-semibold px-4 py-2 rounded-lg
                        transition-colors duration-150
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strivo-accent"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}