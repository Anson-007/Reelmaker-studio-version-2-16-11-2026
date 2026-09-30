// 1. Continuous Camera Movements (14 Streamlined High-Impact Presets)
export type CameraMovement =
  | "parallaxDepthPush"
  | "vertigoWarp"
  | "droneFlyover"
  | "lowAngleJibPush"
  | "arcSweepReveal"
  | "spiralDive"
  | "sCurvePan"
  | "craneRise"
  | "handheldBreathing"
  | "steadicamGlide"
  | "zeroGFloat"
  | "orbitalDrift"
  | "dutchAngleRoll"
  | "slowZoomIn";

// 2. Entrance Transitions (Updated with 3D Curved Slider)
export type SlideTransition =
  | "none"
  | "curvedSlider3D"
  | "carousel3D"
  | "carousel3DSpin"
  | "flip3D"
  | "spiralVortex"
  | "whipZoom"
  | "zoomFade"
  | "dropBounce"
  | "skewSlide"
  | "spinZoom"
  | "opticalDissolve"
  | "exposureGlow"
  | "slideLeft"
  | "slideRight"
  | "slideUp"
  | "crossFade";

// 3. Slide Configuration
export interface ReelSlide {
  id: string;
  imageUrl: string;
  durationInSeconds: number;
  cameraMovement: CameraMovement;
  transition: SlideTransition;
}

// 4. Audio Track Definition
export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  tag: string;
  duration: string;
  url: string;
}

// 5. Curated Motion Combo Definition
export interface MotionComboPreset {
  id: string;
  name: string;
  description: string;
  transition: SlideTransition;
  cameraMovement: CameraMovement;
}
