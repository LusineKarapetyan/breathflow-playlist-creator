import { useState } from "react"
import { Youtube, GripVertical, X } from "lucide-react"
import { Card } from "./ui/card"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import type { Track } from "../types"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface TrackItemProps {
  track: Track
  onUpdate: (track: Track) => void
  onDelete: () => void
}

export function TrackItem({ track, onUpdate, onDelete }: TrackItemProps) {
  const [title, setTitle] = useState(track.title)
  const [transitionTime, setTransitionTime] = useState(track.transitionTime.toString())

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleTitleChange = (value: string) => {
    setTitle(value)
    onUpdate({ ...track, title: value })
  }

  const handleTransitionTimeChange = (value: string) => {
    const num = parseInt(value) || 0
    setTransitionTime(value)
    onUpdate({ ...track, transitionTime: num })
  }

  const youtubeUrl = `https://www.youtube.com/watch?v=${track.videoId}`

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="mb-3 p-3 hover:shadow-lg transition-shadow"
    >
      <div className="flex gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing flex items-center text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="h-5 w-5" />
        </div>

        <img
          src={track.thumbnail}
          alt={track.title}
          className="w-24 h-16 object-cover rounded-md flex-shrink-0"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "https://via.placeholder.com/320x180?text=No+Thumbnail"
          }}
        />

        <div className="flex-1 min-w-0">
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Track title"
            className="mb-2"
          />
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={transitionTime}
              onChange={(e) => handleTransitionTimeChange(e.target.value)}
              placeholder="Transition (s)"
              className="w-24"
              min="0"
            />
            <span className="text-sm text-gray-500">seconds</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(youtubeUrl, "_blank")}
              className="ml-auto"
            >
              <Youtube className="h-4 w-4" />
              Watch
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

