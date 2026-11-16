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
import { TextFX, SceneTransitionFX, InkShockwaveOverlay, LightFX } from "./fx";

export type OutroTransitionType = "cut" | "fade" | "slice" | "circle" | "slide";

interface AiseKyunProps {
  photos: string[];
  showOutro?: boolean;
  muteAudio?: boolean;
  outroData?: OutroProps & { transitionType?: OutroTransitionType };
}

export const AISE_BEAT_FRAMES: number[] = [
  67, // Cut 1 (00:02.23): White Ink Splash Cutout + Tapered Ribbons -> Photo 1 ("Kaise bataaye ?")
  135, // Cut 2 (00:04.50): Optical Sunlight Flash -> Photo 2 ("Kyun tujhko chahe ?")
  206, // Cut 3 (00:06.86): Warm Cross-Dissolve -> Photo 3 ("Yaara batana paaye")
  284, // Cut 4 (00:09.46): Optical Sunlight Flash -> Photo 4
];

export const BASE_DURATION = 348; // 11.6s @ 30 FPS
export const OUTRO_DURATION = 150; // 5.0s
const TRANSITION_FRAMES = 25;

export const getAiseKyunTotalFrames = (
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

export const AiseKyunComposition: React.FC<AiseKyunProps> = ({
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

  // 4 Photos for the 2x2 Intro Grid
  const gridPhoto1 = getPhotoAt(0);
  const gridPhoto2 = getPhotoAt(1);
  const gridPhoto3 = getPhotoAt(2);
  const gridPhoto4 = getPhotoAt(3);

  // Active full-screen cut index (Frames 67+)
  let cutIndex = 0;
  if (frame >= AISE_BEAT_FRAMES[0] && frame < BASE_DURATION) {
    for (let i = AISE_BEAT_FRAMES.length - 1; i >= 0; i--) {
      if (frame >= AISE_BEAT_FRAMES[i]) {
        cutIndex = i;
        break;
      }
    }
  }

  const startFrame = AISE_BEAT_FRAMES[cutIndex] || AISE_BEAT_FRAMES[0];
  const localFrame = frame - startFrame;

  const activeFullPhoto =
    safePhotos.length > 4 ? getPhotoAt(cutIndex + 4) : getPhotoAt(cutIndex);

  const prevFullPhoto =
    cutIndex > 0
      ? safePhotos.length > 4
        ? getPhotoAt(cutIndex + 3)
        : getPhotoAt(cutIndex - 1)
      : gridPhoto4;

  // Subtle slow zoom on each full-screen photo
  const scale =
    frame >= AISE_BEAT_FRAMES[0]
      ? interpolate(localFrame, [0, 75], [1.05, 1.0], {
          extrapolateRight: "clamp",
        })
      : 1;

  // Warm coral pre-flash 4 frames before Cut 2 and Cut 4 (matches 00:04.375 & 00:09.375)
  const nextCutFrame = AISE_BEAT_FRAMES[cutIndex + 1] || 9999;
  const preCutWarmth = interpolate(
    frame,
    [nextCutFrame - 5, nextCutFrame],
    [0, 0.55],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const endFadeOut = interpolate(
    frame,
    [BASE_DURATION - 22, BASE_DURATION],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Staggered 2x2 Grid Entrance Springs (0s, 0.5s, 1.0s, 1.5s)
  const q1Anim = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120 },
  });
  const q2Anim = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { damping: 14, stiffness: 120 },
  });
  const q3Anim = spring({
    frame: Math.max(0, frame - 30),
    fps,
    config: { damping: 14, stiffness: 120 },
  });
  const q4Anim = spring({
    frame: Math.max(0, frame - 45),
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  // White Ink Splash Cutout + Tapered Ribbons from 00:02.20 (Frame 66) to 00:03.85 (Frame 116)
  const mainSplashProgress = interpolate(frame, [66, 116], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lyricsByCut: Record<number, string> = {
    0: "Kaise bataaye ?",
    1: "Kyun tujhko chahe ?",
    2: "Yaara batana paaye",
    3: "",
  };

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
            src={staticFile("audio/ReelAudio-Aise.mp3")}
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

        {/* --- PHASE 1: 4-QUADRANT INTRO GRID (Frames 0 to 67) --- */}
        {frame < 68 && (
          <AbsoluteFill>
            {/* 1. Top-Left ("Aise") */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "50%",
                height: "50%",
                overflow: "hidden",
                opacity: q1Anim,
                transform: `scale(${interpolate(q1Anim, [0, 1], [1.05, 1])})`,
              }}
            >
              {gridPhoto1 && (
                <img
                  src={gridPhoto1}
                  alt="Aise"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
              <TextFX
                text="Aise"
                preset="quadrant-whisper"
                fontPreset="cormorant-italic"
                localFrame={frame}
                fontSize={64}
                style={{ bottom: "38px", left: "58%" }}
              />
            </div>

            {/* 2. Top-Right ("Kaise") */}
            {frame >= 15 && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  width: "50%",
                  height: "50%",
                  overflow: "hidden",
                  opacity: q2Anim,
                  transform: `scale(${interpolate(q2Anim, [0, 1], [1.05, 1])})`,
                }}
              >
                {gridPhoto2 && (
                  <img
                    src={gridPhoto2}
                    alt="Kaise"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}
                <TextFX
                  text="Kaise"
                  preset="quadrant-whisper"
                  fontPreset="cormorant-italic"
                  localFrame={frame - 15}
                  fontSize={64}
                  style={{ bottom: "38px", left: "44%" }}
                />
              </div>
            )}

            {/* 3. Bottom-Left ("Waise") */}
            {frame >= 30 && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: 0,
                  width: "50%",
                  height: "50%",
                  overflow: "hidden",
                  opacity: q3Anim,
                  transform: `scale(${interpolate(q3Anim, [0, 1], [1.05, 1])})`,
                }}
              >
                {gridPhoto3 && (
                  <img
                    src={gridPhoto3}
                    alt="Waise"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}
                <TextFX
                  text="Waise"
                  preset="quadrant-whisper"
                  fontPreset="cormorant-italic"
                  localFrame={frame - 30}
                  fontSize={64}
                  style={{ top: "34px", left: "58%" }}
                />
              </div>
            )}

            {/* 4. Bottom-Right ("Jaise") */}
            {frame >= 45 && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: "50%",
                  height: "50%",
                  overflow: "hidden",
                  opacity: q4Anim,
                  transform: `scale(${interpolate(q4Anim, [0, 1], [1.05, 1])})`,
                }}
              >
                {gridPhoto4 && (
                  <img
                    src={gridPhoto4}
                    alt="Jaise"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}
                <TextFX
                  text="Jaise"
                  preset="quadrant-whisper"
                  fontPreset="cormorant-italic"
                  localFrame={frame - 45}
                  fontSize={64}
                  style={{ top: "34px", left: "44%" }}
                />
              </div>
            )}
          </AbsoluteFill>
        )}

        {/* --- PHASE 2: INVERTED WHITE INK SPLASH CUTOUT & TAPERED RIBBONS (Frames 66 to 116) --- */}
        <InkShockwaveOverlay progress={mainSplashProgress} />

        {/* --- PHASE 3: FULLSCREEN SLIDES WITH OPTICAL SUNLIGHT FLASH (Frames 67+) --- */}
        {frame >= AISE_BEAT_FRAMES[0] && (
          <AbsoluteFill style={{ opacity: endFadeOut }}>
            <SceneTransitionFX
              fromSrc={prevFullPhoto}
              toSrc={activeFullPhoto}
              localFrame={localFrame}
              durationInFrames={15}
              preset={cutIndex === 0 ? "droplet-reveal" : "optical-dissolve"}
              maskId={`aise-cut-${cutIndex}`}
              targetScale={scale}
            />

            {/* Optical Sunlight Flash on Cuts 2, 3, 4 */}
            {cutIndex > 0 && (
              <LightFX
                preset="golden-sunlight"
                localFrame={localFrame}
                durationInFrames={18}
                intensity={1.0}
              />
            )}

            {/* Pre-cut warm coral build-up 5 frames before the next cut */}
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

            {/* Slender Calligraphic Italic Lyrics (Cormorant Garamond 400 Italic) */}
            {lyricsByCut[cutIndex] && (
              <TextFX
                text={lyricsByCut[cutIndex]}
                preset="lyric-serif-italic"
                fontPreset="cormorant-italic"
                localFrame={localFrame}
                durationInFrames={65}
                fontSize={62}
                bottomOffset={230}
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
