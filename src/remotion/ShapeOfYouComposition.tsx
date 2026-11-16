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
import {
  SceneTransitionFX,
  ThumbBeatIntroFX,
  LightFX,
  LightPreset,
} from "./fx";

export type OutroTransitionType = "cut" | "fade" | "slice" | "circle" | "slide";

interface ShapeOfYouProps {
  photos: string[];
  showOutro?: boolean;
  muteAudio?: boolean;
  outroData?: OutroProps & { transitionType?: OutroTransitionType };
}

export interface ShapeOfYouSlideSpec {
  startFrame: number;
  endFrame: number;
  photoIndex: number;
  direction: "right-top" | "left-bottom";
  lightPreset: LightPreset;
  lightIntensity: number;
}

// Phase 1: "MOVE YOUR THUMB to the beat" Intro (Frames 0 to 122 / 00:00:00 to 00:04:02)
export const THUMB_INTRO_END_FRAME = 122;

// Exact Beat Frame Markers from 00:04:02 (Frame 122) to 00:15:00 (Frame 450)
export const SHAPE_BEAT_FRAMES = [
  122, // 00:04:02 — Manual marker (First photo drop)
  135, // 00:04:15 — Quantized grid starts
  150, // 00:05:00
  165, // 00:05:15
  180, // 00:06:00
  195, // 00:06:15
  210, // 00:07:00
  225, // 00:07:15
  240, // 00:08:00
  255, // 00:08:15
  270, // 00:09:00
  285, // 00:09:15
  300, // 00:10:00
  315, // 00:10:15
  330, // 00:11:00
  345, // 00:11:15
  360, // 00:12:00
  375, // 00:12:15
  390, // 00:13:00
  405, // 00:13:15
  420, // 00:14:00
  435, // 00:14:15
];

export const PHOTO_END_FRAME = 450; // 00:15:00
export const BASE_DURATION = 459; // 15.3s @ 30 FPS (fades to black at 450..459)
export const OUTRO_DURATION = 150; // 5.0s
const TRANSITION_FRAMES = 25;

// Build the 22 beat-locked slides alternating Right-Top and Left-Bottom
export const SHAPE_OF_YOU_SLIDES: ShapeOfYouSlideSpec[] = SHAPE_BEAT_FRAMES.map(
  (startFrame, idx) => {
    const endFrame =
      idx < SHAPE_BEAT_FRAMES.length - 1
        ? SHAPE_BEAT_FRAMES[idx + 1]
        : BASE_DURATION;
    return {
      startFrame,
      endFrame,
      photoIndex: idx,
      direction: idx % 2 === 0 ? "right-top" : "left-bottom",
      lightPreset: idx % 4 === 2 ? "film-burn" : "golden-sunlight",
      lightIntensity: idx === 0 ? 0.9 : 0.65,
    };
  },
);

export const getShapeOfYouTotalFrames = (
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

export const ShapeOfYouComposition: React.FC<ShapeOfYouProps> = ({
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

  // Determine active beat slide for Phase 2 (Frames 122 to 459)
  let activeSlideIndex = 0;
  if (frame >= THUMB_INTRO_END_FRAME && frame < BASE_DURATION) {
    for (let i = SHAPE_OF_YOU_SLIDES.length - 1; i >= 0; i--) {
      if (frame >= SHAPE_OF_YOU_SLIDES[i].startFrame) {
        activeSlideIndex = i;
        break;
      }
    }
  }

  const activeSlide = SHAPE_OF_YOU_SLIDES[activeSlideIndex];
  const slideLocalFrame = frame - activeSlide.startFrame;
  const slideDuration = activeSlide.endFrame - activeSlide.startFrame;

  const activePhoto = getPhotoAt(activeSlide.photoIndex);
  const prevPhoto =
    activeSlideIndex === 0
      ? null
      : getPhotoAt(SHAPE_OF_YOU_SLIDES[activeSlideIndex - 1].photoIndex);

  // Fade to black at Frame 450 (00:15:00) matching the reference video
  const endFadeOut = interpolate(
    frame,
    [PHOTO_END_FRAME - 4, PHOTO_END_FRAME + 3],
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
            src={staticFile("audio/Shape Of You.mp3")}
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

        {/* --- PHASE 1: "MOVE YOUR THUMB TO THE BEAT" VECTOR INTRO (Frames 0 to 122) --- */}
        {frame < THUMB_INTRO_END_FRAME && <ThumbBeatIntroFX frame={frame} />}

        {/* --- PHASE 2: 22 DIAGONAL THUMB-SYNCED PHOTO CUTS (Frames 122 to 459) --- */}
        {frame >= THUMB_INTRO_END_FRAME && (
          <AbsoluteFill style={{ opacity: endFadeOut }}>
            <SceneTransitionFX
              fromSrc={prevPhoto}
              toSrc={activePhoto}
              localFrame={slideLocalFrame}
              durationInFrames={slideDuration}
              preset="thumb-diagonal"
              diagonalDirection={activeSlide.direction}
              maskId={`shape-cut-${activeSlideIndex}`}
              targetScale={1.15}
            />

            {/* Golden Sunlight / Film Burn Flash on Each Beat Cut */}
            <LightFX
              preset={activeSlide.lightPreset}
              localFrame={slideLocalFrame}
              durationInFrames={10}
              intensity={activeSlide.lightIntensity}
            />

            {/* Subtle Continuous Golden-Hour Glow Wash */}
            <AbsoluteFill
              style={{
                background:
                  "radial-gradient(circle at 82% 18%, rgba(254, 240, 138, 0.16) 0%, rgba(245, 158, 11, 0.09) 45%, rgba(0, 0, 0, 0.22) 100%)",
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
