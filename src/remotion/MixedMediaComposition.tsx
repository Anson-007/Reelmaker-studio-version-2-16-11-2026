import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Img,
  // CRITICAL FIX: DO NOT IMPORT 'Video' from here
} from "remotion";
// CRITICAL FIX: Import Audio AND Video from @remotion/media for GPU export support
import { Audio, Video } from "@remotion/media";

interface MixedMediaProps {
  photos: string[];
  videoUrl: string | null;
}

// 8 photos, 1 video (2.4s), 16 photos
export const MIXED_MEDIA_BEAT_FRAMES: number[] = [
  0, 21, 39, 57, 75, 93, 111, 129, 147, 219, 228, 237, 246, 255, 264, 273, 282,
  291, 300, 309, 318, 327, 336, 345, 354,
];

export const TOTAL_FRAMES = 363; // 12.1s @ 30 FPS

export const MixedMediaComposition: React.FC<MixedMediaProps> = ({
  photos,
  videoUrl,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const safePhotos =
    photos && photos.length > 0
      ? photos
      : [
          "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=1200",
          "https://images.unsplash.com/photo-1682687982501-1e58f813f228?w=1200",
        ];

  let cutIndex = 0;
  for (let i = MIXED_MEDIA_BEAT_FRAMES.length - 1; i >= 0; i--) {
    if (frame >= MIXED_MEDIA_BEAT_FRAMES[i]) {
      cutIndex = i;
      break;
    }
  }

  const startFrame = MIXED_MEDIA_BEAT_FRAMES[cutIndex];
  const localFrame = frame - startFrame;
  const isVideoSegment = cutIndex === 8;

  let photoToRender = safePhotos[0];
  if (!isVideoSegment) {
    const photoOffset = cutIndex > 8 ? cutIndex - 1 : cutIndex;
    photoToRender = safePhotos[photoOffset % safePhotos.length];
  }

  let scale = 1.0;
  let flashOpacity = 0.0;

  if (isVideoSegment) {
    scale = interpolate(localFrame, [0, 72], [1.0, 1.15], {
      extrapolateRight: "clamp",
    });
  } else if (cutIndex > 8) {
    scale = localFrame === 0 ? 1.05 : 1.0;
    flashOpacity = localFrame === 0 ? 0.2 : 0.0;
  } else {
    const dropSpring = spring({
      frame: localFrame,
      fps,
      config: { damping: 14, stiffness: 160, mass: 0.6 },
    });
    scale = interpolate(dropSpring, [0, 1], [1.08, 1.0]);
    flashOpacity = interpolate(localFrame, [0, 3], [0.15, 0], {
      extrapolateRight: "clamp",
    });
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <Audio src={staticFile("audio/ReelAudio-7.mp3")} />

      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {isVideoSegment ? (
          videoUrl ? (
            <Video
              // Removed crossOrigin, startFrom, and onError to fix all TS errors
              src={videoUrl}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              muted
            />
          ) : (
            // Reliable fallback if no video is uploaded
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
            alt={`Slide ${cutIndex + 1}`}
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
