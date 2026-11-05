import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Img,
} from "remotion";
import { Audio } from "@remotion/media";

interface RapidPhotoDumpProps {
  photos: string[];
}

// 32 Photos at 0.45s each (13.5 frames per cut at 30fps)
export const RAPID_DUMP_BEAT_FRAMES: number[] = Array.from(
  { length: 32 },
  (_, i) => Math.round(i * 13.5),
);

export const TOTAL_FRAMES = 432; // 32 photos * 13.5 frames = 432 frames (14.4s)

export const RapidPhotoDumpComposition: React.FC<RapidPhotoDumpProps> = ({
  photos,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fallback photos if user hasn't uploaded enough
  const safePhotos =
    photos && photos.length > 0
      ? photos
      : [
          "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=1200",
          "https://images.unsplash.com/photo-1682687982501-1e58f813f228?w=1200",
          "https://images.unsplash.com/photo-1682687221038-404670f0943a?w=1200",
          "https://images.unsplash.com/photo-1682687982185-531d09ec56fc?w=1200",
        ];

  // Determine which of the 32 cuts we are currently viewing
  let cutIndex = 0;
  for (let i = RAPID_DUMP_BEAT_FRAMES.length - 1; i >= 0; i--) {
    if (frame >= RAPID_DUMP_BEAT_FRAMES[i]) {
      cutIndex = i;
      break;
    }
  }

  const startFrame = RAPID_DUMP_BEAT_FRAMES[cutIndex];
  const localFrame = frame - startFrame;

  // Cycle through uploaded photos (wraps around if user uploads less than 32)
  const activePhoto = safePhotos[cutIndex % safePhotos.length];

  // Snappy kinetic spring for fast 0.45s cuts
  const punchSpring = spring({
    frame: localFrame,
    fps,
    config: { damping: 14, stiffness: 180, mass: 0.6 },
  });

  // Very subtle zoom out to give it a driving momentum
  const scale = interpolate(punchSpring, [0, 1], [1.06, 1.0]);

  // Quick exposure flash on the cut
  const flashOpacity = interpolate(localFrame, [0, 3], [0.15, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <Audio src={staticFile("audio/ReelAudio-6.mp3")} />

      {/* FOREGROUND CLIP */}
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Img
          crossOrigin="anonymous"
          src={activePhoto}
          alt={`Dump Slide ${cutIndex + 1}`}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      {/* RHYTHMIC BEAT FLASH */}
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
