import React from "react";
import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Img,
  // CRITICAL FIX: Removed 'Video' from this import
} from "remotion";
// CRITICAL FIX: Imported 'Video' from @remotion/media
import { Audio, Video } from "@remotion/media";

interface TranquilRushProps {
  photos: string[];
  videoUrl: string | null;
}

// 1 Video (7.86s = 236 frames) -> 37 Photos (0.15s = 4.5 frames each)
export const TRANQUIL_RUSH_BEAT_FRAMES: number[] = [
  0,
  ...Array.from({ length: 37 }, (_, i) => 236 + Math.round(i * 4.5)),
];

export const TOTAL_FRAMES = 403; // ~13.43s @ 30 FPS

export const TranquilRushComposition: React.FC<TranquilRushProps> = ({
  photos,
  videoUrl,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const safePhotos =
    photos && photos.length > 0
      ? photos
      : [
          "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200",
          "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200",
          "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200",
        ];

  // Default fallback video
  const safeVideo =
    videoUrl ||
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

  let cutIndex = 0;
  for (let i = TRANQUIL_RUSH_BEAT_FRAMES.length - 1; i >= 0; i--) {
    if (frame >= TRANQUIL_RUSH_BEAT_FRAMES[i]) {
      cutIndex = i;
      break;
    }
  }

  const startFrame = TRANQUIL_RUSH_BEAT_FRAMES[cutIndex];
  const localFrame = frame - startFrame;
  const isVideoSegment = cutIndex === 0;

  let photoToRender = safePhotos[0];
  if (!isVideoSegment) {
    const photoOffset = cutIndex - 1;
    photoToRender = safePhotos[photoOffset % safePhotos.length];
  }

  // Animation dynamics
  let scale = 1.0;
  let flashOpacity = 0.0;
  let brightness = 1.0;

  if (isVideoSegment) {
    // 7.86s Video Segment: Very slow, calm cinematic drift
    scale = interpolate(localFrame, [0, 236], [1.0, 1.08], {
      extrapolateRight: "clamp",
    });
  } else {
    // Phase 2: Hyper-stutter 0.15s (4.5 frames) cuts
    // Slight punch per cut to maintain kinetic energy
    scale = localFrame === 0 ? 1.03 : 1.0;

    // Fast strobe flash on odd cuts
    if (cutIndex % 2 !== 0) {
      flashOpacity = interpolate(localFrame, [0, 2], [0.2, 0], {
        extrapolateRight: "clamp",
      });
    } else {
      brightness = 0.85; // Slight contrast flicker between cuts
    }
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <Audio src={staticFile("audio/ReelAudio-9.mp3")} />

      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          filter: `brightness(${brightness})`,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {isVideoSegment ? (
          videoUrl ? (
            <Video
              // CRITICAL FIX: Removed crossOrigin and startFrom to clear TS errors
              src={videoUrl}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              muted
            />
          ) : (
            <AbsoluteFill
              style={{
                backgroundColor: "#1e1e1e",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <span
                style={{ color: "#fff", fontSize: "40px", fontWeight: "bold" }}
              >
                No Video Uploaded
              </span>
            </AbsoluteFill>
          )
        ) : (
          <Img
            crossOrigin="anonymous"
            src={photoToRender}
            alt={`Slide ${cutIndex}`}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </AbsoluteFill>

      {flashOpacity > 0 && (
        <AbsoluteFill
          style={{
            backgroundColor: "#FFFFFF",
            opacity: flashOpacity,
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
};
