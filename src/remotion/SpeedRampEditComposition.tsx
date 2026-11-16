import React from "react";
import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useCurrentFrame,
  Sequence,
} from "remotion";
import { Audio } from "@remotion/media";
import { OutroCard, OutroProps } from "./OutroCard";
import { LightFX, LightPreset } from "./fx";
import {
  SpeedRampIntroFX,
  SpeedRampSlideFX,
  SpeedRampStyle,
} from "./fx/TransitionFX";

export type OutroTransitionType = "cut" | "fade" | "slice" | "circle" | "slide";

interface SpeedRampEditProps {
  photos: string[];
  showOutro?: boolean;
  muteAudio?: boolean;
  outroData?: OutroProps & { transitionType?: OutroTransitionType };
}

export interface SpeedRampSlideSpec {
  startFrame: number;
  endFrame: number;
  photoIndex: number;
  stylePreset: SpeedRampStyle;
  lightPreset: LightPreset;
  lightIntensity: number;
}

// Phase 1: 6.00s Tension-Building Intro Hold on Photo 1 (Frames 0 to 180)
export const SPEED_RAMP_INTRO_END_FRAME = 180;

// Phase 2: 18 High-Velocity Speed-Ramp Cuts (Cycle 1: 6.0s - 12.0s | Cycle 2: 12.0s - 18.0s)
export const SPEED_RAMP_SLIDES: SpeedRampSlideSpec[] = [
  // --- CYCLE 1 (Photos 1 to 9: 6.00s - 12.00s / Frames 180 to 360) ---
  {
    startFrame: 180,
    endFrame: 204,
    photoIndex: 0,
    stylePreset: "flash-zoom",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.9,
  },
  {
    startFrame: 204,
    endFrame: 215,
    photoIndex: 1,
    stylePreset: "vertical-streak",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.65,
  },
  {
    startFrame: 215,
    endFrame: 225,
    photoIndex: 2,
    stylePreset: "tilted-whip",
    lightPreset: "film-burn",
    lightIntensity: 0.7,
  },
  {
    startFrame: 225,
    endFrame: 249,
    photoIndex: 3,
    stylePreset: "defocus-zoom",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.75,
  },
  {
    startFrame: 249,
    endFrame: 270,
    photoIndex: 4,
    stylePreset: "exposure-whip",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.85,
  },
  {
    startFrame: 270,
    endFrame: 294,
    photoIndex: 5,
    stylePreset: "vertical-streak",
    lightPreset: "film-burn",
    lightIntensity: 0.8,
  },
  {
    startFrame: 294,
    endFrame: 315,
    photoIndex: 6,
    stylePreset: "vignette-punch",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.7,
  },
  {
    startFrame: 315,
    endFrame: 339,
    photoIndex: 7,
    stylePreset: "vertical-streak",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.8,
  },
  {
    startFrame: 339,
    endFrame: 360,
    photoIndex: 8,
    stylePreset: "vignette-punch",
    lightPreset: "film-burn",
    lightIntensity: 0.75,
  },

  // --- CYCLE 2 (Photos 1 to 9 Repeat: 12.00s - 18.00s / Frames 360 to 540) ---
  {
    startFrame: 360,
    endFrame: 384,
    photoIndex: 0,
    stylePreset: "exposure-whip",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.9,
  },
  {
    startFrame: 384,
    endFrame: 395,
    photoIndex: 1,
    stylePreset: "vertical-streak",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.65,
  },
  {
    startFrame: 395,
    endFrame: 405,
    photoIndex: 2,
    stylePreset: "tilted-whip",
    lightPreset: "film-burn",
    lightIntensity: 0.7,
  },
  {
    startFrame: 405,
    endFrame: 429,
    photoIndex: 3,
    stylePreset: "defocus-zoom",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.75,
  },
  {
    startFrame: 429,
    endFrame: 450,
    photoIndex: 4,
    stylePreset: "exposure-whip",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.85,
  },
  {
    startFrame: 450,
    endFrame: 474,
    photoIndex: 5,
    stylePreset: "vertical-streak",
    lightPreset: "film-burn",
    lightIntensity: 0.8,
  },
  {
    startFrame: 474,
    endFrame: 495,
    photoIndex: 6,
    stylePreset: "vignette-punch",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.7,
  },
  {
    startFrame: 495,
    endFrame: 519,
    photoIndex: 7,
    stylePreset: "vertical-streak",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.8,
  },
  {
    startFrame: 519,
    endFrame: 540,
    photoIndex: 8,
    stylePreset: "vignette-punch",
    lightPreset: "film-burn",
    lightIntensity: 0.85,
  },
];

export const PHOTO_CUTOFF_FRAME = 540; // 18.00s (Fades to black at 18.0s for the final 1.37s tail)
export const BASE_DURATION = 581; // 19.37s @ 30 FPS
export const OUTRO_DURATION = 150; // 5.0s
const TRANSITION_FRAMES = 25;

export const getSpeedRampEditTotalFrames = (
  showOutro: boolean = false,
  transition: string = "cut",
) => {
  const overlap = showOutro && transition !== "cut" ? TRANSITION_FRAMES : 0;
  return showOutro ? BASE_DURATION + OUTRO_DURATION - overlap : BASE_DURATION;
};

const getSafePhotoSrc = (src: string | null | undefined): string | null => {
  if (!src) return null;
  if (
    src.startsWith("http") ||
    src.startsWith("data:") ||
    src.startsWith("blob:")
  ) {
    return src;
  }
  return staticFile(src.startsWith("/") ? src.substring(1) : src);
};

export const SpeedRampEditComposition: React.FC<SpeedRampEditProps> = ({
  photos,
  showOutro = false,
  muteAudio = false,
  outroData,
}) => {
  const frame = useCurrentFrame();

  const transitionType = outroData?.transitionType || "cut";
  const overlapDur =
    showOutro && transitionType !== "cut" ? TRANSITION_FRAMES : 0;
  const outroStartFrame = BASE_DURATION - overlapDur;

  const safePhotos =
    photos && photos.length > 0
      ? (photos.map((p) => getSafePhotoSrc(p)).filter(Boolean) as string[])
      : [];

  const getPhotoAt = (index: number): string | null => {
    if (safePhotos.length === 0) return null;
    return safePhotos[index % safePhotos.length];
  };

  const introPhoto = getPhotoAt(0);

  // Determine active beat slide for Phase 2 (Frames 180 to 540)
  let activeSlideIndex = 0;
  if (frame >= SPEED_RAMP_INTRO_END_FRAME && frame < PHOTO_CUTOFF_FRAME) {
    for (let i = SPEED_RAMP_SLIDES.length - 1; i >= 0; i--) {
      if (frame >= SPEED_RAMP_SLIDES[i].startFrame) {
        activeSlideIndex = i;
        break;
      }
    }
  }

  const activeSlide = SPEED_RAMP_SLIDES[activeSlideIndex];
  const slideLocalFrame = frame - activeSlide.startFrame;
  const slideDuration = activeSlide.endFrame - activeSlide.startFrame;

  const activePhoto = getPhotoAt(activeSlide.photoIndex);
  const prevPhoto =
    activeSlideIndex === 0
      ? introPhoto
      : getPhotoAt(SPEED_RAMP_SLIDES[activeSlideIndex - 1].photoIndex);

  // Smooth fade-out at 18.00s (Frames 532 to 540)
  const endFadeOut = interpolate(
    frame,
    [PHOTO_CUTOFF_FRAME - 8, PHOTO_CUTOFF_FRAME],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Outro Transition Calculations
  const outroLocalFrame = frame - outroStartFrame;
  const outroTransitionStyle: React.CSSProperties = {
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
    <AbsoluteFill style={{ backgroundColor: "#000000", overflow: "hidden" }}>
      <Sequence from={0} durationInFrames={BASE_DURATION}>
        {!muteAudio && (
          <Audio
            src={staticFile("audio/Speed Ramp edit.mp3")}
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
        )}

        {/* --- PHASE 1: 6.00s TENSION-BUILDING INTRO HOLD ON PHOTO 1 (Frames 0 to 180) --- */}
        {frame < SPEED_RAMP_INTRO_END_FRAME && (
          <SpeedRampIntroFX
            src={introPhoto}
            frame={frame}
            endFrame={SPEED_RAMP_INTRO_END_FRAME}
          />
        )}

        {/* --- PHASE 2: 18 HIGH-VELOCITY SPEED-RAMP CUTS (Frames 180 to 540) --- */}
        {frame >= SPEED_RAMP_INTRO_END_FRAME && frame < PHOTO_CUTOFF_FRAME && (
          <AbsoluteFill style={{ opacity: endFadeOut }}>
            <SpeedRampSlideFX
              fromSrc={prevPhoto}
              toSrc={activePhoto}
              localFrame={slideLocalFrame}
              slotDuration={slideDuration}
              stylePreset={activeSlide.stylePreset}
              slideIndex={activeSlideIndex}
            />

            {/* Golden Sunlight / Film Burn Flash on Each Velocity Cut */}
            <LightFX
              preset={activeSlide.lightPreset}
              localFrame={slideLocalFrame}
              durationInFrames={Math.min(10, slideDuration)}
              intensity={activeSlide.lightIntensity}
            />

            {/* Subtle Continuous Golden-Hour Glow Wash */}
            <AbsoluteFill
              style={{
                background:
                  "radial-gradient(circle at 80% 18%, rgba(254, 240, 138, 0.14) 0%, rgba(245, 158, 11, 0.08) 45%, rgba(0, 0, 0, 0.24) 100%)",
                mixBlendMode: "screen",
                pointerEvents: "none",
              }}
            />
          </AbsoluteFill>
        )}
      </Sequence>

      {/* --- OUTRO SEQUENCE --- */}
      {showOutro && (
        <>
          {!muteAudio && (
            <Sequence from={outroStartFrame} durationInFrames={OUTRO_DURATION}>
              <Audio
                src={staticFile("audio/whoosh-transition.mp3")}
                volume={0.8}
              />
            </Sequence>
          )}

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
