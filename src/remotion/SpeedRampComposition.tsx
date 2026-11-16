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

interface SpeedRampProps {
  photos: string[];
  showOutro?: boolean;
  outroData?: OutroProps & { transitionType?: OutroTransitionType };
}

// Exact 30 FPS frame numbers converted from your 58 timestamps
export const SPEED_RAMP_BEAT_FRAMES: number[] = [
  0, 50, 70, 84, 103, 123, 130, 137, 144, 156, 163, 170, 183, 190, 193, 197,
  200, 204, 213, 216, 220, 223, 227, 231, 234, 243, 246, 250, 253, 255, 257,
  259, 261, 263, 270, 272, 274, 276, 278, 280, 282, 284, 286, 288, 290, 292,
  294, 301, 303, 305, 307, 309, 311, 313, 315, 317, 319, 321,
];

export const BASE_DURATION = 330; // Exactly 11.0s @ 30 FPS
export const OUTRO_DURATION = 150; // 5.0s
const TRANSITION_FRAMES = 25;

export const getSpeedRampTotalFrames = (
  showOutro: boolean = false,
  transition: string = "cut",
) => {
  const overlap = showOutro && transition !== "cut" ? TRANSITION_FRAMES : 0;
  return showOutro ? BASE_DURATION + OUTRO_DURATION - overlap : BASE_DURATION;
};

export const SpeedRampComposition: React.FC<SpeedRampProps> = ({
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

  // Find active cut index
  let cutIndex = 0;
  if (frame < BASE_DURATION) {
    for (let i = SPEED_RAMP_BEAT_FRAMES.length - 1; i >= 0; i--) {
      if (frame >= SPEED_RAMP_BEAT_FRAMES[i]) {
        cutIndex = i;
        break;
      }
    }
  }

  const startFrame = SPEED_RAMP_BEAT_FRAMES[cutIndex];
  const nextFrame =
    cutIndex < SPEED_RAMP_BEAT_FRAMES.length - 1
      ? SPEED_RAMP_BEAT_FRAMES[cutIndex + 1]
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
      // FIX: Corrected line break in the clipPath template literal
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
          src={staticFile("audio/ReelAudio-3.mp3")}
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

        {/* GHOSTED UNDERLAY MORPH */}
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

        {/* FOREGROUND SHOT */}
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
                  color: "#f43f5e",
                  fontSize: "40px",
                  fontWeight: "bold",
                }}
              >
                Upload Photos
              </span>
            </AbsoluteFill>
          )}
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
