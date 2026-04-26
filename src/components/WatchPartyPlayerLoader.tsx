'use client'

import dynamic from 'next/dynamic'

const WatchPartyPlayer = dynamic(() => import('@/components/WatchPartyPlayer'), {
  ssr: false,
  loading: () => (
    <div className="aspect-video bg-black rounded-xl flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-cinema-accent animate-spin" />
    </div>
  ),
})

export default WatchPartyPlayer