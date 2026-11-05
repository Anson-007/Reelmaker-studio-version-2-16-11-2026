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

interface FrostlightFlickerProps {
  photos: string[];
}

// 20 Photos converted to exact 30 FPS frames based on the tutorial math
// Timings: 0.14s, 0.30s, 0.27s, 0.27s, then sixteen ~0.57s clips
export const FROSTLIGHT_BEAT_FRAMES: number[] = [
  0, 4, 13, 21, 29, 46, 64, 80, 97, 115, 132, 149, 166, 183, 201, 218, 234, 252,
  269, 286,
];

export const TOTAL_FRAMES = 303; // ~10.1s @ 30 FPS

export const FrostlightFlickerComposition: React.FC<FrostlightFlickerProps> = ({
  photos,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const safePhotos =
    photos && photos.length > 0
      ? photos
      : [
          "https://images.unsplash.com/photo-1543364195-077a16c30ff3?w=1200",
          "https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=1200",
        ];

  let cutIndex = 0;
  for (let i = FROSTLIGHT_BEAT_FRAMES.length - 1; i >= 0; i--) {
    if (frame >= FROSTLIGHT_BEAT_FRAMES[i]) {
      cutIndex = i;
      break;
    }
  }

  const startFrame = FROSTLIGHT_BEAT_FRAMES[cutIndex];
  const nextFrame =
    cutIndex < FROSTLIGHT_BEAT_FRAMES.length - 1
      ? FROSTLIGHT_BEAT_FRAMES[cutIndex + 1]
      : TOTAL_FRAMES;
  const slotDuration = Math.max(1, nextFrame - startFrame);
  const localFrame = frame - startFrame;
  const activePhoto = safePhotos[cutIndex % safePhotos.length];

  let scale = 1.0;
  let flashOpacity = 0.0;

  if (slotDuration < 10) {
    // Ultra-fast intro flickers (0.14s, 0.27s)
    scale = localFrame === 0 ? 1.05 : 1.0;
    flashOpacity = localFrame === 0 ? 0.4 : 0.0;
  } else {
    // Main rhythmic holds (~0.57s)
    const bounce = spring({
      frame: localFrame,
      fps,
      config: { damping: 14, stiffness: 130, mass: 0.8 },
    });
    scale = interpolate(bounce, [0, 1], [1.08, 1.0]);

    // Warm golden/amber flash to emulate holiday lights
    flashOpacity = interpolate(localFrame, [0, 6], [0.25, 0], {
      extrapolateRight: "clamp",
    });
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <Audio src={staticFile("audio/ReelAudio-14.mp3")} />

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
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      {flashOpacity > 0 && (
        <AbsoluteFill
          style={{
            backgroundColor: "#fef08a", // Warm amber/golden glow
            opacity: flashOpacity,
            mixBlendMode: "overlay",
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
};
