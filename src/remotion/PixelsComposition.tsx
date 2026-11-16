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
  PixelResolutionIntroFX,
  TransitionPreset,
  LightFX,
  LightPreset,
} from "./fx";

export type OutroTransitionType = "cut" | "fade" | "slice" | "circle" | "slide";

interface PixelsProps {
  photos: string[];
  showOutro?: boolean;
  muteAudio?: boolean;
  outroData?: OutroProps & { transitionType?: OutroTransitionType };
}

export interface PixelsSlideSpec {
  startFrame: number;
  endFrame: number;
  photoIndex: number;
  transitionPreset: TransitionPreset;
  lightPreset: LightPreset;
  lightIntensity: number;
}

// Phase 1: 144p -> 240p -> 720p -> 1080p Resolution UI Intro (0.0s to 5.0s = Frames 0 to 150)
export const PIXELS_INTRO_END_FRAME = 150;

// Phase 2: 6 Beat-Synced 1080p HD Cuts (5.0s to 14.9s = Frames 150 to 447 @ 30 FPS)
export const PIXELS_SLIDES: PixelsSlideSpec[] = [
  {
    startFrame: 150, // Photo 1 (1080p HD Reveal): 5.0s - 6.1s (33 frames)
    endFrame: 183,
    photoIndex: 0,
    transitionPreset: "optical-dissolve",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.9,
  },
  {
    startFrame: 183, // Photo 2: 6.1s - 7.33s (37 frames)
    endFrame: 220,
    photoIndex: 1,
    transitionPreset: "horizontal-blur-snap",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.75,
  },
  {
    startFrame: 220, // Photo 3: 7.33s - 8.43s (33 frames)
    endFrame: 253,
    photoIndex: 2,
    transitionPreset: "double-exposure",
    lightPreset: "film-burn",
    lightIntensity: 0.8,
  },
  {
    startFrame: 253, // Photo 4: 8.43s - 9.67s (37 frames)
    endFrame: 290,
    photoIndex: 3,
    transitionPreset: "vertical-blur-snap",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.75,
  },
  {
    startFrame: 290, // Photo 5: 9.67s - 11.33s (50 frames)
    endFrame: 340,
    photoIndex: 4,
    transitionPreset: "optical-dissolve",
    lightPreset: "film-burn",
    lightIntensity: 0.85,
  },
  {
    startFrame: 340, // Photo 6 (Finale): 11.33s - 14.9s (107 frames)
    endFrame: 447,
    photoIndex: 5,
    transitionPreset: "horizontal-blur-snap",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.85,
  },
];

export const BASE_DURATION = 447; // 14.9s @ 30 FPS
export const OUTRO_DURATION = 150; // 5.0s
const TRANSITION_FRAMES = 25;

export const getPixelsTotalFrames = (
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

export const PixelsComposition: React.FC<PixelsProps> = ({
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

  const heroPhoto = getPhotoAt(0);

  // Determine active beat slide for Phase 2 (Frames 150 to 447)
  let activeSlideIndex = 0;
  if (frame >= PIXELS_INTRO_END_FRAME && frame < BASE_DURATION) {
    for (let i = PIXELS_SLIDES.length - 1; i >= 0; i--) {
      if (frame >= PIXELS_SLIDES[i].startFrame) {
        activeSlideIndex = i;
        break;
      }
    }
  }

  const activeSlide = PIXELS_SLIDES[activeSlideIndex];
  const slideLocalFrame = frame - activeSlide.startFrame;
  const slideDuration = activeSlide.endFrame - activeSlide.startFrame;

  const activePhoto = getPhotoAt(activeSlide.photoIndex);
  const prevPhoto =
    activeSlideIndex === 0
      ? null
      : getPhotoAt(PIXELS_SLIDES[activeSlideIndex - 1].photoIndex);

  // Smooth 3D gyro float & slow zoom on the 1080p beat slides
  const phase = activeSlideIndex * 2.05 + 0.5;
  const floatX = Math.sin(slideLocalFrame * 0.13 + phase) * 9;
  const floatY = Math.cos(slideLocalFrame * 0.11 + phase) * 7;
  const rotZ = Math.sin(slideLocalFrame * 0.09 + phase) * 0.65;
  const slideScale = interpolate(
    slideLocalFrame,
    [0, slideDuration],
    [1.02, 1.07],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Pre-cut warm golden build-up 5 frames before the next beat cut
  const nextCutFrame = activeSlide.endFrame;
  const preCutGoldGlow =
    activeSlideIndex < PIXELS_SLIDES.length - 1
      ? interpolate(frame, [nextCutFrame - 5, nextCutFrame], [0, 0.5], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;

  // Smooth fade-out at the end of Slide 6 (Frames 425 to 447)
  const endFadeOut = interpolate(
    frame,
    [BASE_DURATION - 22, BASE_DURATION],
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
            src={staticFile("audio/Pixels.mp3")}
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

        {/* --- PHASE 1: 144p -> 240p -> 720p -> 1080p RESOLUTION UI INTRO (Frames 0 to 150) --- */}
        {frame < PIXELS_INTRO_END_FRAME && (
          <PixelResolutionIntroFX src={heroPhoto} frame={frame} />
        )}

        {/* --- PHASE 2: 6 BEAT-SYNCED 1080p HD CUTS + GOLD GLOW (Frames 150 to 447) --- */}
        {frame >= PIXELS_INTRO_END_FRAME && (
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
                durationInFrames={11}
                preset={activeSlide.transitionPreset}
                maskId={`pixels-cut-${activeSlideIndex}`}
                targetScale={slideScale}
              />
            </AbsoluteFill>

            {/* Golden Sunlight / Film Burn Flash on Each Beat Cut */}
            <LightFX
              preset={activeSlide.lightPreset}
              localFrame={slideLocalFrame}
              durationInFrames={16}
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

            {/* Pre-cut warm golden glow 5 frames before the next cut */}
            {preCutGoldGlow > 0 && (
              <AbsoluteFill
                style={{
                  backgroundColor: "#FBBF24",
                  opacity: preCutGoldGlow,
                  mixBlendMode: "screen",
                  pointerEvents: "none",
                }}
              />
            )}
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
