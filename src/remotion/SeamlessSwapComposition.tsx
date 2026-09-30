import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

export interface SeamlessSwapProps {
  photos: string[];
}

// 238 frames total @ 30 FPS (~7.916s)
// Frame mapping converted from your exact timestamp markers:
const CUT_FRAMES = [
  // --- Phase 1: Rapid Teaser (up to 00:02:05 / Frame 65) ---
  { start: 0, end: 9, phase: 1 },
  { start: 9, end: 18, phase: 1 },
  { start: 18, end: 27, phase: 1 },
  { start: 27, end: 36, phase: 1 },
  { start: 36, end: 45, phase: 1 },
  { start: 45, end: 55, phase: 1 },
  { start: 55, end: 65, phase: 1 }, // ends at 00:02:05

  // --- Phase 2: Steady Groove Hits ---
  { start: 65, end: 70, phase: 2 }, // cut at 00:02:10 (Frame 70)
  { start: 70, end: 95, phase: 2 }, // cut at 00:03:05 (Frame 95)
  { start: 95, end: 135, phase: 2 }, // cut at 00:04:15 (Frame 135)
  { start: 135, end: 160, phase: 2 }, // cut at 00:05:10 (Frame 160)
  { start: 160, end: 175, phase: 2 }, // cut at 00:05:25 (Frame 175)

  // --- Phase 3: Outro Speed Ramp Up ---
  { start: 175, end: 185, phase: 3 }, // cut at 00:06:05 (Frame 185)
  { start: 185, end: 195, phase: 3 }, // cut at 00:06:15 (Frame 195)
  { start: 195, end: 200, phase: 3 }, // cut at 00:06:20 (Frame 200)
  { start: 200, end: 212, phase: 3 }, // cut at 00:07:02 (Frame 212)
  { start: 212, end: 216, phase: 3 }, // cut at 00:07:06 (Frame 216)
  { start: 216, end: 220, phase: 3 }, // cut at 00:07:10 (Frame 220)
  { start: 220, end: 223, phase: 3 }, // cut at 00:07:13 (Frame 223)
  { start: 223, end: 227, phase: 3 }, // cut at 00:07:17 (Frame 227)
  { start: 227, end: 229, phase: 3 }, // cut at 00:07:19 (Frame 229)
  { start: 229, end: 231, phase: 3 }, // cut at 00:07:21 (Frame 231)
  { start: 231, end: 238, phase: 3 }, // Tail end ring-out
];

const DEFAULT_PHOTOS = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200",
  "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200",
  "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200",
];

export const SeamlessSwapComposition: React.FC<SeamlessSwapProps> = ({
  photos = [],
}) => {
  const frame = useCurrentFrame();

  const safePhotos = photos.length > 0 ? photos : DEFAULT_PHOTOS;

  // Locate the active slot index for the current frame
  const currentSlotIndex = Math.max(
    0,
    CUT_FRAMES.findIndex((slot) => frame >= slot.start && frame < slot.end),
  );
  const activeSlot =
    CUT_FRAMES[currentSlotIndex] || CUT_FRAMES[CUT_FRAMES.length - 1];

  // Distribute photos cyclically across slots
  const photoIndex = currentSlotIndex % safePhotos.length;
  const currentImage = safePhotos[photoIndex];

  // Frame progress within this current cut
  const frameInSlot = frame - activeSlot.start;
  const slotDuration = activeSlot.end - activeSlot.start;

  // Phase 1 has zero zoom.
  // Phase 2 has a subtle 2-frame scale punch on beat impact followed by a micro drift.
  // Phase 3 cuts rapidly without zoom-blur.
  let scale = 1.0;
  if (activeSlot.phase === 1 || activeSlot.phase === 3) {
    scale = 1.0;
  } else {
    const punch = interpolate(frameInSlot, [0, 2, 4], [1.025, 1.008, 1.0], {
      extrapolateRight: "clamp",
    });
    const drift = interpolate(frameInSlot, [4, slotDuration], [1.0, 1.012], {
      extrapolateRight: "clamp",
    });
    scale = punch * drift;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Synchronized Audio Track */}
      <Audio src={staticFile("audio/ReelAudio-1.mp3")} volume={0.9} />

      {/* Synchronized Image Canvas */}
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img
          src={currentImage}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
