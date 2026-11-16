import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

export type LightPreset =
  | "golden-sunlight"
  | "film-burn"
  | "camera-flash"
  | "warm- leak";

interface LightFXProps {
  preset?: LightPreset;
  localFrame?: number;
  durationInFrames?: number;
  intensity?: number;
}

export const LightFX: React.FC<LightFXProps> = ({
  preset = "golden-sunlight",
  localFrame,
  durationInFrames = 18,
  intensity = 1.0,
}) => {
  const globalFrame = useCurrentFrame();
  const f = localFrame !== undefined ? localFrame : globalFrame;

  // Guarantee a minimum span of 4 frames so proportional keyframes are always strictly increasing
  const dur = Math.max(4, durationInFrames);

  if (f < 0 || f > dur) return null;

  // Strictly monotonically increasing keyframes (e.g., for dur=10 -> [0, 2, 6.5, 10])
  const k1 = Number((dur * 0.18).toFixed(2));
  const k2 = Number((dur * 0.58).toFixed(2));

  // 1. GOLDEN SUNLIGHT BLOOM
  if (preset === "golden-sunlight") {
    const flashOpacity =
      interpolate(f, [0, k1, k2, dur], [0.85, 0.95, 0.38, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }) * intensity;

    const scale = interpolate(f, [0, dur], [1.0, 1.25], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    return (
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          zIndex: 25,
          opacity: flashOpacity,
          mixBlendMode: "screen",
          transform: `scale(${scale.toFixed(3)})`,
          background:
            "radial-gradient(circle at 50% 42%, rgba(255, 255, 255, 0.96) 0%, rgba(254, 240, 138, 0.82) 32%, rgba(251, 146, 60, 0.45) 65%, rgba(0, 0, 0, 0) 100%)",
        }}
      />
    );
  }

  // 2. WARM FILM BURN
  if (preset === "film-burn") {
    const burnOpacity =
      interpolate(f, [0, k1, k2, dur], [0.7, 0.92, 0.42, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }) * intensity;

    const shiftX = interpolate(f, [0, dur], [-25, 35], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    return (
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          zIndex: 25,
          opacity: burnOpacity,
          mixBlendMode: "screen",
          transform: `translateX(${shiftX.toFixed(1)}px) scale(1.12)`,
          background:
            "radial-gradient(circle at 25% 35%, rgba(254, 215, 170, 0.92) 0%, rgba(249, 115, 22, 0.75) 38%, rgba(225, 29, 72, 0.38) 72%, rgba(0, 0, 0, 0) 100%)",
        }}
      />
    );
  }

  // 3. CAMERA FLASH (Crisp White Optical Pop)
  const whiteOpacity =
    interpolate(f, [0, k1, dur], [0.95, 0.45, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) * intensity;

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        zIndex: 25,
        backgroundColor: "#FFFFFF",
        opacity: whiteOpacity,
        mixBlendMode: "screen",
      }}
    />
  );
};
