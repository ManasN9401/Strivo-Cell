'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/lib/actions/auth'

interface Props {
    email: string
    profile?: { username?: string | null; avatar_url?: string | null } | null
}

export default function UserMenu({ email, profile }: Props) {
    const [open, setOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const pathname = usePathname()
    const isCreators = pathname.startsWith('/creators') || pathname.startsWith('/watch')

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        if (open) document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [open])

    // Close on Escape
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false)
        }
        if (open) window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [open])

    // Close on route change
    useEffect(() => setOpen(false), [pathname])

    const displayName = profile?.username || email
    const letter = displayName[0]?.toUpperCase() ?? 'U'

    return (
        <div ref={menuRef} className="relative">
            {/* Avatar trigger */}
            <button
                onClick={() => setOpen(v => !v)}
                aria-label="Account menu"
                aria-expanded={open}
                aria-haspopup="true"
                className="w-8 h-8 rounded-full bg-strivo-accent flex items-center justify-center
                   text-white text-xs font-bold hover:bg-strivo-accent/80
                   transition-colors duration-150 cursor-pointer
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strivo-accent
                   focus-visible:ring-offset-2 focus-visible:ring-offset-strivo-bg"
            >
                {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="User Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                    letter
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div
                    role="menu"
                    aria-label="Account options"
                    className="absolute right-0 top-full mt-2 w-56 bg-strivo-surface border border-white/10
                     rounded-xl shadow-2xl overflow-hidden z-50
                     animate-in fade-in slide-in-from-top-2 duration-150"
                >
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-white/[0.06]">
                        <p className="text-white text-sm font-semibold truncate">{displayName}</p>
                        <p className="text-white/40 text-xs mt-0.5">
                            {isCreators ? 'Creators mode' : 'Cinema mode'}
                        </p>
                    </div>

                    {/* Cinema links */}
                    <div className="py-1">
                        <MenuLink href="/" label="Home" icon={
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                        } />
                        <MenuLink href="/library" label="My List" icon={
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                        } />
                        <MenuLink href="/party/new" label="Watch Party" icon={
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        } />
                    </div>

                    {/* Divider */}
                    <div className="border-t border-white/[0.06]" />

                    {/* Creators links */}
                    <div className="py-1">
                        <p className="px-4 pt-2 pb-1 text-white/30 text-[10px] font-semibold uppercase tracking-wider">
                            Creators
                        </p>
                        <MenuLink href="/creators" label="Creators Feed" icon={
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                                <circle cx="12" cy="12" r="10" />
                                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
                            </svg>
                        } />
                        <MenuLink href="/creators/dashboard" label="My Dashboard" icon={
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                                <rect x="3" y="3" width="7" height="7" />
                                <rect x="14" y="3" width="7" height="7" />
                                <rect x="3" y="14" width="7" height="7" />
                                <rect x="14" y="14" width="7" height="7" />
                            </svg>
                        } />
                        <MenuLink href="/creators/dashboard/upload" label="Upload Video" icon={
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        } />
                    </div>

                    {/* Divider */}
                    <div className="border-t border-white/[0.06]" />

                    {/* Settings + sign out */}
                    <div className="py-1">
                        <MenuLink href="/settings" label="Settings" icon={
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                        } />

                        <form action={signOut}>
                            <button
                                type="submit"
                                role="menuitem"
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400
                           hover:bg-white/5 hover:text-red-300 transition-colors cursor-pointer
                           focus-visible:outline-none focus-visible:bg-white/5 text-left"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                                Sign out
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

function MenuLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
    return (
        <Link
            href={href}
            role="menuitem"
            className="flex items-center gap-3 px-4 py-2 text-sm text-white/70
                 hover:text-white hover:bg-white/5 transition-colors
                 focus-visible:outline-none focus-visible:bg-white/5"
        >
            <span className="text-white/40">{icon}</span>
            {label}
        </Link>
    )
}