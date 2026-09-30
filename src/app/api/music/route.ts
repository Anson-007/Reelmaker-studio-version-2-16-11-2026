import { NextResponse } from "next/server";

// Curated high-performance fallback tracks
const BACKUP_TRACKS = [
  {
    id: "f-phonk-1",
    title: "Night Drive Phonk",
    artist: "Ghost Wave",
    tag: "Viral Phonk",
    duration: "2:15",
    url: "https://cdn.pixabay.com/download/audio/2022/11/06/audio_c3c3a72688.mp3?filename=phonk-drift-124970.mp3",
  },
  {
    id: "f-phonk-2",
    title: "Midnight Tokyo Drift",
    artist: "K-Rider",
    tag: "Viral Phonk",
    duration: "2:40",
    url: "https://cdn.pixabay.com/download/audio/2023/04/10/audio_55a298be59.mp3?filename=shadow-dance-phonk-145781.mp3",
  },
  {
    id: "f-lofi-1",
    title: "Coffee Shop Sunset",
    artist: "Chill Hop Collective",
    tag: "Lo-Fi Beats",
    duration: "2:20",
    url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3",
  },
  {
    id: "f-lofi-2",
    title: "Rainy Window Pane",
    artist: "Aesthetic Daydream",
    tag: "Lo-Fi Beats",
    duration: "2:55",
    url: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=empty-mind-118973.mp3",
  },
  {
    id: "f-cinematic-1",
    title: "Epic Horizon Reveal",
    artist: "Score Masters",
    tag: "Cinematic",
    duration: "3:10",
    url: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=cinematic-atmosphere-score-1-22136.mp3",
  },
  {
    id: "f-upbeat-1",
    title: "Sunny Summer Festival",
    artist: "Groove Wave",
    tag: "Upbeat",
    duration: "2:30",
    url: "https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f77cb7.mp3?filename=tropic-summer-house-122538.mp3",
  },
];

async function getHealthyAudiusHost(): Promise<string> {
  try {
    const res = await fetch("https://api.audius.co", {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    const json = await res.json();
    if (json.data && json.data.length > 0) {
      return json.data[0];
    }
  } catch {
    // fallback host
  }
  return "https://discoveryprovider.audius.co";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.toLowerCase().trim() || "";
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const limit = parseInt(searchParams.get("limit") || "15", 10);

  try {
    const host = await getHealthyAudiusHost();
    const audiusEndpoint = query
      ? `${host}/v1/tracks/search?query=${encodeURIComponent(query)}&offset=${offset}&limit=${limit}&app_name=reelmaker_studio`
      : `${host}/v1/tracks/trending?offset=${offset}&limit=${limit}&app_name=reelmaker_studio`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(audiusEndpoint, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      const list = json.data || [];

      if (Array.isArray(list) && list.length > 0) {
        const liveTracks = list
          .filter((t: any) => !t.is_delete && !t.is_premium)
          .map((t: any) => {
            const minutes = Math.floor((t.duration || 120) / 60);
            const seconds = String((t.duration || 120) % 60).padStart(2, "0");
            return {
              id: `audius-${t.id}`,
              title: t.title || "Trending Song",
              artist: t.user?.name || "Popular Artist",
              tag: t.genre || (query ? query.toUpperCase() : "Trending Reel"),
              duration: `${minutes}:${seconds}`,
              url: `${host}/v1/tracks/${t.id}/stream?app_name=reelmaker_studio`,
            };
          });

        if (liveTracks.length > 0) {
          return NextResponse.json({
            tracks: liveTracks,
            hasMore: liveTracks.length >= limit,
          });
        }
      }
    }
  } catch (err: any) {
    console.warn("Audius fetch notice:", err.message);
  }

  // Filter fallback static library if network fails
  const filtered = query
    ? BACKUP_TRACKS.filter(
        (t) =>
          t.tag.toLowerCase().includes(query) ||
          t.title.toLowerCase().includes(query) ||
          t.artist.toLowerCase().includes(query),
      )
    : BACKUP_TRACKS;

  return NextResponse.json({
    tracks: filtered,
    hasMore: false,
  });
}
