import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Img,
} from "remotion";
import { CameraMovement, SlideTransition } from "../types/reel";

interface DynamicSlideProps {
  imageUrl: string;
  slideIndex: number;
  allImageUrls: string[];
  cameraMovement: CameraMovement;
  transition: SlideTransition;
}

export const DynamicSlide: React.FC<DynamicSlideProps> = ({
  imageUrl,
  slideIndex,
  allImageUrls,
  cameraMovement,
  transition,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const introSpring = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 100 },
  });

  const bounceSpring = spring({
    frame,
    fps,
    config: { damping: 11, mass: 0.7, stiffness: 130 },
  });

  const drift = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateRight: "clamp",
  });

  // ==========================================
  // CONTINUOUS DRIFT CAMERA MOVEMENTS
  // ==========================================
  let motionTransform = "";
  switch (cameraMovement) {
    case "parallaxDepthPush": {
      const scale = interpolate(drift, [0, 1], [1.05, 1.18]);
      const x = interpolate(drift, [0, 1], [-2.0, 2.0]);
      const y = interpolate(drift, [0, 1], [1.5, -1.2]);
      const rotX = interpolate(drift, [0, 1], [1.2, -0.6]);
      const rotY = interpolate(drift, [0, 1], [-1.8, 1.4]);
      motionTransform = `perspective(1000px) scale(${scale}) translate(${x}%, ${y}%) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      break;
    }
    case "vertigoWarp": {
      const scale = interpolate(drift, [0, 1], [1.2, 1.05]);
      const z = interpolate(drift, [0, 1], [-260, 30]);
      motionTransform = `perspective(850px) translateZ(${z}px) scale(${scale})`;
      break;
    }
    case "droneFlyover": {
      const scale = interpolate(drift, [0, 1], [1.05, 1.18]);
      const y = interpolate(drift, [0, 1], [3.5, -2.5]);
      const pitch = interpolate(drift, [0, 1], [4.0, 0.5]);
      motionTransform = `perspective(1000px) scale(${scale}) translateY(${y}%) rotateX(${pitch}deg)`;
      break;
    }
    case "lowAngleJibPush": {
      const scale = interpolate(drift, [0, 1], [1.06, 1.2]);
      const y = interpolate(drift, [0, 1], [4.0, -1.8]);
      const pitch = interpolate(drift, [0, 1], [-3.5, 0.5]);
      motionTransform = `perspective(1000px) scale(${scale}) translateY(${y}%) rotateX(${pitch}deg)`;
      break;
    }
    case "arcSweepReveal": {
      const scale = interpolate(drift, [0, 1], [1.05, 1.16]);
      const x = -3.0 + Math.sin(drift * Math.PI * 0.5) * 5.5;
      const y = 2.5 - (1 - Math.cos(drift * Math.PI * 0.5)) * 4.5;
      const rot = interpolate(drift, [0, 1], [-1.5, 1.0]);
      motionTransform = `scale(${scale}) translate(${x}%, ${y}%) rotate(${rot}deg)`;
      break;
    }
    case "spiralDive": {
      const scale = interpolate(drift, [0, 1], [1.04, 1.2]);
      const rot = interpolate(drift, [0, 1], [0, 4.0]);
      const x = Math.sin(drift * Math.PI * 1.5) * 1.6;
      const y = Math.cos(drift * Math.PI * 1.5) * 1.0;
      motionTransform = `scale(${scale}) translate(${x}%, ${y}%) rotate(${rot}deg)`;
      break;
    }
    case "sCurvePan": {
      const sProgress =
        drift < 0.5
          ? 4 * drift * drift * drift
          : 1 - Math.pow(-2 * drift + 2, 3) / 2;
      const scale = 1.12;
      const x = interpolate(sProgress, [0, 1], [-3.5, 3.5]);
      const roll = interpolate(sProgress, [0, 0.5, 1], [0, -1.2, 0]);
      motionTransform = `scale(${scale}) translateX(${x}%) rotate(${roll}deg)`;
      break;
    }
    case "craneRise": {
      const scale = interpolate(drift, [0, 1], [1.14, 1.04]);
      const y = interpolate(drift, [0, 1], [-3.0, 3.0]);
      motionTransform = `scale(${scale}) translateY(${y}%)`;
      break;
    }
    case "handheldBreathing": {
      const timeInSec = frame / fps;
      const swayX = Math.sin(timeInSec * 1.6) * 1.0;
      const swayY = Math.cos(timeInSec * 1.2) * 0.8;
      const roll = Math.sin(timeInSec * 1.0) * 0.35;
      const breatheScale = 1.08 + Math.sin(timeInSec * 0.9) * 0.025;
      motionTransform = `scale(${breatheScale}) translate(${swayX}%, ${swayY}%) rotate(${roll}deg)`;
      break;
    }
    case "steadicamGlide": {
      const t = (frame / fps) * 2.2;
      const stepX = Math.sin(t) * 1.0;
      const stepY = Math.abs(Math.sin(t)) * 0.6 - 0.3;
      const push = interpolate(drift, [0, 1], [1.04, 1.16]);
      const roll = Math.sin(t * 0.5) * 0.4;
      motionTransform = `scale(${push}) translate(${stepX}%, ${stepY}%) rotate(${roll}deg)`;
      break;
    }
    case "zeroGFloat": {
      const t = frame / fps;
      const x = Math.sin(t * 0.8) * 2.0;
      const y = Math.cos(t * 1.1) * 1.5;
      const rot = Math.sin(t * 0.6) * 1.2;
      const zoom = 1.1 + Math.sin(t * 0.95) * 0.035;
      motionTransform = `scale(${zoom}) translate(${x}%, ${y}%) rotate(${rot}deg)`;
      break;
    }
    case "orbitalDrift": {
      const scale = interpolate(drift, [0, 1], [1.12, 1.05]);
      const x = interpolate(drift, [0, 1], [-2.0, 2.0]);
      const y = interpolate(drift, [0, 1], [1.2, -1.2]);
      const rot = interpolate(drift, [0, 1], [-0.7, 0.7]);
      motionTransform = `scale(${scale}) translate(${x}%, ${y}%) rotate(${rot}deg)`;
      break;
    }
    case "dutchAngleRoll": {
      const scale = interpolate(drift, [0, 1], [1.1, 1.16]);
      const rot = interpolate(drift, [0, 1], [-2.0, 1.6]);
      motionTransform = `scale(${scale}) rotate(${rot}deg)`;
      break;
    }
    case "slowZoomIn":
    default: {
      const scale = interpolate(drift, [0, 1], [1.02, 1.16]);
      motionTransform = `scale(${scale})`;
      break;
    }
  }

  // ==========================================
  // STANDARD ENTRANCE TRANSITIONS
  // ==========================================
  let standardTransitionTransform = "";
  let borderRadius = "0px";
  let opacity = 1;
  let filter = "none";
  let shadow = "none";
  let flashOpacity = 0;

  switch (transition) {
    case "spiralVortex": {
      const rot = interpolate(introSpring, [0, 1], [-180, 0]);
      const scale = interpolate(introSpring, [0, 1], [0.2, 1]);
      opacity = interpolate(frame, [0, 12], [0, 1], {
        extrapolateRight: "clamp",
      });
      const blurVal = interpolate(frame, [0, 6, 16], [12, 4, 0], {
        extrapolateRight: "clamp",
      });
      standardTransitionTransform = `scale(${scale}) rotate(${rot}deg)`;
      filter = `blur(${blurVal}px)`;
      break;
    }
    case "opticalDissolve": {
      opacity = interpolate(frame, [0, 16], [0, 1], {
        extrapolateRight: "clamp",
      });
      const contrast = interpolate(frame, [0, 8, 16], [1.7, 1.25, 1], {
        extrapolateRight: "clamp",
      });
      const brightness = interpolate(frame, [0, 8, 16], [1.3, 1.1, 1], {
        extrapolateRight: "clamp",
      });
      const scale = interpolate(introSpring, [0, 1], [1.08, 1]);
      standardTransitionTransform = `scale(${scale})`;
      filter = `contrast(${contrast}) brightness(${brightness})`;
      break;
    }
    case "exposureGlow": {
      flashOpacity = interpolate(frame, [0, 4, 16], [0, 0.9, 0], {
        extrapolateRight: "clamp",
      });
      const brightness = interpolate(frame, [0, 4, 16], [1, 2.2, 1], {
        extrapolateRight: "clamp",
      });
      const scale = interpolate(introSpring, [0, 1], [1.12, 1]);
      opacity = interpolate(frame, [0, 8], [0, 1], {
        extrapolateRight: "clamp",
      });
      standardTransitionTransform = `scale(${scale})`;
      filter = `brightness(${brightness})`;
      break;
    }
    case "flip3D": {
      const rotateY = interpolate(introSpring, [0, 1], [-75, 0]);
      const zTranslate = interpolate(introSpring, [0, 1], [-300, 0]);
      const scale = interpolate(introSpring, [0, 1], [0.85, 1]);
      const rVal = interpolate(introSpring, [0, 0.9, 1], [30, 4, 0]);
      standardTransitionTransform = `perspective(1200px) translateZ(${zTranslate}px) rotateY(${rotateY}deg) scale(${scale})`;
      borderRadius = `${rVal}px`;
      if (frame < 18) shadow = "0 30px 60px rgba(0,0,0,0.7)";
      break;
    }
    case "whipZoom": {
      const scaleFactor = interpolate(introSpring, [0, 1], [2.2, 1]);
      const blurVal = interpolate(frame, [0, 8, 16], [8, 2, 0], {
        extrapolateRight: "clamp",
      });
      standardTransitionTransform = `scale(${scaleFactor})`;
      filter = `blur(${blurVal}px)`;
      break;
    }
    case "zoomFade": {
      const scale = interpolate(introSpring, [0, 1], [1.32, 1]);
      opacity = interpolate(frame, [0, 14], [0, 1], {
        extrapolateRight: "clamp",
      });
      standardTransitionTransform = `scale(${scale})`;
      break;
    }
    case "dropBounce": {
      const yPos = interpolate(bounceSpring, [0, 1], [-105, 0]);
      const rVal = interpolate(bounceSpring, [0, 0.85, 1], [24, 6, 0]);
      standardTransitionTransform = `translateY(${yPos}%)`;
      borderRadius = `${rVal}px`;
      if (frame < 18) shadow = "0 20px 45px rgba(0,0,0,0.65)";
      break;
    }
    case "slideLeft": {
      const xPos = interpolate(introSpring, [0, 1], [100, 0]);
      standardTransitionTransform = `translateX(${xPos}%)`;
      break;
    }
    case "slideRight": {
      const xPos = interpolate(introSpring, [0, 1], [-100, 0]);
      standardTransitionTransform = `translateX(${xPos}%)`;
      break;
    }
    case "slideUp": {
      const yPos = interpolate(introSpring, [0, 1], [100, 0]);
      standardTransitionTransform = `translateY(${yPos}%)`;
      break;
    }
    case "skewSlide": {
      const xPos = interpolate(introSpring, [0, 1], [100, 0]);
      const skew = interpolate(introSpring, [0, 1], [-12, 0]);
      standardTransitionTransform = `translateX(${xPos}%) skewX(${skew}deg)`;
      break;
    }
    case "spinZoom": {
      const rot = interpolate(introSpring, [0, 1], [-35, 0]);
      const scale = interpolate(introSpring, [0, 1], [0.55, 1]);
      opacity = interpolate(frame, [0, 12], [0, 1], {
        extrapolateRight: "clamp",
      });
      standardTransitionTransform = `scale(${scale}) rotate(${rot}deg)`;
      break;
    }
    case "crossFade": {
      opacity = interpolate(frame, [0, 15], [0, 1], {
        extrapolateRight: "clamp",
      });
      break;
    }
    case "none":
    default:
      break;
  }

  const prevImageUrl =
    slideIndex > 0 ? allImageUrls[slideIndex - 1] : undefined;
  const isUnderlayTransition = [
    "flip3D",
    "dropBounce",
    "spinZoom",
    "spiralVortex",
    "skewSlide",
  ].includes(transition);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      {isUnderlayTransition && frame < 20 && prevImageUrl && (
        <AbsoluteFill
          style={{
            transform: "scale(1.15)",
            filter: "blur(10px)",
            opacity: 0.65,
          }}
        >
          <Img
            crossOrigin="anonymous"
            src={prevImageUrl}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </AbsoluteFill>
      )}

      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          perspective: 1200,
          opacity,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            overflow: "hidden",
            borderRadius,
            transform: standardTransitionTransform,
            transformOrigin: "center center",
            filter,
            boxShadow: shadow,
            willChange: "transform",
          }}
        >
          <Img
            crossOrigin="anonymous"
            src={imageUrl}
            alt="Dynamic Slide"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: motionTransform,
              transformOrigin: "center center",
              willChange: "transform",
            }}
          />
        </div>
      </AbsoluteFill>

      {flashOpacity > 0 && (
        <AbsoluteFill
          style={{
            backgroundColor: "#fff",
            opacity: flashOpacity,
            pointerEvents: "none",
            mixBlendMode: "screen",
          }}
        />
      )}
    </AbsoluteFill>
  );
};
