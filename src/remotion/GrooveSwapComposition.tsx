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

interface GrooveSwapProps {
  photos: string[];
}

export const GROOVE_SWAP_BEAT_FRAMES: number[] = [
  0, 24, 48, 72, 96, 120, 144, 168, 192, 216, 240, 264,
];

// Added the missing 'export' keyword here
export const TOTAL_FRAMES = 288; // 9.6s @ 30 FPS

export const GrooveSwapComposition: React.FC<GrooveSwapProps> = ({
  photos,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const safePhotos =
    photos && photos.length > 0
      ? photos
      : [
          "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200",
          "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200",
        ];

  let cutIndex = 0;
  for (let i = GROOVE_SWAP_BEAT_FRAMES.length - 1; i >= 0; i--) {
    if (frame >= GROOVE_SWAP_BEAT_FRAMES[i]) {
      cutIndex = i;
      break;
    }
  }

  const startFrame = GROOVE_SWAP_BEAT_FRAMES[cutIndex];
  const localFrame = frame - startFrame;

  const activePhoto = safePhotos[cutIndex % safePhotos.length];
  const prevPhoto =
    safePhotos[(cutIndex - 1 + safePhotos.length) % safePhotos.length];

  const spr = spring({
    frame: localFrame,
    fps,
    config: { damping: 14, stiffness: 140, mass: 0.8 },
  });

  const punch = interpolate(spr, [0, 1], [1.1, 1.0]);
  const drift = interpolate(localFrame, [0, 24], [1.0, 1.02], {
    extrapolateRight: "clamp",
  });
  const scale = punch * drift;

  const flashOpacity = interpolate(localFrame, [0, 4], [0.3, 0], {
    extrapolateRight: "clamp",
  });

  const showUnderlay = localFrame < 6;
  const underlayScale = showUnderlay
    ? interpolate(localFrame, [0, 6], [1.0, 1.05])
    : 1.0;
  const underlayOpacity = showUnderlay
    ? interpolate(localFrame, [0, 6], [0.5, 0])
    : 0.0;
  const opacity = showUnderlay
    ? interpolate(localFrame, [0, 4], [0.3, 1], { extrapolateRight: "clamp" })
    : 1.0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <Audio src={staticFile("audio/ReelAudio-2.mp3")} />

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
          transform: `scale(${scale})`,
          opacity,
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
