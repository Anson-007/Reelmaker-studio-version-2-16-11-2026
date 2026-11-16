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
import { SceneTransitionFX, SilentModeIntroFX, LightFX } from "./fx";

export type OutroTransitionType = "cut" | "fade" | "slice" | "circle" | "slide";

interface LoveTodayProps {
  photos: string[];
  showOutro?: boolean;
  muteAudio?: boolean;
  outroData?: OutroProps & { transitionType?: OutroTransitionType };
}

export interface LoveTodaySlideSpec {
  startFrame: number;
  endFrame: number;
  photoIndex: number;
}

// Phase 1: 4-Step Silent UI Intro (0.0s to 2.0s = Frames 0 to 60 @ 30 FPS)
export const INTRO_END_FRAME = 60;

// Phase 2: 9 Full-Screen Beat Slides (2.0s to 11.5s = Frames 60 to 345)
export const LOVE_TODAY_SLIDES: LoveTodaySlideSpec[] = [
  { startFrame: 60, endFrame: 90, photoIndex: 0 }, // Image 1: 2.0s - 3.0s
  { startFrame: 90, endFrame: 120, photoIndex: 1 }, // Image 2: 3.0s - 4.0s
  { startFrame: 120, endFrame: 150, photoIndex: 2 }, // Image 3: 4.0s - 5.0s
  { startFrame: 150, endFrame: 180, photoIndex: 3 }, // Image 4: 5.0s - 6.0s
  { startFrame: 180, endFrame: 210, photoIndex: 4 }, // Image 5: 6.0s - 7.0s
  { startFrame: 210, endFrame: 240, photoIndex: 5 }, // Image 6: 7.0s - 8.0s
  { startFrame: 240, endFrame: 270, photoIndex: 6 }, // Image 7: 8.0s - 9.0s
  { startFrame: 270, endFrame: 300, photoIndex: 7 }, // Image 8: 9.0s - 10.0s
  { startFrame: 300, endFrame: 345, photoIndex: 8 }, // Image 9: 10.0s - 11.5s
];

export const BASE_DURATION = 345; // 11.5s @ 30 FPS
export const OUTRO_DURATION = 150; // 5.0s
const TRANSITION_FRAMES = 25;

export const getLoveTodayTotalFrames = (
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

export const LoveTodayComposition: React.FC<LoveTodayProps> = ({
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

  // Find active slide (Frames 60 to 345)
  let activeSlideIndex = 0;
  if (frame >= INTRO_END_FRAME && frame < BASE_DURATION) {
    for (let i = LOVE_TODAY_SLIDES.length - 1; i >= 0; i--) {
      if (frame >= LOVE_TODAY_SLIDES[i].startFrame) {
        activeSlideIndex = i;
        break;
      }
    }
  }

  const activeSlide = LOVE_TODAY_SLIDES[activeSlideIndex];
  const slideLocalFrame = frame - activeSlide.startFrame;
  const slideDuration = activeSlide.endFrame - activeSlide.startFrame;

  const activePhoto = getPhotoAt(activeSlide.photoIndex);
  const prevPhoto =
    activeSlideIndex === 0
      ? null
      : getPhotoAt(LOVE_TODAY_SLIDES[activeSlideIndex - 1].photoIndex);

  // Subtle 3D gyro float & slow zoom per slide
  const phase = activeSlideIndex * 1.85 + 0.4;
  const floatX = Math.sin(slideLocalFrame * 0.14 + phase) * 9;
  const floatY = Math.cos(slideLocalFrame * 0.12 + phase) * 7;
  const rotZ = Math.sin(slideLocalFrame * 0.1 + phase) * 0.65;
  const slideScale = interpolate(
    slideLocalFrame,
    [0, slideDuration],
    [1.07, 1.02],
    { extrapolateRight: "clamp" },
  );

  // Fade to black at the end of Slide 9 (Frames 330 to 345)
  const endFadeOut = interpolate(
    frame,
    [BASE_DURATION - 15, BASE_DURATION],
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
            src={staticFile("audio/Love today.mp3")}
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

        {/* --- PHASE 1: 4-STEP MOBILE UI INTRO (0.0s to 2.0s / Frames 0 to 60) --- */}
        {frame < INTRO_END_FRAME && <SilentModeIntroFX frame={frame} />}

        {/* --- PHASE 2: 9 FULL-SCREEN SLIDES WITH DOUBLE-EXPOSURE & GOLD GLOW (Frames 60 to 345) --- */}
        {frame >= INTRO_END_FRAME && (
          <AbsoluteFill style={{ opacity: endFadeOut }}>
            <AbsoluteFill
              style={{
                transform: `translate3d(${floatX.toFixed(
                  2,
                )}px, ${floatY.toFixed(2)}px, 0px) rotateZ(${rotZ.toFixed(
                  2,
                )}deg)`,
              }}
            >
              <SceneTransitionFX
                fromSrc={prevPhoto}
                toSrc={activePhoto}
                localFrame={slideLocalFrame}
                durationInFrames={12}
                preset={
                  activeSlideIndex === 0
                    ? "optical-dissolve"
                    : "double-exposure"
                }
                maskId={`love-today-cut-${activeSlideIndex}`}
                targetScale={slideScale}
              />
            </AbsoluteFill>

            {/* Subtle Golden Sunlight Glow on every cut */}
            <LightFX
              preset="golden-sunlight"
              localFrame={slideLocalFrame}
              durationInFrames={16}
              intensity={activeSlideIndex === 4 ? 0.95 : 0.55}
            />

            {/* Soft Ambient Warm Gold Halation Wash */}
            <AbsoluteFill
              style={{
                background:
                  "radial-gradient(circle at 80% 18%, rgba(253, 224, 71, 0.14) 0%, rgba(245, 158, 11, 0.08) 45%, rgba(0, 0, 0, 0.25) 100%)",
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
