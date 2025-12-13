export interface YouTubeVideoInfo {
  videoId: string;
  thumbnail: string;
  title?: string;
}

export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/.*[?&]v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

export function parseYouTubeUrl(url: string): YouTubeVideoInfo | null {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;

  return {
    videoId,
    thumbnail: getYouTubeThumbnail(videoId),
  };
}

