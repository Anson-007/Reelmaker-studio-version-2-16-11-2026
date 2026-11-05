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

interface ChillPulseProps {
  photos: string[];
}

// 16 Photos converted to exact 30 FPS frames based on the tutorial math
// Timings: 0.48s, 0.42s, 0.49s, 0.42s, 0.51s, 0.43s, 0.45s, 0.48s, 0.48s, 0.42s, 0.44s, 0.45s, 0.48s, 0.44s, 0.46s, 0.38s
export const CHILL_PULSE_BEAT_FRAMES: number[] = [
  0, 14, 27, 42, 55, 70, 83, 97, 111, 125, 138, 151, 165, 179, 192, 206,
];

export const TOTAL_FRAMES = 217; // 7.23s @ 30 FPS

export const ChillPulseComposition: React.FC<ChillPulseProps> = ({
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
        ];

  let cutIndex = 0;
  for (let i = CHILL_PULSE_BEAT_FRAMES.length - 1; i >= 0; i--) {
    if (frame >= CHILL_PULSE_BEAT_FRAMES[i]) {
      cutIndex = i;
      break;
    }
  }

  const startFrame = CHILL_PULSE_BEAT_FRAMES[cutIndex];
  const localFrame = frame - startFrame;
  const activePhoto = safePhotos[cutIndex % safePhotos.length];

  // Animation: Smooth, groovy "Pulse" instead of a harsh flash
  const bounce = spring({
    frame: localFrame,
    fps,
    config: { damping: 16, stiffness: 120, mass: 0.9 }, // Softer, calmer spring
  });

  const scale = interpolate(bounce, [0, 1], [1.08, 1.0]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <Audio src={staticFile("audio/ReelAudio-15.mp3")} />

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
    </AbsoluteFill>
  );
};
