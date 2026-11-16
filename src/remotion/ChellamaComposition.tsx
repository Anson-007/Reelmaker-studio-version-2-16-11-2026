import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  Sequence,
} from "remotion";
import { Audio } from "@remotion/media";
import { OutroCard, OutroProps } from "./OutroCard";
import {
  SceneTransitionFX,
  TransitionPreset,
  LightFX,
  LightPreset,
} from "./fx";
import { RadialTunnelIntroFX } from "./fx/TransitionFX";

export type OutroTransitionType = "cut" | "fade" | "slice" | "circle" | "slide";

interface ChellamaProps {
  photos: string[];
  showOutro?: boolean;
  muteAudio?: boolean;
  outroData?: OutroProps & { transitionType?: OutroTransitionType };
}

export interface ChellamaSlideSpec {
  startFrame: number;
  endFrame: number;
  photoIndex: number;
  transitionPreset: TransitionPreset;
  lightPreset: LightPreset;
  lightIntensity: number;
}

// Phase 1: Black & White Radial Zoom-Tunnel Intro on Photo 1 (0.0s to 2.0s = Frames 0 to 60)
export const CHELLAMA_INTRO_END_FRAME = 60;

// Phase 2: 4 Beat-Synced Full-Color Photo Drops (2.0s, 5.0s, 8.0s, 11.0s)
export const CHELLAMA_SLIDES: ChellamaSlideSpec[] = [
  {
    startFrame: 60, // Photo 2: 2.0s - 5.0s (90 frames)
    endFrame: 150,
    photoIndex: 1,
    transitionPreset: "wave-whip",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.9,
  },
  {
    startFrame: 150, // Photo 3: 5.0s - 8.0s (90 frames)
    endFrame: 240,
    photoIndex: 2,
    transitionPreset: "optical-dissolve",
    lightPreset: "film-burn",
    lightIntensity: 0.85,
  },
  {
    startFrame: 240, // Photo 4: 8.0s - 11.0s (90 frames)
    endFrame: 330,
    photoIndex: 3,
    transitionPreset: "wave-whip",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.9,
  },
  {
    startFrame: 330, // Photo 5: 11.0s - 14.73s (112 frames)
    endFrame: 442,
    photoIndex: 4,
    transitionPreset: "optical-dissolve",
    lightPreset: "film-burn",
    lightIntensity: 0.9,
  },
];

export const VIGNETTE_CLOSE_START = 405; // 13.5s
export const BASE_DURATION = 442; // 14.73s @ 30 FPS
export const OUTRO_DURATION = 150; // 5.0s
const TRANSITION_FRAMES = 25;

export const getChellamaTotalFrames = (
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

export const ChellamaComposition: React.FC<ChellamaProps> = ({
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

  // Determine active beat slide for Phase 2 (Frames 60 to 442)
  let activeSlideIndex = 0;
  if (frame >= CHELLAMA_INTRO_END_FRAME && frame < BASE_DURATION) {
    for (let i = CHELLAMA_SLIDES.length - 1; i >= 0; i--) {
      if (frame >= CHELLAMA_SLIDES[i].startFrame) {
        activeSlideIndex = i;
        break;
      }
    }
  }

  const activeSlide = CHELLAMA_SLIDES[activeSlideIndex];
  const slideLocalFrame = frame - activeSlide.startFrame;
  const slideDuration = activeSlide.endFrame - activeSlide.startFrame;

  const activePhoto = getPhotoAt(activeSlide.photoIndex);
  const prevPhoto =
    activeSlideIndex === 0
      ? introPhoto
      : getPhotoAt(CHELLAMA_SLIDES[activeSlideIndex - 1].photoIndex);

  // Smooth 3D Gyro Float + Slow Zoom on each 3-second photo slot
  const phase = activeSlideIndex * 1.9 + 0.6;
  const floatX = Math.sin(slideLocalFrame * 0.1 + phase) * 8;
  const floatY = Math.cos(slideLocalFrame * 0.08 + phase) * 6;
  const rotZ = Math.sin(slideLocalFrame * 0.07 + phase) * 0.55;
  const slideScale = interpolate(
    slideLocalFrame,
    [0, slideDuration],
    [1.09, 1.01],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Circular Radial Vignette Iris Close at 13.5s (Frames 405 to 428)
  const isClosingVignette = frame >= VIGNETTE_CLOSE_START;
  const vignetteRadiusPct = isClosingVignette
    ? interpolate(frame, [VIGNETTE_CLOSE_START, 428], [115, 0], {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 115;

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
            src={staticFile("audio/Chellama.mp3")}
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

        {/* --- PHASE 1: PHOTO 1 IN BLACK & WHITE + 0.5s RADIAL ZOOM-TUNNEL INTRO (Frames 0 to 60) --- */}
        {frame < CHELLAMA_INTRO_END_FRAME && (
          <RadialTunnelIntroFX
            src={introPhoto}
            frame={frame}
            grayscale={true}
          />
        )}

        {/* --- PHASE 2: PHOTOS 2-5 IN FULL COLOR + GOLD GLOW (Frames 60 to 442) --- */}
        {frame >= CHELLAMA_INTRO_END_FRAME && (
          <AbsoluteFill>
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
                preset={activeSlide.transitionPreset}
                maskId={`chellama-cut-${activeSlideIndex}`}
                targetScale={slideScale}
              />
            </AbsoluteFill>

            {/* Golden Sunlight / Film Burn Flash on Each Cut */}
            <LightFX
              preset={activeSlide.lightPreset}
              localFrame={slideLocalFrame}
              durationInFrames={18}
              intensity={activeSlide.lightIntensity}
            />

            {/* Continuous Subtle Golden-Hour Glow Wash (On Colorful Slides 2-5) */}
            <AbsoluteFill
              style={{
                background:
                  "radial-gradient(circle at 82% 18%, rgba(254, 240, 138, 0.16) 0%, rgba(245, 158, 11, 0.09) 45%, rgba(0, 0, 0, 0.24) 100%)",
                mixBlendMode: "screen",
                pointerEvents: "none",
                zIndex: 35,
              }}
            />
          </AbsoluteFill>
        )}

        {/* Circular Radial Vignette Iris Close (13.5s - 14.73s / Frames 405 to 442) */}
        {isClosingVignette && (
          <AbsoluteFill
            style={{
              background: `radial-gradient(circle at 50% 50%, transparent ${Math.max(
                0,
                vignetteRadiusPct - 18,
              ).toFixed(1)}%, #000000 ${vignetteRadiusPct.toFixed(1)}%)`,
              pointerEvents: "none",
              zIndex: 40,
            }}
          />
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
