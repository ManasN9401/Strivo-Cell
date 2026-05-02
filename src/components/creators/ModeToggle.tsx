'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useTransition } from 'react'

export default function ModeToggle() {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const isCreators = pathname.startsWith('/creators')

  function switchMode(mode: 'cinema' | 'creators') {
    if (mode === 'cinema' && isCreators) {
      startTransition(() => router.push('/'))
    } else if (mode === 'creators' && !isCreators) {
      startTransition(() => router.push('/creators'))
    }
  }

  return (
    <div
      role="group"
      aria-label="Switch viewing mode"
      className="hidden sm:flex items-center gap-0.5 bg-white/[0.06] border border-white/[0.08]
                 rounded-full p-0.5 shrink-0"
    >
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
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold',
        'transition-all duration-200 cursor-pointer min-h-[32px]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent',
        active
          ? 'bg-cinema-accent text-white shadow-[0_0_12px_rgba(9,21,230,0.4)]'
          : 'text-white/50 hover:text-white/80 disabled:cursor-default',
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  )
}