import React from "react";
import { AbsoluteFill, Series, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { DynamicSlide } from "./DynamicSlide";
import { ReelSlide } from "../types/reel";

interface ReelCompositionProps {
  slides: ReelSlide[];
  audioUrl?: string;
  audioVolume?: number;
}

export const ReelComposition: React.FC<ReelCompositionProps> = ({
  slides,
  audioUrl,
  audioVolume = 0.8,
}) => {
  const { fps } = useVideoConfig();
  const allImageUrls = slides.map((s) => s.imageUrl);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {audioUrl && <Audio src={audioUrl} volume={audioVolume} />}

      <Series>
        {slides.map((slide, index) => {
          const durationInFrames = Math.max(
            15,
            Math.round((slide.durationInSeconds || 4) * fps),
          );

          return (
            <Series.Sequence
              key={slide.id || index}
              durationInFrames={durationInFrames}
            >
              <DynamicSlide
                imageUrl={slide.imageUrl}
                cameraMovement={slide.cameraMovement}
                transition={slide.transition}
                slideIndex={index}
                allImageUrls={allImageUrls}
              />
            </Series.Sequence>
          );
        })}
      </Series>
    </AbsoluteFill>
  );
};
