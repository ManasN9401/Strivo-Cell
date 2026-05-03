'use client'

import Link        from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useEffect, useState } from 'react'

const NAV_LINKS = [
  { href: '/',        label: 'Home'    },
  { href: '/browse',  label: 'Browse'  },
  { href: '/library', label: 'My List' },
]

export function NavLinks() {
  const pathname  = usePathname()
  const listRef   = useRef<HTMLUListElement>(null)
  const [bar, setBar] = useState<{ left: number; width: number } | null>(null)

  // Resolve which link is active
  const activePath = pathname === '/'
    ? '/'
    : NAV_LINKS.filter(l => l.href !== '/').find(l => pathname.startsWith(l.href))?.href ?? null

  // Measure after paint so getBoundingClientRect() is accurate
  useEffect(() => {
    function measure() {
      const list = listRef.current
      if (!list) return
      const active = list.querySelector<HTMLElement>('[data-active="true"]')
      if (!active) { setBar(null); return }
      const listRect   = list.getBoundingClientRect()
      const activeRect = active.getBoundingClientRect()
      setBar({
        left:  activeRect.left - listRect.left,
        width: activeRect.width,
      })
    }

    // rAF ensures we measure after the browser has painted
    const id = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(id)
  }, [pathname])

  return (
    <div className="relative hidden md:flex items-center">
      <ul ref={listRef} className="flex items-center gap-8 list-none m-0 p-0">
        {NAV_LINKS.map(({ href, label }) => {
          const isActive = activePath === href
          return (
            <li key={href}>
              <Link
                href={href}
                data-active={isActive ? 'true' : 'false'}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'text-sm font-medium transition-colors duration-200 py-5 block',
                  'focus-visible:outline-none focus-visible:ring-2',
                  'focus-visible:ring-strivo-accent rounded',
                  isActive ? 'text-white' : 'text-white/50 hover:text-white',
                ].join(' ')}
              >
                {label}
              </Link>
            </li>
          )
        })}
      </ul>

      {/* Sliding indicator — only renders once we have a measurement */}
      {bar && (
        <div
          aria-hidden
          className="absolute bottom-0 h-[2px] bg-strivo-accent rounded-full
                     transition-all duration-300 ease-out"
          style={{ left: bar.left, width: bar.width }}
        />
      )}
    </div>
  )
}