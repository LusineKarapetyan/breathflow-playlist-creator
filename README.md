# 🧘 BreathFlow Playlist Creator 2.0

A modern, elegant, web-based playlist creator for organizing YouTube links into sections with transitions — designed for meditation and breathwork sessions.

![BreathFlow Playlist Creator](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-38B2AC?logo=tailwind-css)

## ✨ Features

- 🎵 **YouTube Playlist Management**: Organize YouTube videos into sections with custom titles
- 🎨 **Beautiful UI**: Glassmorphism design with purple-indigo gradient background
- 🔄 **Drag & Drop**: Intuitive drag-and-drop interface for reordering tracks within and across sections
- ⏱️ **Transition Times**: Set custom transition times between tracks
- 📥 **Import/Export**: Save and load playlists as JSON files
- 🎬 **Built-in Player**: Preview and play tracks directly in the app
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🎭 **Smooth Animations**: Framer Motion powered transitions

## 🛠️ Tech Stack

- **React 19** - Modern React with latest features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **TailwindCSS v4** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible component library
- **@dnd-kit** - Drag and drop functionality
- **lucide-react** - Icon library
- **framer-motion** - Animation library

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/LusineKarapetyan/breathflow-playlist-creator.git
cd breathflow-playlist-creator
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

## 📖 Usage

### Creating a Playlist

1. **Add a Section**: Click the "Add Section" button to create a new section
2. **Name Your Section**: Edit the section title by clicking on the input field
3. **Add Tracks**: 
   - Paste a YouTube URL in the input field
   - Click "Add Track" or press Enter
   - The app will automatically extract the video thumbnail and ID
4. **Edit Track Details**:
   - Click on the track title to edit it
   - Set the transition time (in seconds) between tracks
5. **Reorder Tracks**: Drag tracks within a section or between sections using the grip handle
6. **Delete**: Remove tracks or sections using the delete buttons

### Playing Your Playlist

- Use the player on the right side to preview and play tracks
- Navigate between tracks using the Previous/Next buttons
- Click on any track in the playlist sidebar to jump to it

### Saving and Loading

- **Export**: Click the "Export" button to download your playlist as a JSON file
- **Import**: Click the "Import" button to load a previously saved playlist

## 📁 Project Structure

```
breathflow-playlist-creator/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   │   ├── card.tsx
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── accordion.tsx
│   │   ├── PlaylistEditor.tsx    # Main editor component
│   │   ├── PlaylistPlayer.tsx    # Player component
│   │   ├── SectionBlock.tsx      # Section container
│   │   └── TrackItem.tsx         # Individual track card
│   ├── lib/
│   │   ├── utils.ts         # Utility functions
│   │   └── youtube.ts       # YouTube URL parsing
│   ├── types.ts             # TypeScript type definitions
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

## 🎨 Design System

The app features a calm, meditation-focused design:

- **Colors**: Soft purple-indigo gradient background (`from-purple-400 via-indigo-500 to-purple-600`)
- **Cards**: Glassmorphism effect with `bg-white/80 backdrop-blur-lg`
- **Typography**: Sans-serif fonts with semi-bold titles
- **Spacing**: Generous padding and rounded corners for a peaceful feel
- **Animations**: Subtle fade transitions using Framer Motion

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [lucide-react](https://lucide.dev/)
- Drag and drop powered by [@dnd-kit](https://dndkit.com/)

---

Made with ❤️ for meditation and breathwork enthusiasts
