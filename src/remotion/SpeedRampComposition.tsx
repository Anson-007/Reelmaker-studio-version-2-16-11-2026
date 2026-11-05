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

interface SpeedRampProps {
  photos: string[];
}

// Exact 30 FPS frame numbers converted from your 58 timestamps
export const SPEED_RAMP_BEAT_FRAMES: number[] = [
  0, // 00:00:00:00
  50, // 00:00:01:20
  70, // 00:00:02:10
  84, // 00:00:02:24
  103, // 00:00:03:13
  123, // 00:00:04:03
  130, // 00:00:04:10
  137, // 00:00:04:17
  144, // 00:00:04:24
  156, // 00:00:05:06
  163, // 00:00:05:13
  170, // 00:00:05:20
  183, // 00:00:06:03
  190, // 00:00:06:10
  193, // 00:00:06:13
  197, // 00:00:06:17
  200, // 00:00:06:20
  204, // 00:00:06:24
  213, // 00:00:07:03
  216, // 00:00:07:06
  220, // 00:00:07:10
  223, // 00:00:07:13
  227, // 00:00:07:17
  231, // 00:00:07:21
  234, // 00:00:07:24
  243, // 00:00:08:03
  246, // 00:00:08:06
  250, // 00:00:08:10
  253, // 00:00:08:13
  255, // 00:00:08:15
  257, // 00:00:08:17
  259, // 00:00:08:19
  261, // 00:00:08:21
  263, // 00:00:08:23
  270, // 00:00:09:00
  272, // 00:00:09:02
  274, // 00:00:09:04
  276, // 00:00:09:06
  278, // 00:00:09:08
  280, // 00:00:09:10
  282, // 00:00:09:12
  284, // 00:00:09:14
  286, // 00:00:09:16
  288, // 00:00:09:18
  290, // 00:00:09:20
  292, // 00:00:09:22
  294, // 00:00:09:24
  301, // 00:00:10:01
  303, // 00:00:10:03
  305, // 00:00:10:05
  307, // 00:00:10:07
  309, // 00:00:10:09
  311, // 00:00:10:11
  313, // 00:00:10:13
  315, // 00:00:10:15
  317, // 00:00:10:17
  319, // 00:00:10:19
  321, // 00:00:10:21 (Held until frame 330)
];

export const TOTAL_FRAMES = 330; // Exactly 11.0s @ 30 FPS

export const SpeedRampComposition: React.FC<SpeedRampProps> = ({ photos }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const safePhotos =
    photos && photos.length > 0
      ? photos
      : [
          "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200",
          "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1200",
          "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200",
          "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200",
        ];

  // Find active cut index
  let cutIndex = 0;
  for (let i = SPEED_RAMP_BEAT_FRAMES.length - 1; i >= 0; i--) {
    if (frame >= SPEED_RAMP_BEAT_FRAMES[i]) {
      cutIndex = i;
      break;
    }
  }

  const startFrame = SPEED_RAMP_BEAT_FRAMES[cutIndex];
  const nextFrame =
    cutIndex < SPEED_RAMP_BEAT_FRAMES.length - 1
      ? SPEED_RAMP_BEAT_FRAMES[cutIndex + 1]
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

  if (slotDuration <= 3) {
    // SECTION 3: 2-frame micro-stutters (Frame 253 onward)
    // Razor snap cuts + instant punch to prevent ghosting or blur
    scale = localFrame === 0 ? 1.04 : 1.0;
    flashOpacity = localFrame === 0 ? 0.22 : 0.0;
  } else if (slotDuration >= 14) {
    // SECTION 1: Deep Sustained Intro Drops (Frames 0 to 123)
    // Settle spring + slow drift zoom
    const introSpring = spring({
      frame: localFrame,
      fps,
      config: { damping: 14, stiffness: 120, mass: 0.8 },
    });
    const punch = interpolate(introSpring, [0, 1], [1.14, 1.0]);
    const drift = interpolate(localFrame, [0, slotDuration], [1.0, 1.03], {
      extrapolateRight: "clamp",
    });
    scale = punch * drift;

    showUnderlay = localFrame < 5;
    if (showUnderlay) {
      underlayScale = interpolate(localFrame, [0, 5], [1.0, 1.08]);
      underlayOpacity = interpolate(localFrame, [0, 5], [0.6, 0]);
      opacity = interpolate(localFrame, [0, 4], [0.4, 1], {
        extrapolateRight: "clamp",
      });
    }

    flashOpacity = interpolate(localFrame, [0, 3], [0.35, 0], {
      extrapolateRight: "clamp",
    });
  } else {
    // SECTION 2: Rhythmic Accelerating Mid-Roll (Frames 130 to 253)
    const midSpring = spring({
      frame: localFrame,
      fps,
      config: { damping: 13, stiffness: 170, mass: 0.5 },
    });
    scale = interpolate(midSpring, [0, 1], [1.08, 1.0]);

    // Subtle alternating tilt on fast snare cuts
    if (cutIndex % 2 === 0) {
      rotation = interpolate(midSpring, [0, 1], [1.2, 0]);
    } else {
      rotation = interpolate(midSpring, [0, 1], [-1.2, 0]);
    }

    showUnderlay = localFrame < 3 && slotDuration >= 6;
    if (showUnderlay) {
      underlayOpacity = interpolate(localFrame, [0, 3], [0.35, 0]);
    }

    flashOpacity = interpolate(localFrame, [0, 2], [0.18, 0], {
      extrapolateRight: "clamp",
    });
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <Audio src={staticFile("audio/ReelAudio-3.mp3")} />

      {/* GHOSTED UNDERLAY MORPH */}
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

      {/* FOREGROUND SHOT */}
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

      {/* TRANSIENT EXPOSURE FLASH */}
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
