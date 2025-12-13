import { Plus, Download, Upload, Music } from "lucide-react"
import { Button } from "./ui/button"
import { SectionBlock } from "./SectionBlock"
import type { Section, Playlist, Track } from "../types"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import type { DragEndEvent } from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"

interface PlaylistEditorProps {
  playlist: Playlist
  onPlaylistChange: (playlist: Playlist) => void
}

export function PlaylistEditor({
  playlist,
  onPlaylistChange,
}: PlaylistEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find the track and its current section
    let activeTrack: Track | null = null
    let activeSectionIndex = -1
    let activeTrackIndex = -1

    for (let i = 0; i < playlist.sections.length; i++) {
      const trackIndex = playlist.sections[i].tracks.findIndex(
        (t) => t.id === activeId
      )
      if (trackIndex !== -1) {
        activeTrack = playlist.sections[i].tracks[trackIndex]
        activeSectionIndex = i
        activeTrackIndex = trackIndex
        break
      }
    }

    if (!activeTrack) return

    // Check if dropping on a section (droppable area)
    if (overId.startsWith("section-")) {
      const targetSectionId = overId.replace("section-", "")
      const targetSectionIndex = playlist.sections.findIndex(
        (s) => s.id === targetSectionId
      )

      if (targetSectionIndex !== -1 && targetSectionIndex !== activeSectionIndex) {
        // Move track to different section
        const newSections = [...playlist.sections]
        newSections[activeSectionIndex].tracks.splice(activeTrackIndex, 1)
        newSections[targetSectionIndex].tracks.push(activeTrack)

        onPlaylistChange({
          ...playlist,
          sections: newSections,
        })
      }
      return
    }

    // Check if dropping on another track
    let overSectionIndex = -1
    let overTrackIndex = -1

    for (let i = 0; i < playlist.sections.length; i++) {
      const trackIndex = playlist.sections[i].tracks.findIndex(
        (t) => t.id === overId
      )
      if (trackIndex !== -1) {
        overSectionIndex = i
        overTrackIndex = trackIndex
        break
      }
    }

    if (overSectionIndex === -1) return

    // Same section - reorder within section
    if (activeSectionIndex === overSectionIndex) {
      const newSections = [...playlist.sections]
      const section = newSections[activeSectionIndex]
      const newTracks = [...section.tracks]
      const [removed] = newTracks.splice(activeTrackIndex, 1)
      newTracks.splice(overTrackIndex, 0, removed)
      newSections[activeSectionIndex] = { ...section, tracks: newTracks }

      onPlaylistChange({
        ...playlist,
        sections: newSections,
      })
    } else {
      // Different section - move to new position in target section
      const newSections = [...playlist.sections]
      const sourceSection = newSections[activeSectionIndex]
      const targetSection = newSections[overSectionIndex]

      // Remove from source
      const [movedTrack] = sourceSection.tracks.splice(activeTrackIndex, 1)
      // Insert into target at the position
      targetSection.tracks.splice(overTrackIndex, 0, movedTrack)

      onPlaylistChange({
        ...playlist,
        sections: newSections,
      })
    }
  }

  const handleAddSection = () => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      title: `Section ${playlist.sections.length + 1}`,
      tracks: [],
    }
    onPlaylistChange({
      ...playlist,
      sections: [...playlist.sections, newSection],
    })
  }

  const handleUpdateSection = (updatedSection: Section) => {
    onPlaylistChange({
      ...playlist,
      sections: playlist.sections.map((s) =>
        s.id === updatedSection.id ? updatedSection : s
      ),
    })
  }

  const handleDeleteSection = (sectionId: string) => {
    onPlaylistChange({
      ...playlist,
      sections: playlist.sections.filter((s) => s.id !== sectionId),
    })
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(playlist, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "playlist.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "application/json"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string
          const imported: Playlist = JSON.parse(content)
          onPlaylistChange(imported)
        } catch (error) {
          alert("Failed to import playlist. Invalid JSON file.")
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Music className="h-6 w-6 text-indigo-500" />
          <h1 className="text-2xl font-semibold text-gray-800">
            BreathFlow Playlist Creator 2.0
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImport}>
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleAddSection}>
            <Plus className="h-4 w-4" />
            Add Section
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-y-auto pr-2">
          {playlist.sections.map((section) => (
            <SectionBlock
              key={section.id}
              section={section}
              onUpdate={handleUpdateSection}
              onDelete={() => handleDeleteSection(section.id)}
            />
          ))}

          {playlist.sections.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No sections yet.</p>
              <p className="text-sm mt-2">Click "Add Section" to get started.</p>
            </div>
          )}
        </div>
      </DndContext>
    </div>
  )
}

