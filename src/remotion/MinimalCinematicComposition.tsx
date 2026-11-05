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

interface MinimalCinematicProps {
  photos: string[];
}

// Exact 30 FPS frame schedule converted from your timestamps (19 unique cut points)
export const CINEMATIC_BEAT_FRAMES: number[] = [
  0, // 00:00:00:00
  2, // 00:00:00:02 (Micro snap entrance)
  14, // 00:00:00:14
  30, // 00:00:01:00
  42, // 00:00:01:12
  53, // 00:00:01:23
  69, // 00:00:02:09
  97, // 00:00:03:07 (Extended breath / sustained hold)
  108, // 00:00:03:18
  125, // 00:00:04:05
  136, // 00:00:04:16
  153, // 00:00:05:03
  165, // 00:00:05:15
  181, // 00:00:06:01
  192, // 00:00:06:12
  204, // 00:00:06:24
  220, // 00:00:07:10
  232, // 00:00:07:22
  243, // 00:00:08:03 (Final cut held to frame 255)
];

export const TOTAL_FRAMES = 255; // Exactly 8.50s @ 30 FPS

export const MinimalCinematicComposition: React.FC<MinimalCinematicProps> = ({
  photos,
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
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
        ];

  // Determine active cut index
  let cutIndex = 0;
  for (let i = CINEMATIC_BEAT_FRAMES.length - 1; i >= 0; i--) {
    if (frame >= CINEMATIC_BEAT_FRAMES[i]) {
      cutIndex = i;
      break;
    }
  }

  const startFrame = CINEMATIC_BEAT_FRAMES[cutIndex];
  const nextFrame =
    cutIndex < CINEMATIC_BEAT_FRAMES.length - 1
      ? CINEMATIC_BEAT_FRAMES[cutIndex + 1]
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

  if (slotDuration <= 2) {
    // 2-frame micro cut at frame 0..2
    scale = 1.03;
    flashOpacity = 0.25;
  } else if (slotDuration >= 25) {
    // Extended ambient hold (Frame 69 to 97)
    const holdProgress = localFrame / slotDuration;
    scale = interpolate(holdProgress, [0, 1], [1.02, 1.08]);
    translateY = interpolate(holdProgress, [0, 1], [1.0, -1.0]);

    showUnderlay = localFrame < 5;
    if (showUnderlay) {
      underlayScale = interpolate(localFrame, [0, 5], [1.0, 1.05]);
      underlayOpacity = interpolate(localFrame, [0, 5], [0.6, 0]);
      opacity = interpolate(localFrame, [0, 4], [0.4, 1], {
        extrapolateRight: "clamp",
      });
    }

    flashOpacity = interpolate(localFrame, [0, 3], [0.3, 0], {
      extrapolateRight: "clamp",
    });
  } else {
    // Regular steady downbeats (~11–16 frames)
    const beatSpring = spring({
      frame: localFrame,
      fps,
      config: { damping: 14, stiffness: 135, mass: 0.65 },
    });

    const punch = interpolate(beatSpring, [0, 1], [1.09, 1.0]);
    const drift = interpolate(localFrame, [0, slotDuration], [1.0, 1.025], {
      extrapolateRight: "clamp",
    });
    scale = punch * drift;

    showUnderlay = localFrame < 4;
    if (showUnderlay) {
      underlayScale = interpolate(localFrame, [0, 4], [1.0, 1.04]);
      underlayOpacity = interpolate(localFrame, [0, 4], [0.45, 0]);
      opacity = interpolate(localFrame, [0, 3], [0.5, 1], {
        extrapolateRight: "clamp",
      });
    }

    flashOpacity = interpolate(localFrame, [0, 2], [0.22, 0], {
      extrapolateRight: "clamp",
    });
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <Audio src={staticFile("audio/ReelAudio-4.mp3")} />

      {/* FILM DISSOLVE UNDERLAY */}
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

      {/* FOREGROUND CLIP */}
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
          alt={`Cinematic Slide ${cutIndex + 1}`}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      {/* OPTICAL EXPOSURE FLASH */}
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
