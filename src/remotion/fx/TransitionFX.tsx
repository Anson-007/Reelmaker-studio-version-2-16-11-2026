import React, { useEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  continueRender,
  delayRender,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";

// Supported scene transition presets across Remotion compositions
export type TransitionPreset =
  | "optical-dissolve"
  | "droplet-reveal"
  | "brush-sweep"
  | "whip-pan"
  | "diagonal-feather"
  | "wave-whip"
  | "double-exposure"
  | "horizontal-blur-snap"
  | "vertical-blur-snap"
  | "thumb-diagonal";

// Continuous slide motion modes
export type SlideMotionPreset = "gyro-float" | "handheld-shake" | "none";

// High-velocity speed-ramp visual styles
export type SpeedRampStyle =
  | "flash-zoom"
  | "vertical-streak"
  | "tilted-whip"
  | "defocus-zoom"
  | "exposure-whip"
  | "vignette-punch";

interface SceneTransitionProps {
  fromSrc: string | null;
  toSrc: string | null;
  localFrame: number;
  durationInFrames?: number;
  preset?: TransitionPreset;
  maskId?: string;
  targetScale?: number;
  diagonalDirection?: "right-top" | "left-bottom";
}

/**
 * Multi-preset scene transition component compatible with Remotion Player
 * and browser GPU export pipelines.
 */
export const SceneTransitionFX: React.FC<SceneTransitionProps> = ({
  fromSrc,
  toSrc,
  localFrame,
  durationInFrames = 15,
  preset = "optical-dissolve",
  maskId = "fx",
  targetScale = 1,
  diagonalDirection = "right-top",
}) => {
  const isTransitioning =
    fromSrc && localFrame >= 0 && localFrame < durationInFrames;

  // Normalized 0..1 transition progress across durationInFrames
  const progress = interpolate(localFrame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Shared optical flash and exposure recovery curves
  const exposureBrightness = interpolate(
    localFrame,
    [0, 2, 8, 18],
    [1.85, 2.05, 1.25, 1.0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const exposureContrast = interpolate(
    localFrame,
    [0, 3, 16],
    [0.86, 0.9, 1.0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const exposureBlur = interpolate(localFrame, [0, 3, 12], [6, 3, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Diagonal whip + directional drift transition
  if (preset === "thumb-diagonal") {
    const dirSign = diagonalDirection === "right-top" ? 1 : -1;
    const whipProgress = interpolate(localFrame, [0, 5], [0, 1], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const holdProgress = interpolate(
      localFrame,
      [0, Math.max(6, durationInFrames)],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );

    const whipOffsetX = interpolate(whipProgress, [0, 1], [-58 * dirSign, 0]);
    const whipOffsetY = interpolate(whipProgress, [0, 1], [58 * dirSign, 0]);
    const driftX = interpolate(
      holdProgress,
      [0, 1],
      [-18 * dirSign, 34 * dirSign],
    );
    const driftY = interpolate(
      holdProgress,
      [0, 1],
      [18 * dirSign, -34 * dirSign],
    );
    const tiltDeg = interpolate(
      holdProgress,
      [0, 1],
      [-0.6 * dirSign, 1.65 * dirSign],
    );

    const totalX = whipOffsetX + driftX;
    const totalY = whipOffsetY + driftY;
    const outX = interpolate(whipProgress, [0, 1], [0, 75 * dirSign]);
    const outY = interpolate(whipProgress, [0, 1], [0, -75 * dirSign]);
    const inOpacity = fromSrc
      ? interpolate(localFrame, [0, 3], [0, 1], { extrapolateRight: "clamp" })
      : 1;

    const isBlurring = localFrame >= 0 && localFrame < 5;
    const blurAmount = isBlurring
      ? interpolate(localFrame, [0, 2, 5], [26, 16, 0], {
          extrapolateRight: "clamp",
        })
      : 0;
    const filterId = `thumb-diag-${maskId}`;
    const safeScale = Math.max(1.14, targetScale);

    return (
      <AbsoluteFill style={{ backgroundColor: "#000" }}>
        {isBlurring && (
          <svg width="0" height="0" style={{ position: "absolute" }}>
            <defs>
              <filter
                id={filterId}
                x="-25%"
                y="-25%"
                width="150%"
                height="150%"
              >
                <feGaussianBlur
                  stdDeviation={`${blurAmount.toFixed(1)} ${(
                    blurAmount * 0.85
                  ).toFixed(1)}`}
                />
              </filter>
            </defs>
          </svg>
        )}
        {isBlurring && fromSrc && (
          <AbsoluteFill
            style={{
              transform: `translate3d(${outX.toFixed(1)}px, ${outY.toFixed(
                1,
              )}px, 0px) scale(${safeScale})`,
              filter: `url(#${filterId})`,
            }}
          >
            <img
              src={fromSrc}
              alt="Outgoing"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </AbsoluteFill>
        )}
        <AbsoluteFill
          style={{
            opacity: inOpacity,
            transform: `translate3d(${totalX.toFixed(1)}px, ${totalY.toFixed(
              1,
            )}px, 0px) rotate(${tiltDeg.toFixed(2)}deg) scale(${safeScale.toFixed(
              3,
            )})`,
            filter: isBlurring ? `url(#${filterId})` : undefined,
            willChange: "transform",
          }}
        >
          {toSrc && (
            <img
              src={toSrc}
              alt="Incoming"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  // Horizontal directional blur snap
  if (preset === "horizontal-blur-snap") {
    const snapFrames = 7;
    const isSnapping = localFrame >= 0 && localFrame < snapFrames;
    const snapProg = interpolate(localFrame, [0, snapFrames], [0, 1], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const blurX = isSnapping
      ? interpolate(snapProg, [0, 0.35, 1], [38, 22, 0])
      : 0;
    const shiftX = isSnapping ? interpolate(snapProg, [0, 1], [34, 0]) : 0;
    const inOpacity = isSnapping
      ? interpolate(localFrame, [0, 3], [0, 1], { extrapolateRight: "clamp" })
      : 1;
    const filterId = `h-blur-${maskId}`;

    return (
      <AbsoluteFill style={{ backgroundColor: "#000" }}>
        {isSnapping && fromSrc && (
          <AbsoluteFill
            style={{
              filter: `url(#${filterId})`,
              transform: `translateX(${(shiftX - 34).toFixed(1)}px) scale(1.04)`,
            }}
          >
            <img
              src={fromSrc}
              alt="Outgoing"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </AbsoluteFill>
        )}
        {isSnapping && (
          <svg width="0" height="0" style={{ position: "absolute" }}>
            <defs>
              <filter
                id={filterId}
                x="-20%"
                y="-20%"
                width="140%"
                height="140%"
              >
                <feGaussianBlur stdDeviation={`${blurX.toFixed(1)} 0`} />
              </filter>
            </defs>
          </svg>
        )}
        <AbsoluteFill
          style={{
            opacity: inOpacity,
            transform: `translateX(${shiftX.toFixed(1)}px) scale(${targetScale})`,
            filter: isSnapping ? `url(#${filterId})` : undefined,
          }}
        >
          {toSrc && (
            <img
              src={toSrc}
              alt="Incoming"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  // Vertical directional blur snap
  if (preset === "vertical-blur-snap") {
    const snapFrames = 7;
    const isSnapping = localFrame >= 0 && localFrame < snapFrames;
    const snapProg = interpolate(localFrame, [0, snapFrames], [0, 1], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const blurY = isSnapping
      ? interpolate(snapProg, [0, 0.35, 1], [42, 24, 0])
      : 0;
    const shiftY = isSnapping ? interpolate(snapProg, [0, 1], [40, 0]) : 0;
    const inOpacity = isSnapping
      ? interpolate(localFrame, [0, 3], [0, 1], { extrapolateRight: "clamp" })
      : 1;
    const filterId = `v-blur-${maskId}`;

    return (
      <AbsoluteFill style={{ backgroundColor: "#000" }}>
        {isSnapping && fromSrc && (
          <AbsoluteFill
            style={{
              filter: `url(#${filterId})`,
              transform: `translateY(${(shiftY - 40).toFixed(1)}px) scale(1.04)`,
            }}
          >
            <img
              src={fromSrc}
              alt="Outgoing"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </AbsoluteFill>
        )}
        {isSnapping && (
          <svg width="0" height="0" style={{ position: "absolute" }}>
            <defs>
              <filter
                id={filterId}
                x="-20%"
                y="-20%"
                width="140%"
                height="140%"
              >
                <feGaussianBlur stdDeviation={`0 ${blurY.toFixed(1)}`} />
              </filter>
            </defs>
          </svg>
        )}
        <AbsoluteFill
          style={{
            opacity: inOpacity,
            transform: `translateY(${shiftY.toFixed(1)}px) scale(${targetScale})`,
            filter: isSnapping ? `url(#${filterId})` : undefined,
          }}
        >
          {toSrc && (
            <img
              src={toSrc}
              alt="Incoming"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  // Screen-blended ghost echo double-exposure transition
  if (preset === "double-exposure") {
    const inOpacity = isTransitioning
      ? interpolate(progress, [0, 0.75, 1], [0, 0.88, 1], {
          easing: Easing.out(Easing.cubic),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;
    const ghostOpacity = isTransitioning
      ? interpolate(progress, [0, 0.45, 1], [0.85, 0.48, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;
    const ghostScale = isTransitioning
      ? interpolate(progress, [0, 1], [1.03, 1.12])
      : 1;
    const ghostTranslateX = isTransitioning
      ? interpolate(progress, [0, 1], [0, -18])
      : 0;
    const inTranslateX = isTransitioning
      ? interpolate(progress, [0, 1], [16, 0], {
          easing: Easing.out(Easing.cubic),
        })
      : 0;
    const inBrightness = interpolate(
      localFrame,
      [0, 3, 14],
      [1.28, 1.16, 1.0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );

    return (
      <AbsoluteFill style={{ backgroundColor: "#050505" }}>
        <AbsoluteFill
          style={{
            opacity: inOpacity,
            transform: `translateX(${inTranslateX.toFixed(1)}px) scale(${targetScale})`,
            filter: `brightness(${inBrightness})`,
          }}
        >
          {toSrc && (
            <img
              src={toSrc}
              alt="Incoming"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
        </AbsoluteFill>
        {isTransitioning && fromSrc && ghostOpacity > 0.01 && (
          <AbsoluteFill
            style={{
              opacity: ghostOpacity,
              mixBlendMode: "screen",
              transform: `translateX(${ghostTranslateX.toFixed(1)}px) scale(${ghostScale.toFixed(3)})`,
              filter: "blur(3px) brightness(1.1)",
              pointerEvents: "none",
            }}
          >
            <img
              src={fromSrc}
              alt="Outgoing Ghost"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </AbsoluteFill>
        )}
      </AbsoluteFill>
    );
  }

  // SVG turbulence + horizontal blur wave whip
  if (preset === "wave-whip") {
    const waveFrames = 7;
    const isWaving = localFrame >= 0 && localFrame < waveFrames;
    const waveProgress = interpolate(localFrame, [0, waveFrames], [0, 1], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const blurX = isWaving
      ? interpolate(waveProgress, [0, 0.3, 1], [26, 18, 0])
      : 0;
    const dispScale = isWaving
      ? interpolate(waveProgress, [0, 0.25, 1], [65, 45, 0])
      : 0;
    const slideX = isWaving ? interpolate(waveProgress, [0, 1], [42, 0]) : 0;
    const punchScale = interpolate(
      localFrame,
      [0, 4, 14],
      [1.14, 1.05, targetScale],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );
    const filterId = `wave-whip-${maskId}`;

    return (
      <AbsoluteFill style={{ backgroundColor: "#000" }}>
        {isWaving && (
          <svg width="0" height="0" style={{ position: "absolute" }}>
            <defs>
              <filter
                id={filterId}
                x="-20%"
                y="-20%"
                width="140%"
                height="140%"
              >
                <feTurbulence
                  type="turbulence"
                  baseFrequency="0.004 0.035"
                  numOctaves="2"
                  seed="5"
                  result="warp"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="warp"
                  scale={dispScale}
                  xChannelSelector="R"
                  yChannelSelector="G"
                  result="displaced"
                />
                <feGaussianBlur
                  in="displaced"
                  stdDeviation={`${blurX.toFixed(1)} 0`}
                />
              </filter>
            </defs>
          </svg>
        )}
        <AbsoluteFill
          style={{
            transform: `translateX(${slideX.toFixed(1)}px) scale(${punchScale.toFixed(4)})`,
            filter: isWaving ? `url(#${filterId})` : undefined,
          }}
        >
          {toSrc && (
            <img
              src={toSrc}
              alt="Slide"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  // Default optical dissolve / exposure cross-fade
  if (preset === "optical-dissolve" || !isTransitioning) {
    const inOpacity = isTransitioning
      ? interpolate(localFrame, [0, 5], [0, 1], { extrapolateRight: "clamp" })
      : 1;

    return (
      <AbsoluteFill>
        {isTransitioning && fromSrc && (
          <AbsoluteFill
            style={{
              filter: `brightness(${interpolate(
                localFrame,
                [0, 5],
                [1.1, 1.9],
                { extrapolateRight: "clamp" },
              )})`,
            }}
          >
            <img
              src={fromSrc}
              alt="Outgoing"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </AbsoluteFill>
        )}
        <AbsoluteFill
          style={{
            opacity: inOpacity,
            transform: `scale(${targetScale})`,
            filter: `brightness(${exposureBrightness}) contrast(${exposureContrast}) blur(${exposureBlur}px)`,
          }}
        >
          {toSrc && (
            <img
              src={toSrc}
              alt="Incoming"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  // Multi-stroke feathered brush sweep mask reveal
  if (preset === "brush-sweep") {
    const uniqueMask = `brush-sweep-mask-${maskId}`;
    const strokes = [
      { x1: -260, y1: 220, x2: 1340, y2: -60, delay: 0.0, width: 520 },
      { x1: 1340, y1: 520, x2: -260, y2: 780, delay: 0.08, width: 540 },
      { x1: -260, y1: 1020, x2: 1340, y2: 760, delay: 0.04, width: 560 },
      { x1: 1340, y1: 1320, x2: -260, y2: 1580, delay: 0.12, width: 540 },
      { x1: -260, y1: 1860, x2: 1340, y2: 1620, delay: 0.06, width: 560 },
    ];
    const incomingZoom = interpolate(progress, [0, 1], [1.08, targetScale], {
      easing: Easing.out(Easing.cubic),
    });

    return (
      <AbsoluteFill>
        <AbsoluteFill>
          <img
            src={fromSrc}
            alt="Outgoing"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </AbsoluteFill>
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <defs>
            <filter id={`feather-${uniqueMask}`}>
              <feGaussianBlur stdDeviation="22" />
            </filter>
            <mask id={uniqueMask}>
              <rect width="1080" height="1920" fill="black" />
              <g filter={`url(#feather-${uniqueMask})`}>
                {strokes.map((s, i) => {
                  const p = interpolate(
                    progress,
                    [s.delay, Math.min(1, s.delay + 0.78)],
                    [0, 1],
                    {
                      easing: Easing.inOut(Easing.cubic),
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    },
                  );
                  const dashOffset = interpolate(p, [0, 1], [1900, 0]);
                  return (
                    <line
                      key={i}
                      x1={s.x1}
                      y1={s.y1}
                      x2={s.x2}
                      y2={s.y2}
                      stroke="white"
                      strokeWidth={s.width}
                      strokeLinecap="round"
                      strokeDasharray="1900"
                      strokeDashoffset={dashOffset}
                    />
                  );
                })}
              </g>
            </mask>
          </defs>
        </svg>
        <AbsoluteFill
          style={{
            mask: `url(#${uniqueMask})`,
            WebkitMask: `url(#${uniqueMask})`,
            transform: `scale(${incomingZoom})`,
            filter: `brightness(${interpolate(
              progress,
              [0, 0.25, 1],
              [1.35, 1.15, 1],
            )})`,
          }}
        >
          {toSrc && (
            <img
              src={toSrc}
              alt="Incoming"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  // Soft expanding droplet mask reveal
  if (preset === "droplet-reveal") {
    const uniqueMask = `droplet-mask-${maskId}`;
    const droplets = [
      { cx: 340, cy: 360, delay: 0.0, maxR: 950 },
      { cx: 740, cy: 480, delay: 0.06, maxR: 900 },
      { cx: 480, cy: 860, delay: 0.03, maxR: 1050 },
      { cx: 820, cy: 920, delay: 0.09, maxR: 850 },
      { cx: 260, cy: 1320, delay: 0.05, maxR: 950 },
      { cx: 680, cy: 1460, delay: 0.02, maxR: 1000 },
    ];

    return (
      <AbsoluteFill>
        <AbsoluteFill>
          <img
            src={fromSrc}
            alt="Outgoing"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </AbsoluteFill>
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <defs>
            <filter id={`soft-${uniqueMask}`}>
              <feGaussianBlur stdDeviation="18" />
            </filter>
            <mask id={uniqueMask}>
              <rect width="1080" height="1920" fill="black" />
              <g filter={`url(#soft-${uniqueMask})`}>
                {droplets.map((d, i) => {
                  const p = interpolate(
                    progress,
                    [d.delay, Math.min(1, d.delay + 0.75)],
                    [0, 1],
                    {
                      easing: Easing.out(Easing.cubic),
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    },
                  );
                  return (
                    <circle
                      key={i}
                      cx={d.cx}
                      cy={d.cy}
                      r={p * d.maxR}
                      fill="white"
                    />
                  );
                })}
              </g>
            </mask>
          </defs>
        </svg>
        <AbsoluteFill
          style={{
            mask: `url(#${uniqueMask})`,
            WebkitMask: `url(#${uniqueMask})`,
            transform: `scale(${targetScale})`,
            filter: `brightness(${exposureBrightness})`,
          }}
        >
          {toSrc && (
            <img
              src={toSrc}
              alt="Incoming"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  // Horizontal whip-pan with motion blur
  if (preset === "whip-pan") {
    const outX = interpolate(progress, [0, 1], [0, -100]);
    const inX = interpolate(progress, [0, 1], [100, 0]);
    const motionBlur = interpolate(progress, [0, 0.5, 1], [0, 24, 0]);

    return (
      <AbsoluteFill style={{ filter: `blur(${motionBlur}px)` }}>
        <AbsoluteFill style={{ transform: `translateX(${outX}%) scale(1.06)` }}>
          <img
            src={fromSrc}
            alt="Outgoing"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </AbsoluteFill>
        <AbsoluteFill
          style={{ transform: `translateX(${inX}%) scale(${targetScale})` }}
        >
          {toSrc && (
            <img
              src={toSrc}
              alt="Incoming"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  // Diagonal feathered wipe fallback
  const wipe = interpolate(progress, [0, 1], [-25, 125]);
  return (
    <AbsoluteFill>
      <AbsoluteFill>
        <img
          src={fromSrc}
          alt="Outgoing"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          transform: `scale(${targetScale})`,
          WebkitMaskImage: `linear-gradient(115deg, black ${wipe - 18}%, transparent ${wipe + 18}%)`,
          maskImage: `linear-gradient(115deg, black ${wipe - 18}%, transparent ${wipe + 18}%)`,
        }}
      >
        {toSrc && (
          <img
            src={toSrc}
            alt="Incoming"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Kinetic typography data structures for the "Believe yourself" beat sequence
interface GlitchToken {
  text: string;
  color: "white" | "red";
}

interface GlitchBeatCard {
  startFrame: number;
  endFrame: number;
  line1: GlitchToken[];
  line2?: GlitchToken[];
  fontSize?: number;
}

const BELIEVE_GLITCH_CARDS: GlitchBeatCard[] = [
  {
    startFrame: 0,
    endFrame: 8,
    line1: [{ text: "YOU", color: "white" }],
    fontSize: 132,
  },
  {
    startFrame: 8,
    endFrame: 20,
    line1: [{ text: "YOU TELL", color: "white" }],
    line2: [{ text: "THEM", color: "red" }],
    fontSize: 124,
  },
  {
    startFrame: 39,
    endFrame: 48,
    line1: [
      { text: "I", color: "white" },
      { text: "BELIEVED", color: "red" },
    ],
    fontSize: 118,
  },
  {
    startFrame: 48,
    endFrame: 69,
    line1: [
      { text: "I", color: "white" },
      { text: "BELIEVED", color: "red" },
    ],
    line2: [
      { text: "IN", color: "red" },
      { text: "MYSELF", color: "white" },
    ],
    fontSize: 116,
  },
  {
    startFrame: 69,
    endFrame: 99,
    line1: [
      { text: "WHEN", color: "white" },
      { text: "NOBODY", color: "red" },
    ],
    line2: [
      { text: "ELSE", color: "white" },
      { text: "DID", color: "red" },
    ],
    fontSize: 112,
  },
  {
    startFrame: 123,
    endFrame: 131,
    line1: [{ text: "KEEP", color: "white" }],
    fontSize: 128,
  },
  {
    startFrame: 131,
    endFrame: 144,
    line1: [
      { text: "KEEP", color: "white" },
      { text: "PUSHING", color: "red" },
    ],
    fontSize: 114,
  },
  {
    startFrame: 164,
    endFrame: 173,
    line1: [{ text: "KEEP", color: "white" }],
    fontSize: 128,
  },
  {
    startFrame: 173,
    endFrame: 188,
    line1: [
      { text: "KEEP", color: "white" },
      { text: "WINNING", color: "red" },
    ],
    fontSize: 114,
  },
  {
    startFrame: 209,
    endFrame: 230,
    line1: [{ text: "AND", color: "white" }],
    line2: [{ text: "REMEMBER", color: "red" }],
    fontSize: 118,
  },
  {
    startFrame: 230,
    endFrame: 248,
    line1: [
      { text: "IT'S", color: "white" },
      { text: "ALWAYS", color: "red" },
    ],
    fontSize: 118,
  },
  {
    startFrame: 248,
    endFrame: 274,
    line1: [
      { text: "THE", color: "white" },
      { text: "UNDERDOGS", color: "red" },
    ],
    fontSize: 106,
  },
  {
    startFrame: 274,
    endFrame: 294,
    line1: [
      { text: "WHO", color: "white" },
      { text: "END UP", color: "red" },
    ],
    fontSize: 118,
  },
  {
    startFrame: 294,
    endFrame: 309,
    line1: [{ text: "RUNNING", color: "red" }],
    fontSize: 126,
  },
  {
    startFrame: 309,
    endFrame: 325,
    line1: [
      { text: "THE", color: "white" },
      { text: "GAME", color: "red" },
    ],
    fontSize: 126,
  },
];

/**
 * CRT RGB-split kinetic text with horizontal slice tears and scanlines.
 */
export const UnderdogGlitchTextFX: React.FC<{ frame: number }> = ({
  frame,
}) => {
  const { fps } = useVideoConfig();

  const activeCard = BELIEVE_GLITCH_CARDS.find(
    (c) => frame >= c.startFrame && frame < c.endFrame,
  );
  if (!activeCard) return null;

  const localF = frame - activeCard.startFrame;
  const cardDur = activeCard.endFrame - activeCard.startFrame;
  const isGlitching = localF < 4 || localF >= cardDur - 2;
  const glitchIntensity = isGlitching
    ? localF < 4
      ? interpolate(localF, [0, 4], [1, 0], { extrapolateRight: "clamp" })
      : 0.85
    : 0;

  const popSpring = spring({
    frame: localF,
    fps,
    config: { damping: 14, stiffness: 220, mass: 0.55 },
  });
  const baseScale = interpolate(popSpring, [0, 1], [0.92, 1.0]);
  const fontSize = activeCard.fontSize || 118;

  const renderLines = (offsetX: number = 0) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transform: `perspective(650px) rotateX(4deg) scale(${baseScale.toFixed(
          3,
        )}) translateX(${offsetX}px)`,
        fontFamily:
          "'Anton', 'Impact', 'Bebas Neue', 'Oswald', 'Arial Black', sans-serif",
        textTransform: "uppercase",
        letterSpacing: "-1.5px",
        lineHeight: 0.94,
        userSelect: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          whiteSpace: "nowrap",
        }}
      >
        {activeCard.line1.map((tok, i) => (
          <span
            key={i}
            style={{
              fontSize: `${fontSize}px`,
              fontWeight: 900,
              color: tok.color === "white" ? "#FFFFFF" : "#D91414",
              textShadow:
                tok.color === "white"
                  ? `-4.5px 0px 0px #00E5FF, 4.5px 0px 0px #FF2A00, 0px 0px 18px rgba(255, 255, 255, 0.35)`
                  : `-3px 0px 0px #7F0000, 3px 0px 0px #FF3B1D, 0px 0px 22px rgba(217, 20, 20, 0.45)`,
            }}
          >
            {tok.text}
          </span>
        ))}
      </div>

      {activeCard.line2 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
            whiteSpace: "nowrap",
            marginTop: "8px",
          }}
        >
          {activeCard.line2.map((tok, i) => (
            <span
              key={i}
              style={{
                fontSize: `${fontSize}px`,
                fontWeight: 900,
                color: tok.color === "white" ? "#FFFFFF" : "#D91414",
                textShadow:
                  tok.color === "white"
                    ? `-4.5px 0px 0px #00E5FF, 4.5px 0px 0px #FF2A00, 0px 0px 18px rgba(255, 255, 255, 0.35)`
                    : `-3px 0px 0px #7F0000, 3px 0px 0px #FF3B1D, 0px 0px 22px rgba(217, 20, 20, 0.45)`,
              }}
            >
              {tok.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  // Deterministic slice offsets to keep render output consistent across frames
  const topSliceShift =
    ((frame * 19) % 2 === 0 ? 1 : -1) * 32 * glitchIntensity;
  const midSliceShift =
    ((frame * 13) % 2 === 0 ? -1 : 1) * 26 * glitchIntensity;
  const botSliceShift =
    ((frame * 29) % 2 === 0 ? 1 : -1) * 22 * glitchIntensity;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {!isGlitching && (
        <AbsoluteFill
          style={{ justifyContent: "center", alignItems: "center" }}
        >
          {renderLines(0)}
        </AbsoluteFill>
      )}

      {isGlitching && (
        <>
          <AbsoluteFill
            style={{
              justifyContent: "center",
              alignItems: "center",
              clipPath: "inset(0% 0% 54% 0%)",
            }}
          >
            {renderLines(topSliceShift)}
          </AbsoluteFill>
          <AbsoluteFill
            style={{
              justifyContent: "center",
              alignItems: "center",
              clipPath: "inset(46% 0% 47% 0%)",
            }}
          >
            {renderLines(midSliceShift)}
          </AbsoluteFill>
          <AbsoluteFill
            style={{
              justifyContent: "center",
              alignItems: "center",
              clipPath: "inset(53% 0% 0% 0%)",
            }}
          >
            {renderLines(botSliceShift)}
          </AbsoluteFill>

          <div
            style={{
              position: "absolute",
              top: "47.5%",
              left: "12%",
              width: "76%",
              height: "5px",
              background:
                "linear-gradient(90deg, transparent 0%, #00E5FF 25%, #FFFFFF 50%, #FF2A00 80%, transparent 100%)",
              opacity: 0.85,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "52.5%",
              left: "18%",
              width: "64%",
              height: "4px",
              background:
                "linear-gradient(90deg, transparent 0%, #D91414 35%, #00E5FF 75%, transparent 100%)",
              opacity: 0.75,
            }}
          />
        </>
      )}

      {/* CRT scanline & sub-pixel grid */}
      <AbsoluteFill
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.42) 0px, rgba(0, 0, 0, 0.42) 2px, transparent 2px, transparent 5px),
            repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.32) 0px, rgba(0, 0, 0, 0.32) 2px, transparent 2px, transparent 5px)
          `,
          pointerEvents: "none",
          zIndex: 25,
        }}
      />

      {/* Edge vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 50%, transparent 45%, rgba(0, 0, 0, 0.88) 100%)",
          pointerEvents: "none",
          zIndex: 26,
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * Diagonal 135-degree wipe with a glowing light-beam streak.
 */
export const DiagonalBeamWipeFX: React.FC<{
  fromSrc: string | null;
  toSrc: string | null;
  localFrame: number;
  durationInFrames?: number;
  targetScale?: number;
}> = ({
  fromSrc,
  toSrc,
  localFrame,
  durationInFrames = 12,
  targetScale = 1.04,
}) => {
  const isWiping = localFrame >= 0 && localFrame < durationInFrames;
  const wipeProgress = interpolate(localFrame, [0, durationInFrames], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const wipePos = interpolate(wipeProgress, [0, 1], [-25, 125]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000", overflow: "hidden" }}>
      {isWiping && fromSrc && (
        <AbsoluteFill style={{ transform: "scale(1.03)" }}>
          <img
            src={fromSrc}
            alt="Outgoing"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </AbsoluteFill>
      )}

      <AbsoluteFill
        style={{
          transform: `scale(${targetScale.toFixed(4)})`,
          WebkitMaskImage: isWiping
            ? `linear-gradient(135deg, black ${wipePos - 8}%, transparent ${
                wipePos + 8
              }%)`
            : undefined,
          maskImage: isWiping
            ? `linear-gradient(135deg, black ${wipePos - 8}%, transparent ${
                wipePos + 8
              }%)`
            : undefined,
        }}
      >
        {toSrc && (
          <img
            src={toSrc}
            alt="Incoming"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </AbsoluteFill>

      {isWiping && (
        <AbsoluteFill
          style={{
            background: `linear-gradient(135deg, transparent ${
              wipePos - 14
            }%, rgba(254, 243, 199, 0.75) ${
              wipePos - 4
            }%, rgba(255, 255, 255, 0.98) ${wipePos}%, rgba(254, 243, 199, 0.75) ${
              wipePos + 4
            }%, transparent ${wipePos + 14}%)`,
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
};

/**
 * Center-expanding card reveal over a dimmed/blurred backdrop, followed by a warm flash.
 */
export const CenterBoxFlashRevealFX: React.FC<{
  backdropSrc: string | null;
  revealSrc: string | null;
  localFrame: number;
}> = ({ backdropSrc, revealSrc, localFrame }) => {
  const isBoxPhase = localFrame < 15;

  const boxScale = interpolate(localFrame, [0, 15], [0.42, 0.78], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fullScale = interpolate(localFrame, [15, 44], [1.08, 1.01], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const creamFlashOpacity =
    localFrame >= 13 && localFrame <= 25
      ? interpolate(localFrame, [13, 16, 25], [0, 0.92, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000", overflow: "hidden" }}>
      {isBoxPhase ? (
        <>
          <AbsoluteFill
            style={{
              filter: "brightness(0.72) blur(2px)",
              transform: "scale(1.04)",
            }}
          >
            {backdropSrc && (
              <img
                src={backdropSrc}
                alt="Backdrop"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
          </AbsoluteFill>

          <AbsoluteFill
            style={{
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                transform: `scale(${boxScale.toFixed(4)})`,
                borderRadius: "20px",
                overflow: "hidden",
                boxShadow: "0px 28px 70px rgba(0, 0, 0, 0.92)",
                border: "2px solid rgba(255, 255, 255, 0.35)",
              }}
            >
              {revealSrc && (
                <img
                  src={revealSrc}
                  alt="Center Box Reveal"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
            </div>
          </AbsoluteFill>
        </>
      ) : (
        <AbsoluteFill style={{ transform: `scale(${fullScale.toFixed(4)})` }}>
          {revealSrc && (
            <img
              src={revealSrc}
              alt="Full Screen Reveal"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
        </AbsoluteFill>
      )}

      {creamFlashOpacity > 0.01 && (
        <AbsoluteFill
          style={{
            opacity: creamFlashOpacity,
            background:
              "radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.98) 0%, rgba(254, 243, 199, 0.92) 60%, rgba(251, 191, 36, 0.65) 100%)",
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
};

/**
 * Intro hold with gradual zoom and a pre-drop flash at the end of the hold.
 */
export const SpeedRampIntroFX: React.FC<{
  src: string | null;
  frame: number;
  endFrame?: number;
}> = ({ src, frame, endFrame = 180 }) => {
  if (frame < 0 || frame >= endFrame) return null;

  const enterOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale =
    frame < endFrame - 7
      ? interpolate(frame, [0, endFrame - 7], [1.0, 1.045], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : interpolate(frame, [endFrame - 7, endFrame], [1.045, 0.96], {
          easing: Easing.in(Easing.cubic),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  const preDropFlash = interpolate(
    frame,
    [endFrame - 6, endFrame - 1],
    [0, 0.92],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          opacity: enterOpacity,
          transform: `scale(${scale.toFixed(4)})`,
        }}
      >
        {src && (
          <img
            src={src}
            alt="Speed Ramp Intro"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </AbsoluteFill>

      {preDropFlash > 0.01 && (
        <AbsoluteFill
          style={{
            opacity: preDropFlash,
            background:
              "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.98) 85%)",
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
};

/**
 * Fast-cut slide with directional blur, scale punch, and end-of-slot exposure dip.
 */
export const SpeedRampSlideFX: React.FC<{
  fromSrc: string | null;
  toSrc: string | null;
  localFrame: number;
  slotDuration: number;
  stylePreset: SpeedRampStyle;
  slideIndex: number;
}> = ({
  fromSrc,
  toSrc,
  localFrame,
  slotDuration,
  stylePreset,
  slideIndex,
}) => {
  const dur = Math.max(8, slotDuration);
  const whipFrames = Math.min(7, Math.floor(dur * 0.45));
  const dipStartFrame = Math.max(whipFrames + 1, dur - 4);

  const enterProgress = interpolate(localFrame, [0, whipFrames], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const baseEnterScale =
    stylePreset === "defocus-zoom"
      ? interpolate(enterProgress, [0, 1], [1.26, 1.02])
      : stylePreset === "vignette-punch"
        ? interpolate(enterProgress, [0, 1], [1.22, 1.02])
        : interpolate(enterProgress, [0, 1], [1.16, 1.02]);

  const preCutPull =
    localFrame >= dipStartFrame
      ? interpolate(localFrame, [dipStartFrame, dur], [0, 0.05], {
          easing: Easing.in(Easing.cubic),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;

  const totalScale = baseEnterScale + preCutPull;

  const endExposureDip =
    localFrame >= dipStartFrame
      ? interpolate(localFrame, [dipStartFrame, dur], [1.0, 0.36], {
          easing: Easing.in(Easing.quad),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1.0;

  const enterBrightness =
    stylePreset === "flash-zoom" || stylePreset === "exposure-whip"
      ? interpolate(localFrame, [0, 2, 8], [1.95, 1.55, 1.0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : interpolate(localFrame, [0, 4], [1.25, 1.0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  const activeBrightness = enterBrightness * endExposureDip;

  let blurX = 0;
  let blurY = 0;
  let shiftX = 0;
  let shiftY = 0;
  let rotateDeg = 0;

  if (stylePreset === "vertical-streak") {
    blurY = interpolate(enterProgress, [0, 0.35, 1], [52, 28, 0]);
    shiftY = interpolate(enterProgress, [0, 1], [64, 0]);
  } else if (stylePreset === "exposure-whip") {
    blurX = interpolate(enterProgress, [0, 0.35, 1], [48, 24, 0]);
    shiftX = interpolate(enterProgress, [0, 1], [56, 0]);
  } else if (stylePreset === "tilted-whip") {
    blurX = interpolate(enterProgress, [0, 0.4, 1], [28, 14, 0]);
    blurY = interpolate(enterProgress, [0, 0.4, 1], [28, 14, 0]);
    rotateDeg = interpolate(enterProgress, [0, 1], [-5.5, 0]);
    shiftX = interpolate(enterProgress, [0, 1], [-42, 0]);
  } else if (stylePreset === "defocus-zoom") {
    blurX = interpolate(enterProgress, [0, 0.5, 1], [24, 12, 0]);
    blurY = interpolate(enterProgress, [0, 0.5, 1], [24, 12, 0]);
  } else {
    blurX = interpolate(enterProgress, [0, 0.35, 1], [18, 8, 0]);
    blurY = interpolate(enterProgress, [0, 0.35, 1], [18, 8, 0]);
  }

  const hasSvgBlur = blurX > 0.6 || blurY > 0.6;
  const filterId = `speed-ramp-blur-${slideIndex}`;

  const showOutgoing = fromSrc && localFrame < 3;
  const inOpacity = fromSrc
    ? interpolate(localFrame, [0, 3], [0, 1], { extrapolateRight: "clamp" })
    : 1;

  const whiteVignetteOpacity =
    stylePreset === "flash-zoom" && localFrame < 9
      ? interpolate(localFrame, [0, 2, 9], [0.95, 0.75, 0], {
          extrapolateRight: "clamp",
        })
      : 0;

  const darkVignetteOpacity =
    stylePreset === "vignette-punch"
      ? interpolate(localFrame, [0, 5, dur], [0.75, 0.35, 0.55], {
          extrapolateRight: "clamp",
        })
      : 0.25;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000", overflow: "hidden" }}>
      {hasSvgBlur && (
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <defs>
            <filter id={filterId} x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur
                stdDeviation={`${blurX.toFixed(1)} ${blurY.toFixed(1)}`}
              />
            </filter>
          </defs>
        </svg>
      )}

      {showOutgoing && (
        <AbsoluteFill
          style={{
            transform: `translate3d(${(-shiftX * 0.8).toFixed(
              1,
            )}px, ${(-shiftY * 0.8).toFixed(1)}px, 0px) scale(1.08)`,
            filter: hasSvgBlur
              ? `url(#${filterId}) brightness(0.6)`
              : "brightness(0.6)",
          }}
        >
          <img
            src={fromSrc as string}
            alt="Outgoing"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </AbsoluteFill>
      )}

      <AbsoluteFill
        style={{
          opacity: inOpacity,
          transform: `translate3d(${shiftX.toFixed(1)}px, ${shiftY.toFixed(
            1,
          )}px, 0px) rotate(${rotateDeg.toFixed(
            2,
          )}deg) scale(${totalScale.toFixed(4)})`,
          filter: `${
            hasSvgBlur ? `url(#${filterId}) ` : ""
          }brightness(${activeBrightness.toFixed(2)}) contrast(1.04)`,
          willChange: "transform, filter",
        }}
      >
        {toSrc && (
          <img
            src={toSrc}
            alt="Incoming"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          opacity: darkVignetteOpacity,
          background:
            "radial-gradient(circle at 50% 50%, transparent 52%, rgba(0, 0, 0, 0.88) 100%)",
          pointerEvents: "none",
        }}
      />

      {whiteVignetteOpacity > 0.01 && (
        <AbsoluteFill
          style={{
            opacity: whiteVignetteOpacity,
            background:
              "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.98) 80%)",
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
};

/**
 * Split-frame film roll and warm exposure burn overlay.
 */
export const FilmStripBurnTransitionFX: React.FC<{
  fromSrc: string | null;
  toSrc: string | null;
  frame: number;
  startFrame?: number;
  durationInFrames?: number;
}> = ({ fromSrc, toSrc, frame, startFrame = 193, durationInFrames = 12 }) => {
  const localFrame = frame - startFrame;
  if (localFrame < 0 || localFrame >= durationInFrames) return null;

  const isFirstHalf = localFrame < 5;
  const topBurnOpacity = isFirstHalf
    ? interpolate(localFrame, [0, 2, 4], [0.48, 0.88, 0.98], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  const bottomBurnOpacity = !isFirstHalf
    ? interpolate(localFrame, [5, 6, 9, 11], [0.98, 0.88, 0.42, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  const vBlurStdDev = interpolate(
    localFrame,
    [0, 2, 4, 5, 8, 11],
    [0, 8, 32, 28, 6, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const outSlipY = isFirstHalf
    ? interpolate(localFrame, [0, 4], [0, 68], {
        easing: Easing.in(Easing.cubic),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  const inSlipY = !isFirstHalf
    ? interpolate(localFrame, [5, 11], [-64, 0], {
        easing: Easing.out(Easing.cubic),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  const splitYPercent = isFirstHalf ? 42 : 38;
  const seamGlowOpacity = interpolate(
    localFrame,
    [0, 3, 6, 11],
    [0.5, 1, 0.95, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000",
        overflow: "hidden",
        zIndex: 34,
      }}
    >
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <filter
            id="film-strip-vblur"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur stdDeviation={`0 ${vBlurStdDev.toFixed(1)}`} />
          </filter>
        </defs>
      </svg>

      <AbsoluteFill
        style={{
          transform: `translateY(${(isFirstHalf ? outSlipY : inSlipY).toFixed(
            1,
          )}px) scale(1.08)`,
          filter: vBlurStdDev > 1 ? "url(#film-strip-vblur)" : undefined,
        }}
      >
        {(isFirstHalf ? fromSrc : toSrc) && (
          <img
            src={(isFirstHalf ? fromSrc : toSrc) as string}
            alt="Film Strip Frame"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </AbsoluteFill>

      {topBurnOpacity > 0.01 && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: `${splitYPercent}%`,
            opacity: topBurnOpacity,
            background:
              "linear-gradient(180deg, rgba(255, 251, 235, 0.98) 0%, rgba(254, 243, 199, 0.95) 68%, rgba(251, 191, 36, 0.82) 100%)",
            boxShadow: "0px 12px 36px rgba(251, 191, 36, 0.55)",
          }}
        />
      )}

      {bottomBurnOpacity > 0.01 && (
        <div
          style={{
            position: "absolute",
            top: `${splitYPercent}%`,
            bottom: 0,
            left: 0,
            right: 0,
            opacity: bottomBurnOpacity,
            background:
              "linear-gradient(180deg, rgba(251, 191, 36, 0.85) 0%, rgba(254, 243, 199, 0.96) 28%, rgba(255, 251, 235, 0.98) 100%)",
            boxShadow: "0px -12px 36px rgba(251, 191, 36, 0.55)",
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          top: `${splitYPercent}%`,
          left: 0,
          right: 0,
          height: "14px",
          transform: "translateY(-50%)",
          opacity: seamGlowOpacity,
          background:
            "linear-gradient(90deg, rgba(245, 158, 11, 0.8) 0%, rgba(255, 255, 255, 0.98) 50%, rgba(245, 158, 11, 0.8) 100%)",
          filter: "blur(3px)",
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * Animated search bar dock and two-wave bento card layout.
 */
export const GoogleSearchBentoFX: React.FC<{
  photos: (string | null)[];
  frame: number;
  totalFrames?: number;
}> = ({ photos, frame, totalFrames = 311 }) => {
  const { fps } = useVideoConfig();

  const QUERY_TEXT = "Who's the cutest person in the world?";
  const typedCount = Math.floor(
    interpolate(frame, [4, 51], [0, QUERY_TEXT.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const visibleQuery = QUERY_TEXT.slice(0, typedCount);

  const isTyping = frame >= 4 && frame <= 51;
  const showCursor = isTyping || Math.floor(frame / 12) % 2 === 0;

  const dockSpring =
    frame >= 114
      ? spring({
          frame: frame - 114,
          fps,
          config: { damping: 15, stiffness: 120, mass: 0.8 },
        })
      : 0;

  const logoTopPx = interpolate(dockSpring, [0, 1], [690, 130]);
  const logoScale = interpolate(dockSpring, [0, 1], [1.0, 0.72]);
  const barTopPx = interpolate(dockSpring, [0, 1], [860, 265]);

  const tabsOpacity = interpolate(frame, [117, 126], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tabsTranslateY = interpolate(dockSpring, [0, 1], [28, 0]);

  const endFadeOut = interpolate(
    frame,
    [totalFrames - 13, totalFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const bentoGeometry = [
    {
      left: "20px",
      top: "510px",
      width: "512px",
      height: "1355px",
      borderRadius: "28px 8px 8px 28px",
    },
    {
      left: "548px",
      top: "510px",
      width: "512px",
      height: "669px",
      borderRadius: "8px 28px 8px 8px",
    },
    {
      left: "548px",
      top: "1196px",
      width: "512px",
      height: "669px",
      borderRadius: "8px 8px 28px 8px",
    },
  ];

  const wave1StartFrames = [125, 152, 179];
  const wave1FadeOutOpacity = interpolate(frame, [204, 215], [1, 0], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const wave1FadeOutScale = interpolate(frame, [204, 215], [1, 0.95], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const wave2StartFrames = [216, 240, 264];

  const renderBentoCard = (
    photoSrc: string | null,
    slotIdx: number,
    startFrame: number,
    waveGroupOpacity: number,
    waveGroupScale: number,
    keyPrefix: string,
  ) => {
    if (frame < startFrame || waveGroupOpacity <= 0.01) return null;

    const localF = frame - startFrame;
    const geom = bentoGeometry[slotIdx];

    const popSpring = spring({
      frame: localF,
      fps,
      config: { damping: 14, stiffness: 125, mass: 0.75 },
    });

    const cardOpacity =
      interpolate(localF, [0, 10], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }) * waveGroupOpacity;

    const translateY = interpolate(popSpring, [0, 1], [44, 0]);
    const cardScale =
      interpolate(popSpring, [0, 1], [0.88, 1.0]) * waveGroupScale;
    const blurPx = interpolate(localF, [0, 12], [12, 0], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    const imgScale = interpolate(localF, [0, 95], [1.08, 1.0], {
      extrapolateRight: "clamp",
    });

    const goldFlashOpacity =
      localF < 18
        ? interpolate(localF, [0, 4, 18], [0, 0.65, 0], {
            extrapolateRight: "clamp",
          })
        : 0;

    return (
      <div
        key={`${keyPrefix}-${slotIdx}`}
        style={{
          position: "absolute",
          left: geom.left,
          top: geom.top,
          width: geom.width,
          height: geom.height,
          borderRadius: geom.borderRadius,
          overflow: "hidden",
          backgroundColor: "#28292e",
          opacity: cardOpacity,
          transform: `translate3d(0px, ${translateY.toFixed(
            1,
          )}px, 0px) scale(${cardScale.toFixed(4)})`,
          filter: blurPx > 0.2 ? `blur(${blurPx.toFixed(1)}px)` : undefined,
          boxShadow:
            "0px 20px 48px rgba(0, 0, 0, 0.65), 0px 0px 24px rgba(254, 240, 138, 0.12)",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          zIndex: 15,
        }}
      >
        {photoSrc && (
          <img
            src={photoSrc}
            alt={`${keyPrefix} Card ${slotIdx + 1}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${imgScale.toFixed(4)})`,
            }}
          />
        )}

        {goldFlashOpacity > 0.01 && (
          <AbsoluteFill
            style={{
              background:
                "linear-gradient(135deg, rgba(254, 240, 138, 0.7) 0%, rgba(245, 158, 11, 0.28) 50%, transparent 100%)",
              opacity: goldFlashOpacity,
              mixBlendMode: "screen",
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    );
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#1f2024",
        overflow: "hidden",
        opacity: endFadeOut,
        fontFamily: "'Inter', 'Product Sans', -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: `${logoTopPx.toFixed(1)}px`,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          transform: `scale(${logoScale.toFixed(4)})`,
          transformOrigin: "center center",
          zIndex: 20,
        }}
      >
        <span
          style={{
            color: "#FFFFFF",
            fontSize: "126px",
            fontWeight: 600,
            letterSpacing: "-3.5px",
            lineHeight: 1,
          }}
        >
          Google
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          top: `${barTopPx.toFixed(1)}px`,
          left: "30px",
          right: "30px",
          height: "108px",
          borderRadius: "9999px",
          backgroundColor: "#303134",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 36px 0 42px",
          boxShadow: "0px 8px 28px rgba(0, 0, 0, 0.38)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          zIndex: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
            whiteSpace: "nowrap",
            paddingRight: "16px",
          }}
        >
          <span
            style={{
              color: "#e8eaed",
              fontSize: "34px",
              fontWeight: 400,
              letterSpacing: "-0.2px",
            }}
          >
            {visibleQuery}
          </span>
          <span
            style={{
              display: "inline-block",
              width: "3.5px",
              height: "42px",
              backgroundColor: "#8ab4f8",
              marginLeft: "3px",
              opacity: showCursor ? 1 : 0,
              borderRadius: "2px",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "28px",
            flexShrink: 0,
          }}
        >
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"
              fill="#4285F4"
            />
            <path
              d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"
              fill="#34A853"
            />
            <path
              d="M7 11H5c0 1.93.78 3.68 2.05 4.95l1.42-1.42C7.56 13.63 7 12.38 7 11z"
              fill="#FBBC05"
            />
            <path
              d="M12 16c-1.38 0-2.63-.56-3.53-1.47l-1.42 1.42A6.98 6.98 0 0 0 11 17.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2c0 2.76-2.24 5-5 5z"
              fill="#EA4335"
            />
          </svg>

          <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 3L7.17 5H4C2.9 5 2 5.9 2 7V10H4V7H8.12L9.95 5H14.05L15.88 7H20V10H22V7C22 5.9 21.1 5 20 5H16.83L15 3H9Z"
              fill="#FBBC05"
            />
            <path d="M4 14H2V19C2 20.1 2.9 21 4 21H9V19H4V14Z" fill="#4285F4" />
            <path
              d="M20 19H15V21H20C21.1 21 22 20.1 22 19V14H20V19Z"
              fill="#34A853"
            />
            <circle cx="12" cy="13" r="3.5" fill="#4285F4" />
            <circle cx="17.5" cy="17.5" r="2" fill="#EA4335" />
          </svg>
        </div>
      </div>

      {tabsOpacity > 0.01 && (
        <div
          style={{
            position: "absolute",
            top: "405px",
            left: "36px",
            right: "0px",
            opacity: tabsOpacity,
            transform: `translateY(${tabsTranslateY.toFixed(1)}px)`,
            display: "flex",
            alignItems: "center",
            gap: "44px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
            paddingBottom: "18px",
            paddingLeft: "10px",
            zIndex: 20,
          }}
        >
          {[
            { label: "All", active: true },
            { label: "Images", active: false },
            { label: "Short Videos", active: false },
            { label: "Videos", active: false },
            { label: "Shopping", active: false },
            { label: "News", active: false },
          ].map((tab) => (
            <div
              key={tab.label}
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  color: tab.active ? "#ffffff" : "#9aa0a6",
                  fontSize: "29px",
                  fontWeight: tab.active ? 600 : 500,
                  whiteSpace: "nowrap",
                }}
              >
                {tab.label}
              </span>
              {tab.active && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "-19px",
                    left: 0,
                    right: 0,
                    height: "5px",
                    backgroundColor: "#e8eaed",
                    borderRadius: "4px",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {wave1StartFrames.map((startF, slotIdx) =>
        renderBentoCard(
          photos[slotIdx] || null,
          slotIdx,
          startF,
          wave1FadeOutOpacity,
          wave1FadeOutScale,
          "wave1",
        ),
      )}

      {wave2StartFrames.map((startF, slotIdx) =>
        renderBentoCard(
          photos[slotIdx + 3] || null,
          slotIdx,
          startF,
          1,
          1,
          "wave2",
        ),
      )}

      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 75% 22%, rgba(254, 240, 138, 0.12) 0%, rgba(245, 158, 11, 0.06) 48%, transparent 75%)",
          mixBlendMode: "screen",
          pointerEvents: "none",
          zIndex: 25,
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * Pure B&W slow zoom + organic float with a soft radial edge falloff
 * (Frames 0 to 60). Avoids CSS maskImage gradients so web-renderer exports cleanly.
 */
export const RadialTunnelIntroFX: React.FC<{
  src: string | null;
  frame: number;
  grayscale?: boolean;
}> = ({ src, frame, grayscale = true }) => {
  if (frame < 0 || frame >= 60) return null;

  // Gradual scale-up from 1.0 to 1.08 over the 60-frame intro
  const zoomScale = interpolate(frame, [0, 60], [1.0, 1.08], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtle two-frequency float and gentle roll tilt
  const floatX =
    Math.sin(frame * 0.09) * 10 + Math.cos(frame * 0.18) * 3;
  const floatY =
    Math.cos(frame * 0.075) * 8 + Math.sin(frame * 0.16) * 2.5;
  const tiltDeg = Math.sin(frame * 0.06) * 0.6;

  // Brief exposure lift around the mid-intro beat
  const snapBrightness = interpolate(
    frame,
    [12, 16, 25, 34],
    [1.0, 1.26, 1.1, 1.0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const bwFilter = grayscale ? "grayscale(100%) contrast(1.08) " : "";

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translate3d(${floatX.toFixed(1)}px, ${floatY.toFixed(
            1,
          )}px, 0px) rotate(${tiltDeg.toFixed(2)}deg) scale(${zoomScale.toFixed(4)})`,
          filter: `${bwFilter}brightness(${snapBrightness.toFixed(2)})`,
          willChange: "transform, filter",
        }}
      >
        {src && (
          <img
            src={src}
            alt="Intro Hero"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </AbsoluteFill>

      {/* Soft dark vignette around frame edges */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 46%, transparent 48%, rgba(0, 0, 0, 0.72) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * Vintage film dust, light leaks, and vertical scratches overlay.
 */
export const VintageFilmOverlayFX: React.FC<{ frame: number }> = ({
  frame,
}) => {
  const showDustBurst = frame >= 48 && frame <= 62;
  const dustOpacity = showDustBurst
    ? interpolate(frame, [48, 55, 62], [0, 0.88, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  const cut1BurnOpacity =
    frame >= 58 && frame <= 76
      ? interpolate(frame, [58, 61, 68, 76], [0, 0.92, 0.48, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;

  const cut2LeakOpacity =
    frame >= 146 && frame <= 168
      ? interpolate(frame, [146, 151, 160, 168], [0, 0.85, 0.45, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;

  const cut3FlashOpacity =
    frame >= 208 && frame <= 224
      ? interpolate(frame, [208, 211, 217, 224], [0, 0.95, 0.4, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;

  const showVerticalScratches = frame >= 216 && frame <= 295;
  const scratchOpacity = showVerticalScratches
    ? interpolate(frame, [216, 225, 282, 295], [0, 0.72, 0.65, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  const scratch1X = 340 + Math.sin(frame * 0.45) * 48 + ((frame * 17) % 24);
  const scratch2X = 680 + Math.cos(frame * 0.38) * 35 - ((frame * 13) % 19);

  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 26 }}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 78% 18%, rgba(254, 240, 138, 0.18) 0%, rgba(245, 158, 11, 0.11) 42%, rgba(0, 0, 0, 0.34) 100%)",
          mixBlendMode: "screen",
        }}
      />

      {showDustBurst && (
        <svg
          viewBox="0 0 1080 1920"
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            inset: 0,
            opacity: dustOpacity,
            mixBlendMode: "screen",
          }}
        >
          <path
            d="M 140 520 Q 260 440 310 610"
            fill="none"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M 720 1180 Q 830 1260 790 1390"
            fill="none"
            stroke="rgba(254,240,138,0.8)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle
            cx={220 + ((frame * 43) % 580)}
            cy={380 + ((frame * 67) % 920)}
            r="6"
            fill="rgba(255,255,255,0.9)"
          />
          <circle
            cx={340 + ((frame * 79) % 520)}
            cy={520 + ((frame * 37) % 880)}
            r="4.5"
            fill="rgba(254,240,138,0.85)"
          />
          <circle
            cx={180 + ((frame * 53) % 690)}
            cy={740 + ((frame * 29) % 720)}
            r="5"
            fill="rgba(255,255,255,0.75)"
          />
        </svg>
      )}

      {cut1BurnOpacity > 0.01 && (
        <AbsoluteFill
          style={{
            opacity: cut1BurnOpacity,
            mixBlendMode: "screen",
            background:
              "radial-gradient(circle at 38% 42%, rgba(255, 255, 255, 0.98) 0%, rgba(224, 242, 254, 0.85) 28%, rgba(251, 191, 36, 0.72) 64%, rgba(245, 158, 11, 0.35) 100%)",
          }}
        />
      )}

      {cut2LeakOpacity > 0.01 && (
        <AbsoluteFill
          style={{
            opacity: cut2LeakOpacity,
            mixBlendMode: "screen",
            background:
              "linear-gradient(125deg, rgba(254, 240, 138, 0.92) 0%, rgba(251, 146, 60, 0.78) 45%, rgba(225, 29, 72, 0.32) 80%, transparent 100%)",
          }}
        />
      )}

      {cut3FlashOpacity > 0.01 && (
        <AbsoluteFill
          style={{
            opacity: cut3FlashOpacity,
            mixBlendMode: "screen",
            background:
              "radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.98) 0%, rgba(254, 240, 138, 0.85) 55%, rgba(245, 158, 11, 0.45) 100%)",
          }}
        />
      )}

      {showVerticalScratches && (
        <svg
          viewBox="0 0 1080 1920"
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            inset: 0,
            opacity: scratchOpacity,
            mixBlendMode: "screen",
          }}
        >
          <line
            x1={scratch1X}
            y1="0"
            x2={scratch1X + 4}
            y2="1920"
            stroke="rgba(255, 255, 255, 0.82)"
            strokeWidth="2.4"
            strokeDasharray="680 90 420 140 590 60"
            strokeDashoffset={(frame * 55) % 1200}
          />
          {frame % 3 !== 0 && (
            <line
              x1={scratch2X}
              y1="0"
              x2={scratch2X - 3}
              y2="1920"
              stroke="rgba(254, 240, 138, 0.58)"
              strokeWidth="1.6"
              strokeDasharray="480 240 560 180"
              strokeDashoffset={-(frame * 70) % 1000}
            />
          )}
          {frame % 4 === 0 && (
            <circle
              cx={scratch1X + 45}
              cy={420 + ((frame * 83) % 980)}
              r="4.5"
              fill="rgba(255, 255, 255, 0.8)"
            />
          )}
        </svg>
      )}
    </AbsoluteFill>
  );
};

/**
 * 3x3 tile grid that builds sequentially and transitions tiles from grayscale to color.
 */
interface GridColorRevealIntroProps {
  photos: (string | null)[];
  frame: number;
  endFrame?: number;
}

export const GridColorRevealIntroFX: React.FC<GridColorRevealIntroProps> = ({
  photos,
  frame,
  endFrame = 162,
}) => {
  const { fps } = useVideoConfig();
  if (frame < 0 || frame >= endFrame) return null;

  const breakoutScale = interpolate(
    frame,
    [endFrame - 8, endFrame],
    [1, 1.18],
    {
      easing: Easing.in(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const breakoutOpacity = interpolate(frame, [endFrame - 5, endFrame], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000",
        padding: "14px",
        opacity: breakoutOpacity,
        transform: `scale(${breakoutScale.toFixed(4)})`,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "repeat(3, 1fr)",
          gap: "12px",
        }}
      >
        {Array.from({ length: 9 }).map((_, idx) => {
          const appearFrame = idx * 9;
          if (frame < appearFrame) {
            return (
              <div
                key={idx}
                style={{
                  borderRadius: "24px",
                  backgroundColor: "#000000",
                }}
              />
            );
          }

          const localAppear = frame - appearFrame;
          const popSpring = spring({
            frame: localAppear,
            fps,
            config: { damping: 14, stiffness: 190, mass: 0.6 },
          });
          const tileScale = interpolate(popSpring, [0, 1], [0.86, 1.0]);
          const tileOpacity = interpolate(localAppear, [0, 4], [0, 1], {
            extrapolateRight: "clamp",
          });

          const colorStartFrame = 81 + idx * 9;
          const colorProgress = interpolate(
            frame,
            [colorStartFrame, colorStartFrame + 10],
            [0, 1],
            {
              easing: Easing.out(Easing.cubic),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );

          const grayscalePct = interpolate(colorProgress, [0, 1], [100, 0]);
          const contrastVal = interpolate(colorProgress, [0, 1], [1.12, 1.03]);
          const saturateVal = interpolate(colorProgress, [0, 1], [0, 1.15]);

          const colorPop =
            frame >= colorStartFrame && frame < colorStartFrame + 12
              ? interpolate(
                  frame - colorStartFrame,
                  [0, 4, 12],
                  [1, 1.035, 1],
                  { extrapolateRight: "clamp" },
                )
              : 1;

          const goldFlashOpacity =
            frame >= colorStartFrame && frame < colorStartFrame + 14
              ? interpolate(frame - colorStartFrame, [0, 3, 14], [0, 0.55, 0], {
                  extrapolateRight: "clamp",
                })
              : 0;

          const src = photos[idx] || null;

          return (
            <div
              key={idx}
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                borderRadius: "24px",
                overflow: "hidden",
                backgroundColor: "#111111",
                opacity: tileOpacity,
                transform: `scale(${(tileScale * colorPop).toFixed(4)})`,
                boxShadow:
                  colorProgress > 0.5
                    ? "0px 8px 25px rgba(245, 158, 11, 0.15)"
                    : "none",
                border:
                  colorProgress > 0.5
                    ? "1.5px solid rgba(254, 240, 138, 0.28)"
                    : "1px solid rgba(255, 255, 255, 0.12)",
              }}
            >
              {src && (
                <img
                  src={src}
                  alt={`Grid Tile ${idx + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: `grayscale(${grayscalePct.toFixed(
                      0,
                    )}%) contrast(${contrastVal.toFixed(
                      2,
                    )}) saturate(${saturateVal.toFixed(2)})`,
                  }}
                />
              )}

              {goldFlashOpacity > 0.01 && (
                <AbsoluteFill
                  style={{
                    background:
                      "radial-gradient(circle at 50% 50%, rgba(254, 240, 138, 0.85) 0%, rgba(245, 158, 11, 0.35) 60%, transparent 100%)",
                    opacity: goldFlashOpacity,
                    mixBlendMode: "screen",
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Beat-synced thumb motion curve configuration
const THUMB_DESIGN_OPTION: number = 3;
const THUMB_BEAT_MARKERS = [3, 17, 32, 46, 63, 75, 94, 105];
const TILT_LEFT_ANGLE = -42;
const UPRIGHT_ANGLE = 0;

function getThumbAngleAtFrame(t: number): number {
  let angle = TILT_LEFT_ANGLE;
  const swingDuration = 5.5;

  for (let i = 0; i < THUMB_BEAT_MARKERS.length; i++) {
    const startF = THUMB_BEAT_MARKERS[i];
    if (t >= startF) {
      const p = interpolate(t - startF, [0, swingDuration], [0, 1], {
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const delta = i % 2 === 0 ? -TILT_LEFT_ANGLE : TILT_LEFT_ANGLE;
      angle += delta * p;
    }
  }

  return angle;
}

function getCurvePoint(u: number): { x: number; y: number } {
  const inv = 1 - u;
  const x = inv * inv * 340 + 2 * inv * u * 510 + u * u * 760;
  const y = inv * inv * 1360 + 2 * inv * u * 1120 + u * u * 1020;
  return { x, y };
}

/**
 * Beat-driven thumb arc indicator with trailing motion echoes.
 */
export const ThumbBeatIntroFX: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < 0 || frame >= 122) return null;

  const currentAngle = getThumbAngleAtFrame(frame);
  const prevAngle = getThumbAngleAtFrame(frame - 1);
  const angularVelocity = currentAngle - prevAngle;
  const speedMagnitude = Math.min(1, Math.abs(angularVelocity) / 9);

  const normPos = interpolate(
    currentAngle,
    [TILT_LEFT_ANGLE, UPRIGHT_ANGLE],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const ghostOffsets = [0.45, 0.95, 1.55, 2.25];
  const ghostOpacities = [0.42, 0.28, 0.16, 0.08];

  const exitOpacity = interpolate(frame, [117, 122], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const textBeatScale = 1 + speedMagnitude * 0.025;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000",
        overflow: "hidden",
        opacity: exitOpacity,
        fontFamily: "'Inter', 'DM Sans', -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "410px",
          left: "92px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          transform: `scale(${textBeatScale.toFixed(3)})`,
          transformOrigin: "top left",
        }}
      >
        <span
          style={{
            color: "#FFFFFF",
            fontSize: "48px",
            fontWeight: 400,
            letterSpacing: "4px",
            lineHeight: 1.05,
            textTransform: "uppercase",
          }}
        >
          MOVE YOUR
        </span>
        <span
          style={{
            color: "#FFFFFF",
            fontSize: "118px",
            fontWeight: 900,
            letterSpacing: "2px",
            lineHeight: 0.96,
            textTransform: "uppercase",
            marginTop: "4px",
          }}
        >
          THUMB
        </span>
        <span
          style={{
            color: "rgba(255, 255, 255, 0.92)",
            fontSize: "40px",
            fontWeight: 400,
            letterSpacing: "1px",
            alignSelf: "flex-end",
            marginTop: "8px",
            paddingRight: "6px",
          }}
        >
          to the beat
        </span>
      </div>

      <svg
        viewBox="0 0 1080 1920"
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
        }}
      >
        <defs>
          <filter
            id="thumb-motion-smear"
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >
            <feGaussianBlur
              stdDeviation={`${(speedMagnitude * 14).toFixed(1)} ${(
                speedMagnitude * 7
              ).toFixed(1)}`}
            />
          </filter>
        </defs>

        {THUMB_DESIGN_OPTION >= 1 && (
          <>
            <path
              d="M 340 1360 Q 510 1120 760 1020"
              fill="none"
              stroke="rgba(255, 255, 255, 0.28)"
              strokeWidth="6"
              strokeDasharray="16 16"
              strokeLinecap="round"
            />
            <circle
              cx="340"
              cy="1360"
              r="52"
              fill="none"
              stroke={normPos < 0.2 ? "#FFFFFF" : "rgba(255,255,255,0.3)"}
              strokeWidth="4"
            />
            {normPos < 0.2 && (
              <circle
                cx="340"
                cy="1360"
                r={interpolate(normPos, [0, 0.2], [72, 110])}
                fill="none"
                stroke="rgba(255, 255, 255, 0.35)"
                strokeWidth="2.5"
              />
            )}
            <circle
              cx="760"
              cy="1020"
              r="52"
              fill="none"
              stroke={normPos > 0.8 ? "#FFFFFF" : "rgba(255,255,255,0.3)"}
              strokeWidth="4"
            />
            {normPos > 0.8 && (
              <circle
                cx="760"
                cy="1020"
                r={interpolate(normPos, [0.8, 1], [110, 72])}
                fill="none"
                stroke="rgba(255, 255, 255, 0.35)"
                strokeWidth="2.5"
              />
            )}

            {speedMagnitude > 0.05 &&
              ghostOffsets.map((offset, idx) => {
                const trailAngle = getThumbAngleAtFrame(frame - offset);
                const trailNorm = interpolate(
                  trailAngle,
                  [TILT_LEFT_ANGLE, UPRIGHT_ANGLE],
                  [0, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                );
                const pt = getCurvePoint(trailNorm);
                const r = 82 - idx * 12;
                return (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r={r}
                    fill={`rgba(255, 255, 255, ${(
                      ghostOpacities[idx] * speedMagnitude
                    ).toFixed(3)})`}
                    filter="url(#thumb-motion-smear)"
                  />
                );
              })}

            {(() => {
              const pt = getCurvePoint(normPos);
              const puckScale = 1 + speedMagnitude * 0.08;
              return (
                <g
                  transform={`translate(${pt.x.toFixed(1)}, ${pt.y.toFixed(
                    1,
                  )}) scale(${puckScale.toFixed(3)})`}
                  style={{
                    filter: "drop-shadow(0px 0px 28px rgba(255,255,255,0.65))",
                  }}
                >
                  <circle
                    r="86"
                    fill="#FFFFFF"
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="12"
                  />
                  <path
                    d="M -28 -10 A 28 28 0 0 1 28 -10 M -42 6 A 42 42 0 0 1 42 6 M -14 22 A 18 18 0 0 1 14 22"
                    fill="none"
                    stroke="#09090b"
                    strokeWidth="5.5"
                    strokeLinecap="round"
                  />
                </g>
              );
            })()}
          </>
        )}
      </svg>
    </AbsoluteFill>
  );
};

// Module-level image cache so offscreen canvas pixelation stays instant across frames
const loadedImageCache = new Map<string, HTMLImageElement>();

/**
 * Simulated resolution selector stepping from low-res pixelated canvas to HD wipe.
 */
export const PixelResolutionIntroFX: React.FC<{
  src: string | null;
  frame: number;
}> = ({ src, frame }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(() =>
    src ? loadedImageCache.get(src) || null : null,
  );

  const OPTIONS = ["144p", "240p", "720p", "1080p"];

  let stage = 0;
  let stageLocal = frame;
  if (frame >= 95) {
    stage = 2;
    stageLocal = frame - 95;
  } else if (frame >= 45) {
    stage = 1;
    stageLocal = frame - 45;
  }

  const pixelW = stage === 0 ? 45 : stage === 1 ? 90 : 216;
  const pixelH = stage === 0 ? 80 : stage === 1 ? 160 : 384;
  const fallbackBlurPx = stage === 0 ? 18 : stage === 1 ? 9 : 3;

  // Delay Remotion render until the source image finishes decoding
  useEffect(() => {
    if (!src) return;
    const cached = loadedImageCache.get(src);
    if (cached && cached.complete && cached.naturalWidth > 0) {
      setImgElement(cached);
      return;
    }

    const handle = delayRender(`Loading pixel intro image: ${src}`);
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      loadedImageCache.set(src, img);
      setImgElement(img);
      continueRender(handle);
    };
    img.onerror = () => {
      continueRender(handle);
    };
    img.src = src;
  }, [src]);

  // Draw cover-fitted image onto low-res canvas with smoothing disabled
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgElement || !imgElement.naturalWidth) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imgRatio = imgElement.naturalWidth / imgElement.naturalHeight;
    const canvasRatio = pixelW / pixelH;
    let drawW = pixelW;
    let drawH = pixelH;
    let offsetX = 0;
    let offsetY = 0;

    if (imgRatio > canvasRatio) {
      drawH = pixelH;
      drawW = pixelH * imgRatio;
      offsetX = (pixelW - drawW) / 2;
    } else {
      drawW = pixelW;
      drawH = pixelW / imgRatio;
      offsetY = (pixelH - drawH) / 2;
    }

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, pixelW, pixelH);
    ctx.drawImage(imgElement, offsetX, offsetY, drawW, drawH);
  }, [imgElement, pixelW, pixelH, stage]);

  if (frame < 0 || frame >= 150) return null;

  const currentLabel = OPTIONS[stage];
  const targetOptionIndex = stage + 1;
  const isMenuOpen = stageLocal >= 12 && stageLocal < 40;

  const buttonCenterX = 245;
  const buttonCenterY = 805;
  const optionRowY = 890 + targetOptionIndex * 76;
  const startX = stage === 0 ? 430 : 255;
  const startY = stage === 0 ? 1050 : 890 + stage * 76;

  let cursorX = buttonCenterX;
  let cursorY = buttonCenterY;

  if (stageLocal < 11) {
    const p = interpolate(stageLocal, [0, 11], [0, 1], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    cursorX = interpolate(p, [0, 1], [startX, buttonCenterX]);
    cursorY = interpolate(p, [0, 1], [startY, buttonCenterY]);
  } else if (stageLocal < 16) {
    cursorX = buttonCenterX;
    cursorY = buttonCenterY;
  } else if (stageLocal < 33) {
    const p = interpolate(stageLocal, [16, 33], [0, 1], {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    cursorX = interpolate(p, [0, 1], [buttonCenterX, buttonCenterX + 12]);
    cursorY = interpolate(p, [0, 1], [buttonCenterY, optionRowY]);
  } else {
    cursorX = buttonCenterX + 12;
    cursorY = optionRowY;
  }

  const isClickingButton = stageLocal >= 10 && stageLocal <= 14;
  const isClickingOption = stageLocal >= 35 && stageLocal <= 40;
  const cursorScale = isClickingButton || isClickingOption ? 0.84 : 1.0;
  const hoveredIdx = isMenuOpen && stageLocal >= 24 ? targetOptionIndex : stage;

  const isWipingTo1080p = frame >= 136;
  const wipeProgress = interpolate(frame, [136, 150], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const wipeXPercent = interpolate(wipeProgress, [0, 1], [-15, 115]);

  const uiOpacity = interpolate(frame, [135, 143], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000", overflow: "hidden" }}>
      {src && (
        <AbsoluteFill
          style={{
            filter: `blur(${fallbackBlurPx}px)`,
            transform: "scale(1.06)",
          }}
        >
          <img
            src={src}
            alt="Fallback Base"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ transform: "scale(1.02)" }}>
        <canvas
          ref={canvasRef}
          width={pixelW}
          height={pixelH}
          style={{
            width: "100%",
            height: "100%",
            imageRendering: "pixelated",
          }}
        />
      </AbsoluteFill>
      {isWipingTo1080p && (
        <>
          <AbsoluteFill
            style={{
              clipPath: `inset(0% ${Math.max(0, 100 - wipeXPercent).toFixed(
                1,
              )}% 0% 0%)`,
              transform: "scale(1.02)",
            }}
          >
            {src && (
              <img
                src={src}
                alt="1080p HD"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
          </AbsoluteFill>
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${wipeXPercent.toFixed(2)}%`,
              width: "140px",
              transform: "translateX(-50%)",
              background:
                "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(254,240,138,0.65) 30%, rgba(255,255,255,0.98) 50%, rgba(254,240,138,0.65) 70%, rgba(255,255,255,0) 100%)",
              filter: "blur(8px)",
              mixBlendMode: "screen",
              pointerEvents: "none",
              zIndex: 30,
            }}
          />
        </>
      )}
      {uiOpacity > 0.01 && (
        <AbsoluteFill
          style={{
            opacity: uiOpacity,
            pointerEvents: "none",
            zIndex: 25,
            fontFamily:
              "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "125px",
              top: "765px",
              width: "245px",
            }}
          >
            <div
              style={{
                height: "78px",
                backgroundColor: "rgba(226, 228, 233, 0.94)",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 24px",
                boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.45)",
                border: "1px solid rgba(255, 255, 255, 0.6)",
                transform: isClickingButton ? "scale(0.97)" : "scale(1)",
              }}
            >
              <span
                style={{
                  color: "#1e2028",
                  fontSize: "38px",
                  fontWeight: 500,
                  letterSpacing: "-0.5px",
                }}
              >
                {currentLabel}
              </span>
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2e313d"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: isMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            {isMenuOpen && (
              <div
                style={{
                  marginTop: "6px",
                  backgroundColor: "rgba(226, 228, 233, 0.96)",
                  borderRadius: "4px",
                  overflow: "hidden",
                  boxShadow: "0px 14px 34px rgba(0, 0, 0, 0.55)",
                  border: "1px solid rgba(255, 255, 255, 0.5)",
                }}
              >
                {OPTIONS.map((opt, idx) => {
                  const isHighlighted = idx === hoveredIdx;
                  return (
                    <div
                      key={opt}
                      style={{
                        height: "76px",
                        display: "flex",
                        alignItems: "center",
                        padding: "0 24px",
                        backgroundColor: isHighlighted
                          ? "#283054"
                          : "transparent",
                      }}
                    >
                      <span
                        style={{
                          color: isHighlighted ? "#ffffff" : "#1e2028",
                          fontSize: "38px",
                          fontWeight: 500,
                          letterSpacing: "-0.5px",
                        }}
                      >
                        {opt}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div
            style={{
              position: "absolute",
              left: `${cursorX.toFixed(1)}px`,
              top: `${cursorY.toFixed(1)}px`,
              transform: `scale(${cursorScale})`,
              transformOrigin: "top left",
              filter: "drop-shadow(0px 6px 12px rgba(0, 0, 0, 0.65))",
              zIndex: 40,
            }}
          >
            <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
              <path
                d="M7 4L26 15.5L16.5 18L21 27L17.5 28.5L13 19.5L7 25V4Z"
                fill="#FFFFFF"
                stroke="#111111"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

/**
 * Staggered multi-card collage entrance with subtle ambient drift.
 */
interface LayeredCollageIntroProps {
  photos: (string | null)[];
  frame: number;
  startFrames?: number[];
  endFrame?: number;
}

export const LayeredCollageIntroFX: React.FC<LayeredCollageIntroProps> = ({
  photos,
  frame,
  startFrames = [0, 39, 81, 120, 186],
  endFrame = 266,
}) => {
  const { fps } = useVideoConfig();
  if (frame < 0 || frame >= endFrame) return null;

  const cards = [
    {
      top: "0%",
      left: "0%",
      width: "65%",
      height: "51%",
      rotateBase: -1.2,
      zIndex: 1,
    },
    {
      top: "5%",
      right: "0%",
      width: "56%",
      height: "49%",
      rotateBase: 1.4,
      zIndex: 2,
    },
    {
      top: "21%",
      left: "4%",
      width: "60%",
      height: "49%",
      rotateBase: -0.8,
      zIndex: 3,
    },
    {
      top: "46%",
      right: "2%",
      width: "56%",
      height: "47%",
      rotateBase: 1.1,
      zIndex: 4,
    },
    {
      bottom: "0%",
      left: "0%",
      width: "54%",
      height: "45%",
      rotateBase: -1.0,
      zIndex: 5,
    },
  ];

  const collageExitOpacity = interpolate(
    frame,
    [endFrame - 24, endFrame - 6],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const collageExitScale = interpolate(
    frame,
    [endFrame - 26, endFrame],
    [1, 1.06],
    {
      easing: Easing.inOut(Easing.quad),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#040404",
        opacity: collageExitOpacity,
        transform: `scale(${collageExitScale.toFixed(4)})`,
      }}
    >
      {cards.map((card, idx) => {
        const startF = startFrames[idx] ?? idx * 35;
        if (frame < startF) return null;

        const localF = frame - startF;
        const src = photos[idx] || null;
        const enterSpring = spring({
          frame: localF,
          fps,
          config: { damping: 16, stiffness: 110, mass: 0.85 },
        });
        const opacity = interpolate(localF, [0, 12], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const blurPx = interpolate(localF, [0, 14], [12, 0], {
          easing: Easing.out(Easing.cubic),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const brightness = interpolate(localF, [0, 4, 16], [1.45, 1.25, 1.0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const translateY = interpolate(enterSpring, [0, 1], [36, 0]);
        const cardScale = interpolate(enterSpring, [0, 1], [0.88, 1.0]);
        const floatY = Math.sin(localF * 0.08 + idx * 1.7) * 4.5;
        const floatX = Math.cos(localF * 0.07 + idx * 2.1) * 3.5;
        const innerImgScale = interpolate(localF, [0, 180], [1.08, 1.01], {
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={idx}
            style={{
              position: "absolute",
              top: card.top,
              bottom: card.bottom,
              left: card.left,
              right: card.right,
              width: card.width,
              height: card.height,
              zIndex: card.zIndex,
              opacity,
              transform: `translate3d(${floatX.toFixed(1)}px, ${(
                translateY + floatY
              ).toFixed(1)}px, 0px) scale(${cardScale.toFixed(
                4,
              )}) rotate(${card.rotateBase}deg)`,
              borderRadius: "18px",
              overflow: "hidden",
              boxShadow:
                "0px 24px 60px rgba(0, 0, 0, 0.9), 0px 0px 28px rgba(245, 158, 11, 0.16)",
              border: "1.5px solid rgba(254, 240, 138, 0.25)",
              filter: `blur(${blurPx.toFixed(1)}px) brightness(${brightness.toFixed(2)})`,
              backgroundColor: "#111",
            }}
          >
            {src && (
              <img
                src={src}
                alt={`Collage ${idx + 1}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: `scale(${innerImgScale.toFixed(4)})`,
                }}
              />
            )}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/**
 * Four-step silent/airplane-mode UI intro sequence (15 frames per step).
 */
export const SilentModeIntroFX: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  if (frame < 0 || frame >= 60) return null;

  const stepIndex = Math.min(3, Math.floor(frame / 15));
  const stepLocal = frame - stepIndex * 15;
  const brightnessOpacity = interpolate(
    stepLocal,
    [0, 5, 12, 15],
    [0.25, 1, 1, 0.85],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const popSpring = spring({
    frame: stepLocal,
    fps,
    config: { damping: 14, stiffness: 160, mass: 0.6 },
  });
  const scale = interpolate(popSpring, [0, 1], [0.9, 1.0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          opacity: brightnessOpacity,
          transform: `scale(${scale.toFixed(3)})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {stepIndex === 0 && (
          <svg
            width="230"
            height="230"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 8.82a15 15 0 0 1 20 0" />
            <path d="M5 12.859a10 10 0 0 1 14 0" />
            <path d="M8.5 16.429a5 5 0 0 1 7 0" />
            <circle cx="12" cy="20" r="1" fill="#FFFFFF" />
            <line x1="3" y1="3" x2="21" y2="21" strokeWidth="2.1" />
          </svg>
        )}
        {stepIndex === 1 && (
          <div
            style={{
              width: "240px",
              height: "240px",
              borderRadius: "9999px",
              border: "7px solid #FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="135"
              height="135"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon
                points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"
                fill="#FFFFFF"
              />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              <line x1="3" y1="3" x2="21" y2="21" strokeWidth="2.3" />
            </svg>
          </div>
        )}
        {stepIndex === 2 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <svg
              width="195"
              height="195"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                fill="#FFFFFF"
              />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              <line
                x1="3"
                y1="3"
                x2="21"
                y2="21"
                stroke="#FFFFFF"
                strokeWidth="2.3"
              />
            </svg>
            <span
              style={{ color: "#FFFFFF", fontSize: "48px", fontWeight: 500 }}
            >
              Silent
            </span>
          </div>
        )}
        {stepIndex === 3 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "22px",
            }}
          >
            <span
              style={{
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: "34px",
                fontWeight: 500,
              }}
            >
              Airplane Mode
            </span>
            <div
              style={{
                width: "340px",
                height: "150px",
                borderRadius: "9999px",
                backgroundColor: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 20px 0 42px",
              }}
            >
              <span
                style={{ color: "#09090b", fontSize: "52px", fontWeight: 700 }}
              >
                On
              </span>
              <div
                style={{
                  width: "114px",
                  height: "114px",
                  borderRadius: "9999px",
                  backgroundColor: "#141414",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="62"
                  height="62"
                  viewBox="0 0 24 24"
                  fill="#FFFFFF"
                  style={{ transform: "rotate(45deg)" }}
                >
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

/**
 * Horizontal slice bands that assemble sequentially with blur-to-sharp motion.
 */
interface StaggeredSliceBuildProps {
  src: string | null;
  frame: number;
  sliceStartFrames: number[];
}

export const StaggeredSliceBuildFX: React.FC<StaggeredSliceBuildProps> = ({
  src,
  frame,
  sliceStartFrames,
}) => {
  const numSlices = sliceStartFrames.length;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {sliceStartFrames.map((startF, idx) => {
        if (frame < startF) return null;

        const localF = frame - startF;
        const topPct = (idx * 100) / numSlices;
        const bottomPct = 100 - ((idx + 1) * 100) / numSlices;
        const blurX = interpolate(localF, [0, 9], [36, 0], {
          easing: Easing.out(Easing.cubic),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const translateX = interpolate(localF, [0, 8], [45, 0], {
          easing: Easing.out(Easing.cubic),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const sliceOpacity = interpolate(localF, [0, 4], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const filterId = `slice-blur-${idx}`;

        return (
          <React.Fragment key={idx}>
            {blurX > 0.5 && (
              <svg width="0" height="0" style={{ position: "absolute" }}>
                <defs>
                  <filter id={filterId}>
                    <feGaussianBlur stdDeviation={`${blurX.toFixed(1)} 0`} />
                  </filter>
                </defs>
              </svg>
            )}
            <AbsoluteFill
              style={{
                clipPath: `inset(${topPct.toFixed(2)}% 0% ${bottomPct.toFixed(2)}% 0%)`,
                opacity: sliceOpacity,
                transform: `translateX(${translateX.toFixed(1)}px)`,
                filter: blurX > 0.5 ? `url(#${filterId})` : undefined,
              }}
            >
              {src && (
                <img
                  src={src}
                  alt={`Slice ${idx + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
            </AbsoluteFill>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

/**
 * Spring-animated overlay that settles into a full-screen scale reveal.
 */
interface PopUpOverlayProps {
  src: string | null;
  frame: number;
  popStartFrame: number;
  fullRevealFrame: number;
}

export const PopUpOverlayFX: React.FC<PopUpOverlayProps> = ({
  src,
  frame,
  popStartFrame,
  fullRevealFrame,
}) => {
  const { fps } = useVideoConfig();
  if (!src || frame < popStartFrame) return null;

  if (frame >= fullRevealFrame) {
    const settleLocal = frame - fullRevealFrame;
    const scale = interpolate(settleLocal, [0, 20], [1.03, 1.0], {
      extrapolateRight: "clamp",
    });
    return (
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        <img
          src={src}
          alt="Full Slide"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
    );
  }

  const popLocal = frame - popStartFrame;
  const popSpring = spring({
    frame: popLocal,
    fps,
    config: { damping: 13, stiffness: 150, mass: 0.7 },
  });

  return (
    <AbsoluteFill style={{ opacity: popSpring }}>
      <img
        src={src}
        alt="Pop Up"
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </AbsoluteFill>
  );
};

/**
 * Slide container with fade-in/out, optional letterbox framing, and gyro/handheld motion.
 */
interface DipToBlackSlideProps {
  src: string | null;
  localFrame: number;
  slotDuration: number;
  fadeInFrames?: number;
  fadeOutFrames?: number;
  letterbox?: boolean;
  letterboxInsetPercent?: number;
  motion?: SlideMotionPreset;
  seed?: number;
  children?: React.ReactNode;
}

export const DipToBlackSlideFX: React.FC<DipToBlackSlideProps> = ({
  src,
  localFrame,
  slotDuration,
  fadeInFrames = 11,
  fadeOutFrames = 11,
  letterbox = true,
  letterboxInsetPercent = 12,
  motion = "gyro-float",
  seed = 0,
  children,
}) => {
  const fadeIn = interpolate(localFrame, [0, fadeInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    localFrame,
    [Math.max(fadeInFrames, slotDuration - fadeOutFrames), slotDuration],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const opacity = fadeIn * fadeOut;
  const phase = seed * 2.35 + 0.7;
  let imageTransform = "scale(1)";

  if (motion === "gyro-float") {
    const floatX =
      Math.sin(localFrame * 0.14 + phase) * 15 +
      Math.cos(localFrame * 0.27 + phase * 1.4) * 6;
    const floatY =
      Math.cos(localFrame * 0.11 + phase * 1.2) * 13 +
      Math.sin(localFrame * 0.23 + phase) * 5;
    const rotZ =
      Math.sin(localFrame * 0.12 + phase * 0.9) * 1.15 +
      Math.cos(localFrame * 0.25 + phase) * 0.35;
    const rotX = Math.cos(localFrame * 0.13 + phase) * 2.4;
    const rotY = Math.sin(localFrame * 0.11 + phase * 1.6) * 2.8;
    const breathScale = 1.09 + Math.sin(localFrame * 0.08 + phase) * 0.015;

    imageTransform = `perspective(1000px) translate3d(${floatX.toFixed(
      2,
    )}px, ${floatY.toFixed(2)}px, 0px) rotateX(${rotX.toFixed(
      2,
    )}deg) rotateY(${rotY.toFixed(2)}deg) rotateZ(${rotZ.toFixed(
      2,
    )}deg) scale(${breathScale.toFixed(4)})`;
  } else if (motion === "handheld-shake") {
    const shakeX =
      Math.sin(localFrame * 0.32 + phase) * 12 +
      Math.cos(localFrame * 0.19 + phase * 2.1) * 8;
    const shakeY =
      Math.cos(localFrame * 0.28 + phase * 1.3) * 11 +
      Math.sin(localFrame * 0.17 + phase) * 7;
    const rotZ = Math.sin(localFrame * 0.24 + phase) * 1.45;

    imageTransform = `translate3d(${shakeX.toFixed(2)}px, ${shakeY.toFixed(
      2,
    )}px, 0px) rotateZ(${rotZ.toFixed(2)}deg) scale(1.09)`;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000", opacity }}>
      <div
        style={{
          position: "absolute",
          top: letterbox ? `${letterboxInsetPercent}%` : "0%",
          bottom: letterbox ? `${letterboxInsetPercent}%` : "0%",
          left: 0,
          right: 0,
          overflow: "hidden",
          backgroundColor: "#0a0a0a",
        }}
      >
        {src ? (
          <img
            src={src}
            alt="Slide"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: imageTransform,
              transformOrigin: "center center",
              willChange: "transform",
            }}
          />
        ) : (
          <AbsoluteFill
            style={{
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#141414",
            }}
          >
            <span
              style={{
                color: "#E5A93C",
                fontSize: "36px",
                fontWeight: 600,
              }}
            >
              Upload 6 Photos
            </span>
          </AbsoluteFill>
        )}
      </div>
      {children}
    </AbsoluteFill>
  );
};

/**
 * Brief white flash and ripple overlay driven by normalized progress (0..1).
 */
export const InkShockwaveOverlay: React.FC<{ progress: number }> = ({
  progress,
}) => {
  if (progress <= 0 || progress >= 1) return null;

  const whiteFlashOpacity = interpolate(
    progress,
    [0, 0.08, 0.28],
    [0, 0.92, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const rippleOpacity = interpolate(
    progress,
    [0.05, 0.2, 0.65, 1],
    [0, 0.75, 0.4, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 28 }}>
      {whiteFlashOpacity > 0 && (
        <AbsoluteFill
          style={{
            backgroundColor: "#ffffff",
            opacity: whiteFlashOpacity,
          }}
        />
      )}
      {rippleOpacity > 0 && (
        <AbsoluteFill
          style={{
            opacity: rippleOpacity,
            justifyContent: "center",
            alignItems: "center",
            mixBlendMode: "screen",
          }}
        />
      )}
    </AbsoluteFill>
  );
};
