import React from "react";
import { Composition } from "remotion";
import { ReelComposition } from "./ReelComposition";
import { SeamlessSwapComposition } from "./SeamlessSwapComposition";
import { GrooveSwapComposition } from "./GrooveSwapComposition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Studio General Reel Composition */}
      <Composition
        id="ReelComposition"
        component={ReelComposition as React.ComponentType<any>}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          slides: [],
          audioUrl: undefined,
          audioVolume: 0.8,
        }}
      />

      {/* Preset 1: Seamless Interior Swap */}
      <Composition
        id="SeamlessSwapComposition"
        component={SeamlessSwapComposition as React.ComponentType<any>}
        durationInFrames={238} // 7.916s @ 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          photos: [],
        }}
      />

      {/* Preset 2: 110 BPM Groove Swap */}
      <Composition
        id="GrooveSwapComposition"
        component={GrooveSwapComposition as React.ComponentType<any>}
        durationInFrames={229} // 7.633s @ 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          photos: [],
        }}
      />
    </>
  );
};
