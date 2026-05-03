'use client'

import dynamic from 'next/dynamic'

const VideoPlayer = dynamic(() => import('./VideoPlayer'), {
  ssr: false,
  loading: () => (
    <div className="aspect-video bg-black rounded-xl flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-strivo-accent animate-spin"/>
    </div>
  ),
})

interface Props {
  titleId:              string
  titleName:            string
  initialProgressSecs?: number
}

export default function VideoPlayerWrapper(props: Props) {
  return <VideoPlayer {...props} />
}