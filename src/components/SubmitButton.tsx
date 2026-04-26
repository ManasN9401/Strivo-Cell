'use client'

import type { ReactNode } from 'react'
import { useFormStatus } from 'react-dom'

interface Props {
  children: ReactNode
  className?: string
  pendingLabel?: string
}

export default function SubmitButton({ children, className, pendingLabel }: Props) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={className}
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <span
            className="w-4 h-4 rounded-full border-2 border-current
                       border-t-transparent animate-spin shrink-0"
            aria-hidden
          />
          {pendingLabel ?? children}
        </span>
      ) : (
        children
      )}
    </button>
  )
}