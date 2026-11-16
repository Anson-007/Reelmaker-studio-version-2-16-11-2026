import React from "react";
import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useCurrentFrame,
  Sequence,
} from "remotion";
import { Audio, Video } from "@remotion/media";
import { OutroCard, OutroProps } from "./OutroCard";
import { LightFX, LightPreset } from "./fx";
import { VintageFilmOverlayFX } from "./fx/TransitionFX";

export type OutroTransitionType = "cut" | "fade" | "slice" | "circle" | "slide";

interface NeetiMullaiProps {
  photos: string[]; // Accepts 4 Video URLs or Photo URLs
  showOutro?: boolean;
  muteAudio?: boolean;
  outroData?: OutroProps & { transitionType?: OutroTransitionType };
}

export interface NeetiMullaiSlotSpec {
  startFrame: number;
  endFrame: number;
  mediaIndex: number;
  zoomFrom: number;
  zoomTo: number;
  lightPreset: LightPreset;
  lightIntensity: number;
}

// Exact 30 FPS timeline for trimmed Neeti Mullai (00:00:10:05 = 305 frames)
export const NEETI_MULLAI_SLOTS: NeetiMullaiSlotSpec[] = [
  {
    startFrame: 0,   // Clip 1: 0.0s - 2.0s (60 frames)
    endFrame: 60,
    mediaIndex: 0,
    zoomFrom: 1.0,
    zoomTo: 1.07,
    lightPreset: "golden-sunlight",
    lightIntensity: 0.65,
  },
  {
    startFrame: 60,  // Clip 2: 2.0s - 5.0s (90 frames)
    endFrame: 150,
    mediaIndex: 1,
    zoomFrom: 1.07,
    zoomTo: 1.01,
    lightPreset: "film-burn",
    lightIntensity: 0.9,
  },
  {
    startFrame: 150, // Clip 3: 5.0s - 7.0s (60 frames)
    endFrame: 210,
    mediaIndex: 2,
    zoomFrom: 1.0,
    zoomTo: 1.07,
    lightPreset: "golden-sunlight",
    lightIntensity: 0.85,
  },
  {
    startFrame: 210, // Clip 4: 7.0s - 10.17s (95 frames)
    endFrame: 305,
    mediaIndex: 3,
    zoomFrom: 1.06,
    zoomTo: 1.0,
    lightPreset: "golden-sunlight",
    lightIntensity: 0.9,
  },
];

export const BASE_DURATION = 305;  // 00:00:10:05 @ 30 FPS
export const OUTRO_DURATION = 150; // 5.0s
const TRANSITION_FRAMES = 25;

export const getNeetiMullaiTotalFrames = (
  showOutro: boolean = false,
  transition: string = "cut",
) => {
  const overlap = showOutro && transition !== "cut" ? TRANSITION_FRAMES : 0;
  return showOutro ? BASE_DURATION + OUTRO_DURATION - overlap : BASE_DURATION;
};

export const isVideoMediaUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  return (
    url.startsWith("data:video/") ||
    url.includes("#video") ||
    /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url)
  );
};

const getSafeMediaSrc = (src: string | null | undefined): string | null => {
  if (!src) return null;
  const cleanUrl = src.replace(/#(video|image)$/, "");
  if (
    cleanUrl.startsWith("http") ||
    cleanUrl.startsWith("data:") ||
    cleanUrl.startsWith("blob:")
  ) {
    return cleanUrl;
  }
  return staticFile(cleanUrl.startsWith("/") ? cleanUrl.substring(1) : cleanUrl);
};

const NeetiClipSlide: React.FC<{
  rawUrl: string | null;
  slot: NeetiMullaiSlotSpec;
  slotIndex: number;
}> = ({ rawUrl, slot, slotIndex }) => {
  const localFrame = useCurrentFrame();
  const slotDuration = slot.endFrame - slot.startFrame;
  const isVideo = isVideoMediaUrl(rawUrl);
  const safeSrc = getSafeMediaSrc(rawUrl);

  // Smooth Ken Burns Zoom + Subtle Floating Drift
  const scale = interpolate(
    localFrame,
    [0, slotDuration],
    [slot.zoomFrom, slot.zoomTo],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const floatX = Math.sin(localFrame * 0.08 + slotIndex * 1.5) * 6;
  const floatY = Math.cos(localFrame * 0.07 + slotIndex * 1.5) * 5;

  // Soft entrance cross-fade (10 frames) and exposure bloom on every cut
  const enterOpacity =
    slotIndex === 0
      ? interpolate(localFrame, [0, 8], [0, 1], { extrapolateRight: "clamp" })
      : interpolate(localFrame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  const exposureBrightness = interpolate(
    localFrame,
    [0, 3, 14],
    [1.45, 1.25, 1.02],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        opacity: enterOpacity,
        transform: `translate3d(${floatX.toFixed(1)}px, ${floatY.toFixed(
          1,
        )}px, 0px) scale(${scale.toFixed(4)})`,
        filter: `brightness(${exposureBrightness.toFixed(
          2,
        )}) contrast(1.04) saturate(1.08)`,
      }}
    >
      {safeSrc &&
        (isVideo ? (
          <Video
            src={safeSrc}
            muted
            playbackRate={0.85}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <img
            src={safeSrc}
            alt={`Clip ${slotIndex + 1}`}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ))}

      {/* Golden Sunlight / Film Burn Flash on Each Cut */}
      <LightFX
        preset={slot.lightPreset}
        localFrame={localFrame}
        durationInFrames={16}
        intensity={slot.lightIntensity}
      />
    </AbsoluteFill>
  );
};

export const NeetiMullaiComposition: React.FC<NeetiMullaiProps> = ({
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

  const getRawMediaAt = (index: number): string | null => {
    if (!photos || photos.length === 0) return null;
    return photos[index % photos.length];
  };

  // Smooth fade-out at the end of Clip 4 (Frames 290 to 305)
  const endFadeOut = interpolate(
    frame,
    [BASE_DURATION - 15, BASE_DURATION],
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
            src={staticFile("audio/Neeti Mullai.mp3")}
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
          {/* 4 Overlapping Video/Photo Sequences (with 10-frame cross-dissolve overlap) */}
          {NEETI_MULLAI_SLOTS.map((slot, idx) => {
            const overlapTail =
              idx < NEETI_MULLAI_SLOTS.length - 1 ? 10 : 0;
            const seqDuration =
              slot.endFrame - slot.startFrame + overlapTail;
            return (
              <Sequence
                key={idx}
                from={slot.startFrame}
                durationInFrames={seqDuration}
              >
                <NeetiClipSlide
                  rawUrl={getRawMediaAt(slot.mediaIndex)}
                  slot={slot}
                  slotIndex={idx}
                />
              </Sequence>
            );
          })}

          {/* Vintage 16mm/35mm Film Scratches, Dust, Film Burns & Golden Glow */}
          <VintageFilmOverlayFX frame={frame} />
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