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
    autoAdvance: true,
  })
  
  // Keep ref in sync with state
  useEffect(() => {
    isPlayingRef.current = playbackState.isPlaying
  }, [playbackState.isPlaying])

  const [transitionCountdown, setTransitionCountdown] = useState<number | null>(null)
  const [useFallback, setUseFallback] = useState(false)
  const [currentPlayerOpacity, setCurrentPlayerOpacity] = useState(1)
  const [nextPlayerOpacity, setNextPlayerOpacity] = useState(0)
  const [nextTrack, setNextTrack] = useState<{ sectionIndex: number; trackIndex: number } | null>(null)
  const playerRef = useRef<YT.Player | null>(null)
  const nextPlayerRef = useRef<YT.Player | null>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const nextPlayerContainerRef = useRef<HTMLDivElement>(null)
  const fadeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isTransitioningRef = useRef(false)
  const handleVideoEndedRef = useRef<() => void>(() => {})
  const lastVideoIdRef = useRef<string | null>(null)
  const videoDurationRef = useRef<number>(0)
  const videoCurrentTimeRef = useRef<number>(0)
  const isPlayingRef = useRef(true) // Track playing state to avoid closure issues

  const getCurrentTrack = (): Track | null => {
    const section = playlist.sections[playbackState.currentSectionIndex]
    if (!section) return null
    return section.tracks[playbackState.currentTrackIndex] || null
  }

  const getNextTrack = (state?: PlaybackState): { sectionIndex: number; trackIndex: number } | null => {
    // Use provided state or current playbackState to avoid closure issues
    const currentState = state || playbackState
    const currentSectionIndex = currentState.currentSectionIndex
    const currentTrackIndex = currentState.currentTrackIndex
    
    console.log("getNextTrack called - current section:", currentSectionIndex, "current track:", currentTrackIndex)
    console.log("Total sections:", playlist.sections.length)
    if (playlist.sections[currentSectionIndex]) {
      console.log("Current section exists, tracks count:", playlist.sections[currentSectionIndex].tracks.length)
      console.log("Current section tracks:", playlist.sections[currentSectionIndex].tracks.map(t => t.videoId))
    } else {
      console.log("Current section does not exist!")
    }
    
    // Try next track in current section
    const currentSection = playlist.sections[currentSectionIndex]
    if (currentSection) {
      const nextTrackIndex = currentTrackIndex + 1
      console.log("Checking if next track exists - next index:", nextTrackIndex, "total tracks:", currentSection.tracks.length)
      if (nextTrackIndex < currentSection.tracks.length) {
        console.log("Found next track in same section:", nextTrackIndex)
        return {
          sectionIndex: currentSectionIndex,
          trackIndex: nextTrackIndex,
        }
      } else {
        console.log("No more tracks in current section")
      }
    } else {
      console.log("Current section is null/undefined")
    }

    // Try first track in next section
    const nextSectionIndex = currentSectionIndex + 1
    console.log("Checking next section - next section index:", nextSectionIndex, "total sections:", playlist.sections.length)
    if (nextSectionIndex < playlist.sections.length) {
      const nextSection = playlist.sections[nextSectionIndex]
      if (nextSection && nextSection.tracks.length > 0) {
        console.log("Moving to next section:", nextSectionIndex)
        return {
          sectionIndex: nextSectionIndex,
          trackIndex: 0,
        }
      } else {
        console.log("Next section exists but has no tracks")
      }
    }

    console.log("No next track found")
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

  // Handle video ended event - complete the transition
  useEffect(() => {
    const handleVideoEnded = () => {
      console.log("Video ended - autoAdvance:", playbackState.autoAdvance, "isTransitioning:", isTransitioningRef.current)
      
      if (!playbackState.autoAdvance) {
        console.log("Auto-advance is OFF, stopping")
        return
      }

      if (isTransitioningRef.current && nextTrack) {
        // Transition is in progress, complete it
        console.log("Video ended during transition, completing fade")
        try {
          // Complete the fade - current should be 0, next should be 1
          setCurrentPlayerOpacity(0)
          setNextPlayerOpacity(1)
          
          // Stop fade timer if running
          if (fadeTimerRef.current) {
            clearInterval(fadeTimerRef.current)
            fadeTimerRef.current = null
          }
          
          // Switch to next track
          setTimeout(() => {
            try {
              console.log("Switching to next track after transition")
              setPlaybackState({
                currentSectionIndex: nextTrack.sectionIndex,
                currentTrackIndex: nextTrack.trackIndex,
                isPlaying: true,
                currentTime: 0,
                autoAdvance: playbackState.autoAdvance,
              })
              // Reset opacities
              setCurrentPlayerOpacity(1)
              setNextPlayerOpacity(0)
              setNextTrack(null)
              isTransitioningRef.current = false
            } catch (e) {
              console.error("Error updating state after transition:", e)
            }
          }, 100)
        } catch (e) {
          console.error("Error completing transition:", e)
          isTransitioningRef.current = false
        }
        return
      }

      // No transition in progress, move to next track immediately
      console.log("No transition in progress, moving to next track")
      console.log("Current state - section:", playbackState.currentSectionIndex, "track:", playbackState.currentTrackIndex)
      // Pass current playbackState explicitly to avoid closure issues
      const next = getNextTrack(playbackState)
      console.log("Next track result:", next)
      if (next) {
        console.log("Moving to next track - section:", next.sectionIndex, "track:", next.trackIndex)
        // Update state immediately - don't use setTimeout as it can cause timing issues
        setPlaybackState({
          currentSectionIndex: next.sectionIndex,
          currentTrackIndex: next.trackIndex,
          isPlaying: true,
          currentTime: 0,
          autoAdvance: playbackState.autoAdvance,
        })
        // Update ref immediately too
        isPlayingRef.current = true
        console.log("State updated, should trigger re-render")
      } else {
        console.log("No next track available, stopping")
        setPlaybackState((prev) => ({ ...prev, isPlaying: false }))
        isPlayingRef.current = false
      }
    }

    // Store handler in ref so it can be called from YouTube API
    handleVideoEndedRef.current = handleVideoEnded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackState.autoAdvance, playbackState.currentSectionIndex, playbackState.currentTrackIndex, playlist.sections, nextTrack])

  // Monitor video progress and start fade transitions
  useEffect(() => {
    if (!playbackState.isPlaying || !playbackState.autoAdvance || !playerRef.current || !currentTrack) {
      return
    }

    const transitionTime = currentTrack.transitionTime || 0
    if (transitionTime <= 0) return

    // Check video progress every 100ms
    const checkProgress = setInterval(() => {
      if (!playerRef.current || !currentTrack) return

      try {
        const duration = playerRef.current.getDuration()
        const currentTime = playerRef.current.getCurrentTime()
        
        // Validate duration and currentTime
        if (!duration || isNaN(duration) || duration <= 0) {
          return // Video not loaded yet
        }
        if (isNaN(currentTime) || currentTime < 0) {
          return
        }
        
        videoDurationRef.current = duration
        videoCurrentTimeRef.current = currentTime

        const timeRemaining = duration - currentTime

        // Start fade when we're transitionTime seconds from the end
        if (timeRemaining <= transitionTime && timeRemaining > 0 && !isTransitioningRef.current) {
          console.log(`Starting fade transition: ${timeRemaining.toFixed(1)}s remaining, transition time: ${transitionTime}s`)
          isTransitioningRef.current = true

          // Get next track
          const next = getNextTrack()
          if (!next) {
            console.log("No next track available")
            isTransitioningRef.current = false
            return
          }

          const nextTrackData = playlist.sections[next.sectionIndex]?.tracks[next.trackIndex]
          if (!nextTrackData) {
            console.log("Next track data not found")
            isTransitioningRef.current = false
            return
          }

          console.log("Setting next track and initializing player")
          // Set next track first to render the container
          setNextTrack(next)
          // Small delay to ensure React has rendered the container
          setTimeout(() => {
            // Now initialize the player
            if (window.YT && window.YT.Player) {
              initNextPlayer()
            } else {
              // Wait for API
              const checkYT = setInterval(() => {
                if (window.YT && window.YT.Player) {
                  clearInterval(checkYT)
                  initNextPlayer()
                }
              }, 100)
            }
          }, 50)

          // Start fade transition function (defined before use)
          const startFadeTransition = (fadeDuration: number) => {
            console.log(`Starting fade transition over ${fadeDuration} seconds`)
            
            // Clear any existing fade timer
            if (fadeTimerRef.current) {
              clearInterval(fadeTimerRef.current)
              fadeTimerRef.current = null
            }
            
            // Start fade out current, fade in next
            const fadeSteps = Math.max(20, Math.floor(fadeDuration * 10)) // More steps for longer transitions
            const fadeInterval = Math.max(50, (fadeDuration * 1000) / fadeSteps) // Minimum 50ms interval
            let step = 0

            // Set initial opacity for next player
            setNextPlayerOpacity(0.01) // Make it slightly visible so it starts rendering

            fadeTimerRef.current = setInterval(() => {
              try {
                step++
                const progress = Math.min(step / fadeSteps, 1)
                setCurrentPlayerOpacity(1 - progress)
                setNextPlayerOpacity(progress)

                // Also fade volume for smoother transition
                if (playerRef.current && nextPlayerRef.current) {
                  try {
                    const currentVolume = Math.max(0, Math.round((1 - progress) * 100))
                    const nextVolume = Math.min(100, Math.round(progress * 100))
                    playerRef.current.setVolume(currentVolume)
                    nextPlayerRef.current.setVolume(nextVolume)
                  } catch (e) {
                    // Ignore volume errors
                  }
                }

                if (step >= fadeSteps) {
                  if (fadeTimerRef.current) {
                    clearInterval(fadeTimerRef.current)
                    fadeTimerRef.current = null
                  }
                  console.log("Fade complete")
                  // Reset volume
                  if (nextPlayerRef.current) {
                    try {
                      nextPlayerRef.current.setVolume(100)
                    } catch (e) {
                      // Ignore
                    }
                  }
                }
              } catch (e) {
                console.error("Error in fade transition:", e)
                if (fadeTimerRef.current) {
                  clearInterval(fadeTimerRef.current)
                  fadeTimerRef.current = null
                }
              }
            }, fadeInterval)
          }

          // Initialize next player if needed, then load next track
          const initNextPlayer = () => {
            // Wait a bit for the container to be rendered
            setTimeout(() => {
              if (!nextPlayerContainerRef.current) {
                console.error("Next player container not available, retrying...")
                // Retry a few times
                let retries = 0
                const retryInit = () => {
                  retries++
                  if (nextPlayerContainerRef.current && retries < 10) {
                    initNextPlayer()
                  } else if (retries >= 10) {
                    console.error("Failed to initialize next player after retries")
                    isTransitioningRef.current = false
                  }
                }
                setTimeout(retryInit, 100)
                return
              }

              if (!nextPlayerRef.current) {
                const containerId = `youtube-player-next-${Date.now()}`
                nextPlayerContainerRef.current.id = containerId

                try {
                  console.log("Creating next player with video:", nextTrackData.videoId)
                  nextPlayerRef.current = new window.YT.Player(containerId, {
                    height: "100%",
                    width: "100%",
                    videoId: nextTrackData.videoId,
                    playerVars: {
                      autoplay: 1,
                      controls: 1,
                      rel: 0,
                      modestbranding: 1,
                      enablejsapi: 1,
                    },
                    events: {
                      onReady: (event: YT.PlayerEvent) => {
                        console.log("Next player ready, starting fade in and playing")
                        try {
                          event.target.playVideo()
                          // Start fade after player is ready
                          startFadeTransition(transitionTime)
                        } catch (e) {
                          console.error("Error in onReady callback:", e)
                        }
                      },
                      onError: (event: YT.OnErrorEvent) => {
                        console.error("Next player error:", event.data)
                        isTransitioningRef.current = false
                      },
                    },
                  })
                } catch (e) {
                  console.error("Error creating next player:", e)
                  isTransitioningRef.current = false
                }
              } else {
                // Player exists, just load the video
                console.log("Next player exists, loading video")
                try {
                  nextPlayerRef.current.loadVideoById(nextTrackData.videoId)
                  nextPlayerRef.current.playVideo()
                  // Start fade after loading
                  setTimeout(() => {
                    try {
                      startFadeTransition(transitionTime)
                    } catch (e) {
                      console.error("Error starting fade:", e)
                    }
                  }, 500)
                } catch (e) {
                  console.error("Error loading video in next player:", e)
                  isTransitioningRef.current = false
                }
              }
            }, 100)
          }

        }
      } catch (e) {
        console.error("Error checking video progress:", e)
      }
    }, 100)

    return () => {
      if (checkProgress) {
        clearInterval(checkProgress)
      }
      if (fadeTimerRef.current) {
        clearInterval(fadeTimerRef.current)
        fadeTimerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackState.isPlaying, playbackState.autoAdvance, currentTrack?.videoId, currentTrack?.transitionTime])

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

  // Initialize YouTube Player once (only when container and track are available)
  useEffect(() => {
    if (!currentTrack) return // Wait for a track to be available
    if (playerRef.current) return // Already initialized

    // Wait for YouTube IFrame API to load
    const initPlayer = () => {
      if (!playerContainerRef.current) {
        console.log("Player container not ready, retrying...")
        setTimeout(initPlayer, 200)
        return
      }
      if (playerRef.current) return // Already initialized

      const containerId = `youtube-player-${Date.now()}`
      playerContainerRef.current.id = containerId

      const track = getCurrentTrack()
      if (!track) return

      try {
        playerRef.current = new window.YT.Player(containerId, {
          height: "100%",
          width: "100%",
          videoId: track.videoId,
          playerVars: {
            autoplay: playbackState.isPlaying ? 1 : 0,
            controls: 1,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
          },
          events: {
            onReady: (event: YT.PlayerEvent) => {
              console.log("YouTube player ready with video:", track.videoId)
              if (playbackState.isPlaying) {
                setTimeout(() => {
                  try {
                    event.target.playVideo()
                  } catch (e) {
                    console.error("Error playing video on ready:", e)
                  }
                }, 300)
              }
            },
            onStateChange: (event: YT.OnStateChangeEvent) => {
              const state = event.data
              console.log("Player state changed:", state)
              
              // YT.PlayerState.ENDED = 0
              if (state === window.YT.PlayerState.ENDED) {
                console.log("Video ended - state change detected")
                if (handleVideoEndedRef.current) {
                  handleVideoEndedRef.current()
                }
              }
              
              // YT.PlayerState.CUED = 5 (video is loaded and ready)
              // If we're supposed to be playing and video is cued, play it
              // Use ref to check current playing state (closure might be stale)
              if (state === window.YT.PlayerState.CUED && isPlayingRef.current) {
                console.log("Video cued and should be playing, starting playback")
                setTimeout(() => {
                  if (playerRef.current && isPlayingRef.current) {
                    try {
                      console.log("Playing video after cue")
                      playerRef.current.playVideo()
                    } catch (e) {
                      console.error("Error playing video after cue:", e)
                    }
                  } else {
                    console.log("Playback was paused, not playing")
                  }
                }, 200)
              }
            },
            onError: (event: YT.OnErrorEvent) => {
              console.error("YouTube player error:", event.data)
            },
          },
        })
        console.log("Player created for video:", track.videoId)
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
      // Don't destroy - let React handle DOM cleanup
      // Just clear the ref
      if (playerRef.current) {
        playerRef.current = null
      }
    }
  }, [currentTrack?.videoId]) // Re-initialize when track changes (first time or when switching)

  // Update player when track changes (only if player already exists)
  useEffect(() => {
    console.log("Track change effect triggered - currentTrack:", currentTrack?.videoId, "sectionIndex:", playbackState.currentSectionIndex, "trackIndex:", playbackState.currentTrackIndex)
    
    if (playerRef.current && currentTrack) {
      // Only update if this is a different video
      if (lastVideoIdRef.current === currentTrack.videoId) {
        console.log("Video already loaded, skipping - but checking if we need to play")
        // But still try to play if we should be playing
        if (isPlayingRef.current) {
          setTimeout(() => {
            if (playerRef.current && isPlayingRef.current) {
              try {
                console.log("Playing already-loaded video")
                playerRef.current.playVideo()
              } catch (e) {
                console.error("Error playing already-loaded video:", e)
              }
            }
          }, 100)
        }
        return
      }

      console.log("Loading new track:", currentTrack.videoId, "Playing:", isPlayingRef.current, "Section:", playbackState.currentSectionIndex, "Track:", playbackState.currentTrackIndex)
      lastVideoIdRef.current = currentTrack.videoId
      
      // Reset transition state
      setCurrentPlayerOpacity(1)
      setNextPlayerOpacity(0)
      setNextTrack(null)
      isTransitioningRef.current = false
      
      // Clean up fade timer
      if (fadeTimerRef.current) {
        clearInterval(fadeTimerRef.current)
        fadeTimerRef.current = null
      }
      
      // Clean up next player - don't destroy, just clear ref
      // React will handle DOM cleanup
      if (nextPlayerRef.current) {
        nextPlayerRef.current = null
      }
      
      try {
        console.log("Calling loadVideoById with:", currentTrack.videoId)
        playerRef.current.loadVideoById(currentTrack.videoId)
        
        // Always try to play if isPlaying is true, with retry logic
        // Use ref to avoid closure issues
        if (isPlayingRef.current) {
          console.log("Scheduling playVideo after load")
          // Wait a bit for video to load, then play
          setTimeout(() => {
            if (playerRef.current && isPlayingRef.current) {
              try {
                console.log("Attempting to play video")
                playerRef.current.playVideo()
                // Double-check after another delay
                setTimeout(() => {
                  if (playerRef.current && isPlayingRef.current) {
                    try {
                      const playerState = playerRef.current.getPlayerState()
                      console.log("Player state after play attempt:", playerState)
                      // If not playing (state 1), try again
                      if (playerState !== window.YT.PlayerState.PLAYING) {
                        console.log("Player not playing, retrying...")
                        playerRef.current.playVideo()
                      }
                    } catch (e) {
                      console.error("Error checking player state:", e)
                    }
                  }
                }, 1000)
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
  }, [currentTrack?.videoId, playbackState.isPlaying, playbackState.currentSectionIndex, playbackState.currentTrackIndex]) // When videoId, playing state, or track position changes

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
    
    // Also pause/play next player if it exists
    if (nextPlayerRef.current) {
      try {
        if (playbackState.isPlaying) {
          nextPlayerRef.current.playVideo()
        } else {
          nextPlayerRef.current.pauseVideo()
        }
      } catch (e) {
        console.error("Error controlling next player playback:", e)
      }
    }
  }, [playbackState.isPlaying]) // Only when play state changes (not videoId)

  const handlePlayPause = () => {
    const newIsPlaying = !playbackState.isPlaying
    console.log("Play/Pause clicked, new state:", newIsPlaying)
    
    // Update ref immediately
    isPlayingRef.current = newIsPlaying
    
    setPlaybackState((prev) => ({ ...prev, isPlaying: newIsPlaying }))
    
    // Control current player immediately
    if (playerRef.current) {
      try {
        if (newIsPlaying) {
          console.log("Playing current video")
          playerRef.current.playVideo()
        } else {
          console.log("Pausing current video")
          playerRef.current.pauseVideo()
        }
      } catch (e) {
        console.error("Error controlling playback:", e)
      }
    }
    
    // Also control next player if it exists (during transitions)
    if (nextPlayerRef.current) {
      try {
        if (newIsPlaying) {
          console.log("Playing next video")
          nextPlayerRef.current.playVideo()
        } else {
          console.log("Pausing next video")
          nextPlayerRef.current.pauseVideo()
        }
      } catch (e) {
        console.error("Error controlling next player playback:", e)
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
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 relative">
                {useFallback ? (
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${currentTrack.videoId}?controls=1&rel=0&modestbranding=1`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={currentTrack.title}
                  />
                ) : (
                  <>
                    {/* Current player */}
                    <div
                      ref={playerContainerRef}
                      className="w-full h-full absolute inset-0"
                      style={{ 
                        opacity: currentPlayerOpacity, 
                        zIndex: nextPlayerOpacity > 0 ? 1 : 2,
                        transition: 'opacity 0.1s ease-in-out'
                      }}
                    />
                    {/* Next player (for crossfade) - always render but hidden */}
                    <div
                      ref={nextPlayerContainerRef}
                      className="w-full h-full absolute inset-0"
                      style={{ 
                        opacity: nextPlayerOpacity, 
                        zIndex: 2,
                        transition: 'opacity 0.1s ease-in-out',
                        pointerEvents: nextPlayerOpacity > 0 ? 'auto' : 'none',
                        visibility: nextPlayerOpacity > 0 ? 'visible' : 'hidden'
                      }}
                    />
                  </>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-1">{currentTrack.title}</h3>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {currentSection?.title} • Transition: {currentTrack.transitionTime}s
                  </p>
                  {isTransitioningRef.current && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                    >
                      <RotateCcw className="h-3 w-3 animate-spin" />
                      Transitioning...
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
                    {playbackState.autoAdvance ? "Turn off Auto Play" : "Turn on Auto Play"}
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

