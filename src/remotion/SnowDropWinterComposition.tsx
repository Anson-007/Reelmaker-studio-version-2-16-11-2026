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

interface SnowDropWinterProps {
  photos: string[];
}

// Exactly mapped from your image durations: 0.27s, 2.33s, 0.20s, 0.20s...
export const SNOW_DROP_BEAT_FRAMES: number[] = [
  0, // Cut 1 (0.27s duration)
  8, // Cut 2 (2.33s duration)
  78, // Cut 3 (0.20s duration)
  84, // Cut 4 (0.20s duration)
  90, // Cut 5 (0.21s duration)
  96, // Cut 6 (0.20s duration)
  102, // Cut 7 (0.84s duration)
  128, // Cut 8 (0.41s duration)
  140, // Cut 9 (0.38s duration)
  151, // Cut 10 (0.38s duration)
  163, // Cut 11 (0.41s duration)
  175, // Cut 12 (0.42s duration)
  188, // Cut 13 (0.41s duration)
  200, // Cut 14 (0.39s duration)
  212, // Cut 15 (0.80s duration)
  236, // Cut 16 (0.47s duration)
  250, // Cut 17 (0.62s duration)
];

// 8.94 seconds at 30 FPS
export const TOTAL_FRAMES = 268;

export const SnowDropWinterComposition: React.FC<SnowDropWinterProps> = ({
  photos,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const safePhotos =
    photos && photos.length > 0
      ? photos
      : [
          "https://images.unsplash.com/photo-1517299321929-30a7082752d7?w=1200",
          "https://images.unsplash.com/photo-1491557345352-5929e343eb89?w=1200",
          "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?w=1200",
          "https://images.unsplash.com/photo-1482192505345-5655af888cc4?w=1200",
        ];

  let cutIndex = 0;
  for (let i = SNOW_DROP_BEAT_FRAMES.length - 1; i >= 0; i--) {
    if (frame >= SNOW_DROP_BEAT_FRAMES[i]) {
      cutIndex = i;
      break;
    }
  }

  const startFrame = SNOW_DROP_BEAT_FRAMES[cutIndex];
  const nextFrame =
    cutIndex < SNOW_DROP_BEAT_FRAMES.length - 1
      ? SNOW_DROP_BEAT_FRAMES[cutIndex + 1]
      : TOTAL_FRAMES;
  const slotDuration = Math.max(1, nextFrame - startFrame);
  const localFrame = frame - startFrame;

  const activePhoto = safePhotos[cutIndex % safePhotos.length];
  const prevPhoto =
    safePhotos[(cutIndex - 1 + safePhotos.length) % safePhotos.length];

  let scale = 1.0;
  let opacity = 1.0;
  let flashOpacity = 0.0;
  let showUnderlay = false;
  let underlayScale = 1.0;
  let underlayOpacity = 0.0;
  let translateY = 0;

  if (slotDuration > 60) {
    // 2.33s Long Ambient Drift (Cut 2)
    scale = interpolate(localFrame, [0, slotDuration], [1.0, 1.15], {
      extrapolateRight: "clamp",
    });
    translateY = interpolate(localFrame, [0, slotDuration], [1.5, -1.5], {
      extrapolateRight: "clamp",
    });
  } else if (slotDuration <= 8) {
    // Ultra-fast 0.20s stutter snaps
    scale = localFrame === 0 ? 1.06 : 1.0;
    flashOpacity = localFrame === 0 ? 0.35 : 0.0;
  } else {
    // Standard ~0.40s driving rhythm beats
    const dropSpring = spring({
      frame: localFrame,
      fps,
      config: { damping: 13, stiffness: 140, mass: 0.7 },
    });
    scale = interpolate(dropSpring, [0, 1], [1.12, 1.0]);

    showUnderlay = localFrame < 5;
    if (showUnderlay) {
      underlayScale = interpolate(localFrame, [0, 5], [1.0, 1.06]);
      underlayOpacity = interpolate(localFrame, [0, 5], [0.5, 0]);
      opacity = interpolate(localFrame, [0, 4], [0.4, 1], {
        extrapolateRight: "clamp",
      });
    }

    flashOpacity = interpolate(localFrame, [0, 3], [0.3, 0], {
      extrapolateRight: "clamp",
    });
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <Audio src={staticFile("audio/ReelAudio-5.mp3")} />

      {showUnderlay && (
        <AbsoluteFill
          style={{
            transform: `scale(${underlayScale})`,
            opacity: underlayOpacity,
            filter: "blur(6px)",
          }}
        >
          <Img
            crossOrigin="anonymous"
            src={prevPhoto}
            alt="Outgoing Slide"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </AbsoluteFill>
      )}

      <AbsoluteFill
        style={{
          transform: `scale(${scale}) translateY(${translateY}%)`,
          opacity,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Img
          crossOrigin="anonymous"
          src={activePhoto}
          alt={`Winter Slide ${cutIndex + 1}`}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      {flashOpacity > 0 && (
        <AbsoluteFill
          style={{
            backgroundColor: "#E0F2FE", // Soft icy blue flash
            opacity: flashOpacity,
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
};
