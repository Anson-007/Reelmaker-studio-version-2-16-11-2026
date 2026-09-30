import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

export interface GrooveSwapProps {
  photos: string[];
}

// Exactly 229 frames @ 30 FPS (7.633s)
// Mapped directly to your timestamp cues:
// 00:00:00:27 (27f), 00:00:01:23 (53f), 00:00:03:17 (107f),
// 00:00:04:27 (147f), 00:00:06:09 (189f), 00:00:07:05 (215f)
const GROOVE_CUT_SLOTS = [
  { start: 0, end: 27 }, // Slot 1: ends at 00:00:00:27
  { start: 27, end: 53 }, // Slot 2: ends at 00:00:01:23
  { start: 53, end: 107 }, // Slot 3: ends at 00:00:03:17
  { start: 107, end: 147 }, // Slot 4: ends at 00:00:04:27
  { start: 147, end: 189 }, // Slot 5: ends at 00:00:06:09
  { start: 189, end: 215 }, // Slot 6: ends at 00:00:07:05
  { start: 215, end: 229 }, // Slot 7: Outro tail hold to 229 frames
];

const DEFAULT_GROOVE_PHOTOS = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200",
  "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200",
  "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200",
];

export const GrooveSwapComposition: React.FC<GrooveSwapProps> = ({
  photos = [],
}) => {
  const frame = useCurrentFrame();

  const safePhotos = photos.length > 0 ? photos : DEFAULT_GROOVE_PHOTOS;

  // Identify which exact beat segment is active for this frame
  const activeSlotIndex = Math.max(
    0,
    GROOVE_CUT_SLOTS.findIndex(
      (slot) => frame >= slot.start && frame < slot.end,
    ),
  );

  const activeSlot =
    GROOVE_CUT_SLOTS[activeSlotIndex] ||
    GROOVE_CUT_SLOTS[GROOVE_CUT_SLOTS.length - 1];

  // Distribute photos cyclically across the 7 groove slots
  const photoIndex = activeSlotIndex % safePhotos.length;
  const currentImage = safePhotos[photoIndex];

  // Frame progress within this active beat slice
  const frameInSlot = frame - activeSlot.start;
  const slotDuration = activeSlot.end - activeSlot.start;

  // Subtle 2-frame scale punch on bass/kick impact followed by gentle micro-drift
  const punch = interpolate(frameInSlot, [0, 2, 4], [1.025, 1.008, 1.0], {
    extrapolateRight: "clamp",
  });
  const drift = interpolate(frameInSlot, [4, slotDuration], [1.0, 1.015], {
    extrapolateRight: "clamp",
  });
  const scale = punch * drift;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Synced Audio from public/audio/ReelAudio-2.mp3 */}
      <Audio src={staticFile("audio/ReelAudio-2.mp3")} volume={0.9} />

      {/* Frame Canvas */}
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
