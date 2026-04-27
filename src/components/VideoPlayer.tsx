'use client'

import { useRef, useState, useEffect, useCallback, useTransition } from 'react'
import { saveProgress } from '@/lib/actions/progress'
import { createBrowserClient } from '@supabase/ssr'

type HlsType = typeof import('hls.js').default
type PlaybackEngine = 'hlsjs' | 'native' | 'unsupported' | null

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
  initialProgressSecs?: number
}

export default function VideoPlayer({
  titleId,
  titleName,
  initialProgressSecs = 0,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<InstanceType<HlsType> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)

  const currentTimeRef = useRef(initialProgressSecs)
  const durationRef = useRef(0)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [timeDisplay, setTimeDisplay] = useState('0:00 / 0:00')
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [srcError, setSrcError] = useState<string | null>(null)

  const [playbackEngine, setPlaybackEngine] = useState<PlaybackEngine>(null)

  const [qualityLevels, setQualityLevels] = useState<
    { index: number; label: string }[]
  >([])
  const [selectedLevel, setSelectedLevel] = useState(-1)

  const [showSettings, setShowSettings] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)

  const [subtitleTracks, setSubtitleTracks] = useState<
    { label: string; lang: string; index: number }[]
  >([])
  const [selectedSubtitle, setSelectedSubtitle] = useState(-1)

  const [, startTransition] = useTransition()

  useEffect(() => {
    let destroyed = false

    async function init() {
      try {
        setIsLoading(true)
        setSrcError(null)
        setProgress(0)
        setBuffered(0)
        setTimeDisplay('0:00 / 0:00')
        setPlaybackEngine(null)
        setQualityLevels([])
        setSelectedLevel(-1)
        setSubtitleTracks([])
        setSelectedSubtitle(-1)
        setShowSettings(false)

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

          video.playbackRate = playbackRate
        }

        video.addEventListener('loadedmetadata', seekToInitialProgress, {
          once: true,
        })

        const Hls = await loadHls()

        if (destroyed) return

        if (Hls.isSupported()) {
          setPlaybackEngine('hlsjs')

          const hls = new Hls({
            startLevel: -1,
            maxBufferLength: 30,
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
            const levels = hls.levels.map((level, index) => ({
              index,
              label: level.height
                ? `${level.height}p`
                : `${Math.round(level.bitrate / 1000)}kbps`,
            }))

            const tracks = hls.subtitleTracks.map((track, index) => ({
              index,
              label: track.name || track.lang || `Track ${index + 1}`,
              lang: track.lang || '',
            }))

            setQualityLevels(levels)
            setSelectedLevel(-1)
            setSubtitleTracks(tracks)
            setSelectedSubtitle(-1)
            setIsLoading(false)
          })

          hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, () => {
            const tracks = hls.subtitleTracks.map((track, index) => ({
              index,
              label: track.name || track.lang || `Track ${index + 1}`,
              lang: track.lang || '',
            }))

            setSubtitleTracks(tracks)
          })

          hls.on(Hls.Events.ERROR, (_, data) => {
            console.error('HLS error:', data)

            if (data.fatal) {
              setSrcError('Playback error.')
            }
          })
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          setPlaybackEngine('native')
          setSrcError('Native HLS playback is not supported for private adaptive streams.')
        } else {
          setPlaybackEngine('unsupported')
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
  }, [titleId, initialProgressSecs])

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
    const onWaiting = () => setIsLoading(true)
    const onPlaying = () => setIsLoading(false)

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
    saveTimerRef.current = setInterval(() => {
      if (currentTimeRef.current > 5) {
        startTransition(() => saveProgress(titleId, currentTimeRef.current))
      }
    }, 10_000)

    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current)

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
      setShowSettings(false)
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

  useEffect(() => {
    function onDocumentMouseDown(e: MouseEvent) {
      if (!showSettings) return

      if (
        settingsRef.current &&
        e.target instanceof Node &&
        !settingsRef.current.contains(e.target)
      ) {
        setShowSettings(false)
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowSettings(false)
      }
    }

    document.addEventListener('mousedown', onDocumentMouseDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('mousedown', onDocumentMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [showSettings])

  function togglePlay() {
    const v = videoRef.current
    if (!v) return

    if (v.paused) {
      v.play().catch(() => {
        setSrcError('Could not start playback.')
      })
    } else {
      v.pause()
    }

    showControls()
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const v = videoRef.current
    if (!v || !durationRef.current) return

    const pct = Number(e.target.value)

    v.currentTime = (pct / 100) * durationRef.current
    setProgress(pct)
  }

  function changeVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Number(e.target.value)
    const v = videoRef.current
    if (!v) return

    v.volume = val
    v.muted = val === 0

    setVolume(val)
    setIsMuted(val === 0)
  }

  function toggleMute() {
    const v = videoRef.current
    if (!v) return

    v.muted = !v.muted
    setIsMuted(v.muted)
  }

  function changeQuality(levelIndex: number) {
    const hls = hlsRef.current
    if (!hls) return

    hls.currentLevel = levelIndex
    setSelectedLevel(levelIndex)
    showControls()
  }

  function changePlaybackRate(rate: number) {
    const video = videoRef.current
    if (!video) return

    video.playbackRate = rate
    setPlaybackRate(rate)
    showControls()
  }

  function disableSubtitles() {
    const hls = hlsRef.current
    if (!hls) return

    hls.subtitleTrack = -1
    setSelectedSubtitle(-1)
    showControls()
  }

  function changeSubtitleTrack(index: number) {
    const hls = hlsRef.current
    if (!hls) return

    hls.subtitleTrack = index
    setSelectedSubtitle(index)
    showControls()
  }

  function skip(s: number) {
    const v = videoRef.current
    if (!v) return

    v.currentTime = Math.max(
      0,
      Math.min(v.currentTime + s, durationRef.current || v.duration || 0)
    )

    showControls()
  }

  async function toggleFs() {
    const el = containerRef.current
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
      ref={containerRef}
      onDoubleClick={toggleFs}
      className={`group relative bg-black overflow-hidden select-none ${
        isFullscreen ? 'fixed inset-0 z-[100]' : 'aspect-video rounded-xl w-full'
      }`}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        preload="metadata"
        aria-label={`Now playing: ${titleName}`}
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-cinema-accent animate-spin" />
        </div>
      )}

      <button
        className="absolute inset-0 w-full h-full focus:outline-none"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      />

      <div
        className={`absolute inset-0 flex flex-col justify-between
        bg-gradient-to-t from-black/80 via-transparent to-black/30
        transition-opacity duration-300
        ${controlsVisible || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="px-5 pt-4">
          <p className="text-white font-semibold text-sm drop-shadow">{titleName}</p>
        </div>

        <div className="px-5 pb-5 space-y-3">
          <div className="relative group/seek h-1 hover:h-1.5 transition-all duration-150">
            <div
              className="absolute inset-y-0 left-0 bg-white/20 rounded-full"
              style={{ width: `${buffered}%` }}
            />

            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progress}
              onChange={seek}
              aria-label="Seek"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />

            <div
              className="absolute inset-y-0 left-0 bg-cinema-accent rounded-full"
              style={{ width: `${progress}%` }}
            />

            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-cinema-accent
              rounded-full opacity-0 group-hover/seek:opacity-100 transition-opacity
              shadow-lg shadow-cinema-accent/50 pointer-events-none"
              style={{ left: `calc(${progress}% - 7px)` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="w-9 h-9 flex items-center justify-center text-white
                hover:text-cinema-accent transition-colors cursor-pointer
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent rounded-full"
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

              <button
                onClick={() => skip(-10)}
                aria-label="Rewind 10 seconds"
                className="text-white/70 hover:text-white transition-colors cursor-pointer
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent rounded"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M10 3a7 7 0 1 0 6.06 3.5" strokeLinecap="round" />
                  <path d="M16 2v4.5H11.5" strokeLinecap="round" strokeLinejoin="round" />
                  <text x="10" y="12.5" textAnchor="middle" fontSize="5.5" fill="currentColor" stroke="none" fontWeight="600">10</text>
                </svg>
              </button>

              <button
                onClick={() => skip(10)}
                aria-label="Skip 10 seconds"
                className="text-white/70 hover:text-white transition-colors cursor-pointer
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent rounded"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M10 3a7 7 0 1 1-6.06 3.5" strokeLinecap="round" />
                  <path d="M4 2v4.5H8.5" strokeLinecap="round" strokeLinejoin="round" />
                  <text x="10" y="12.5" textAnchor="middle" fontSize="5.5" fill="currentColor" stroke="none" fontWeight="600">10</text>
                </svg>
              </button>

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

              <span className="text-white/60 text-xs tabular-nums hidden sm:block">
                {timeDisplay}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <div ref={settingsRef} className="relative flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowSettings((v) => !v)
                    showControls()
                  }}
                  aria-label="Playback settings"
                  className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-white
                            transition-colors cursor-pointer
                            focus-visible:outline-none focus-visible:ring-2
                            focus-visible:ring-cinema-accent rounded-full"
                >
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M8.7 2.8h2.6l.5 1.8c.5.2.9.4 1.4.8l1.8-.5 1.3 2.2-1.3 1.3c.1.3.1.7.1 1s0 .7-.1 1l1.3 1.3-1.3 2.2-1.8-.5c-.4.3-.9.6-1.4.8l-.5 1.8H8.7l-.5-1.8a5.9 5.9 0 0 1-1.4-.8l-1.8.5-1.3-2.2L5 10.4a7 7 0 0 1 0-2L3.7 7.1 5 4.9l1.8.5c.4-.3.9-.6 1.4-.8l.5-1.8Z" />
                    <circle cx="10" cy="10" r="2.3" />
                  </svg>
                </button>

                {showSettings && (
                  <div
                    className="absolute bottom-11 right-0 w-60 rounded-xl border border-white/10
                              bg-cinema-surface/95 backdrop-blur-xl shadow-xl p-3 space-y-4 z-30"
                  >
                    <div>
                      <p className="text-xs font-semibold text-white/70 mb-2">Quality</p>

                      {playbackEngine === 'hlsjs' && qualityLevels.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => changeQuality(-1)}
                            className={`text-[11px] px-2 py-1 rounded border transition-colors ${
                              selectedLevel === -1
                                ? 'border-cinema-accent text-cinema-accent bg-cinema-accent/10'
                                : 'border-white/10 text-white/60 hover:text-white'
                            }`}
                          >
                            Auto
                          </button>

                          {qualityLevels.map((level) => (
                            <button
                              key={level.index}
                              type="button"
                              onClick={() => changeQuality(level.index)}
                              className={`text-[11px] px-2 py-1 rounded border transition-colors ${
                                selectedLevel === level.index
                                  ? 'border-cinema-accent text-cinema-accent bg-cinema-accent/10'
                                  : 'border-white/10 text-white/60 hover:text-white'
                              }`}
                            >
                              {level.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-white/40">
                          Quality controls unavailable
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-white/70 mb-2">Speed</p>

                      <div className="flex flex-wrap gap-1.5">
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => changePlaybackRate(rate)}
                            className={`text-[11px] px-2 py-1 rounded border transition-colors ${
                              playbackRate === rate
                                ? 'border-cinema-accent text-cinema-accent bg-cinema-accent/10'
                                : 'border-white/10 text-white/60 hover:text-white'
                            }`}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-white/70 mb-2">Subtitles</p>

                      {playbackEngine === 'hlsjs' && subtitleTracks.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={disableSubtitles}
                            className={`text-[11px] px-2 py-1 rounded border transition-colors ${
                              selectedSubtitle === -1
                                ? 'border-cinema-accent text-cinema-accent bg-cinema-accent/10'
                                : 'border-white/10 text-white/60 hover:text-white'
                            }`}
                          >
                            Off
                          </button>

                          {subtitleTracks.map((track) => (
                            <button
                              key={track.index}
                              type="button"
                              onClick={() => changeSubtitleTrack(track.index)}
                              className={`text-[11px] px-2 py-1 rounded border transition-colors ${
                                selectedSubtitle === track.index
                                  ? 'border-cinema-accent text-cinema-accent bg-cinema-accent/10'
                                  : 'border-white/10 text-white/60 hover:text-white'
                              }`}
                            >
                              {track.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-white/40">
                          No subtitles available
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={toggleFs}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-white
                          transition-colors cursor-pointer
                          focus-visible:outline-none focus-visible:ring-2
                          focus-visible:ring-cinema-accent rounded-full"
              >
                {isFullscreen ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M7 3v4H3" />
                    <path d="M13 3v4h4" />
                    <path d="M7 17v-4H3" />
                    <path d="M13 17v-4h4" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
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
  )
}