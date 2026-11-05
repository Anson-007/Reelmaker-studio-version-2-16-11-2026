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

interface SeamlessSwapProps {
  photos: string[];
}

export const SEAMLESS_SWAP_BEAT_FRAMES: number[] = [
  0, 1, 2, 4, 5, 6, 8, 9, 11, 13, 15, 18, 21, 24, 33, 38, 45, 54, 71, 96, 135,
  159, 171, 185, 192, 197, 202, 211, 215, 218, 221, 223, 226, 228,
];

// Added the missing 'export' keyword here
export const TOTAL_FRAMES = 238; // 7.92s @ 30 FPS

export const SeamlessSwapComposition: React.FC<SeamlessSwapProps> = ({
  photos,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const safePhotos =
    photos && photos.length > 0
      ? photos
      : [
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
          "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200",
        ];

  let cutIndex = 0;
  for (let i = SEAMLESS_SWAP_BEAT_FRAMES.length - 1; i >= 0; i--) {
    if (frame >= SEAMLESS_SWAP_BEAT_FRAMES[i]) {
      cutIndex = i;
      break;
    }
  }

  const startFrame = SEAMLESS_SWAP_BEAT_FRAMES[cutIndex];
  const nextFrame =
    cutIndex < SEAMLESS_SWAP_BEAT_FRAMES.length - 1
      ? SEAMLESS_SWAP_BEAT_FRAMES[cutIndex + 1]
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
  let rotation = 0;

  if (slotDuration <= 4) {
    scale = localFrame === 0 ? 1.05 : 1.0;
    flashOpacity = localFrame === 0 ? 0.3 : 0.0;
  } else if (slotDuration >= 20) {
    const spr = spring({
      frame: localFrame,
      fps,
      config: { damping: 14, stiffness: 120, mass: 0.8 },
    });
    const punch = interpolate(spr, [0, 1], [1.1, 1.0]);
    const drift = interpolate(localFrame, [0, slotDuration], [1.0, 1.03], {
      extrapolateRight: "clamp",
    });
    scale = punch * drift;

    showUnderlay = localFrame < 5;
    if (showUnderlay) {
      underlayScale = interpolate(localFrame, [0, 5], [1.0, 1.05]);
      underlayOpacity = interpolate(localFrame, [0, 5], [0.5, 0]);
      opacity = interpolate(localFrame, [0, 4], [0.3, 1], {
        extrapolateRight: "clamp",
      });
    }

    flashOpacity = interpolate(localFrame, [0, 3], [0.4, 0], {
      extrapolateRight: "clamp",
    });
  } else {
    const spr = spring({
      frame: localFrame,
      fps,
      config: { damping: 12, stiffness: 180, mass: 0.6 },
    });
    scale = interpolate(spr, [0, 1], [1.08, 1.0]);

    if (cutIndex % 2 === 0) {
      rotation = interpolate(spr, [0, 1], [1.5, 0]);
    } else {
      rotation = interpolate(spr, [0, 1], [-1.5, 0]);
    }

    showUnderlay = localFrame < 3;
    if (showUnderlay) {
      underlayOpacity = interpolate(localFrame, [0, 3], [0.4, 0]);
    }

    flashOpacity = interpolate(localFrame, [0, 2], [0.2, 0], {
      extrapolateRight: "clamp",
    });
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <Audio src={staticFile("audio/ReelAudio-1.mp3")} />

      {showUnderlay && (
        <AbsoluteFill
          style={{
            transform: `scale(${underlayScale})`,
            opacity: underlayOpacity,
            filter: "blur(8px)",
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
          transform: `scale(${scale}) rotate(${rotation}deg)`,
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
