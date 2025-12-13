import { useState } from "react"
import { Plus, Music } from "lucide-react"
import { Card, CardHeader, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { TrackItem } from "./TrackItem"
import type { Section, Track } from "../types"
import { parseYouTubeUrl } from "../lib/youtube"
import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"

interface SectionBlockProps {
  section: Section
  onUpdate: (section: Section) => void
  onDelete: () => void
}

export function SectionBlock({ section, onUpdate, onDelete }: SectionBlockProps) {
  const [title, setTitle] = useState(section.title)
  const [urlInput, setUrlInput] = useState("")

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `section-${section.id}`,
  })

  const handleTitleChange = (value: string) => {
    setTitle(value)
    onUpdate({ ...section, title: value })
  }

  const handleAddTrack = () => {
    if (!urlInput.trim()) return

    const videoInfo = parseYouTubeUrl(urlInput.trim())
    if (!videoInfo) {
      alert("Invalid YouTube URL")
      return
    }

    const newTrack: Track = {
      id: `track-${Date.now()}`,
      url: urlInput.trim(),
      title: `Track ${section.tracks.length + 1}`,
      videoId: videoInfo.videoId,
      thumbnail: videoInfo.thumbnail,
      transitionTime: 0,
    }

    onUpdate({
      ...section,
      tracks: [...section.tracks, newTrack],
    })

    setUrlInput("")
  }

  const handleUpdateTrack = (updatedTrack: Track) => {
    onUpdate({
      ...section,
      tracks: section.tracks.map((t) =>
        t.id === updatedTrack.id ? updatedTrack : t
      ),
    })
  }

  const handleDeleteTrack = (trackId: string) => {
    onUpdate({
      ...section,
      tracks: section.tracks.filter((t) => t.id !== trackId),
    })
  }

  return (
    <Card
      ref={setDroppableRef}
      className={`mb-6 transition-colors ${
        isOver ? "bg-indigo-50 border-indigo-300" : ""
      }`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <Music className="h-5 w-5 text-indigo-500" />
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Section title"
              className="font-semibold text-lg"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            Delete Section
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddTrack()
              }
            }}
            placeholder="Paste YouTube URL here..."
            className="flex-1"
          />
          <Button onClick={handleAddTrack}>
            <Plus className="h-4 w-4" />
            Add Track
          </Button>
        </div>

        <SortableContext
          items={section.tracks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {section.tracks.map((track) => (
            <TrackItem
              key={track.id}
              track={track}
              onUpdate={handleUpdateTrack}
              onDelete={() => handleDeleteTrack(track.id)}
            />
          ))}
        </SortableContext>

        {section.tracks.length === 0 && (
          <div
            className={`text-center py-8 transition-colors ${
              isOver
                ? "text-indigo-600 font-medium border-2 border-dashed border-indigo-300 rounded-lg"
                : "text-gray-400"
            }`}
          >
            {isOver
              ? "Drop track here"
              : "No tracks yet. Add a YouTube URL above to get started."}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

