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
import {
  UnderdogGlitchTextFX,
  DiagonalBeamWipeFX,
  CenterBoxFlashRevealFX,
} from "./fx/TransitionFX";

export type OutroTransitionType = "cut" | "fade" | "slice" | "circle" | "slide";

interface BelieveYourselfProps {
  photos: string[];
  showOutro?: boolean;
  muteAudio?: boolean;
  outroData?: OutroProps & { transitionType?: OutroTransitionType };
}

export interface BelieveSegmentSpec {
  startFrame: number;
  endFrame: number;
  kind: "text" | "teaser-photo" | "drop-photo" | "diagonal-beam" | "center-box";
  photoIndex?: number;
  prevPhotoIndex?: number;
  transitionPreset?: TransitionPreset;
  lightPreset?: LightPreset;
  lightIntensity?: number;
}

// Complete 30 FPS Timeline for "Believe yourself" (19.77s = 593 Frames)
// Configured for 12 Unique Photo Slots (0..11), where 16.75s (Frame 503) reuses Photo 9 (photoIndex: 8)
export const BELIEVE_SEGMENTS: BelieveSegmentSpec[] = [
  // --- PHASE 1: INTERLEAVED CRT GLITCH TEXT & 4 TEASER PHOTOS (0.00s - 10.83s / Frames 0 to 325) ---
  { startFrame: 0, endFrame: 20, kind: "text" },
  {
    startFrame: 20,
    endFrame: 39,
    kind: "teaser-photo",
    photoIndex: 0,
    lightPreset: "golden-sunlight",
    lightIntensity: 0.55,
  },
  { startFrame: 39, endFrame: 99, kind: "text" },
  {
    startFrame: 99,
    endFrame: 123,
    kind: "teaser-photo",
    photoIndex: 1,
    lightPreset: "film-burn",
    lightIntensity: 0.65,
  },
  { startFrame: 123, endFrame: 144, kind: "text" },
  {
    startFrame: 144,
    endFrame: 164,
    kind: "teaser-photo",
    photoIndex: 2,
    lightPreset: "golden-sunlight",
    lightIntensity: 0.55,
  },
  { startFrame: 164, endFrame: 188, kind: "text" },
  {
    startFrame: 188,
    endFrame: 209,
    kind: "teaser-photo",
    photoIndex: 3,
    lightPreset: "golden-sunlight",
    lightIntensity: 0.6,
  },
  { startFrame: 209, endFrame: 325, kind: "text" },

  // --- PHASE 2: BEAT DROP & CINEMATIC PHOTO MONTAGE (10.83s - 19.77s / Frames 325 to 593) ---
  // Slot 5 (10.83s - 11.75s): Main Beat Drop with Cream Flash Wipe
  {
    startFrame: 325,
    endFrame: 353,
    kind: "drop-photo",
    photoIndex: 4,
    prevPhotoIndex: 3,
    transitionPreset: "whip-pan",
    lightPreset: "film-burn",
    lightIntensity: 0.9,
  },
  // Slot 6 (11.75s - 12.25s): Diagonal White Light-Beam Wipe from Photo 5 to Photo 6
  {
    startFrame: 353,
    endFrame: 368,
    kind: "diagonal-beam",
    photoIndex: 5,
    prevPhotoIndex: 4,
    lightPreset: "golden-sunlight",
    lightIntensity: 0.8,
  },
  // Slot 7 (12.25s - 13.10s): Beat Cut
  {
    startFrame: 368,
    endFrame: 393,
    kind: "drop-photo",
    photoIndex: 6,
    prevPhotoIndex: 5,
    transitionPreset: "optical-dissolve",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.65,
  },
  // Slot 8 (13.10s - 13.60s): Beat Cut
  {
    startFrame: 393,
    endFrame: 408,
    kind: "drop-photo",
    photoIndex: 7,
    prevPhotoIndex: 6,
    transitionPreset: "horizontal-blur-snap",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.65,
  },
  // Slot 9 (13.60s - 14.45s): Beat Cut (Photo 9 - Motorcycle / Hero Shot)
  {
    startFrame: 408,
    endFrame: 434,
    kind: "drop-photo",
    photoIndex: 8,
    prevPhotoIndex: 7,
    transitionPreset: "optical-dissolve",
    lightPreset: "film-burn",
    lightIntensity: 0.7,
  },
  // Slot 10 (14.45s - 15.30s): Beat Cut (Photo 10 - Backdrop for Center Box)
  {
    startFrame: 434,
    endFrame: 459,
    kind: "drop-photo",
    photoIndex: 9,
    prevPhotoIndex: 8,
    transitionPreset: "vertical-blur-snap",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.65,
  },
  // Slot 11 (15.30s - 16.75s): Center-Expanding Rectangular Box over Photo 10 -> Cream Flash into Full-Screen Photo 11
  {
    startFrame: 459,
    endFrame: 503,
    kind: "center-box",
    photoIndex: 10,
    prevPhotoIndex: 9,
    lightPreset: "film-burn",
    lightIntensity: 0.85,
  },
  // Callback Slot (16.75s - 17.25s): Automatically Reuses Photo 9 (photoIndex: 8) like the reference video
  {
    startFrame: 503,
    endFrame: 518,
    kind: "drop-photo",
    photoIndex: 8,
    prevPhotoIndex: 10,
    transitionPreset: "horizontal-blur-snap",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.7,
  },
  // Slot 12 (17.25s - 19.77s): Finale Photo 12 (photoIndex: 11) + Slow Fade to Black
  {
    startFrame: 518,
    endFrame: 593,
    kind: "drop-photo",
    photoIndex: 11,
    prevPhotoIndex: 8,
    transitionPreset: "optical-dissolve",
    lightPreset: "golden-sunlight",
    lightIntensity: 0.8,
  },
];

export const BASE_DURATION = 593; // 19.77s @ 30 FPS
export const OUTRO_DURATION = 150; // 5.0s
const TRANSITION_FRAMES = 25;

export const getBelieveYourselfTotalFrames = (
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

export const BelieveYourselfComposition: React.FC<BelieveYourselfProps> = ({
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

  // Find active timeline segment
  let activeSegIndex = 0;
  for (let i = BELIEVE_SEGMENTS.length - 1; i >= 0; i--) {
    if (frame >= BELIEVE_SEGMENTS[i].startFrame) {
      activeSegIndex = i;
      break;
    }
  }

  const activeSeg = BELIEVE_SEGMENTS[activeSegIndex];
  const localFrame = frame - activeSeg.startFrame;
  const segDuration = activeSeg.endFrame - activeSeg.startFrame;

  const activePhoto =
    activeSeg.photoIndex !== undefined
      ? getPhotoAt(activeSeg.photoIndex)
      : null;
  const prevPhoto =
    activeSeg.prevPhotoIndex !== undefined
      ? getPhotoAt(activeSeg.prevPhotoIndex)
      : null;

  // Slow fade to pitch black at the end of Photo 12 (Frames 558 to 590 / 18.6s to 19.7s)
  const endFadeOut = interpolate(
    frame,
    [BASE_DURATION - 35, BASE_DURATION - 4],
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
            src={staticFile("audio/Believe yourself.mp3")}
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

        <AbsoluteFill style={{ opacity: endFadeOut }}>
          {/* 1. CRT RGB-SPLIT KINETIC TEXT SEGMENTS */}
          {activeSeg.kind === "text" && <UnderdogGlitchTextFX frame={frame} />}

          {/* 2. INTRO TEASER PHOTOS (Photos 1..4 interleaved between text beats) */}
          {activeSeg.kind === "teaser-photo" && (
            <AbsoluteFill>
              {(() => {
                const zoom = interpolate(
                  localFrame,
                  [0, segDuration],
                  [1.0, 1.07],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                );
                const fadeIn = interpolate(localFrame, [0, 4], [0, 1], {
                  extrapolateRight: "clamp",
                });
                return (
                  <AbsoluteFill
                    style={{
                      opacity: fadeIn,
                      transform: `scale(${zoom.toFixed(4)})`,
                      filter: "contrast(1.06) saturate(1.08)",
                    }}
                  >
                    {activePhoto && (
                      <img
                        src={activePhoto}
                        alt="Teaser"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    )}
                  </AbsoluteFill>
                );
              })()}

              {activeSeg.lightPreset && (
                <LightFX
                  preset={activeSeg.lightPreset}
                  localFrame={localFrame}
                  durationInFrames={10}
                  intensity={activeSeg.lightIntensity || 0.6}
                />
              )}
            </AbsoluteFill>
          )}

          {/* 3. POST-DROP STANDARD PHOTO CUTS */}
          {activeSeg.kind === "drop-photo" && (
            <AbsoluteFill>
              {(() => {
                const scale = interpolate(
                  localFrame,
                  [0, segDuration],
                  [1.07, 1.01],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                );
                return (
                  <SceneTransitionFX
                    fromSrc={prevPhoto}
                    toSrc={activePhoto}
                    localFrame={localFrame}
                    durationInFrames={7}
                    preset={activeSeg.transitionPreset || "optical-dissolve"}
                    maskId={`believe-cut-${activeSegIndex}`}
                    targetScale={scale}
                  />
                );
              })()}

              {activeSeg.lightPreset && (
                <LightFX
                  preset={activeSeg.lightPreset}
                  localFrame={localFrame}
                  durationInFrames={12}
                  intensity={activeSeg.lightIntensity || 0.7}
                />
              )}
            </AbsoluteFill>
          )}

          {/* 4. DIAGONAL WHITE LIGHT-BEAM WIPE (Slot 6 at 11.75s) */}
          {activeSeg.kind === "diagonal-beam" && (
            <DiagonalBeamWipeFX
              fromSrc={prevPhoto}
              toSrc={activePhoto}
              localFrame={localFrame}
              durationInFrames={10}
              targetScale={interpolate(
                localFrame,
                [0, segDuration],
                [1.06, 1.01],
                { extrapolateRight: "clamp" },
              )}
            />
          )}

          {/* 5. CENTER-EXPANDING BOX + CREAM FLASH REVEAL (Slot 11 at 15.30s) */}
          {activeSeg.kind === "center-box" && (
            <CenterBoxFlashRevealFX
              backdropSrc={prevPhoto}
              revealSrc={activePhoto}
              localFrame={localFrame}
            />
          )}

          {/* Subtle Golden-Hour Ambient Glow on All Photo Segments */}
          {activeSeg.kind !== "text" && (
            <AbsoluteFill
              style={{
                background:
                  "radial-gradient(circle at 80% 18%, rgba(254, 240, 138, 0.14) 0%, rgba(245, 158, 11, 0.08) 45%, rgba(0, 0, 0, 0.25) 100%)",
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
