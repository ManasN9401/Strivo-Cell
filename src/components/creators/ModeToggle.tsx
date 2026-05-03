'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useTransition, useState, useEffect } from 'react'

export default function ModeToggle() {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [squish, setSquish] = useState(false)

  const [localMode, setLocalMode] = useState<'cinema' | 'creators'>(
    pathname.startsWith('/creators') ? 'creators' : 'cinema'
  )

  useEffect(() => {
    setLocalMode(pathname.startsWith('/creators') ? 'creators' : 'cinema')
  }, [pathname])

  const isCreators = localMode === 'creators'

  function switchMode(mode: 'cinema' | 'creators') {
    if (mode !== localMode) {
      setLocalMode(mode)
      setSquish(true)
      setTimeout(() => setSquish(false), 150)
      startTransition(() => router.push(mode === 'cinema' ? '/' : '/creators'))
    }
  }

  return (
    <div
      role="group"
      aria-label="Switch viewing mode"
      className="relative hidden sm:flex items-center gap-0.5 bg-white/[0.06] border border-white/[0.08]
                 rounded-full p-0.5 shrink-0"
    >
      <div
        className={`absolute inset-y-0.5 rounded-full shadow-[0_0_12px_rgba(34,211,238,0.4)] transition-all duration-300 ease-in-out z-0 ${
          isCreators 
            ? 'bg-gradient-to-r from-cyan-400 to-blue-500' 
            : 'bg-gradient-to-r from-blue-500 to-cyan-400'
        }`}
        style={{
          left: isCreators ? 'calc(50% + 1px)' : '2px',
          width: 'calc(50% - 3px)',
          transform: squish ? 'scaleX(0.6)' : 'scaleX(1)'
        }}
      />
      <ModeButton
        label="Cinema"
        icon={
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor"
               strokeWidth="1.8" aria-hidden>
            <rect x="1" y="3" width="14" height="10" rx="1.5"/>
            <path d="M5 3V13M11 3V13M1 6h3M12 6h3M1 10h3M12 10h3"/>
          </svg>
        }
        active={!isCreators}
        pending={isPending}
        onClick={() => switchMode('cinema')}
      />
      <ModeButton
        label="Creators"
        icon={
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor"
               strokeWidth="1.8" aria-hidden>
            <circle cx="8" cy="8" r="6.5"/>
            <polygon points="6.5,5.5 11.5,8 6.5,10.5" fill="currentColor" stroke="none"/>
          </svg>
        }
        active={isCreators}
        pending={isPending}
        onClick={() => switchMode('creators')}
      />
    </div>
  )
}

interface ModeButtonProps {
  label: string
  icon: React.ReactNode
  active: boolean
  pending: boolean
  onClick: () => void
}

function ModeButton({ label, icon, active, pending, onClick }: ModeButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      disabled={active || pending}
      className={[
        'relative z-10 flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold',
        'transition-colors duration-200 cursor-pointer min-h-[32px] w-[90px]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strivo-accent',
        active
          ? 'text-white'
          : 'text-white/50 hover:text-white/80 disabled:cursor-default',
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  )
}