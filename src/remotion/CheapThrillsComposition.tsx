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
  TransitionPreset,
  LightFX,
  LightPreset,
} from "./fx";
import { FilmStripBurnTransitionFX } from "./fx/TransitionFX";

export type OutroTransitionType = "cut" | "fade" | "slice" | "circle" | "slide";

interface CheapThrillsProps {
  photos: string[];
  showOutro?: boolean;
  muteAudio?: boolean;
  outroData?: OutroProps & { transitionType?: OutroTransitionType };
}

export interface CheapThrillsSlideSpec {
  startFrame: number;
  endFrame: number;
  photoIndex: number;
  transitionPreset: TransitionPreset;
  lightPreset: LightPreset;
  lightIntensity: number;
}

// Phase 1: Photo 1 Slow Emergence from Black (0.00s to 1.80s = Frames 0 to 54)
export const CHEAP_THRILLS_INTRO_END_FRAME = 54;

// Phase 2: Cycle 1 (Photos 2..8) -> 6.5s Film-Strip Split Burn -> Cycle 2 (Photos 2..8 Repeat)
export const CHEAP_THRILLS_SLIDES: CheapThrillsSlideSpec[] = [
  // --- CYCLE 1 (Photos 2 to 8: 1.80s - 6.60s / Frames 54 to 198) ---
  {
    startFrame: 54,
    endFrame: 75,
    photoIndex: 1,
    transitionPreset: "optical-dissolve",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.75,
  },
  {
    startFrame: 75,
    endFrame: 96,
    photoIndex: 2,
    transitionPreset: "horizontal-blur-snap",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.65,
  },
  {
    startFrame: 96,
    endFrame: 117,
    photoIndex: 3,
    transitionPreset: "optical-dissolve",
    lightPreset: "film-burn",
    lightIntensity: 0.7,
  },
  {
    startFrame: 117,
    endFrame: 137,
    photoIndex: 4,
    transitionPreset: "vertical-blur-snap",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.65,
  },
  {
    startFrame: 137,
    endFrame: 158,
    photoIndex: 5,
    transitionPreset: "horizontal-blur-snap",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.65,
  },
  {
    startFrame: 158,
    endFrame: 177,
    photoIndex: 6,
    transitionPreset: "optical-dissolve",
    lightPreset: "film-burn",
    lightIntensity: 0.7,
  },
  {
    startFrame: 177,
    endFrame: 198,
    photoIndex: 7,
    transitionPreset: "horizontal-blur-snap",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.65,
  },

  // --- CYCLE 2 (Photos 2 to 8 Repeat after 6.5s Film-Strip Burn: 6.60s - 11.47s / Frames 198 to 344) ---
  {
    startFrame: 198,
    endFrame: 219,
    photoIndex: 1,
    transitionPreset: "optical-dissolve",
    lightPreset: "film-burn",
    lightIntensity: 0.85,
  },
  {
    startFrame: 219,
    endFrame: 240,
    photoIndex: 2,
    transitionPreset: "horizontal-blur-snap",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.65,
  },
  {
    startFrame: 240,
    endFrame: 260,
    photoIndex: 3,
    transitionPreset: "vertical-blur-snap",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.65,
  },
  {
    startFrame: 260,
    endFrame: 281,
    photoIndex: 4,
    transitionPreset: "optical-dissolve",
    lightPreset: "film-burn",
    lightIntensity: 0.75,
  },
  {
    startFrame: 281,
    endFrame: 302,
    photoIndex: 5,
    transitionPreset: "horizontal-blur-snap",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.65,
  },
  {
    startFrame: 302,
    endFrame: 321,
    photoIndex: 6,
    transitionPreset: "vertical-blur-snap",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.65,
  },
  {
    startFrame: 321,
    endFrame: 344,
    photoIndex: 7,
    transitionPreset: "optical-dissolve",
    lightPreset: "film-burn",
    lightIntensity: 0.75,
  },
];

export const PHOTO_CUTOFF_FRAME = 344; // 11.47s (Cuts to black for final 0.7s like reference video)
export const BASE_DURATION = 365; // 12.17s @ 30 FPS
export const OUTRO_DURATION = 150; // 5.0s
const TRANSITION_FRAMES = 25;

export const getCheapThrillsTotalFrames = (
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

export const CheapThrillsComposition: React.FC<CheapThrillsProps> = ({
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

  // Intro (Frames 0 to 54): Emerges smoothly from pitch black over the first 33 frames (1.1s)
  const introOpacity = interpolate(frame, [0, 33], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const introScale = interpolate(frame, [0, 54], [1.0, 1.06], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Determine active beat slide for Phase 2 (Frames 54 to 344)
  let activeSlideIndex = 0;
  if (frame >= CHEAP_THRILLS_INTRO_END_FRAME && frame < PHOTO_CUTOFF_FRAME) {
    for (let i = CHEAP_THRILLS_SLIDES.length - 1; i >= 0; i--) {
      if (frame >= CHEAP_THRILLS_SLIDES[i].startFrame) {
        activeSlideIndex = i;
        break;
      }
    }
  }

  const activeSlide = CHEAP_THRILLS_SLIDES[activeSlideIndex];
  const slideLocalFrame = frame - activeSlide.startFrame;
  const slideDuration = activeSlide.endFrame - activeSlide.startFrame;

  const activePhoto = getPhotoAt(activeSlide.photoIndex);
  const prevPhoto =
    activeSlideIndex === 0
      ? introPhoto
      : getPhotoAt(CHEAP_THRILLS_SLIDES[activeSlideIndex - 1].photoIndex);

  // Subtle Ken Burns zoom settle on each 0.7s beat cut
  const slideScale = interpolate(
    slideLocalFrame,
    [0, slideDuration],
    [1.06, 1.01],
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
            src={staticFile("audio/Cheap Thrills.mp3")}
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

        {/* --- PHASE 1: PHOTO 1 SLOW EMERGENCE FROM PITCH BLACK (Frames 0 to 54) --- */}
        {frame < CHEAP_THRILLS_INTRO_END_FRAME && (
          <AbsoluteFill
            style={{
              opacity: introOpacity,
              transform: `scale(${introScale.toFixed(4)})`,
            }}
          >
            {introPhoto && (
              <img
                src={introPhoto}
                alt="Intro Slot 1"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
          </AbsoluteFill>
        )}

        {/* --- PHASE 2: CYCLE 1 & CYCLE 2 BEAT CUTS (Frames 54 to 344) --- */}
        {frame >= CHEAP_THRILLS_INTRO_END_FRAME &&
          frame < PHOTO_CUTOFF_FRAME && (
            <AbsoluteFill>
              <SceneTransitionFX
                fromSrc={prevPhoto}
                toSrc={activePhoto}
                localFrame={slideLocalFrame}
                durationInFrames={7}
                preset={activeSlide.transitionPreset}
                maskId={`cheap-thrills-cut-${activeSlideIndex}`}
                targetScale={slideScale}
              />

              {/* Golden Sunlight / Film Burn Flash on Each Beat Cut */}
              <LightFX
                preset={activeSlide.lightPreset}
                localFrame={slideLocalFrame}
                durationInFrames={11}
                intensity={activeSlide.lightIntensity}
              />

              {/* Continuous Warm Golden-Hour Halation Wash */}
              <AbsoluteFill
                style={{
                  background:
                    "radial-gradient(circle at 80% 18%, rgba(254, 240, 138, 0.16) 0%, rgba(245, 158, 11, 0.09) 45%, rgba(0, 0, 0, 0.25) 100%)",
                  mixBlendMode: "screen",
                  pointerEvents: "none",
                }}
              />
            </AbsoluteFill>
          )}

        {/* --- SIGNATURE 6.5s CHORUS DROP: 35mm FILM-STRIP SPLIT ROLL & BURN (Frames 193 to 205) --- */}
        <FilmStripBurnTransitionFX
          fromSrc={getPhotoAt(7)}
          toSrc={getPhotoAt(1)}
          frame={frame}
          startFrame={193}
          durationInFrames={12}
        />
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
