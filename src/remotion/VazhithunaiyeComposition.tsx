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
  LayeredCollageIntroFX,
  TransitionPreset,
  LightFX,
  LightPreset,
} from "./fx";

export type OutroTransitionType = "cut" | "fade" | "slice" | "circle" | "slide";

interface VazhithunaiyeProps {
  photos: string[];
  showOutro?: boolean;
  muteAudio?: boolean;
  outroData?: OutroProps & { transitionType?: OutroTransitionType };
}

export interface VazhithunaiyeSlideSpec {
  startFrame: number;
  endFrame: number;
  photoIndex: number;
  transitionPreset: TransitionPreset;
  lightPreset: LightPreset;
  lightIntensity: number;
}

// Phase 1: 5-Card Overlapping Collage Intro (0.0s to 8.85s = Frames 0 to 266 @ 30 FPS)
export const COLLAGE_CARD_START_FRAMES = [
  0, // Card 1 (Couple on left) - 0.0s
  39, // Card 2 (Couple on right) - 1.3s
  81, // Card 3 (Two men selfie, center left) - 2.7s
  120, // Card 4 (Man in black kurta, center right) - 4.0s
  186, // Card 5 (Man walking in park, bottom) - 6.2s
];
export const COLLAGE_END_FRAME = 266; // 8.85s @ 30 FPS

// Phase 2: 5 Full-Screen Beat Drops (8.85s to 17.3s = Frames 266 to 519 @ 30 FPS)
export const VAZHITHUNAIYE_SLIDES: VazhithunaiyeSlideSpec[] = [
  {
    startFrame: 266, // Full Image 1: 8.85s - 10.9s (61 frames)
    endFrame: 327,
    photoIndex: 0,
    transitionPreset: "optical-dissolve",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.85,
  },
  {
    startFrame: 327, // Full Image 2: 10.9s - 12.8s (57 frames)
    endFrame: 384,
    photoIndex: 1,
    transitionPreset: "double-exposure",
    lightPreset: "film-burn",
    lightIntensity: 0.8,
  },
  {
    startFrame: 384, // Full Image 3: 12.8s - 14.15s (41 frames)
    endFrame: 425,
    photoIndex: 2,
    transitionPreset: "optical-dissolve",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.75,
  },
  {
    startFrame: 425, // Full Image 4: 14.15s - 15.65s (45 frames) - Main Chorus Peak 1
    endFrame: 470,
    photoIndex: 3,
    transitionPreset: "horizontal-blur-snap",
    lightPreset: "film-burn",
    lightIntensity: 0.95,
  },
  {
    startFrame: 470, // Full Image 5: 15.65s - 17.3s (49 frames) - Main Chorus Peak 2
    endFrame: 519,
    photoIndex: 4,
    transitionPreset: "optical-dissolve",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.9,
  },
];

export const BASE_DURATION = 519; // 17.3s @ 30 FPS
export const OUTRO_DURATION = 150; // 5.0s
const TRANSITION_FRAMES = 25;

export const getVazhithunaiyeTotalFrames = (
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

export const VazhithunaiyeComposition: React.FC<VazhithunaiyeProps> = ({
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

  const collagePhotos = [
    getPhotoAt(0),
    getPhotoAt(1),
    getPhotoAt(2),
    getPhotoAt(3),
    getPhotoAt(4),
  ];

  // Determine active full-screen slide (Frames 266 to 519)
  let activeSlideIndex = 0;
  if (frame >= COLLAGE_END_FRAME && frame < BASE_DURATION) {
    for (let i = VAZHITHUNAIYE_SLIDES.length - 1; i >= 0; i--) {
      if (frame >= VAZHITHUNAIYE_SLIDES[i].startFrame) {
        activeSlideIndex = i;
        break;
      }
    }
  }

  const activeSlide = VAZHITHUNAIYE_SLIDES[activeSlideIndex];
  const slideLocalFrame = frame - activeSlide.startFrame;
  const slideDuration = activeSlide.endFrame - activeSlide.startFrame;

  const activePhoto = getPhotoAt(activeSlide.photoIndex);
  const prevPhoto =
    activeSlideIndex === 0
      ? null
      : getPhotoAt(VAZHITHUNAIYE_SLIDES[activeSlideIndex - 1].photoIndex);

  // Smooth slow zoom-in + subtle 3D gyro float on full-screen slides
  const phase = activeSlideIndex * 1.9 + 0.6;
  const floatX = Math.sin(slideLocalFrame * 0.13 + phase) * 9;
  const floatY = Math.cos(slideLocalFrame * 0.11 + phase) * 7;
  const rotZ = Math.sin(slideLocalFrame * 0.09 + phase) * 0.65;
  const slideScale = interpolate(
    slideLocalFrame,
    [0, slideDuration],
    [1.02, 1.07],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Pre-cut warm golden glow 5 frames before the next full-screen cut
  const nextCutFrame = activeSlide.endFrame;
  const preCutGoldGlow =
    activeSlideIndex < VAZHITHUNAIYE_SLIDES.length - 1
      ? interpolate(frame, [nextCutFrame - 6, nextCutFrame], [0, 0.55], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;

  // Smooth fade-out at the end of Slide 5 (Frames 502 to 519)
  const endFadeOut = interpolate(
    frame,
    [BASE_DURATION - 17, BASE_DURATION],
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
            src={staticFile("audio/Vazhithunaiye.mp3")}
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

        {/* --- PHASE 1: SMOOTH 5-CARD OVERLAPPING COLLAGE (Frames 0 to 266 / 0.0s to 8.85s) --- */}
        {frame < COLLAGE_END_FRAME && (
          <LayeredCollageIntroFX
            photos={collagePhotos}
            frame={frame}
            startFrames={COLLAGE_CARD_START_FRAMES}
            endFrame={COLLAGE_END_FRAME}
          />
        )}

        {/* --- PHASE 2: 5 FULL-SCREEN CHORUS BEAT DROPS (Frames 266 to 519 / 8.85s to 17.3s) --- */}
        {frame >= COLLAGE_END_FRAME && (
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
                preset={activeSlide.transitionPreset}
                maskId={`vazhithunaiye-cut-${activeSlideIndex}`}
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

            {/* Continuous Subtle Golden-Hour Glow Wash */}
            <AbsoluteFill
              style={{
                background:
                  "radial-gradient(circle at 82% 18%, rgba(254, 240, 138, 0.16) 0%, rgba(245, 158, 11, 0.09) 45%, rgba(0, 0, 0, 0.22) 100%)",
                mixBlendMode: "screen",
                pointerEvents: "none",
              }}
            />

            {/* Pre-cut warm golden glow 6 frames before the next cut */}
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
