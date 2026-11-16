import React from "react";
import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Sequence,
} from "remotion";
import { Audio, Video } from "@remotion/media";
import { OutroCard, OutroProps } from "./OutroCard";

export type OutroTransitionType = "cut" | "fade" | "slice" | "circle" | "slide";

interface TranquilRushProps {
  photos: string[];
  videoUrl: string | null;
  showOutro?: boolean;
  outroData?: OutroProps & { transitionType?: OutroTransitionType };
}

// 1 Video (7.86s = 236 frames) -> 37 Photos (0.15s = 4.5 frames each)
export const TRANQUIL_RUSH_BEAT_FRAMES: number[] = [
  0,
  ...Array.from({ length: 37 }, (_, i) => 236 + Math.round(i * 4.5)),
];

export const BASE_DURATION = 403; // ~13.43s @ 30 FPS
export const OUTRO_DURATION = 150; // 5.0s
const TRANSITION_FRAMES = 25;

export const getTranquilRushTotalFrames = (
  showOutro: boolean = false,
  transition: string = "cut",
) => {
  const overlap = showOutro && transition !== "cut" ? TRANSITION_FRAMES : 0;
  return showOutro ? BASE_DURATION + OUTRO_DURATION - overlap : BASE_DURATION;
};

export const TranquilRushComposition: React.FC<TranquilRushProps> = ({
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
    for (let i = TRANQUIL_RUSH_BEAT_FRAMES.length - 1; i >= 0; i--) {
      if (frame >= TRANQUIL_RUSH_BEAT_FRAMES[i]) {
        cutIndex = i;
        break;
      }
    }
  }

  const startFrame = TRANQUIL_RUSH_BEAT_FRAMES[cutIndex] || 0;
  const localFrame = frame - startFrame;
  const isVideoSegment = cutIndex === 0;

  let photoToRender = safePhotos.length > 0 ? safePhotos[0] : null;
  if (!isVideoSegment && safePhotos.length > 0) {
    const photoOffset = cutIndex - 1;
    photoToRender = safePhotos[photoOffset % safePhotos.length];
  }

  // Animation dynamics
  let scale = 1.0;
  let flashOpacity = 0.0;
  let brightness = 1.0;

  if (frame < BASE_DURATION) {
    if (isVideoSegment) {
      scale = interpolate(localFrame, [0, 236], [1.0, 1.08], {
        extrapolateRight: "clamp",
      });
    } else {
      scale = localFrame === 0 ? 1.03 : 1.0;
      if (cutIndex % 2 !== 0) {
        flashOpacity = interpolate(localFrame, [0, 2], [0.2, 0], {
          extrapolateRight: "clamp",
        });
      } else {
        brightness = 0.85;
      }
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
        {/* FIX: Clamp the volume on both sides so it never exceeds 1 (100%) */}
        <Audio
          src={staticFile("audio/ReelAudio-9.mp3")}
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
            transform: `scale(${scale})`,
            filter: `brightness(${brightness})`,
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
                  color: "#38bdf8",
                  fontSize: "40px",
                  fontWeight: "bold",
                }}
              >
                Upload Photos
              </span>
            </AbsoluteFill>
          )}
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
      </Sequence>

      {/* Outro Sequence */}
      {showOutro && (
        <>
          {/* Transition Sound Effect */}
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
