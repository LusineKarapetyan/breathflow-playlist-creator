import { useState } from "react"
import { PlaylistEditor } from "./components/PlaylistEditor"
import { PlaylistPlayer } from "./components/PlaylistPlayer"
import type { Playlist } from "./types"

function App() {
  const [playlist, setPlaylist] = useState<Playlist>({
    sections: [],
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-indigo-500 to-purple-600 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)] lg:h-[calc(100vh-4rem)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 h-full">
            {/* Left Side - Playlist Editor */}
            <div className="bg-white/80 backdrop-blur-lg border border-white/40 shadow-xl rounded-2xl p-4 md:p-6 overflow-hidden">
              <PlaylistEditor
                playlist={playlist}
                onPlaylistChange={setPlaylist}
              />
            </div>

            {/* Right Side - Player */}
            <div className="bg-white/80 backdrop-blur-lg border border-white/40 shadow-xl rounded-2xl p-4 md:p-6 overflow-hidden">
              <PlaylistPlayer playlist={playlist} />
            </div>
          </div>
        </div>
      </div>
  )
}

export default App
