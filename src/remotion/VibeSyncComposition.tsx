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

interface VibeSyncProps {
  photos: string[];
}

// 9 Photos converted to 30 FPS frames
// Timings: 2.20s, 1.02s, 1.02s, 1.04s, 1.07s, 1.03s, 1.07s, 1.01s, 1.04s
export const VIBE_SYNC_BEAT_FRAMES: number[] = [
  0, 66, 97, 128, 159, 191, 222, 254, 284,
];

export const TOTAL_FRAMES = 315; // 10.5s @ 30 FPS

export const VibeSyncComposition: React.FC<VibeSyncProps> = ({ photos }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const safePhotos =
    photos && photos.length > 0
      ? photos
      : [
          "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200",
          "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1200",
        ];

  let cutIndex = 0;
  for (let i = VIBE_SYNC_BEAT_FRAMES.length - 1; i >= 0; i--) {
    if (frame >= VIBE_SYNC_BEAT_FRAMES[i]) {
      cutIndex = i;
      break;
    }
  }

  const startFrame = VIBE_SYNC_BEAT_FRAMES[cutIndex];
  const localFrame = frame - startFrame;
  const activePhoto = safePhotos[cutIndex % safePhotos.length];

  let scale = 1.0;
  let flashOpacity = 0.0;

  if (cutIndex === 0) {
    // First clip (2.20s) gets a slow, cool drift
    scale = interpolate(localFrame, [0, 66], [1.0, 1.08], {
      extrapolateRight: "clamp",
    });
  } else {
    // The ~1s clips get a bouncy, rhythmic snap
    const bounce = spring({
      frame: localFrame,
      fps,
      config: { damping: 12, stiffness: 150, mass: 0.8 },
    });
    scale = interpolate(bounce, [0, 1], [1.1, 1.0]);

    // Cool cyan beat flash
    flashOpacity = interpolate(localFrame, [0, 5], [0.15, 0], {
      extrapolateRight: "clamp",
    });
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <Audio src={staticFile("audio/ReelAudio-13.mp3")} />

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
            backgroundColor: "#22d3ee", // Cyan vibe flash
            opacity: flashOpacity,
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
};
