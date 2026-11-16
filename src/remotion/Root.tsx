import React from "react";
import { Composition } from "remotion";
import { ReelComposition } from "./ReelComposition";
import { SeamlessSwapComposition } from "./SeamlessSwapComposition";
import { GrooveSwapComposition } from "./GrooveSwapComposition";

// 1. Import the Mixed Media Component and its frame calculator
import {
  MixedMediaComposition,
  getMixedMediaTotalFrames,
} from "./MixedMediaComposition";

// 2. Import the new Parallel Parallax component
import {
  ParallelParallaxComposition,
  BASE_DURATION as ParallelParallaxDuration,
} from "./ParallelParallaxComposition";

// 3. Import Trending Composition: Aise Kyun Trend
import {
  AiseKyunComposition,
  getAiseKyunTotalFrames,
} from "./AiseKyunComposition";

// 4. Import Trending Composition: Hindi Ishq Hai
import {
  HindiIshqComposition,
  getHindiIshqTotalFrames,
} from "./HindiIshqComposition";

// 5. Import Trending Composition: Othayadi
import {
  OthayadiComposition,
  getOthayadiTotalFrames,
} from "./OthayadiComposition";

// 6. Import Trending Composition: Vacchindiamma
import {
  VacchindiammaComposition,
  getVacchindiammaTotalFrames,
} from "./VacchindiammaComposition";

// 7. Import Trending Composition: Love Today
import {
  LoveTodayComposition,
  getLoveTodayTotalFrames,
} from "./LoveTodayComposition";

// 8. Import Trending Composition: Jaalakaari
import {
  JaalakaariComposition,
  getJaalakaariTotalFrames,
} from "./JaalakaariComposition";

// 9. Import Trending Composition: Vazhithunaiye (Tamil)
import {
  VazhithunaiyeComposition,
  getVazhithunaiyeTotalFrames,
} from "./VazhithunaiyeComposition";

// 10. Import Trending Composition: Pixels
import { PixelsComposition, getPixelsTotalFrames } from "./PixelsComposition";

// 11. Import Trending Composition: Shape Of You
import {
  ShapeOfYouComposition,
  getShapeOfYouTotalFrames,
} from "./ShapeOfYouComposition";

// 12. Import Trending Composition: Dance Monkey Groove
import {
  DanceMonkeyComposition,
  getDanceMonkeyTotalFrames,
} from "./DanceMonkeyComposition";

// 13. Import Trending Composition: Neeti Mullai
import {
  NeetiMullaiComposition,
  getNeetiMullaiTotalFrames,
} from "./NeetiMullaiComposition";

// 14. Import Trending Composition: Chellama
import {
  ChellamaComposition,
  getChellamaTotalFrames,
} from "./ChellamaComposition";

// 15. Import Trending Composition: Cutest Person
import {
  CutestPersonComposition,
  getCutestPersonTotalFrames,
} from "./CutestPersonComposition";

// 16. Import Trending Composition: Cheap Thrills
import {
  CheapThrillsComposition,
  getCheapThrillsTotalFrames,
} from "./CheapThrillsComposition";

// 17. Import Trending Composition: Speed Ramp edit
import {
  SpeedRampEditComposition,
  getSpeedRampEditTotalFrames,
} from "./SpeedRampEditComposition";

// 18. Import Trending Composition: Believe yourself
import {
  BelieveYourselfComposition,
  getBelieveYourselfTotalFrames,
} from "./BelieveYourselfComposition";

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
        durationInFrames={238}
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
        durationInFrames={229}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          photos: [],
        }}
      />

      {/* Mixed Media Flow */}
      <Composition
        id="MixedMediaComposition"
        component={MixedMediaComposition as React.ComponentType<any>}
        durationInFrames={getMixedMediaTotalFrames(true)}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          photos: [],
          videoUrl: null,
          showOutro: true,
          outroData: {
            logoUrl: null,
            bgUrl: null,
            contactText: "123 Business Road, Suite 100\nHyderabad, TG 500034",
            socialHandle: "@rawfilmss",
          },
        }}
      />

      {/* Parallel Parallax */}
      <Composition
        id="ParallelParallax"
        component={ParallelParallaxComposition as React.ComponentType<any>}
        durationInFrames={ParallelParallaxDuration}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          assets: [],
        }}
      />

      {/* Trending 1: Aise Kyun Trend */}
      <Composition
        id="AiseKyunComposition"
        component={AiseKyunComposition as React.ComponentType<any>}
        durationInFrames={getAiseKyunTotalFrames(false, "cut")}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          photos: [],
          showOutro: false,
        }}
      />

      {/* Trending 2: Hindi Ishq Hai */}
      <Composition
        id="HindiIshqComposition"
        component={HindiIshqComposition as React.ComponentType<any>}
        durationInFrames={getHindiIshqTotalFrames(false, "cut")}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          photos: [],
          showOutro: false,
        }}
      />

      {/* Trending 3: Othayadi */}
      <Composition
        id="OthayadiComposition"
        component={OthayadiComposition as React.ComponentType<any>}
        durationInFrames={getOthayadiTotalFrames(false, "cut")}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          photos: [],
          showOutro: false,
        }}
      />

      {/* Trending 4: Vacchindiamma */}
      <Composition
        id="VacchindiammaComposition"
        component={VacchindiammaComposition as React.ComponentType<any>}
        durationInFrames={getVacchindiammaTotalFrames(false, "cut")}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          photos: [],
          showOutro: false,
        }}
      />

      {/* Trending 5: Love Today */}
      <Composition
        id="LoveTodayComposition"
        component={LoveTodayComposition as React.ComponentType<any>}
        durationInFrames={getLoveTodayTotalFrames(false, "cut")}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          photos: [],
          showOutro: false,
        }}
      />

      {/* Trending 6: Jaalakaari */}
      <Composition
        id="JaalakaariComposition"
        component={JaalakaariComposition as React.ComponentType<any>}
        durationInFrames={getJaalakaariTotalFrames(false, "cut")}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          photos: [],
          showOutro: false,
        }}
      />

      {/* Trending 7: Vazhithunaiye (Tamil) */}
      <Composition
        id="VazhithunaiyeComposition"
        component={VazhithunaiyeComposition as React.ComponentType<any>}
        durationInFrames={getVazhithunaiyeTotalFrames(false, "cut")}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          photos: [],
          showOutro: false,
        }}
      />

      {/* Trending 8: Pixels */}
      <Composition
        id="PixelsComposition"
        component={PixelsComposition as React.ComponentType<any>}
        durationInFrames={getPixelsTotalFrames(false, "cut")}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          photos: [],
          showOutro: false,
        }}
      />

      {/* Trending 9: Shape Of You */}
      <Composition
        id="ShapeOfYouComposition"
        component={ShapeOfYouComposition as React.ComponentType<any>}
        durationInFrames={getShapeOfYouTotalFrames(false, "cut")}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          photos: [],
          showOutro: false,
        }}
      />

      {/* Trending 10: Dance Monkey Groove */}
      <Composition
        id="DanceMonkeyComposition"
        component={DanceMonkeyComposition as React.ComponentType<any>}
        durationInFrames={getDanceMonkeyTotalFrames(false, "cut")}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          photos: [],
          showOutro: false,
        }}
      />

      {/* Trending 11: Neeti Mullai */}
      <Composition
        id="NeetiMullaiComposition"
        component={NeetiMullaiComposition as React.ComponentType<any>}
        durationInFrames={getNeetiMullaiTotalFrames(false, "cut")}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          photos: [],
          showOutro: false,
        }}
      />

      {/* Trending 12: Chellama */}
      <Composition
        id="ChellamaComposition"
        component={ChellamaComposition as React.ComponentType<any>}
        durationInFrames={getChellamaTotalFrames(false, "cut")}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          photos: [],
          showOutro: false,
        }}
      />

      {/* Trending 13: Cutest Person */}
      <Composition
        id="CutestPersonComposition"
        component={CutestPersonComposition as React.ComponentType<any>}
        durationInFrames={getCutestPersonTotalFrames(false, "cut")}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          photos: [],
          showOutro: false,
        }}
      />

      {/* Trending 14: Cheap Thrills */}
      <Composition
        id="CheapThrillsComposition"
        component={CheapThrillsComposition as React.ComponentType<any>}
        durationInFrames={getCheapThrillsTotalFrames(false, "cut")}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          photos: [],
          showOutro: false,
        }}
      />

      {/* Trending 15: Speed Ramp edit */}
      <Composition
        id="SpeedRampEditComposition"
        component={SpeedRampEditComposition as React.ComponentType<any>}
        durationInFrames={getSpeedRampEditTotalFrames(false, "cut")}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          photos: [],
          showOutro: false,
        }}
      />

      {/* Trending 16: Believe yourself */}
      <Composition
        id="BelieveYourselfComposition"
        component={BelieveYourselfComposition as React.ComponentType<any>}
        durationInFrames={getBelieveYourselfTotalFrames(false, "cut")}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          photos: [],
          showOutro: false,
        }}
      />
    </>
  );
};
