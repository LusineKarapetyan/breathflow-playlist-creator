export interface Track {
  id: string;
  url: string;
  title: string;
  videoId: string;
  thumbnail: string;
  transitionTime: number; // in seconds
}

export interface Section {
  id: string;
  title: string;
  tracks: Track[];
}

export interface Playlist {
  sections: Section[];
}

