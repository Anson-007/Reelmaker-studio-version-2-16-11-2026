import React from "react";
import {
  AbsoluteFill,
  Series,
  Audio,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { DynamicSlide } from "./DynamicSlide";
import { ReelSlide } from "../types/reel";

interface ReelCompositionProps {
  slides: ReelSlide[];
  audioUrl?: string | null;
  audioVolume?: number;
}

export const ReelComposition: React.FC<ReelCompositionProps> = ({
  slides,
  audioUrl,
  audioVolume = 0.8,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const isCurvedSlider = slides.some((s) => s.transition === "curvedSlider3D");
  const isCylinderCarousel = slides.some(
    (s) => s.transition === "carousel3D" || s.transition === "carousel3DSpin",
  );

  const allImageUrls = slides.map((s) => s.imageUrl);
  const totalSlides = slides.length;

  let accumulatedFrames = 0;
  const slideTimings = slides.map((s) => {
    const start = accumulatedFrames;
    const duration = Math.round(s.durationInSeconds * fps);
    accumulatedFrames += duration;
    return { start, duration, end: accumulatedFrames };
  });

  const smoothStep = (t: number) => {
    const clamped = Math.max(0, Math.min(1, t));
    return clamped * clamped * (3 - 2 * clamped);
  };

  let currentSlideIdx = 0;
  for (let i = 0; i < slideTimings.length; i++) {
    if (frame >= slideTimings[i].start && frame < slideTimings[i].end) {
      currentSlideIdx = i;
      break;
    }
    if (frame >= slideTimings[slideTimings.length - 1].end) {
      currentSlideIdx = slideTimings.length - 1;
    }
  }

  const currentTiming = slideTimings[currentSlideIdx];
  const frameInSlide = frame - currentTiming.start;
  const slideDuration = currentTiming.duration;
  const transitionWindow = 28;

  // ========================================================
  // 1. 3D CURVED PANORAMIC IMAGE SLIDER (CONCAVE ARC)
  // ========================================================
  if (isCurvedSlider && totalSlides > 0) {
    const cardWidth = 560;
    const cardHeight = 995;
    const cardSpacingX = 610;
    const curveDepthRadius = 1500;

    let trackSlideOffset = currentSlideIdx;
    let cameraZ = 0;
    let cameraPitch = 0;
    let activeCardScale = 1;
    let activeCardRadius = 0;
    let isFullBleed = false;

    // Zoom-out parameters
    const maxZoomOutZ = -1400;
    const curveTiltX = -6;

    if (frameInSlide < transitionWindow) {
      const progress = smoothStep(frameInSlide / transitionWindow);
      trackSlideOffset = interpolate(
        progress,
        [0, 1],
        [currentSlideIdx - 1, currentSlideIdx],
      );
      cameraZ = interpolate(progress, [0, 1], [maxZoomOutZ, 0]);
      cameraPitch = interpolate(progress, [0, 1], [curveTiltX, 0]);
      activeCardScale = interpolate(progress, [0, 0.75, 1], [0.82, 0.95, 1]);
      activeCardRadius = interpolate(progress, [0, 0.8, 1], [32, 14, 0]);
      isFullBleed = progress > 0.94;
    } else if (
      frameInSlide > slideDuration - transitionWindow &&
      currentSlideIdx < totalSlides - 1
    ) {
      const outroProgress = smoothStep(
        (frameInSlide - (slideDuration - transitionWindow)) / transitionWindow,
      );
      trackSlideOffset = interpolate(
        outroProgress,
        [0, 1],
        [currentSlideIdx, currentSlideIdx + 1],
      );
      cameraZ = interpolate(outroProgress, [0, 1], [0, maxZoomOutZ]);
      cameraPitch = interpolate(outroProgress, [0, 1], [0, curveTiltX]);
      activeCardScale = interpolate(
        outroProgress,
        [0, 0.35, 1],
        [1, 0.95, 0.82],
      );
      activeCardRadius = interpolate(outroProgress, [0, 0.25, 1], [0, 14, 32]);
      isFullBleed = outroProgress < 0.06;
    } else {
      trackSlideOffset = currentSlideIdx;
      cameraZ = 0;
      cameraPitch = 0;
      activeCardScale = 1;
      activeCardRadius = 0;
      isFullBleed = true;
    }

    return (
      <AbsoluteFill style={{ backgroundColor: "#f8f6f0", overflow: "hidden" }}>
        {audioUrl ? (
          <Audio
            src={audioUrl}
            volume={() => (typeof audioVolume === "number" ? audioVolume : 0.8)}
            crossOrigin="anonymous"
          />
        ) : null}

        {/* Studio High-Key Lighting Background */}
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(circle at 50% 40%, #ffffff 0%, #ece7dc 100%)",
            opacity: 1,
          }}
        />

        {/* 3D World Stage */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            left: 0,
            top: 0,
            perspective: 1700,
            perspectiveOrigin: "50% 50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* Panoramic Curved Ribbon Anchor */}
          <div
            style={{
              position: "absolute",
              width: 0,
              height: 0,
              transformStyle: "preserve-3d",
              transform: `translateZ(${cameraZ}px) rotateX(${cameraPitch}deg)`,
            }}
          >
            {allImageUrls.map((imgUrl, i) => {
              const relativeIndex = i - trackSlideOffset;
              const xPos = relativeIndex * cardSpacingX;

              // Arc math: concave bend towards camera
              const angleRad = (xPos / curveDepthRadius) * 1.15;
              const zPos =
                -Math.abs(Math.sin(angleRad)) * 360 +
                (1 - Math.cos(angleRad)) * -220;
              const rotY = (angleRad * 180) / Math.PI;

              const isCurrentCard = i === currentSlideIdx;
              const currentW = isCurrentCard && isFullBleed ? width : cardWidth;
              const currentH =
                isCurrentCard && isFullBleed ? height : cardHeight;

              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    width: currentW,
                    height: currentH,
                    left: -currentW / 2,
                    top: -currentH / 2,
                    transformStyle: "preserve-3d",
                    transform: `translateX(${xPos}px) translateZ(${zPos}px) rotateY(${rotY}deg) scale(${
                      isCurrentCard ? activeCardScale : 0.82
                    })`,
                    borderRadius: isCurrentCard ? activeCardRadius : 28,
                    overflow: "hidden",
                    boxShadow: isCurrentCard
                      ? isFullBleed
                        ? "none"
                        : "0 30px 60px rgba(0,0,0,0.18), 0 10px 25px rgba(0,0,0,0.1)"
                      : "0 20px 40px rgba(0,0,0,0.12)",
                    border:
                      isCurrentCard && !isFullBleed
                        ? "3px solid #ffffff"
                        : isFullBleed
                          ? "none"
                          : "2px solid rgba(255,255,255,0.9)",
                    filter: isCurrentCard
                      ? "brightness(1)"
                      : "brightness(0.92)",
                    backgroundColor: "#ffffff",
                    backfaceVisibility: "hidden",
                  }}
                >
                  <img
                    src={imgUrl}
                    alt={`Slide ${i + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ========================================================
  // 2. 3D CYLINDRICAL CAROUSEL (360° SPINNING RING)
  // ========================================================
  if (isCylinderCarousel && totalSlides > 0) {
    const cardWidth = 560;
    const cardHeight = 995;
    const totalFaces = Math.max(5, totalSlides);
    const anglePerCard = 360 / totalFaces;
    const ringRadius =
      Math.round(cardWidth / 2 / Math.tan(Math.PI / totalFaces)) + 120;

    const maxZoomOutZ = -ringRadius - 1100;
    const cinematicTiltX = -15;
    const cinematicRollZ = -2.5;

    let baseAngle = -currentSlideIdx * anglePerCard;
    let cameraZ = 0;
    let cameraPitch = 0;
    let cameraRoll = 0;
    let activeCardScale = 1;
    let activeCardRadius = 0;
    let isFullBleed = false;

    if (frameInSlide < transitionWindow) {
      const progress = smoothStep(frameInSlide / transitionWindow);
      const prevAngle = -(currentSlideIdx - 1) * anglePerCard;
      baseAngle = interpolate(
        progress,
        [0, 1],
        [prevAngle, -currentSlideIdx * anglePerCard],
      );
      cameraZ = interpolate(progress, [0, 1], [maxZoomOutZ, 0]);
      cameraPitch = interpolate(progress, [0, 1], [cinematicTiltX, 0]);
      cameraRoll = interpolate(progress, [0, 1], [cinematicRollZ, 0]);
      activeCardScale = interpolate(progress, [0, 0.7, 1], [0.82, 0.95, 1]);
      activeCardRadius = interpolate(progress, [0, 0.75, 1], [32, 16, 0]);
      isFullBleed = progress > 0.92;
    } else if (
      frameInSlide > slideDuration - transitionWindow &&
      currentSlideIdx < totalSlides - 1
    ) {
      const outroProgress = smoothStep(
        (frameInSlide - (slideDuration - transitionWindow)) / transitionWindow,
      );
      const nextAngle = -(currentSlideIdx + 1) * anglePerCard;
      baseAngle = interpolate(
        outroProgress,
        [0, 1],
        [-currentSlideIdx * anglePerCard, nextAngle],
      );
      cameraZ = interpolate(outroProgress, [0, 1], [0, maxZoomOutZ]);
      cameraPitch = interpolate(outroProgress, [0, 1], [0, cinematicTiltX]);
      cameraRoll = interpolate(outroProgress, [0, 1], [0, cinematicRollZ]);
      activeCardScale = interpolate(
        outroProgress,
        [0, 0.35, 1],
        [1, 0.95, 0.82],
      );
      activeCardRadius = interpolate(outroProgress, [0, 0.25, 1], [0, 16, 32]);
      isFullBleed = outroProgress < 0.08;
    } else {
      baseAngle = -currentSlideIdx * anglePerCard;
      cameraZ = 0;
      cameraPitch = 0;
      cameraRoll = 0;
      activeCardScale = 1;
      activeCardRadius = 0;
      isFullBleed = true;
    }

    return (
      <AbsoluteFill style={{ backgroundColor: "#060112", overflow: "hidden" }}>
        {audioUrl ? (
          <Audio
            src={audioUrl}
            volume={() => (typeof audioVolume === "number" ? audioVolume : 0.8)}
            crossOrigin="anonymous"
          />
        ) : null}

        <AbsoluteFill
          style={{
            background:
              "radial-gradient(circle at 50% 45%, #2a085c 0%, #060112 85%)",
            opacity: 0.95,
          }}
        />

        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            left: 0,
            top: 0,
            perspective: 1600,
            perspectiveOrigin: "50% 50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 0,
              height: 0,
              transformStyle: "preserve-3d",
              transform: `translateZ(${cameraZ}px) rotateX(${cameraPitch}deg) rotateZ(${cameraRoll}deg) rotateY(${baseAngle}deg)`,
            }}
          >
            {Array.from({ length: totalFaces }).map((_, i) => {
              const cardAngle = i * anglePerCard;
              const imgUrl = allImageUrls[i % totalSlides];
              const isCurrentCard = i === currentSlideIdx;

              const currentW = isCurrentCard && isFullBleed ? width : cardWidth;
              const currentH =
                isCurrentCard && isFullBleed ? height : cardHeight;

              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    width: currentW,
                    height: currentH,
                    left: -currentW / 2,
                    top: -currentH / 2,
                    transformStyle: "preserve-3d",
                    transform: `rotateY(${cardAngle}deg) translateZ(${ringRadius}px) scale(${
                      isCurrentCard ? activeCardScale : 0.82
                    })`,
                    borderRadius: isCurrentCard ? activeCardRadius : 32,
                    overflow: "hidden",
                    boxShadow: isCurrentCard
                      ? isFullBleed
                        ? "none"
                        : "0 35px 70px rgba(0,0,0,0.95), 0 0 35px rgba(168,85,247,0.4)"
                      : "0 25px 45px rgba(0,0,0,0.8)",
                    border:
                      isCurrentCard && !isFullBleed
                        ? "2px solid rgba(255,255,255,0.45)"
                        : isFullBleed
                          ? "none"
                          : "1px solid rgba(255,255,255,0.15)",
                    filter: isCurrentCard
                      ? "brightness(1)"
                      : "brightness(0.65)",
                    backgroundColor: "#0d0422",
                    backfaceVisibility: "hidden",
                  }}
                >
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={`Slide ${i + 1}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ========================================================
  // 3. STANDARD SEQUENTIAL STYLES (FLIP, DISSOLVE, ETC.)
  // ========================================================
  return (
    <>
      {audioUrl ? (
        <Audio
          src={audioUrl}
          volume={() => (typeof audioVolume === "number" ? audioVolume : 0.8)}
          crossOrigin="anonymous"
        />
      ) : null}

      <Series>
        {slides.map((slide, index) => {
          return (
            <Series.Sequence
              key={slide.id}
              durationInFrames={Math.round(slide.durationInSeconds * fps)}
            >
              <DynamicSlide
                imageUrl={slide.imageUrl}
                slideIndex={index}
                allImageUrls={allImageUrls}
                cameraMovement={slide.cameraMovement}
                transition={slide.transition}
              />
            </Series.Sequence>
          );
        })}
      </Series>
    </>
  );
};
