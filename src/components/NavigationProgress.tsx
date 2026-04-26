'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Thin cobalt progress bar at the top of the page that animates
 * during every route transition — gives instant feedback that
 * something is happening when a link is clicked.
 */
export default function NavigationProgress() {
  const pathname      = usePathname()
  const searchParams  = useSearchParams()
  const [visible,  setVisible]  = useState(false)
  const [width,    setWidth]    = useState(0)
  const [leaving,  setLeaving]  = useState(false)
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef    = useRef<number | null>(null)

  // Simulate progress crawl while navigating
  function startProgress() {
    setLeaving(false)
    setWidth(0)
    setVisible(true)

    let current = 0
    function crawl() {
      // Accelerate quickly to ~70% then slow down — never reaches 100 naturally
      const increment = current < 30 ? 8 : current < 60 ? 4 : current < 80 ? 1.5 : 0.3
      current = Math.min(current + increment, 92)
      setWidth(current)
      rafRef.current = requestAnimationFrame(crawl)
    }
    rafRef.current = requestAnimationFrame(crawl)
  }

  function completeProgress() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setWidth(100)
    setLeaving(true)
    timerRef.current = setTimeout(() => {
      setVisible(false)
      setWidth(0)
      setLeaving(false)
    }, 400)
  }

  // Track navigation start via click interception
  useEffect(() => {
    function onLinkClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest('a')
      if (!target) return
      const href = target.getAttribute('href')
      // Only intercept internal navigation links
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return
      if (e.metaKey || e.ctrlKey || e.shiftKey) return
      startProgress()
    }

    document.addEventListener('click', onLinkClick)
    return () => document.removeEventListener('click', onLinkClick)
  }, [])

  // Complete when route actually changes
  useEffect(() => {
    completeProgress()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [pathname, searchParams])

  if (!visible) return null

  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 z-[200] h-[2px] pointer-events-none"
    >
      <div
        className="h-full bg-cinema-accent shadow-[0_0_8px_#0915e6]"
        style={{
          width:      `${width}%`,
          transition: leaving
            ? 'width 0.3s ease-out, opacity 0.4s ease-out'
            : 'width 0.1s linear',
          opacity: leaving ? 0 : 1,
        }}
      />
    </div>
  )
}
