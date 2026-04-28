'use client'

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useTransition,
} from 'react'
import { saveProgress } from '@/lib/actions/progress'
import {
  createPartyChannel,
  destroyPartyChannel,
  type PartyEvent,
} from '@/lib/supabase/realtime'
import { createBrowserClient } from '@supabase/ssr'
import type { RealtimeChannel } from '@supabase/supabase-js'
import PartyChat from './PartyChat'

type HlsType = typeof import('hls.js').default

let HlsLib: HlsType | null = null

async function loadHls(): Promise<HlsType> {
  if (HlsLib) return HlsLib

  const mod = await import('hls.js')
  HlsLib = mod.default

  return HlsLib
}

function fmtTime(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)

  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`
}

interface Props {
  titleId: string
  titleName: string
  roomId: string
  isHost: boolean
  currentUserId: string
  userEmail: string
  initialProgressSecs?: number
}

const DRIFT_S = 8
const SYNC_MS = 10_000
const SAVE_MS = 10_000

export default function WatchPartyPlayer({
  titleId,
  titleName,
  roomId,
  isHost,
  currentUserId,
  userEmail,
  initialProgressSecs = 0,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<InstanceType<HlsType> | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fullscreenRootRef = useRef<HTMLDivElement>(null)

  const currentTimeRef = useRef(initialProgressSecs)
  const durationRef = useRef(0)
  const lastHostTimeRef = useRef(initialProgressSecs)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [partyChannel, setPartyChannel] = useState<RealtimeChannel | null>(null)
  const [participantCount, setParticipantCount] = useState(1)
  const [needsUserStart, setNeedsUserStart] = useState(false)

  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [timeDisplay, setTimeDisplay] = useState('0:00 / 0:00')
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [guestLocked, setGuestLocked] = useState(!isHost)
  const [syncStatus, setSyncStatus] = useState<'live' | 'syncing' | 'buffering'>(
    'buffering'
  )
  const [srcError, setSrcError] = useState<string | null>(null)

  const [, startTransition] = useTransition()

  const broadcast = useCallback(
    (type: PartyEvent['type'], time: number) => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'party',
        payload: {
          type,
          time,
          sender_id: currentUserId,
          sent_at: Date.now(),
        } satisfies PartyEvent,
      })
    },
    [currentUserId]
  )

  useEffect(() => {
    const ch = createPartyChannel(roomId)

    channelRef.current = ch
    setPartyChannel(ch)

    ch.on<PartyEvent>('broadcast', { event: 'party' }, ({ payload }) => {
      if (!payload || isHost) return

      const ev = payload as PartyEvent
      const video = videoRef.current
      if (!video) return

      const latency = (Date.now() - ev.sent_at) / 1000
      const target = ev.time + (ev.type === 'PLAY' ? latency : 0)

      switch (ev.type) {
        case 'PLAY':
          lastHostTimeRef.current = target

          if (Math.abs(video.currentTime - target) > 0.5) {
            video.currentTime = target
          }

          video
            .play()
            .then(() => {
              setNeedsUserStart(false)
              setGuestLocked(false)
              setSyncStatus('live')
            })
            .catch((err) => {
              console.warn('Guest playback blocked until user interaction:', err)
              setNeedsUserStart(true)
              setGuestLocked(false)
              setSyncStatus('buffering')
            })
          break

        case 'PAUSE':
          lastHostTimeRef.current = ev.time
          video.pause()
          video.currentTime = ev.time
          setSyncStatus('live')
          break

        case 'SEEK':
          lastHostTimeRef.current = ev.time
          video.currentTime = ev.time
          setSyncStatus('live')
          break

        case 'SYNC':
          lastHostTimeRef.current = ev.time

          if (Math.abs(video.currentTime - ev.time) > DRIFT_S) {
            setSyncStatus('syncing')
            video.currentTime = ev.time
            setTimeout(() => setSyncStatus('live'), 800)
          } else {
            setSyncStatus('live')
          }

          break
      }
    })

    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState() as Record<string, unknown[]>

      const count = Object.values(state).reduce(
        (total, presences) => total + presences.length,
        0
      )

      setParticipantCount(Math.max(1, count))
    })

    const subscribeTimer = window.setTimeout(() => {
      ch.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await ch.track({
            user_id: currentUserId,
            email: userEmail,
            is_host: isHost,
            joined_at: new Date().toISOString(),
          })
        }
      })
    }, 0)

    return () => {
      window.clearTimeout(subscribeTimer)
      setPartyChannel(null)
      channelRef.current = null
      destroyPartyChannel(ch)
    }
  }, [roomId, isHost, currentUserId, userEmail])

  useEffect(() => {
    if (!isHost) return

    const id = setInterval(() => {
      const video = videoRef.current

      if (video && !video.paused) {
        broadcast('SYNC', video.currentTime)
      }
    }, SYNC_MS)

    return () => clearInterval(id)
  }, [isHost, broadcast])

  useEffect(() => {
    let destroyed = false

    async function init() {
      try {
        setIsLoading(true)
        setSrcError(null)
        setProgress(0)
        setBuffered(0)
        setTimeDisplay('0:00 / 0:00')
        setSyncStatus(isHost ? 'live' : 'buffering')

        const video = videoRef.current
        if (!video) return

        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          throw new Error('Not signed in')
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/+$/, '')
        const functionUrl = `${supabaseUrl}/functions/v1/get-signed-url/`
        const authHeader = `Bearer ${session.access_token}`

        const sourceUrl = `${functionUrl}?title_id=${encodeURIComponent(
          titleId
        )}&quality=720p`

        const seekToInitialProgress = () => {
          if (initialProgressSecs > 0) {
            video.currentTime = initialProgressSecs
            currentTimeRef.current = initialProgressSecs
          }
        }

        video.addEventListener('loadedmetadata', seekToInitialProgress, {
          once: true,
        })

        const Hls = await loadHls()

        if (destroyed) return

        if (Hls.isSupported()) {
          const hls = new Hls({
            startLevel: 0,
            capLevelToPlayerSize: true,
            maxBufferLength: 60,
            enableWorker: true,
            lowLatencyMode: false,
            xhrSetup: (xhr, url) => {
              if (url.includes('/functions/v1/get-signed-url')) {
                xhr.setRequestHeader('Authorization', authHeader)
              }
            },
          })

          hlsRef.current = hls
          hls.loadSource(sourceUrl)
          hls.attachMedia(video)

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoading(false)
            setSyncStatus(isHost ? 'live' : 'buffering')
          })

          hls.on(Hls.Events.ERROR, (_, data) => {
            console.error('Watch party HLS error:', data)

            if (data.fatal) {
              setSrcError('Playback error.')
            }
          })
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          setSrcError('Native HLS playback is not supported for private adaptive streams.')
        } else {
          setSrcError('Browser does not support HLS playback.')
        }
      } catch (e: any) {
        if (!destroyed) {
          setSrcError(e?.message ?? 'Playback error.')
        }
      }
    }

    init()

    return () => {
      destroyed = true

      hlsRef.current?.destroy()
      hlsRef.current = null

      const video = videoRef.current
      if (video) {
        video.removeAttribute('src')
        video.load()
      }
    }
  }, [titleId, initialProgressSecs, isHost])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onTime = () => {
      currentTimeRef.current = video.currentTime
      durationRef.current = video.duration || 0

      const pct =
        durationRef.current > 0
          ? (video.currentTime / durationRef.current) * 100
          : 0

      setProgress(pct)
      setTimeDisplay(`${fmtTime(video.currentTime)} / ${fmtTime(durationRef.current)}`)
    }

    const onProgress = () => {
      if (!video.buffered.length || !durationRef.current) return

      setBuffered(
        (video.buffered.end(video.buffered.length - 1) / durationRef.current) * 100
      )
    }

    const onPlay = () => {
      setIsPlaying(true)
      setIsLoading(false)
    }

    const onPause = () => setIsPlaying(false)

    const onWaiting = () => {
      setIsLoading(true)
      setSyncStatus('buffering')
    }

    const onPlaying = () => {
      setIsLoading(false)
      setSyncStatus('live')
    }

    video.addEventListener('timeupdate', onTime)
    video.addEventListener('progress', onProgress)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('waiting', onWaiting)
    video.addEventListener('playing', onPlaying)

    return () => {
      video.removeEventListener('timeupdate', onTime)
      video.removeEventListener('progress', onProgress)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('waiting', onWaiting)
      video.removeEventListener('playing', onPlaying)
    }
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      if (currentTimeRef.current > 5) {
        startTransition(() => saveProgress(titleId, currentTimeRef.current))
      }
    }, SAVE_MS)

    return () => {
      clearInterval(id)

      if (currentTimeRef.current > 5) {
        saveProgress(titleId, currentTimeRef.current)
      }
    }
  }, [titleId, startTransition])

  const showControls = useCallback(() => {
    setControlsVisible(true)

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
    }

    hideTimerRef.current = setTimeout(() => {
      setControlsVisible(false)
    }, 3000)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    el.addEventListener('mousemove', showControls, { passive: true })
    el.addEventListener('touchstart', showControls, { passive: true })

    return () => {
      el.removeEventListener('mousemove', showControls)
      el.removeEventListener('touchstart', showControls)
    }
  }, [showControls])

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement)

    document.addEventListener('fullscreenchange', onFs)

    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  function togglePlay() {
    if (!isHost) return

    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video
        .play()
        .then(() => broadcast('PLAY', video.currentTime))
        .catch(() => setSrcError('Could not start playback.'))
    } else {
      video.pause()
      broadcast('PAUSE', video.currentTime)
    }

    showControls()
  }

  function joinPlayback() {
    const video = videoRef.current
    if (!video) return

    video
      .play()
      .then(() => {
        setNeedsUserStart(false)
        setGuestLocked(false)
        setSyncStatus('live')
        showControls()
      })
      .catch((err) => {
        console.error('Could not start guest playback:', err)
        setSrcError('Could not start playback. Try clicking again.')
      })
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    if (!isHost) return

    const video = videoRef.current
    if (!video || !durationRef.current) return

    const pct = Number(e.target.value)
    const time = (pct / 100) * durationRef.current

    video.currentTime = time
    setProgress(pct)
    broadcast('SEEK', time)
  }

  function skip(s: number) {
    if (!isHost) return

    const video = videoRef.current
    if (!video) return

    const duration = durationRef.current || video.duration || 0
    const time = Math.max(0, Math.min(video.currentTime + s, duration))

    video.currentTime = time
    broadcast('SEEK', time)
    showControls()
  }

  function changeVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Number(e.target.value)
    const video = videoRef.current
    if (!video) return

    video.volume = val
    video.muted = val === 0

    setVolume(val)
    setIsMuted(val === 0)
  }

  function toggleMute() {
    const video = videoRef.current
    if (!video) return

    video.muted = !video.muted
    setIsMuted(video.muted)
  }

  async function toggleFs() {
    const el = fullscreenRootRef.current
    if (!el) return

    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else {
      await el.requestFullscreen()
    }

    showControls()
  }

  if (srcError) {
    return (
      <div className="aspect-video bg-black rounded-xl flex items-center justify-center">
        <p className="text-red-400 text-sm">{srcError}</p>
      </div>
    )
  }

  return (
    <div
      ref={fullscreenRootRef}
      className={
        isFullscreen
          ? 'fixed inset-0 z-[100] bg-black'
          : 'flex gap-4 items-start'
      }
    >
      <div className={isFullscreen ? 'w-full h-full' : 'flex-1 min-w-0'}>
        <div
          ref={containerRef}
          onDoubleClick={toggleFs}
          className={`group relative bg-black overflow-hidden select-none ${
            isFullscreen ? 'w-full h-full' : 'aspect-video rounded-xl w-full'
          }`}
        >
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            playsInline
            preload="metadata"
            aria-label={`Watch party: ${titleName}`}
          />

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-cinema-accent animate-spin" />
            </div>
          )}

          {guestLocked && !isLoading && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center
                         bg-black/70 backdrop-blur-sm gap-4"
            >
              <div
                className="w-14 h-14 rounded-full bg-cinema-surface border border-white/10
                           flex items-center justify-center"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 22 22"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-white/40"
                  aria-hidden
                >
                  <rect x="3" y="11" width="16" height="10" rx="2" />
                  <path d="M7 11V7a4 4 0 0 1 8 0v4" />
                </svg>
              </div>
              <p className="text-white/60 text-sm">Waiting for host to start playback…</p>
            </div>
          )}

          <button
            className="absolute inset-0 w-full h-full focus:outline-none"
            onClick={isHost ? togglePlay : undefined}
            aria-label={isHost ? (isPlaying ? 'Pause' : 'Play') : 'Controlled by host'}
            disabled={!isHost}
          />

          {needsUserStart && !isHost && !isLoading && (
            <div
              className="absolute inset-0 z-20 flex flex-col items-center justify-center
                         bg-black/70 backdrop-blur-sm gap-4"
            >
              <p className="text-white/70 text-sm text-center max-w-sm">
                Your browser blocked automatic playback. Click below to join the watch party.
              </p>

              <button
                type="button"
                onClick={joinPlayback}
                className="bg-cinema-accent hover:bg-cinema-accent-hover text-white
                           font-semibold px-6 py-3 rounded-lg text-sm transition-colors
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-cinema-accent"
              >
                Join playback
              </button>
            </div>
          )}

          <div
            className={`absolute inset-0 flex flex-col justify-between pointer-events-none
                       bg-gradient-to-t from-black/80 via-transparent to-black/30
                       transition-opacity duration-300
                       ${controlsVisible || !isPlaying ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="px-5 pt-4 flex items-center justify-between pointer-events-auto">
              <p className="text-white font-semibold text-sm drop-shadow">{titleName}</p>

              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${
                    syncStatus === 'live'
                      ? 'bg-green-500/20 border-green-500/30 text-green-400'
                      : syncStatus === 'syncing'
                        ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                        : 'bg-white/10 border-white/20 text-white/40'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      syncStatus === 'live'
                        ? 'bg-green-400 animate-pulse'
                        : syncStatus === 'syncing'
                          ? 'bg-amber-400'
                          : 'bg-white/30'
                    }`}
                  />
                  {syncStatus === 'live'
                    ? 'Live'
                    : syncStatus === 'syncing'
                      ? 'Syncing…'
                      : 'Buffering'}
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    isHost
                      ? 'bg-cinema-accent/20 border-cinema-accent/40 text-cinema-accent'
                      : 'bg-white/10 border-white/20 text-white/50'
                  }`}
                >
                  {isHost ? 'Host' : 'Guest'}
                </span>
              </div>
            </div>

            <div className="px-5 pb-5 space-y-3 pointer-events-auto">
              <div
                className={`relative h-1 hover:h-1.5 transition-all duration-150 group/seek ${
                  isHost ? '' : 'opacity-50'
                }`}
              >
                <div
                  className="absolute inset-y-0 left-0 bg-white/20 rounded-full"
                  style={{ width: `${buffered}%` }}
                />

                {isHost && (
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={progress}
                    onChange={handleSeek}
                    aria-label="Seek"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                )}

                <div
                  className="absolute inset-y-0 left-0 bg-cinema-accent rounded-full"
                  style={{ width: `${progress}%` }}
                />

                {isHost && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-cinema-accent rounded-full
                               opacity-0 group-hover/seek:opacity-100 transition-opacity pointer-events-none
                               shadow-lg shadow-cinema-accent/50"
                    style={{ left: `calc(${progress}% - 7px)` }}
                  />
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={isHost ? togglePlay : undefined}
                    disabled={!isHost}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors
                                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent
                                ${
                                  isHost
                                    ? 'text-white hover:text-cinema-accent cursor-pointer'
                                    : 'text-white/20 cursor-not-allowed'
                                }`}
                  >
                    {isPlaying ? (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                        <rect x="4" y="2" width="4" height="16" rx="1" />
                        <rect x="12" y="2" width="4" height="16" rx="1" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                        <path d="M5 2l13 8-13 8V2z" />
                      </svg>
                    )}
                  </button>

                  {([-10, 10] as const).map((seconds) => (
                    <button
                      key={seconds}
                      onClick={() => skip(seconds)}
                      disabled={!isHost}
                      aria-label={`${seconds < 0 ? 'Rewind' : 'Skip'} ${Math.abs(
                        seconds
                      )} seconds`}
                      className={`transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent rounded ${
                        isHost
                          ? 'text-white/70 hover:text-white cursor-pointer'
                          : 'text-white/20 cursor-not-allowed'
                      }`}
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                        {seconds < 0 ? (
                          <>
                            <path d="M10 3a7 7 0 1 0 6.06 3.5" strokeLinecap="round" />
                            <path d="M16 2v4.5H11.5" strokeLinecap="round" strokeLinejoin="round" />
                          </>
                        ) : (
                          <>
                            <path d="M10 3a7 7 0 1 1-6.06 3.5" strokeLinecap="round" />
                            <path d="M4 2v4.5H8.5" strokeLinecap="round" strokeLinejoin="round" />
                          </>
                        )}
                        <text
                          x="10"
                          y="12.5"
                          textAnchor="middle"
                          fontSize="5.5"
                          fill="currentColor"
                          stroke="none"
                          fontWeight="600"
                        >
                          {Math.abs(seconds)}
                        </text>
                      </svg>
                    </button>
                  ))}

                  <div className="flex items-center gap-2 group/vol">
                    <button
                      onClick={toggleMute}
                      aria-label={isMuted ? 'Unmute' : 'Mute'}
                      className="text-white/70 hover:text-white transition-colors cursor-pointer
                                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent rounded"
                    >
                      {isMuted || volume === 0 ? (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                          <path d="M3 7h3l5-4v14l-5-4H3V7z" />
                          <line x1="14" y1="8" x2="18" y2="12" stroke="currentColor" strokeWidth="2" />
                          <line x1="18" y1="8" x2="14" y2="12" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                          <path d="M3 7h3l5-4v14l-5-4H3V7z" />
                          <path d="M13 7.5a4 4 0 0 1 0 5M15.5 5.5a7 7 0 0 1 0 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      )}
                    </button>

                    <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-200">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={changeVolume}
                        aria-label="Volume"
                        className="w-20 accent-cinema-accent cursor-pointer"
                      />
                    </div>
                  </div>

                  <span className="text-white/50 text-xs tabular-nums hidden sm:block">
                    {timeDisplay}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full
                               bg-white/10 border border-white/20 text-white/50 text-xs font-semibold"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    {participantCount} watching
                  </div>

                  <button
                    onClick={toggleFs}
                    aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                    className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-white
                               transition-colors cursor-pointer
                               focus-visible:outline-none focus-visible:ring-2
                               focus-visible:ring-cinema-accent rounded-full"
                  >
                    {isFullscreen ? (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M7 3v4H3" />
                        <path d="M13 3v4h4" />
                        <path d="M7 17v-4H3" />
                        <path d="M13 17v-4h4" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M3 7V3h4" />
                        <path d="M13 3h4v4" />
                        <path d="M3 13v4h4" />
                        <path d="M17 13v4h-4" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {partyChannel && (
        <div
          className={
            isFullscreen
              ? 'contents'
              : 'w-72 xl:w-80 flex-shrink-0 h-[calc(56.25vw-2rem)] max-h-[600px] min-h-[400px]'
          }
        >
          <PartyChat
            channel={partyChannel}
            currentUserId={currentUserId}
            userEmail={userEmail}
            isHost={isHost}
            isFullscreen={isFullscreen}
          />
        </div>
      )}
    </div>
  )
}