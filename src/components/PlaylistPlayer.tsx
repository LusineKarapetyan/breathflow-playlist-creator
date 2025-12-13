import { useState, useEffect, useRef } from "react"
import { Play, Pause, SkipForward, SkipBack, RotateCcw } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import type { Playlist, Track } from "../types"
import { motion, AnimatePresence } from "framer-motion"

interface PlaylistPlayerProps {
  playlist: Playlist
}

interface PlaybackState {
  currentSectionIndex: number
  currentTrackIndex: number
  isPlaying: boolean
  currentTime: number
  autoAdvance: boolean
}

export function PlaylistPlayer({ playlist }: PlaylistPlayerProps) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    currentSectionIndex: 0,
    currentTrackIndex: 0,
    isPlaying: false,
    currentTime: 0,
    autoAdvance: false,
  })

  const [transitionCountdown, setTransitionCountdown] = useState<number | null>(null)
  const [useFallback, setUseFallback] = useState(false)
  const playerRef = useRef<YT.Player | null>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const transitionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isTransitioningRef = useRef(false)
  const handleVideoEndedRef = useRef<() => void>(() => {})
  const lastVideoIdRef = useRef<string | null>(null)

  const getCurrentTrack = (): Track | null => {
    const section = playlist.sections[playbackState.currentSectionIndex]
    if (!section) return null
    return section.tracks[playbackState.currentTrackIndex] || null
  }

  const getNextTrack = (): { sectionIndex: number; trackIndex: number } | null => {
    let { currentSectionIndex, currentTrackIndex } = playbackState

    // Try next track in current section
    if (
      currentTrackIndex + 1 <
      playlist.sections[currentSectionIndex]?.tracks.length
    ) {
      return {
        sectionIndex: currentSectionIndex,
        trackIndex: currentTrackIndex + 1,
      }
    }

    // Try first track in next section
    if (currentSectionIndex + 1 < playlist.sections.length) {
      return {
        sectionIndex: currentSectionIndex + 1,
        trackIndex: 0,
      }
    }

    return null
  }

  const getPreviousTrack = (): { sectionIndex: number; trackIndex: number } | null => {
    let { currentSectionIndex, currentTrackIndex } = playbackState

    // Try previous track in current section
    if (currentTrackIndex > 0) {
      return {
        sectionIndex: currentSectionIndex,
        trackIndex: currentTrackIndex - 1,
      }
    }

    // Try last track in previous section
    if (currentSectionIndex > 0) {
      const prevSection = playlist.sections[currentSectionIndex - 1]
      return {
        sectionIndex: currentSectionIndex - 1,
        trackIndex: prevSection.tracks.length - 1,
      }
    }

    return null
  }

  const currentTrack = getCurrentTrack()
  const currentSection =
    playlist.sections[playbackState.currentSectionIndex] || null

  // Handle video ended event - use useEffect to keep closure fresh
  useEffect(() => {
    const handleVideoEnded = () => {
      if (isTransitioningRef.current) {
        console.log("Already transitioning, ignoring video end")
        return // Prevent multiple triggers
      }

      console.log("Handling video ended, autoAdvance:", playbackState.autoAdvance)

      if (!playbackState.autoAdvance) {
        console.log("Auto-advance is OFF, stopping")
        return
      }

      // Calculate next track
      let nextSectionIndex = playbackState.currentSectionIndex
      let nextTrackIndex = playbackState.currentTrackIndex + 1

      // Try next track in current section
      const currentSection = playlist.sections[playbackState.currentSectionIndex]
      if (nextTrackIndex < (currentSection?.tracks.length || 0)) {
        // Next track in same section
        console.log("Moving to next track in same section")
      } else if (playbackState.currentSectionIndex + 1 < playlist.sections.length) {
        // First track in next section
        nextSectionIndex = playbackState.currentSectionIndex + 1
        nextTrackIndex = 0
        console.log("Moving to first track in next section")
      } else {
        // No next track, stop auto-advance
        console.log("No next track, stopping auto-advance")
        setPlaybackState((prev) => ({ ...prev, autoAdvance: false }))
        return
      }

      const currentTrackData = currentSection?.tracks[playbackState.currentTrackIndex]
      const transitionTime = currentTrackData?.transitionTime || 0
      console.log("Transition time:", transitionTime)

      if (transitionTime > 0) {
        // Start transition countdown
        isTransitioningRef.current = true
        let countdown = transitionTime
        setTransitionCountdown(countdown)
        console.log("Starting transition countdown:", countdown)

        transitionTimerRef.current = setInterval(() => {
          countdown -= 1
          setTransitionCountdown(countdown)

          if (countdown <= 0) {
            // Transition time elapsed, move to next track
            if (transitionTimerRef.current) {
              clearInterval(transitionTimerRef.current)
              transitionTimerRef.current = null
            }
            setTransitionCountdown(null)
            isTransitioningRef.current = false

            console.log("Transition complete, moving to next track")
            setPlaybackState({
              currentSectionIndex: nextSectionIndex,
              currentTrackIndex: nextTrackIndex,
              isPlaying: true,
              currentTime: 0,
              autoAdvance: playbackState.autoAdvance,
            })
          }
        }, 1000)
      } else {
        // No transition time, move immediately
        console.log("No transition time, moving immediately")
        isTransitioningRef.current = false
        setPlaybackState({
          currentSectionIndex: nextSectionIndex,
          currentTrackIndex: nextTrackIndex,
          isPlaying: true,
          currentTime: 0,
          autoAdvance: playbackState.autoAdvance,
        })
      }
    }

    // Store handler in ref so it can be called from YouTube API
    handleVideoEndedRef.current = handleVideoEnded
  }, [playbackState, playlist])

  // Set up YouTube API callback
  useEffect(() => {
    // Define the callback function for when YouTube API is ready
    const onYouTubeIframeAPIReady = () => {
      console.log("YouTube API ready")
    }

    // Set the global callback
    if (!(window as any).onYouTubeIframeAPIReady) {
      (window as any).onYouTubeIframeAPIReady = onYouTubeIframeAPIReady
    }

    return () => {
      // Clean up callback
      if ((window as any).onYouTubeIframeAPIReady === onYouTubeIframeAPIReady) {
        delete (window as any).onYouTubeIframeAPIReady
      }
    }
  }, [])

  // Initialize YouTube Player once (only when container is available)
  useEffect(() => {
    if (!playerContainerRef.current || playerRef.current) return

    // Wait for YouTube IFrame API to load
    const initPlayer = () => {
      if (!playerContainerRef.current || playerRef.current) return

      const containerId = `youtube-player-${Date.now()}`
      playerContainerRef.current.id = containerId

      const track = getCurrentTrack()
      // Initialize with first available track or empty
      const initialVideoId = track?.videoId || ""

      try {
        playerRef.current = new window.YT.Player(containerId, {
          height: "100%",
          width: "100%",
          videoId: initialVideoId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
          },
          events: {
            onReady: (event: YT.PlayerEvent) => {
              console.log("YouTube player ready")
              const track = getCurrentTrack()
              if (track) {
                console.log("Loading initial track:", track.videoId)
                event.target.loadVideoById(track.videoId)
                if (playbackState.isPlaying) {
                  setTimeout(() => {
                    try {
                      event.target.playVideo()
                    } catch (e) {
                      console.error("Error playing video on ready:", e)
                    }
                  }, 300)
                }
              }
            },
            onStateChange: (event: YT.OnStateChangeEvent) => {
              // YT.PlayerState.ENDED = 0
              if (event.data === window.YT.PlayerState.ENDED) {
                console.log("Video ended - state change detected")
                if (handleVideoEndedRef.current) {
                  handleVideoEndedRef.current()
                }
              }
            },
            onError: (event: YT.OnErrorEvent) => {
              console.error("YouTube player error:", event.data)
            },
          },
        })
        console.log("Player created")
      } catch (e) {
        console.error("Error creating YouTube player:", e)
      }
    }

    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(initPlayer, 200)
      return () => clearTimeout(timer)
    } else {
      // Wait for API to load (check every 100ms, max 5 seconds)
      let attempts = 0
      const maxAttempts = 50
      const checkYT = setInterval(() => {
        attempts++
        if (window.YT && window.YT.Player) {
          clearInterval(checkYT)
          setTimeout(initPlayer, 200)
        } else if (attempts >= maxAttempts) {
          clearInterval(checkYT)
          console.error("YouTube API failed to load, using fallback iframe")
          setUseFallback(true)
        }
      }, 100)

      return () => clearInterval(checkYT)
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy()
        } catch (e) {
          // Ignore errors
        }
        playerRef.current = null
      }
    }
  }, []) // Only initialize once

  // Update player when track changes (only if player already exists)
  useEffect(() => {
    if (playerRef.current && currentTrack) {
      // Only update if this is a different video
      if (lastVideoIdRef.current === currentTrack.videoId) {
        console.log("Video already loaded, skipping")
        return
      }

      console.log("Loading new track:", currentTrack.videoId, "Playing:", playbackState.isPlaying)
      lastVideoIdRef.current = currentTrack.videoId
      
      try {
        playerRef.current.loadVideoById(currentTrack.videoId)
        if (playbackState.isPlaying) {
          // Wait a bit for video to load, then play
          setTimeout(() => {
            if (playerRef.current) {
              try {
                playerRef.current.playVideo()
              } catch (e) {
                console.error("Error playing video:", e)
              }
            }
          }, 500)
        }
      } catch (e) {
        console.error("Error loading video:", e)
      }
    }
  }, [currentTrack?.videoId]) // Only when videoId changes

  // Update player playback state (play/pause)
  useEffect(() => {
    if (playerRef.current && currentTrack) {
      try {
        if (playbackState.isPlaying) {
          playerRef.current.playVideo()
        } else {
          playerRef.current.pauseVideo()
        }
      } catch (e) {
        console.error("Error controlling playback:", e)
      }
    }
  }, [playbackState.isPlaying]) // Only when play state changes (not videoId)

  const handlePlayPause = () => {
    const newIsPlaying = !playbackState.isPlaying
    setPlaybackState((prev) => ({ ...prev, isPlaying: newIsPlaying }))
    
    if (playerRef.current) {
      try {
        if (newIsPlaying) {
          playerRef.current.playVideo()
        } else {
          playerRef.current.pauseVideo()
        }
      } catch (e) {
        console.error("Error controlling playback:", e)
      }
    }
  }

  const handleNext = () => {
    const next = getNextTrack()
    if (next) {
      setPlaybackState({
        currentSectionIndex: next.sectionIndex,
        currentTrackIndex: next.trackIndex,
        isPlaying: true,
        currentTime: 0,
        autoAdvance: playbackState.autoAdvance,
      })
      setTransitionCountdown(null)
    }
  }

  const handlePrevious = () => {
    const prev = getPreviousTrack()
    if (prev) {
      setPlaybackState({
        currentSectionIndex: prev.sectionIndex,
        currentTrackIndex: prev.trackIndex,
        isPlaying: true,
        currentTime: 0,
        autoAdvance: playbackState.autoAdvance,
      })
      setTransitionCountdown(null)
    }
  }

  const toggleAutoAdvance = () => {
    setPlaybackState((prev) => ({
      ...prev,
      autoAdvance: !prev.autoAdvance,
    }))
    if (transitionCountdown !== null) {
      setTransitionCountdown(null)
    }
  }

  const allTracks: Array<{ track: Track; sectionTitle: string }> = []
  playlist.sections.forEach((section) => {
    section.tracks.forEach((track) => {
      allTracks.push({ track, sectionTitle: section.title })
    })
  })

  return (
    <div className="h-full flex flex-col">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Player</CardTitle>
        </CardHeader>
        <CardContent>
          {currentTrack ? (
            <div className="space-y-4">
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                {useFallback ? (
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${currentTrack.videoId}?controls=1&rel=0&modestbranding=1`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={currentTrack.title}
                  />
                ) : (
                  <div
                    ref={playerContainerRef}
                    className="w-full h-full"
                  />
                )}
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-1">{currentTrack.title}</h3>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {currentSection?.title} • Transition: {currentTrack.transitionTime}s
                  </p>
                  {transitionCountdown !== null && transitionCountdown > 0 && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                    >
                      <RotateCcw className="h-3 w-3 animate-spin" />
                      Next in {transitionCountdown}s
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={!getPreviousTrack()}
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button onClick={handlePlayPause} size="lg">
                    {playbackState.isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleNext}
                    disabled={!getNextTrack()}
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex justify-center">
                  <Button
                    variant={playbackState.autoAdvance ? "default" : "outline"}
                    size="sm"
                    onClick={toggleAutoAdvance}
                    className="text-xs"
                  >
                    {playbackState.autoAdvance ? "Auto-Advance: ON" : "Auto-Advance: OFF"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>No tracks to play.</p>
              <p className="text-sm mt-2">Add tracks in the editor to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardHeader>
          <CardTitle>Playlist</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <div className="space-y-2">
            <AnimatePresence>
              {playlist.sections.map((section, sectionIndex) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="mb-3">
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">
                      {section.title}
                    </h4>
                    <div className="space-y-1">
                      {section.tracks.map((track, trackIndex) => {
                        const isActive =
                          playbackState.currentSectionIndex === sectionIndex &&
                          playbackState.currentTrackIndex === trackIndex

                        return (
                          <motion.div
                            key={track.id}
                            whileHover={{ x: 4 }}
                            className={`p-2 rounded-md cursor-pointer transition-colors ${
                              isActive
                                ? "bg-indigo-100 text-indigo-700"
                                : "bg-gray-50 hover:bg-gray-100"
                            }`}
                            onClick={() => {
                              setPlaybackState({
                                currentSectionIndex: sectionIndex,
                                currentTrackIndex: trackIndex,
                                isPlaying: true,
                                currentTime: 0,
                                autoAdvance: playbackState.autoAdvance,
                              })
                              setTransitionCountdown(null)
                            }}
                          >
                            <p className="text-sm font-medium">{track.title}</p>
                            <p className="text-xs text-gray-500">
                              {track.transitionTime}s transition
                            </p>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

