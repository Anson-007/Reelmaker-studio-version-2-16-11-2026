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
import { Audio } from "@remotion/media";
import { OutroCard, OutroProps } from "./OutroCard";

export type OutroTransitionType = "cut" | "fade" | "slice" | "circle" | "slide";

interface SeamlessSwapProps {
  photos: string[];
  showOutro?: boolean;
  outroData?: OutroProps & { transitionType?: OutroTransitionType };
}

export const SEAMLESS_SWAP_BEAT_FRAMES: number[] = [
  0, 1, 2, 4, 5, 6, 8, 9, 11, 13, 15, 18, 21, 24, 33, 38, 45, 54, 71, 96, 135,
  159, 171, 185, 192, 197, 202, 211, 215, 218, 221, 223, 226, 228,
];

export const BASE_DURATION = 238; // 7.92s @ 30 FPS
export const OUTRO_DURATION = 150; // 5.0s
const TRANSITION_FRAMES = 25;

export const getSeamlessSwapTotalFrames = (
  showOutro: boolean = false,
  transition: string = "cut",
) => {
  const overlap = showOutro && transition !== "cut" ? TRANSITION_FRAMES : 0;
  return showOutro ? BASE_DURATION + OUTRO_DURATION - overlap : BASE_DURATION;
};

export const SeamlessSwapComposition: React.FC<SeamlessSwapProps> = ({
  photos,
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
    for (let i = SEAMLESS_SWAP_BEAT_FRAMES.length - 1; i >= 0; i--) {
      if (frame >= SEAMLESS_SWAP_BEAT_FRAMES[i]) {
        cutIndex = i;
        break;
      }
    }
  }

  const startFrame = SEAMLESS_SWAP_BEAT_FRAMES[cutIndex];
  const nextFrame =
    cutIndex < SEAMLESS_SWAP_BEAT_FRAMES.length - 1
      ? SEAMLESS_SWAP_BEAT_FRAMES[cutIndex + 1]
      : BASE_DURATION;
  const slotDuration = Math.max(1, nextFrame - startFrame);
  const localFrame = frame - startFrame;

  const activePhoto =
    safePhotos.length > 0 ? safePhotos[cutIndex % safePhotos.length] : null;
  const prevPhoto =
    safePhotos.length > 0
      ? safePhotos[(cutIndex - 1 + safePhotos.length) % safePhotos.length]
      : null;

  let scale = 1.0;
  let opacity = 1.0;
  let flashOpacity = 0.0;
  let showUnderlay = false;
  let underlayScale = 1.0;
  let underlayOpacity = 0.0;
  let rotation = 0;

  if (frame < BASE_DURATION) {
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
        {/* FIX: Audio volume is clamped and processed via callback */}
        <Audio
          src={staticFile("audio/ReelAudio-1.mp3")}
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

        {showUnderlay && prevPhoto && (
          <AbsoluteFill
            style={{
              transform: `scale(${underlayScale})`,
              opacity: underlayOpacity,
              filter: "blur(8px)",
            }}
          >
            <img
              src={prevPhoto}
              alt="Outgoing Slide"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                position: "absolute",
                inset: 0,
              }}
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
          {activePhoto ? (
            <img
              src={activePhoto}
              alt={`Slide ${cutIndex + 1}`}
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
                  color: "#c084fc",
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
