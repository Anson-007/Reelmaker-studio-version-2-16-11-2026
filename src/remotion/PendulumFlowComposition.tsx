import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Img,
  // CRITICAL FIX: Removed 'Video' from this import
} from "remotion";
// CRITICAL FIX: Imported 'Video' from @remotion/media
import { Audio, Video } from "@remotion/media";

interface PendulumFlowProps {
  photos: string[];
  videoUrl: string | null;
}

// 1 Video (2.4s = 72 frames) -> 11 Photos (0.7s = 21 frames each)
export const PENDULUM_BEAT_FRAMES: number[] = [
  0, 72, 93, 114, 135, 156, 177, 198, 219, 240, 261, 282,
];

export const TOTAL_FRAMES = 303; // 10.1s @ 30 FPS

export const PendulumFlowComposition: React.FC<PendulumFlowProps> = ({
  photos,
  videoUrl,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const safePhotos =
    photos && photos.length > 0
      ? photos
      : [
          "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=1200",
          "https://images.unsplash.com/photo-1682687982501-1e58f813f228?w=1200",
        ];

  // Default fallback video
  const safeVideo =
    videoUrl ||
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

  let cutIndex = 0;
  for (let i = PENDULUM_BEAT_FRAMES.length - 1; i >= 0; i--) {
    if (frame >= PENDULUM_BEAT_FRAMES[i]) {
      cutIndex = i;
      break;
    }
  }

  const startFrame = PENDULUM_BEAT_FRAMES[cutIndex];
  const localFrame = frame - startFrame;
  const isVideoSegment = cutIndex === 0; // 1st slot is the video

  // Calculate which photo to show (skipping the video index)
  let photoToRender = safePhotos[0];
  if (!isVideoSegment) {
    const photoOffset = cutIndex - 1;
    photoToRender = safePhotos[photoOffset % safePhotos.length];
  }

  // Animation dynamics
  let scale = 1.0;
  let rotation = 0;
  let flashOpacity = 0.0;

  if (isVideoSegment) {
    // 2.40s Video Segment: Cinematic push
    scale = interpolate(localFrame, [0, 72], [1.0, 1.15], {
      extrapolateRight: "clamp",
    });
  } else {
    // Phase 2: Alternating Pendulum 1 & 2
    const pendulumSpring = spring({
      frame: localFrame,
      fps,
      config: { damping: 12, stiffness: 140, mass: 0.6 },
    });

    // Alternating directions based on odd/even cuts
    const rotationStart = cutIndex % 2 === 0 ? 15 : -15;
    rotation = interpolate(pendulumSpring, [0, 1], [rotationStart, 0]);

    // Scale slightly so black edges don't show during rotation
    scale = interpolate(pendulumSpring, [0, 1], [1.18, 1.05]);

    // Quick exposure flash
    flashOpacity = interpolate(localFrame, [0, 4], [0.25, 0], {
      extrapolateRight: "clamp",
    });
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <Audio src={staticFile("audio/ReelAudio-8.mp3")} />

      <AbsoluteFill
        style={{
          transform: `scale(${scale}) rotate(${rotation}deg)`,
          transformOrigin: "bottom center", // Anchor at bottom for pendulum feel
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {isVideoSegment ? (
          videoUrl ? (
            <Video
              // Removed crossOrigin and startFrom to fix TS errors
              src={videoUrl}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              muted
            />
          ) : (
            <AbsoluteFill
              style={{
                backgroundColor: "#1e1e1e",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <span
                style={{ color: "#fff", fontSize: "40px", fontWeight: "bold" }}
              >
                No Video Uploaded
              </span>
            </AbsoluteFill>
          )
        ) : (
          <Img
            crossOrigin="anonymous"
            src={photoToRender}
            alt={`Slide ${cutIndex}`}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </AbsoluteFill>

      {/* BEAT FLASH */}
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
