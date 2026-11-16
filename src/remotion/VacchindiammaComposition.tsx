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
import { SceneTransitionFX, LightFX, LightPreset } from "./fx";

export type OutroTransitionType = "cut" | "fade" | "slice" | "circle" | "slide";

interface VacchindiammaProps {
  photos: string[];
  showOutro?: boolean;
  muteAudio?: boolean;
  outroData?: OutroProps & { transitionType?: OutroTransitionType };
}

export interface FullSlideSpec {
  startFrame: number;
  endFrame: number;
  photoIndex: number;
  lightPreset: LightPreset;
}

// Phase 1: 2x2 Collage Grid (0.0s to 8.8s = Frames 0 to 264 @ 30 FPS)
export const COLLAGE_START_FRAMES = [
  0, // Image 1 (Top-Left) starts at 0.0s
  30, // Image 2 (Top-Right) starts at 1.0s
  60, // Image 3 (Bottom-Left) starts at 2.0s
  90, // Image 4 (Bottom-Right) starts at 3.0s
];
export const COLLAGE_END_FRAME = 264; // 8.8s @ 30 FPS

// Phase 2: 4 Full-Screen Beat Slides (8.8s to 16.9s = Frames 264 to 507)
export const FULL_SLIDES: FullSlideSpec[] = [
  {
    startFrame: 264, // 8.8s - 9.9s (1.1s) - Image 5 (Red/Gold Saree)
    endFrame: 297,
    photoIndex: 4,
    lightPreset: "film-burn",
  },
  {
    startFrame: 297, // 9.9s - 11.0s (1.1s) - Image 6 (Pink/Red Saree)
    endFrame: 330,
    photoIndex: 5,
    lightPreset: "golden-sunlight",
  },
  {
    startFrame: 330, // 11.0s - 12.3s (1.3s) - Image 7 (Close up / Bangles)
    endFrame: 369,
    photoIndex: 6,
    lightPreset: "film-burn",
  },
  {
    startFrame: 369, // 12.3s - 16.9s (4.6s) - Image 8 (Couple Finale)
    endFrame: 507,
    photoIndex: 7,
    lightPreset: "golden-sunlight",
  },
];

export const BASE_DURATION = 507; // 16.9s @ 30 FPS
export const OUTRO_DURATION = 150; // 5.0s
const TRANSITION_FRAMES = 25;

export const getVacchindiammaTotalFrames = (
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

export const VacchindiammaComposition: React.FC<VacchindiammaProps> = ({
  photos,
  showOutro = false,
  muteAudio = false,
  outroData,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

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

  // 4 Collage Photos (Indices 0, 1, 2, 3)
  const collagePhoto1 = getPhotoAt(0); // Top-Left (0.0s)
  const collagePhoto2 = getPhotoAt(1); // Top-Right (1.0s)
  const collagePhoto3 = getPhotoAt(2); // Bottom-Left (2.0s)
  const collagePhoto4 = getPhotoAt(3); // Bottom-Right (3.0s)

  // Staggered Entrance Springs for the 4 Quadrants
  const q1Spring = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 110 },
  });
  const q2Spring = spring({
    frame: Math.max(0, frame - COLLAGE_START_FRAMES[1]),
    fps,
    config: { damping: 15, stiffness: 110 },
  });
  const q3Spring = spring({
    frame: Math.max(0, frame - COLLAGE_START_FRAMES[2]),
    fps,
    config: { damping: 15, stiffness: 110 },
  });
  const q4Spring = spring({
    frame: Math.max(0, frame - COLLAGE_START_FRAMES[3]),
    fps,
    config: { damping: 15, stiffness: 110 },
  });

  // Subtle slow drift inside each collage cell while holding until 8.8s
  const q1Drift = interpolate(frame, [0, COLLAGE_END_FRAME], [1.06, 1.0], {
    extrapolateRight: "clamp",
  });
  const q2Drift = interpolate(frame, [30, COLLAGE_END_FRAME], [1.06, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const q3Drift = interpolate(frame, [60, COLLAGE_END_FRAME], [1.06, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const q4Drift = interpolate(frame, [90, COLLAGE_END_FRAME], [1.06, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Center Flower (public/flower.png) entrance + gentle breathing float
  const flowerSpring = spring({
    frame,
    fps,
    config: { damping: 13, stiffness: 120, mass: 0.8 },
  });
  const flowerBreath = 1 + Math.sin(frame * 0.08) * 0.025;
  const flowerRotate = Math.sin(frame * 0.05) * 3.5;

  // Warm golden pre-flash right before the 8.8s beat drop (Frames 255 to 264)
  const preDropFlash = interpolate(
    frame,
    [COLLAGE_END_FRAME - 9, COLLAGE_END_FRAME],
    [0, 0.85],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Determine active full-screen slide (Frames 264 to 507)
  let activeSlideIndex = 0;
  if (frame >= COLLAGE_END_FRAME && frame < BASE_DURATION) {
    for (let i = FULL_SLIDES.length - 1; i >= 0; i--) {
      if (frame >= FULL_SLIDES[i].startFrame) {
        activeSlideIndex = i;
        break;
      }
    }
  }

  const activeSlide = FULL_SLIDES[activeSlideIndex];
  const slideLocalFrame = frame - activeSlide.startFrame;
  const slideDuration = activeSlide.endFrame - activeSlide.startFrame;

  const activePhoto = getPhotoAt(activeSlide.photoIndex);
  const prevPhoto =
    activeSlideIndex === 0
      ? collagePhoto4
      : getPhotoAt(FULL_SLIDES[activeSlideIndex - 1].photoIndex);

  // Subtle slow zoom + 3D gyro float on the full-screen slides
  const phase = activeSlideIndex * 2.1 + 0.5;
  const floatX = Math.sin(slideLocalFrame * 0.12 + phase) * 10;
  const floatY = Math.cos(slideLocalFrame * 0.1 + phase) * 8;
  const rotZ = Math.sin(slideLocalFrame * 0.09 + phase) * 0.7;
  const slideScale = interpolate(
    slideLocalFrame,
    [0, slideDuration],
    [1.08, 1.03],
    { extrapolateRight: "clamp" },
  );

  // Pre-cut warm amber build-up 5 frames before the next full-screen cut
  const nextCutFrame = activeSlide.endFrame;
  const preCutWarmth =
    activeSlideIndex < FULL_SLIDES.length - 1
      ? interpolate(frame, [nextCutFrame - 5, nextCutFrame], [0, 0.6], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;

  // Smooth fade to black at the end of Slide 8 (Frames 490 to 507)
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
    <AbsoluteFill style={{ backgroundColor: "#050505", overflow: "hidden" }}>
      <Sequence from={0} durationInFrames={BASE_DURATION}>
        {!muteAudio && (
          <Audio
            src={staticFile("audio/vacchindiamma.mp3")}
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

        {/* --- PHASE 1: 2x2 STAGGERED COLLAGE + CENTER FLOWER (Frames 0 to 264 / 0.0s to 8.8s) --- */}
        {frame < COLLAGE_END_FRAME && (
          <AbsoluteFill style={{ backgroundColor: "#000000" }}>
            {/* 1. Top-Left Quadrant (Starts at 0.0s / Frame 0) */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "50%",
                height: "50%",
                overflow: "hidden",
                opacity: q1Spring,
              }}
            >
              {collagePhoto1 && (
                <img
                  src={collagePhoto1}
                  alt="Collage 1"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: `scale(${q1Drift})`,
                  }}
                />
              )}
            </div>

            {/* 2. Top-Right Quadrant (Starts at 1.0s / Frame 30) */}
            {frame >= COLLAGE_START_FRAMES[1] && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  width: "50%",
                  height: "50%",
                  overflow: "hidden",
                  opacity: q2Spring,
                }}
              >
                {collagePhoto2 && (
                  <img
                    src={collagePhoto2}
                    alt="Collage 2"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transform: `scale(${q2Drift})`,
                    }}
                  />
                )}
              </div>
            )}

            {/* 3. Bottom-Left Quadrant (Starts at 2.0s / Frame 60) */}
            {frame >= COLLAGE_START_FRAMES[2] && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: 0,
                  width: "50%",
                  height: "50%",
                  overflow: "hidden",
                  opacity: q3Spring,
                }}
              >
                {collagePhoto3 && (
                  <img
                    src={collagePhoto3}
                    alt="Collage 3"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transform: `scale(${q3Drift})`,
                    }}
                  />
                )}
              </div>
            )}

            {/* 4. Bottom-Right Quadrant (Starts at 3.0s / Frame 90) */}
            {frame >= COLLAGE_START_FRAMES[3] && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: "50%",
                  height: "50%",
                  overflow: "hidden",
                  opacity: q4Spring,
                }}
              >
                {collagePhoto4 && (
                  <img
                    src={collagePhoto4}
                    alt="Collage 4"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transform: `scale(${q4Drift})`,
                    }}
                  />
                )}
              </div>
            )}

            {/* CENTER FLOWER OVERLAY (public/flower.png) */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "250px",
                height: "250px",
                transform: `translate(-50%, -50%) scale(${
                  flowerSpring * flowerBreath
                }) rotate(${flowerRotate.toFixed(2)}deg)`,
                zIndex: 25,
                pointerEvents: "none",
                filter: "drop-shadow(0px 10px 28px rgba(0, 0, 0, 0.65))",
              }}
            >
              <img
                src={staticFile("flower.png")}
                alt="Center Flower"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            </div>

            {/* Warm Golden Pre-Flash right before 8.8s drop */}
            {preDropFlash > 0 && (
              <AbsoluteFill
                style={{
                  background:
                    "radial-gradient(circle at 50% 50%, rgba(255, 251, 235, 0.95) 0%, rgba(251, 146, 60, 0.8) 45%, rgba(225, 29, 72, 0.5) 100%)",
                  opacity: preDropFlash,
                  mixBlendMode: "screen",
                  zIndex: 30,
                  pointerEvents: "none",
                }}
              />
            )}
          </AbsoluteFill>
        )}

        {/* --- PHASE 2: 4 FULL-SCREEN SLIDES (Frames 264 to 507 / 8.8s to 16.9s) --- */}
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
                durationInFrames={14}
                preset="optical-dissolve"
                maskId={`vacchindiamma-cut-${activeSlideIndex}`}
                targetScale={slideScale}
              />
            </AbsoluteFill>

            {/* Warm Film Burn & Golden Sunlight Flash on each full-screen cut */}
            <LightFX
              preset={activeSlide.lightPreset}
              localFrame={slideLocalFrame}
              durationInFrames={20}
              intensity={1.05}
            />

            {/* Pre-cut warm amber glow 5 frames before the next cut */}
            {preCutWarmth > 0 && (
              <AbsoluteFill
                style={{
                  backgroundColor: "#FB923C",
                  opacity: preCutWarmth,
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
