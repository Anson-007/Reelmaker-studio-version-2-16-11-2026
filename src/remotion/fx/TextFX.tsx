import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type FontFamilyPreset =
  | "cormorant-italic" // Slender calligraphic italic from Aise Kyun reel
  | "instrument-serif" // Viral editorial TikTok/Reels italic serif
  | "playfair-italic" // High-fashion magazine serif
  | "alex-brush" // Delicate handwritten signature script
  | "great-vibes" // Classic flowing cursive script
  | "cinzel-cinema" // Movie-poster uppercase serif
  | "syne-bold" // Modern hype/velocity display sans
  | "dm-sans"; // Clean humanist sans-serif for dual-tone quotes

export type TextPreset =
  | "lyric-serif-italic"
  | "quadrant-whisper"
  | "word-pop-spring"
  | "cinematic-tracking"
  | "script-hero-intro"
  | "dual-tone-quote";

export const FONT_MAP: Record<FontFamilyPreset, string> = {
  "cormorant-italic": "'Cormorant Garamond', 'EB Garamond', Georgia, serif",
  "instrument-serif": "'Instrument Serif', 'Playfair Display', Georgia, serif",
  "playfair-italic": "'Playfair Display', Georgia, serif",
  "alex-brush": "'Alex Brush', cursive",
  "great-vibes": "'Great Vibes', cursive",
  "cinzel-cinema": "'Cinzel', serif",
  "syne-bold": "'Syne', sans-serif",
  "dm-sans": "'DM Sans', 'Inter', sans-serif",
};

// Automatically loads Google Fonts inside Remotion Preview & WebGPU Export
const ReelGoogleFonts: React.FC = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cinzel:wght@400;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=Great+Vibes&family=Instrument+Serif:ital@0;1&family=Playfair+Display:ital,wght@0,400;1,400&family=Syne:wght@700;800&display=swap');
  `}</style>
);

interface TextFXProps {
  text: string;
  preset?: TextPreset;
  fontPreset?: FontFamilyPreset;
  localFrame?: number;
  durationInFrames?: number;
  fontSize?: number;
  color?: string;
  highlightWord?: string;
  highlightColor?: string;
  glowColor?: string;
  topOffset?: number;
  bottomOffset?: number;
  style?: React.CSSProperties;
}

export const TextFX: React.FC<TextFXProps> = ({
  text,
  preset = "lyric-serif-italic",
  fontPreset = "cormorant-italic",
  localFrame,
  durationInFrames = 65,
  fontSize = 62,
  color = "rgba(255, 255, 255, 0.94)",
  highlightWord,
  highlightColor = "#E5A93C",
  glowColor = "rgba(0, 0, 0, 0.55)",
  topOffset = 285,
  bottomOffset = 225,
  style,
}) => {
  const globalFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = localFrame !== undefined ? localFrame : globalFrame;

  if (!text || f < 0 || f > durationInFrames) return null;

  const fontFamily = FONT_MAP[fontPreset];

  // Smooth fade-out over the last 14 frames of the cut
  const exitOpacity = interpolate(
    f,
    [Math.max(1, durationInFrames - 14), durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // 1. SCRIPT HERO INTRO (“ Describe Her In Many / Languages “)
  if (preset === "script-hero-intro") {
    const enterOpacity = interpolate(f, [0, 10], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const outOpacity = interpolate(
      f,
      [durationInFrames - 12, durationInFrames],
      [1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );
    const subtleScale = interpolate(f, [0, durationInFrames], [0.98, 1.02], {
      extrapolateRight: "clamp",
    });

    return (
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          pointerEvents: "none",
          zIndex: 35,
          opacity: enterOpacity * outOpacity,
          transform: `scale(${subtleScale})`,
          ...style,
        }}
      >
        <ReelGoogleFonts />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "6px",
            padding: "0 40px",
          }}
        >
          {/* Line 1: “ Describe [Her] In Many */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "center",
              gap: "14px",
              color: "#FFFFFF",
              fontFamily: FONT_MAP["dm-sans"],
              fontSize: `${fontSize}px`,
              fontWeight: 400,
              letterSpacing: "0.3px",
            }}
          >
            <span>“ Describe</span>
            <span
              style={{
                fontFamily: FONT_MAP["great-vibes"],
                fontSize: `${Math.round(fontSize * 2.15)}px`,
                color: highlightColor,
                fontWeight: 400,
                lineHeight: 0.85,
                padding: "0 6px",
                textShadow: "0px 4px 18px rgba(229, 169, 60, 0.35)",
              }}
            >
              {highlightWord || "Her"}
            </span>
            <span>In Many</span>
          </div>

          {/* Line 2: Languages “ */}
          <div
            style={{
              color: "#FFFFFF",
              fontFamily: FONT_MAP["dm-sans"],
              fontSize: `${fontSize}px`,
              fontWeight: 400,
              letterSpacing: "0.3px",
            }}
          >
            Languages “
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // 2. DUAL-TONE QUOTE (“ Hindi Ishq Hain “ — White + Gold Highlight Word)
  if (preset === "dual-tone-quote") {
    const words = text.split(" ");
    const targetClean = highlightWord?.toLowerCase().replace(/[^a-z]/gi, "");

    return (
      <AbsoluteFill
        style={{
          justifyContent: "flex-start",
          alignItems: "center",
          paddingTop: `${topOffset}px`,
          pointerEvents: "none",
          zIndex: 35,
          ...style,
        }}
      >
        <ReelGoogleFonts />
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "baseline",
            gap: "12px",
            padding: "8px 28px",
            fontFamily: FONT_MAP["dm-sans"],
            fontSize: `${fontSize}px`,
            fontWeight: 500,
            letterSpacing: "0.3px",
            textShadow:
              "0px 2px 10px rgba(0, 0, 0, 0.85), 0px 1px 3px rgba(0, 0, 0, 0.9)",
          }}
        >
          <span style={{ color }}>“</span>
          {words.map((rawWord, idx) => {
            const isStarred = rawWord.startsWith("*") && rawWord.endsWith("*");
            const cleanWord = isStarred ? rawWord.slice(1, -1) : rawWord;
            const matchesProp =
              targetClean &&
              cleanWord.toLowerCase().replace(/[^a-z]/gi, "") === targetClean;
            const isHighlighted = isStarred || matchesProp;

            return (
              <span
                key={idx}
                style={{
                  color: isHighlighted ? highlightColor : color,
                  fontWeight: isHighlighted ? 600 : 400,
                }}
              >
                {cleanWord}
              </span>
            );
          })}
          <span style={{ color }}>“</span>
        </div>
      </AbsoluteFill>
    );
  }

  // 3. DELICATE CALLIGRAPHIC ITALIC LYRIC (Matches "Kaise bataaye ?", "Kyun tujhko chahe ?")
  if (preset === "lyric-serif-italic") {
    const words = text.split(" ");
    return (
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: `${bottomOffset}px`,
          pointerEvents: "none",
          zIndex: 35,
          opacity: exitOpacity,
          ...style,
        }}
      >
        <ReelGoogleFonts />
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "baseline",
            gap: `${Math.round(fontSize * 0.24)}px`,
            padding: "8px 24px",
          }}
        >
          {words.map((word, idx) => {
            const delay = idx * 3;
            const wordSpring = spring({
              frame: Math.max(0, f - delay),
              fps,
              config: { damping: 16, stiffness: 100, mass: 0.8 },
            });
            const wordOpacity = interpolate(f - delay, [0, 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const blurPx = interpolate(f - delay, [0, 9], [8, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const translateY = interpolate(wordSpring, [0, 1], [14, 0]);

            return (
              <span
                key={idx}
                style={{
                  display: "inline-block",
                  color,
                  fontSize: `${fontSize}px`,
                  fontStyle: "italic",
                  fontFamily,
                  fontWeight: 400,
                  letterSpacing: "0.4px",
                  lineHeight: 1.1,
                  opacity: wordOpacity,
                  transform: `translateY(${translateY}px)`,
                  filter: `blur(${blurPx}px)`,
                  textShadow: `0px 2px 14px ${glowColor}, 0px 1px 3px rgba(0, 0, 0, 0.45)`,
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
    );
  }

  // 4. QUADRANT WHISPER ("Aise", "Kaise", "Waise", "Jaise" on the 2x2 intro grid)
  if (preset === "quadrant-whisper") {
    const pop = spring({
      frame: f,
      fps,
      config: { damping: 15, stiffness: 115, mass: 0.75 },
    });
    const blur = interpolate(f, [0, 8], [7, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const opacity = interpolate(f, [0, 7], [0, 0.92], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    return (
      <>
        <ReelGoogleFonts />
        <span
          style={{
            position: "absolute",
            color,
            fontSize: `${fontSize}px`,
            fontStyle: "italic",
            fontFamily,
            fontWeight: 400,
            letterSpacing: "0.5px",
            opacity,
            filter: `blur(${blur}px)`,
            transform: `translateX(-50%) translateY(${interpolate(
              pop,
              [0, 1],
              [12, 0],
            )}px)`,
            textShadow:
              "0px 2px 12px rgba(0, 0, 0, 0.65), 0px 1px 3px rgba(0, 0, 0, 0.4)",
            zIndex: 10,
            pointerEvents: "none",
            ...style,
          }}
        >
          {text}
        </span>
      </>
    );
  }

  // 5. WORD POP SPRING
  if (preset === "word-pop-spring") {
    const words = text.split(" ");
    return (
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: `${bottomOffset}px`,
          pointerEvents: "none",
          zIndex: 35,
          opacity: exitOpacity,
          ...style,
        }}
      >
        <ReelGoogleFonts />
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "14px",
          }}
        >
          {words.map((word, idx) => {
            const delay = idx * 3;
            const s = spring({
              frame: Math.max(0, f - delay),
              fps,
              config: { damping: 9, stiffness: 180, mass: 0.6 },
            });
            return (
              <span
                key={idx}
                style={{
                  display: "inline-block",
                  color,
                  fontSize: `${fontSize}px`,
                  fontWeight: 800,
                  fontFamily: FONT_MAP["syne-bold"],
                  transform: `scale(${s})`,
                  textShadow: "0px 6px 20px rgba(0,0,0,0.85)",
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
    );
  }

  // 6. CINEMATIC LETTER TRACKING
  const tracking = interpolate(f, [0, durationInFrames], [2, 14], {
    extrapolateRight: "clamp",
  });
  const fade = interpolate(f, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: `${bottomOffset}px`,
        pointerEvents: "none",
        zIndex: 35,
        opacity: fade * exitOpacity,
        ...style,
      }}
    >
      <ReelGoogleFonts />
      <span
        style={{
          color,
          fontSize: `${fontSize}px`,
          fontFamily: FONT_MAP["cinzel-cinema"],
          fontWeight: 600,
          letterSpacing: `${tracking}px`,
          textTransform: "uppercase",
          textShadow: "0px 4px 20px rgba(0,0,0,0.9)",
        }}
      >
        {text}
      </span>
    </AbsoluteFill>
  );
};
