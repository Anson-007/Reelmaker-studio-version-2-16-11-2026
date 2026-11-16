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

interface MixedMediaProps {
  photos: string[];
  videoUrl: string | null;
  showOutro?: boolean;
  outroData?: OutroProps & { transitionType?: OutroTransitionType };
}

export const MIXED_MEDIA_BEAT_FRAMES = [
  0, 21, 39, 57, 75, 93, 111, 129, 147, 219, 228, 237, 246, 255, 264, 273, 282,
  291, 300, 309, 318, 327, 336, 345, 354,
];

const BASE_DURATION = 363; // 12.1s
export const OUTRO_DURATION = 150; // 5.0s
const TRANSITION_FRAMES = 25;

export const getMixedMediaTotalFrames = (
  showOutro: boolean = false,
  transition: string = "cut",
) => {
  const overlap = showOutro && transition !== "cut" ? TRANSITION_FRAMES : 0;
  return showOutro ? BASE_DURATION + OUTRO_DURATION - overlap : BASE_DURATION;
};

export const MixedMediaComposition: React.FC<MixedMediaProps> = ({
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

  let cutIndex = 0;
  if (frame < BASE_DURATION) {
    for (let i = MIXED_MEDIA_BEAT_FRAMES.length - 1; i >= 0; i--) {
      if (frame >= MIXED_MEDIA_BEAT_FRAMES[i]) {
        cutIndex = i;
        break;
      }
    }
  }

  const startFrame = MIXED_MEDIA_BEAT_FRAMES[cutIndex] || 0;
  const localFrame = frame - startFrame;
  const isVideoSegment = cutIndex === 8;

  let photoToRender = safePhotos.length > 0 ? safePhotos[0] : null;
  if (!isVideoSegment && frame < BASE_DURATION && safePhotos.length > 0) {
    const photoOffset = cutIndex > 8 ? cutIndex - 1 : cutIndex;
    photoToRender = safePhotos[photoOffset % safePhotos.length];
  }

  let scale = 1.0;
  let flashOpacity = 0.0;

  if (frame < BASE_DURATION) {
    if (isVideoSegment) {
      scale = interpolate(localFrame, [0, 72], [1.0, 1.15], {
        extrapolateRight: "clamp",
      });
    } else if (cutIndex > 8) {
      scale = localFrame === 0 ? 1.05 : 1.0;
      flashOpacity = localFrame === 0 ? 0.2 : 0.0;
    } else {
      const dropSpring = spring({
        frame: localFrame,
        fps,
        config: { damping: 14, stiffness: 160, mass: 0.6 },
      });
      scale = interpolate(dropSpring, [0, 1], [1.08, 1.0]);
      flashOpacity = interpolate(localFrame, [0, 3], [0.15, 0], {
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
        {/* FIX: Reattached the volume prop, clamped it, and executed via callback */}
        <Audio
          src={staticFile("audio/ReelAudio-7.mp3")}
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
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {isVideoSegment ? (
            videoUrl ? (
              <Video
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
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                position: "absolute",
                inset: 0,
              }}
              alt="Slide"
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
                  color: "#818cf8",
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
