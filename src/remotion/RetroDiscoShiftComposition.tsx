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

interface RetroDiscoShiftProps {
  photos: string[];
}

// 20 Photos converted to exact 30 FPS frames (Total: 453 frames = 15.1s)
export const RETRO_DISCO_BEAT_FRAMES: number[] = [
  0, 71, 98, 121, 133, 145, 169, 193, 215, 227, 239, 251, 263, 287, 311, 323,
  335, 359, 383, 407,
];

export const TOTAL_FRAMES = 453;

export const RetroDiscoShiftComposition: React.FC<RetroDiscoShiftProps> = ({
  photos,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const safePhotos =
    photos && photos.length > 0
      ? photos
      : [
          "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1200",
          "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200",
          "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200",
        ];

  let cutIndex = 0;
  for (let i = RETRO_DISCO_BEAT_FRAMES.length - 1; i >= 0; i--) {
    if (frame >= RETRO_DISCO_BEAT_FRAMES[i]) {
      cutIndex = i;
      break;
    }
  }

  const startFrame = RETRO_DISCO_BEAT_FRAMES[cutIndex];
  const nextFrame =
    cutIndex < RETRO_DISCO_BEAT_FRAMES.length - 1
      ? RETRO_DISCO_BEAT_FRAMES[cutIndex + 1]
      : TOTAL_FRAMES;
  const slotDuration = Math.max(1, nextFrame - startFrame);
  const localFrame = frame - startFrame;

  const activePhoto = safePhotos[cutIndex % safePhotos.length];

  // Animation dynamics
  let scale = 1.0;
  let flashOpacity = 0.0;
  let brightness = 1.0;

  if (slotDuration > 40) {
    // Long Segments (Intro 2.38s and Outro 1.54s): Smooth cinematic drift
    scale = interpolate(localFrame, [0, slotDuration], [1.0, 1.1], {
      extrapolateRight: "clamp",
    });
  } else if (slotDuration <= 15) {
    // Fast Cuts (0.40s): Sharp, snappy hits
    scale = localFrame === 0 ? 1.06 : 1.0;

    if (cutIndex % 2 === 0) {
      flashOpacity = interpolate(localFrame, [0, 3], [0.3, 0], {
        extrapolateRight: "clamp",
      });
    }
  } else {
    // Medium Beats (0.75s, 0.80s, 0.90s): Smooth bounce
    const bounce = spring({
      frame: localFrame,
      fps,
      config: { damping: 14, stiffness: 140, mass: 0.7 },
    });
    scale = interpolate(bounce, [0, 1], [1.08, 1.0]);
    brightness = interpolate(localFrame, [0, slotDuration], [1.05, 0.95]);
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <Audio src={staticFile("audio/ReelAudio-10.mp3")} />

      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          filter: `brightness(${brightness})`,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Img
          crossOrigin="anonymous"
          src={activePhoto}
          alt={`Slide ${cutIndex + 1}`}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      {flashOpacity > 0 && (
        <AbsoluteFill
          style={{
            backgroundColor: "#FBCFE8", // Retro pink flash
            opacity: flashOpacity,
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
};
