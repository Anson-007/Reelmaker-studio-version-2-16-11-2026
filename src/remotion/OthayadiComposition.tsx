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
  StaggeredSliceBuildFX,
  InkShockwaveOverlay,
  LightFX,
} from "./fx";

export type OutroTransitionType = "cut" | "fade" | "slice" | "circle" | "slide";

interface OthayadiProps {
  photos: string[];
  showOutro?: boolean;
  muteAudio?: boolean;
  outroData?: OutroProps & { transitionType?: OutroTransitionType };
}

// Clips 1-5: 5 horizontal slices of Photo 1 (Red) entering at 0.0s, 0.63s, 1.33s, 2.0s, 2.63s
export const OTHAYADI_SLICE_START_FRAMES: number[] = [0, 19, 40, 60, 79];

// Clips 6 & 7: Feathered Brush & Ink Transition from Photo 1 (Red) -> Photo 2 (Yellow)
export const YELLOW_TRANSITION_START_FRAME = 144; // 4.8s
export const BEAT_LOOP_START_FRAME = 180; // 6.0s
export const BEAT_SLOT_FRAMES = 20; // 0.667s (~0.7s) per color cut

// Color-to-Photo Index Mapping:
// 0 = Red (Photo 1)
// 1 = Yellow (Photo 2)
// 2 = Green (Photo 3)
// 3 = Orange (Photo 4)
// 4 = Blue (Photo 5)

// Clips 8 to 30 (23 cuts x 20 frames = 460 frames, from Frame 180 to Frame 640):
export const OTHAYADI_COLOR_SEQUENCE: number[] = [
  // Cycle 1 (Clips 8 - 13)
  2, // 8. Green
  3, // 9. Orange
  4, // 10. Blue
  2, // 11. Green
  1, // 12. Yellow
  0, // 13. Red
  // Cycle 2 (Clips 14 - 19)
  2, // 14. Green
  3, // 15. Orange
  4, // 16. Blue
  2, // 17. Green
  1, // 18. Yellow
  0, // 19. Red
  // Cycle 3 (Clips 20 - 25)
  2, // 20. Green
  3, // 21. Orange
  4, // 22. Blue
  2, // 23. Green
  1, // 24. Yellow
  0, // 25. Red
  // Cycle 4 (Clips 26 - 30)
  2, // 26. Green
  3, // 27. Orange
  4, // 28. Blue
  2, // 29. Green
  1, // 30. Yellow
];

export const BASE_DURATION = 647; // 21.56s @ 30 FPS
export const OUTRO_DURATION = 150; // 5.0s
const TRANSITION_FRAMES = 25;

export const getOthayadiTotalFrames = (
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

export const OthayadiComposition: React.FC<OthayadiProps> = ({
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

  const getPhotoByColorIndex = (colorIdx: number): string | null => {
    if (safePhotos.length === 0) return null;
    return safePhotos[colorIdx % safePhotos.length];
  };

  const redPhoto = getPhotoByColorIndex(0); // Red (1st image)
  const yellowPhoto = getPhotoByColorIndex(1); // Yellow (2nd image)

  // Local frame for the Photo 1 (Red) -> Photo 2 (Yellow) Brush & Ink transition (Frames 144 to 180)
  const yellowLocalFrame = frame - YELLOW_TRANSITION_START_FRAME;
  const yellowScale = interpolate(yellowLocalFrame, [0, 36], [1.06, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const yellowSplashProgress = interpolate(
    frame,
    [YELLOW_TRANSITION_START_FRAME, BEAT_LOOP_START_FRAME],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Determine active beat cut for Clips 8-30 (Frames 180 to 640)
  const beatElapsed = Math.max(0, frame - BEAT_LOOP_START_FRAME);
  const beatIndex = Math.min(
    OTHAYADI_COLOR_SEQUENCE.length - 1,
    Math.floor(beatElapsed / BEAT_SLOT_FRAMES),
  );
  const beatLocalFrame = beatElapsed - beatIndex * BEAT_SLOT_FRAMES;

  const activeColorPhotoIndex = OTHAYADI_COLOR_SEQUENCE[beatIndex];
  const prevColorPhotoIndex =
    beatIndex === 0 ? 1 : OTHAYADI_COLOR_SEQUENCE[beatIndex - 1];

  const activeBeatPhoto = getPhotoByColorIndex(activeColorPhotoIndex);
  const prevBeatPhoto = getPhotoByColorIndex(prevColorPhotoIndex);

  // Fade to black at the very end (Frames 636 to 647)
  const endFadeOut = interpolate(
    frame,
    [BASE_DURATION - 11, BASE_DURATION],
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
            src={staticFile("audio/othayadi.mp3")}
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

        {/* --- CLIPS 1 TO 5: 5 HORIZONTAL SLICES OF RED PHOTO (Frames 0 to 144) --- */}
        {frame < YELLOW_TRANSITION_START_FRAME && (
          <StaggeredSliceBuildFX
            src={redPhoto}
            frame={frame}
            sliceStartFrames={OTHAYADI_SLICE_START_FRAMES}
          />
        )}

        {/* --- CLIPS 6 & 7: FEATHERED BRUSH & INK TRANSITION INTO YELLOW PHOTO (Frames 144 to 180) --- */}
        {frame >= YELLOW_TRANSITION_START_FRAME &&
          frame < BEAT_LOOP_START_FRAME && (
            <AbsoluteFill>
              <SceneTransitionFX
                fromSrc={redPhoto}
                toSrc={yellowPhoto}
                localFrame={yellowLocalFrame}
                durationInFrames={18}
                preset="brush-sweep"
                maskId="othayadi-yellow-brush"
                targetScale={yellowScale}
              />

              <InkShockwaveOverlay progress={yellowSplashProgress} />

              <LightFX
                preset="golden-sunlight"
                localFrame={yellowLocalFrame}
                durationInFrames={20}
                intensity={0.9}
              />
            </AbsoluteFill>
          )}

        {/* --- CLIPS 8 TO 30: 23 RHYTHMIC WAVE-WHIP CUTS (Frames 180 to 647) --- */}
        {frame >= BEAT_LOOP_START_FRAME && (
          <AbsoluteFill style={{ opacity: endFadeOut }}>
            <SceneTransitionFX
              fromSrc={prevBeatPhoto}
              toSrc={activeBeatPhoto}
              localFrame={beatLocalFrame}
              durationInFrames={8}
              preset="wave-whip"
              maskId={`othayadi-beat-${beatIndex}`}
              targetScale={1}
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
