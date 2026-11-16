import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from "remotion";
import { Audio, Video } from "@remotion/media";
import { OutroCard, OutroProps } from "./OutroCard";

export type OutroTransitionType = "cut" | "fade" | "slice" | "circle" | "slide";

interface PendulumFlowProps {
  photos: string[];
  videoUrl: string | null;
  showOutro?: boolean;
  outroData?: OutroProps & { transitionType?: OutroTransitionType };
}

// 1 Video (2.4s = 72 frames) -> 11 Photos (0.7s = 21 frames each)
export const PENDULUM_BEAT_FRAMES: number[] = [
  0, 72, 93, 114, 135, 156, 177, 198, 219, 240, 261, 282,
];

export const BASE_DURATION = 303; // 10.1s @ 30 FPS
export const OUTRO_DURATION = 150; // 5.0s
const TRANSITION_FRAMES = 25;

export const getPendulumTotalFrames = (
  showOutro: boolean = false,
  transition: string = "cut",
) => {
  const overlap = showOutro && transition !== "cut" ? TRANSITION_FRAMES : 0;
  return showOutro ? BASE_DURATION + OUTRO_DURATION - overlap : BASE_DURATION;
};

export const PendulumFlowComposition: React.FC<PendulumFlowProps> = ({
  photos,
  videoUrl,
  showOutro = false,
  outroData,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const transitionType = outroData?.transitionType || "cut";
  const overlapDur =
    showOutro && transitionType !== "cut" ? TRANSITION_FRAMES : 0;
  const outroStartFrame = BASE_DURATION - overlapDur;

  const safePhotos = photos && photos.length > 0 ? photos : [];
  const safeVideo = videoUrl || "";

  let cutIndex = 0;
  if (frame < BASE_DURATION) {
    for (let i = PENDULUM_BEAT_FRAMES.length - 1; i >= 0; i--) {
      if (frame >= PENDULUM_BEAT_FRAMES[i]) {
        cutIndex = i;
        break;
      }
    }
  }

  const startFrame = PENDULUM_BEAT_FRAMES[cutIndex] || 0;
  const localFrame = frame - startFrame;
  const isVideoSegment = cutIndex === 0;

  let photoToRender = safePhotos.length > 0 ? safePhotos[0] : null;
  if (!isVideoSegment && safePhotos.length > 0) {
    const photoOffset = cutIndex - 1;
    photoToRender = safePhotos[photoOffset % safePhotos.length];
  }

  // Animation dynamics
  let scale = 1.0;
  let rotation = 0;
  let flashOpacity = 0.0;

  if (frame < BASE_DURATION) {
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
  }

  const outroLocalFrame = frame - outroStartFrame;
  let outroTransitionStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    position: "absolute",
  };

  if (showOutro && outroLocalFrame >= 0 && outroLocalFrame <= overlapDur) {
    if (transitionType === "fade") {
      outroTransitionStyle.opacity = interpolate(
        outroLocalFrame,
        [0, overlapDur],
        [0, 1],
        { extrapolateRight: "clamp" },
      );
    } else if (transitionType === "slice") {
      const progress = interpolate(outroLocalFrame, [0, overlapDur], [0, 150], {
        extrapolateRight: "clamp",
      });
      // FIX: Corrected line break in the template literal
      outroTransitionStyle.clipPath = `polygon(0 0, ${progress}% 0, ${progress - 50}% 100%, 0 100%)`;
    } else if (transitionType === "circle") {
      const radius = interpolate(outroLocalFrame, [0, overlapDur], [0, 150], {
        extrapolateRight: "clamp",
      });
      outroTransitionStyle.clipPath = `circle(${radius}% at 50% 50%)`;
    } else if (transitionType === "slide") {
      const y = interpolate(outroLocalFrame, [0, overlapDur], [100, 0], {
        extrapolateRight: "clamp",
      });
      outroTransitionStyle.transform = `translateY(${y}%)`;
    }
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <Sequence from={0} durationInFrames={BASE_DURATION}>
        {/* FIX: Audio volume is clamped and processed via callback */}
        <Audio
          src={staticFile("audio/ReelAudio-8.mp3")}
          volume={(f) =>
            showOutro
              ? interpolate(
                  f,
                  [outroStartFrame, outroStartFrame + TRANSITION_FRAMES],
                  [1, 0],
                  {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  },
                )
              : 1
          }
        />

        <AbsoluteFill
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transformOrigin: "bottom center",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {isVideoSegment ? (
            safeVideo ? (
              <Video
                src={safeVideo}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                muted
                // FIX: Removed playsInline attribute
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
                  style={{
                    color: "#fff",
                    fontSize: "40px",
                    fontWeight: "bold",
                  }}
                >
                  No Video Uploaded
                </span>
              </AbsoluteFill>
            )
          ) : photoToRender ? (
            <img
              src={photoToRender}
              alt={`Slide ${cutIndex}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                position: "absolute",
                inset: 0,
              }}
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
                style={{
                  color: "#14b8a6",
                  fontSize: "40px",
                  fontWeight: "bold",
                }}
              >
                Upload Photos
              </span>
            </AbsoluteFill>
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
      </Sequence>

      {/* Outro Sequence */}
      {showOutro && (
        <>
          {/* FIX: Transition Sound Effect */}
          <Sequence from={outroStartFrame} durationInFrames={OUTRO_DURATION}>
            <Audio
              src={staticFile("audio/whoosh-transition.mp3")}
              volume={0.8}
            />
          </Sequence>

          <Sequence from={outroStartFrame} durationInFrames={OUTRO_DURATION}>
            <div style={outroTransitionStyle}>
              <OutroCard
                {...(outroData || {
                  logoUrl: null,
                  bgUrl: null,
                  contactText: "",
                  socialHandle: "",
                })}
              />
            </div>
          </Sequence>
        </>
      )}
    </AbsoluteFill>
  );
};
