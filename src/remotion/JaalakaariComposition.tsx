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

export type OutroTransitionType = "cut" | "fade" | "slice" | "circle" | "slide";

interface JaalakaariProps {
  photos: string[];
  showOutro?: boolean;
  muteAudio?: boolean;
  outroData?: OutroProps & { transitionType?: OutroTransitionType };
}

export interface JaalakaariSlideSpec {
  startFrame: number;
  endFrame: number;
  photoIndex: number;
  transitionPreset: TransitionPreset;
  lightPreset: LightPreset;
  lightIntensity: number;
}

// Exact 30 FPS timeline for Jaalakaari (19.76s = 593 frames)
export const JAALAKAARI_SLIDES: JaalakaariSlideSpec[] = [
  {
    startFrame: 0, // Image 1: 0.0s - 4.0s (120 frames)
    endFrame: 120,
    photoIndex: 0,
    transitionPreset: "optical-dissolve",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.55,
  },
  {
    startFrame: 120, // Image 2: 4.0s - 6.0s (60 frames)
    endFrame: 180,
    photoIndex: 1,
    transitionPreset: "optical-dissolve",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.7,
  },
  {
    startFrame: 180, // Image 3: 6.0s - 9.0s (90 frames) - Horizontal Motion Blur Snap
    endFrame: 270,
    photoIndex: 2,
    transitionPreset: "horizontal-blur-snap",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.65,
  },
  {
    startFrame: 270, // Image 4: 9.0s - 12.0s (90 frames) - Warm Gold Overexposure Bloom
    endFrame: 360,
    photoIndex: 3,
    transitionPreset: "optical-dissolve",
    lightPreset: "film-burn",
    lightIntensity: 0.85,
  },
  {
    startFrame: 360, // Image 5: 12.0s - 15.0s (90 frames) - Golden Sunlight Flash
    endFrame: 450,
    photoIndex: 4,
    transitionPreset: "optical-dissolve",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.85,
  },
  {
    startFrame: 450, // Image 6: 15.0s - 19.76s (143 frames) - Vertical Motion Blur Whip
    endFrame: 593,
    photoIndex: 5,
    transitionPreset: "vertical-blur-snap",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.7,
  },
];

export const BASE_DURATION = 593; // 19.76s @ 30 FPS
export const OUTRO_DURATION = 150; // 5.0s
const TRANSITION_FRAMES = 25;

export const getJaalakaariTotalFrames = (
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

export const JaalakaariComposition: React.FC<JaalakaariProps> = ({
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

  // Determine active slide (Frames 0 to 593)
  let activeSlideIndex = 0;
  for (let i = JAALAKAARI_SLIDES.length - 1; i >= 0; i--) {
    if (frame >= JAALAKAARI_SLIDES[i].startFrame) {
      activeSlideIndex = i;
      break;
    }
  }

  const activeSlide = JAALAKAARI_SLIDES[activeSlideIndex];
  const slideLocalFrame = frame - activeSlide.startFrame;
  const slideDuration = activeSlide.endFrame - activeSlide.startFrame;

  const activePhoto = getPhotoAt(activeSlide.photoIndex);
  const prevPhoto =
    activeSlideIndex === 0
      ? null
      : getPhotoAt(JAALAKAARI_SLIDES[activeSlideIndex - 1].photoIndex);

  // Minimal slow zoom-in on each image (1.00 -> 1.05)
  const slowZoomIn = interpolate(
    slideLocalFrame,
    [0, slideDuration],
    [1.0, 1.05],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Subtle warm gold build-up 5 frames before Cuts 3 & 4 (at 9.0s and 12.0s)
  const nextCutFrame = activeSlide.endFrame;
  const preCutGoldGlow =
    activeSlideIndex === 2 || activeSlideIndex === 3
      ? interpolate(frame, [nextCutFrame - 6, nextCutFrame], [0, 0.5], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;

  // Smooth opening fade-in (Frames 0 to 10) and closing fade-out (Frames 568 to 593)
  const openingFadeIn = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const endFadeOut = interpolate(
    frame,
    [BASE_DURATION - 25, BASE_DURATION],
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
            src={staticFile("audio/jaalakaari.mp3")}
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

        <AbsoluteFill style={{ opacity: openingFadeIn * endFadeOut }}>
          <SceneTransitionFX
            fromSrc={prevPhoto}
            toSrc={activePhoto}
            localFrame={slideLocalFrame}
            durationInFrames={12}
            preset={activeSlide.transitionPreset}
            maskId={`jaalakaari-cut-${activeSlideIndex}`}
            targetScale={slowZoomIn}
          />

          {/* Golden Glow Flash on Each Cut */}
          <LightFX
            preset={activeSlide.lightPreset}
            localFrame={slideLocalFrame}
            durationInFrames={18}
            intensity={activeSlide.lightIntensity}
          />

          {/* Subtle Continuous Golden-Hour Glow Wash */}
          <AbsoluteFill
            style={{
              background:
                "radial-gradient(circle at 82% 16%, rgba(254, 240, 138, 0.16) 0%, rgba(245, 158, 11, 0.09) 45%, rgba(0, 0, 0, 0.22) 100%)",
              mixBlendMode: "screen",
              pointerEvents: "none",
            }}
          />

          {/* Pre-cut warm golden glow 6 frames before the 9.0s & 12.0s cuts */}
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
