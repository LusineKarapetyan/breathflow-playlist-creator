// YouTube IFrame API Types
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string | HTMLElement,
        config: YT.PlayerOptions
      ) => YT.Player
      PlayerState: {
        UNSTARTED: number
        ENDED: number
        PLAYING: number
        PAUSED: number
        BUFFERING: number
        CUED: number
      }
    }
  }

  namespace YT {
    interface PlayerOptions {
      height?: string | number
      width?: string | number
      videoId?: string
      playerVars?: PlayerVars
      events?: PlayerEvents
    }

    interface PlayerVars {
      autoplay?: 0 | 1
      controls?: 0 | 1
      rel?: 0 | 1
      modestbranding?: 0 | 1
      [key: string]: string | number | undefined
    }

    interface PlayerEvents {
      onReady?: (event: PlayerEvent) => void
      onStateChange?: (event: OnStateChangeEvent) => void
      onError?: (event: OnErrorEvent) => void
    }

    interface PlayerEvent {
      target: Player
    }

    interface OnStateChangeEvent {
      data: number
      target: Player
    }

    interface OnErrorEvent {
      data: number
      target: Player
    }

    class Player {
      constructor(
        elementId: string | HTMLElement,
        config: PlayerOptions
      )
      loadVideoById(videoId: string, startSeconds?: number): void
      playVideo(): void
      pauseVideo(): void
      stopVideo(): void
      seekTo(seconds: number, allowSeekAhead?: boolean): void
      getCurrentTime(): number
      getDuration(): number
      getPlayerState(): number
      destroy(): void
    }
  }
}

export {}

