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
import { TextFX, DipToBlackSlideFX } from "./fx";

export type OutroTransitionType = "cut" | "fade" | "slice" | "circle" | "slide";

interface HindiIshqProps {
  photos: string[];
  showOutro?: boolean;
  muteAudio?: boolean;
  outroData?: OutroProps & { transitionType?: OutroTransitionType };
}

export interface LanguageSlideSpec {
  startFrame: number;
  endFrame: number;
  text: string;
  highlightWord: string;
}

// Exact 30 FPS timeline from Hindi-ishq-hai.mp4 (Fade-In + Hold + Fade-Out per vocal line)
export const INTRO_END_FRAME = 78; // 0.0s - 2.6s: “ Describe Her In Many Languages “

export const HINDI_ISHQ_SLIDES: LanguageSlideSpec[] = [
  {
    startFrame: 78, // 2.6s - 3.9s
    endFrame: 117,
    text: "Hindi *Ishq* Hain",
    highlightWord: "Ishq",
  },
  {
    startFrame: 117, // 3.9s - 5.1s
    endFrame: 153,
    text: "Tamilu *kadal* Le",
    highlightWord: "kadal",
  },
  {
    startFrame: 153, // 5.1s - 7.7s
    endFrame: 231,
    text: "Telugu *premava* Helu",
    highlightWord: "premava",
  },
  {
    startFrame: 231, // 7.7s - 9.1s
    endFrame: 273,
    text: "English *love* you Na",
    highlightWord: "love",
  },
  {
    startFrame: 273, // 9.1s - 10.3s
    endFrame: 309,
    text: "Kerala *premama*",
    highlightWord: "premama",
  },
  {
    startFrame: 309, // 10.3s - 12.6s
    endFrame: 378,
    text: "Kannada *preethiya* Helu",
    highlightWord: "preethiya",
  },
];

export const BASE_DURATION = 378; // 12.6s @ 30 FPS
export const OUTRO_DURATION = 150; // 5.0s
const TRANSITION_FRAMES = 25;

export const getHindiIshqTotalFrames = (
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

export const HindiIshqComposition: React.FC<HindiIshqProps> = ({
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

  // Find active language slide (Frames 78 to 378)
  let activeSlideIndex = -1;
  if (frame >= INTRO_END_FRAME && frame < BASE_DURATION) {
    for (let i = 0; i < HINDI_ISHQ_SLIDES.length; i++) {
      if (
        frame >= HINDI_ISHQ_SLIDES[i].startFrame &&
        frame < HINDI_ISHQ_SLIDES[i].endFrame
      ) {
        activeSlideIndex = i;
        break;
      }
    }
  }

  const activeSlide =
    activeSlideIndex >= 0 ? HINDI_ISHQ_SLIDES[activeSlideIndex] : null;
  const slideLocalFrame = activeSlide ? frame - activeSlide.startFrame : 0;
  const slideDuration = activeSlide
    ? activeSlide.endFrame - activeSlide.startFrame
    : 30;

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
            src={staticFile("audio/ReelAudio-HindiIshq.mp3")}
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

        {/* --- PHASE 1: INTRO TITLE LOCKUP (Frames 0 to 78) --- */}
        {frame < INTRO_END_FRAME && (
          <TextFX
            text="Describe Her In Many Languages"
            preset="script-hero-intro"
            highlightWord="Her"
            highlightColor="#D99B26"
            localFrame={frame}
            durationInFrames={INTRO_END_FRAME}
            fontSize={44}
          />
        )}

        {/* --- PHASE 2: 6 LANGUAGE SLIDES WITH GYRO FLOAT & LETTERBOX (Frames 78 to 378) --- */}
        {activeSlide && (
          <DipToBlackSlideFX
            src={getPhotoAt(activeSlideIndex)}
            localFrame={slideLocalFrame}
            slotDuration={slideDuration}
            fadeInFrames={11}
            fadeOutFrames={11}
            letterbox={true}
            letterboxInsetPercent={12}
            motion="gyro-float"
            seed={activeSlideIndex}
          >
            <TextFX
              text={activeSlide.text}
              preset="dual-tone-quote"
              highlightWord={activeSlide.highlightWord}
              highlightColor="#E5A93C"
              localFrame={slideLocalFrame}
              durationInFrames={slideDuration}
              fontSize={44}
              topOffset={285}
            />
          </DipToBlackSlideFX>
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
