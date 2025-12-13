import { useState, useEffect, useRef } from "react"
import { Play, Pause, SkipForward, SkipBack } from "lucide-react"
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
}

export function PlaylistPlayer({ playlist }: PlaylistPlayerProps) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    currentSectionIndex: 0,
    currentTrackIndex: 0,
    isPlaying: false,
    currentTime: 0,
  })

  const iframeRef = useRef<HTMLIFrameElement>(null)

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

  useEffect(() => {
    if (currentTrack && iframeRef.current) {
      const videoUrl = `https://www.youtube.com/embed/${currentTrack.videoId}?autoplay=${playbackState.isPlaying ? 1 : 0}&controls=1`
      iframeRef.current.src = videoUrl
    }
  }, [currentTrack?.videoId, playbackState.isPlaying])

  const handlePlayPause = () => {
    setPlaybackState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }))
  }

  const handleNext = () => {
    const next = getNextTrack()
    if (next) {
      setPlaybackState({
        currentSectionIndex: next.sectionIndex,
        currentTrackIndex: next.trackIndex,
        isPlaying: true,
        currentTime: 0,
      })
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
      })
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
                <iframe
                  ref={iframeRef}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={currentTrack.title}
                />
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-1">{currentTrack.title}</h3>
                <p className="text-sm text-gray-600">
                  {currentSection?.title} • Transition: {currentTrack.transitionTime}s
                </p>
              </div>

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
                              })
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

