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
  GridColorRevealIntroFX,
  LightFX,
  LightPreset,
} from "./fx";

export type OutroTransitionType = "cut" | "fade" | "slice" | "circle" | "slide";

interface DanceMonkeyProps {
  photos: string[];
  showOutro?: boolean;
  muteAudio?: boolean;
  outroData?: OutroProps & { transitionType?: OutroTransitionType };
}

export interface DanceMonkeySlideSpec {
  startFrame: number;
  endFrame: number;
  photoIndex: number;
  direction: "right-top" | "left-bottom";
  lightPreset: LightPreset;
  lightIntensity: number;
}

// Phase 1 & 2:
// - 0.0s to 2.7s (Frames 0..81): 3x3 B&W Grid builds every 9 frames (0.3s)
// - 2.7s to 5.4s (Frames 81..162): 3x3 Color Sweep every 9 frames (0.3s)
export const GRID_INTRO_END_FRAME = 162; // 5.40s @ 30 FPS
export const BEAT_STEP_FRAMES = 9; // Exact 0.30s beat interval (9 frames @ 30 FPS)
export const BASE_DURATION = 385; // 12.83s @ 30 FPS
export const OUTRO_DURATION = 150; // 5.0s
const TRANSITION_FRAMES = 25;

// Phase 3: 24 Rapid Full-Screen Cuts locked to the exact same 9-frame (0.30s) beat
// (162, 171, 180, 189, 198, 207, 216, 225, 234, 243, 252, 261, 270, 279, 288, 297, 306, 315, 324, 333, 342, 351, 360, 369)
export const DANCE_MONKEY_BEAT_FRAMES = Array.from(
  { length: 24 },
  (_, i) => GRID_INTRO_END_FRAME + i * BEAT_STEP_FRAMES,
);

export const DANCE_MONKEY_SLIDES: DanceMonkeySlideSpec[] =
  DANCE_MONKEY_BEAT_FRAMES.map((startFrame, idx) => {
    const endFrame =
      idx < DANCE_MONKEY_BEAT_FRAMES.length - 1
        ? DANCE_MONKEY_BEAT_FRAMES[idx + 1]
        : BASE_DURATION;

    return {
      startFrame,
      endFrame,
      photoIndex: idx % 9, // Cycles through the 9 uploaded grid photos
      direction: idx % 2 === 0 ? "right-top" : "left-bottom",
      lightPreset: idx % 4 === 2 ? "film-burn" : "golden-sunlight",
      lightIntensity: idx === 0 ? 0.9 : 0.65,
    };
  });

export const getDanceMonkeyTotalFrames = (
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

export const DanceMonkeyComposition: React.FC<DanceMonkeyProps> = ({
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

  const gridPhotos = Array.from({ length: 9 }, (_, i) => getPhotoAt(i));

  // Determine active full-screen beat slide (Frames 162 to 385)
  let activeSlideIndex = 0;
  if (frame >= GRID_INTRO_END_FRAME && frame < BASE_DURATION) {
    for (let i = DANCE_MONKEY_SLIDES.length - 1; i >= 0; i--) {
      if (frame >= DANCE_MONKEY_SLIDES[i].startFrame) {
        activeSlideIndex = i;
        break;
      }
    }
  }

  const activeSlide = DANCE_MONKEY_SLIDES[activeSlideIndex];
  const slideLocalFrame = frame - activeSlide.startFrame;
  const slideDuration = activeSlide.endFrame - activeSlide.startFrame;

  const activePhoto = getPhotoAt(activeSlide.photoIndex);
  const prevPhoto =
    activeSlideIndex === 0
      ? null
      : getPhotoAt(DANCE_MONKEY_SLIDES[activeSlideIndex - 1].photoIndex);

  // Smooth fade-out at the end of the final beat (Frames 375 to 385)
  const endFadeOut = interpolate(
    frame,
    [BASE_DURATION - 10, BASE_DURATION],
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
            src={staticFile("audio/Dance Monkey.mp3")}
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

        {/* --- PHASE 1 & 2: 3x3 B&W GRID BUILD + ROW-BY-ROW COLOR REVEAL (Frames 0 to 162) --- */}
        {frame < GRID_INTRO_END_FRAME && (
          <GridColorRevealIntroFX
            photos={gridPhotos}
            frame={frame}
            endFrame={GRID_INTRO_END_FRAME}
          />
        )}

        {/* --- PHASE 3: 0.3s (9-FRAME) DIAGONAL RIGHT-TOP / LEFT-BOTTOM BEAT CUTS (Frames 162 to 385) --- */}
        {frame >= GRID_INTRO_END_FRAME && (
          <AbsoluteFill style={{ opacity: endFadeOut }}>
            <SceneTransitionFX
              fromSrc={prevPhoto}
              toSrc={activePhoto}
              localFrame={slideLocalFrame}
              durationInFrames={slideDuration}
              preset="thumb-diagonal"
              diagonalDirection={activeSlide.direction}
              maskId={`dance-monkey-cut-${activeSlideIndex}`}
              targetScale={1.15}
            />

            {/* Golden Sunlight / Film Burn Flash on Each 0.3s Beat Cut */}
            <LightFX
              preset={activeSlide.lightPreset}
              localFrame={slideLocalFrame}
              durationInFrames={9}
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
