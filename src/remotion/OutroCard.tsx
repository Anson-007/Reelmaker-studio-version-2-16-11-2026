import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type OutroStyle =
  | "classic"
  | "glass"
  | "split"
  | "bold"
  | "minimal"
  | "elegant-dark"
  | "aesthetic-pastel"
  | "modern-corporate"
  | "vibrant-gradient"
  | "minimalist-light"
  | "custom-color"
  | "gradient-preset";

export interface OutroProps {
  logoUrl: string | null;
  bgUrl: string | null;
  contactText: string;
  socialHandle: string;
  styleType?: OutroStyle;
  customBgColor?: string;
  gradientIndex?: number;
  logoAnim?: "spring" | "fade" | "drop" | "spin";
  textAnim?: "slideUp" | "fade" | "scale";
  animSpeed?: number;
  contactTextSize?: number;
  socialTextSize?: number;
}

export const PRESET_GRADIENTS = [
  "linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
  "linear-gradient(135deg, #ff0844 0%, #ffb199 100%)",
  "linear-gradient(135deg, #13547a 0%, #80d0c7 100%)",
];

export const OutroCard: React.FC<OutroProps> = ({
  logoUrl,
  bgUrl,
  contactText,
  socialHandle,
  styleType = "classic",
  customBgColor = "#4f46e5",
  gradientIndex = 0,
  logoAnim = "spring",
  textAnim = "slideUp",
  animSpeed = 25,
  contactTextSize = 30,
  socialTextSize = 35,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const safeBg = bgUrl;

  const bgOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const baseSpring = spring({
    frame: frame - 10,
    fps,
    config: { damping: 12, stiffness: 150 },
  });

  const logoScale =
    logoAnim === "spring" || logoAnim === "spin"
      ? baseSpring
      : logoAnim === "fade"
        ? 1
        : 1;
  const logoOpacity =
    logoAnim === "fade"
      ? interpolate(frame, [10, 10 + animSpeed], [0, 1], {
          extrapolateRight: "clamp",
        })
      : 1;
  const logoTranslate =
    logoAnim === "drop" ? interpolate(baseSpring, [0, 1], [-400, 0]) : 0;
  const logoRotate =
    logoAnim === "spin" ? interpolate(baseSpring, [0, 1], [-180, 0]) : 0;

  const textStart = 20;
  const textOpacity = interpolate(
    frame,
    [textStart, textStart + animSpeed],
    [0, 1],
    { extrapolateRight: "clamp" },
  );
  const textTranslate =
    textAnim === "slideUp"
      ? interpolate(frame, [textStart, textStart + animSpeed], [50, 0], {
          extrapolateRight: "clamp",
        })
      : 0;
  const textScale =
    textAnim === "scale"
      ? interpolate(frame, [textStart, textStart + animSpeed], [0.8, 1], {
          extrapolateRight: "clamp",
        })
      : 1;

  const socialSpring = spring({
    frame: frame - (textStart + 15),
    fps,
    config: { damping: 14, stiffness: 130 },
  });

  const InstagramIcon = ({ color = "white", size = socialTextSize }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );

  const RenderLogo = ({
    size = 350,
    rounded = 30,
    bg = "white",
    border = "none",
  }) => (
    <div
      style={{
        transform: `scale(${logoScale}) translateY(${logoTranslate}px) rotate(${logoRotate}deg)`,
        opacity: logoOpacity,
      }}
    >
      {logoUrl ? (
        // FIXED: Using standard HTML img instead of Remotion Img to prevent blob decode crashes
        <img
          src={logoUrl}
          style={{
            width: size,
            height: size,
            objectFit: "contain",
            borderRadius: rounded,
            backgroundColor: bg,
            border,
            padding: size * 0.05,
          }}
          alt="Logo"
        />
      ) : (
        <div
          style={{
            width: size,
            height: size,
            backgroundColor: bg,
            border,
            borderRadius: rounded,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "#0f172a",
            fontSize: size * 0.1,
            fontWeight: "bold",
          }}
        >
          LOGO
        </div>
      )}
    </div>
  );

  const renderTextContent = (color: string) => (
    <div
      style={{
        opacity: textOpacity,
        transform: `translateY(${textTranslate}px) scale(${textScale})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          color,
          fontSize: contactTextSize,
          fontWeight: "500",
          whiteSpace: "pre-line",
          lineHeight: 1.5,
          textAlign: "center",
        }}
      >
        {contactText}
      </div>
    </div>
  );

  const renderBackground = (blur: boolean = false) => {
    if (!safeBg) return <AbsoluteFill style={{ backgroundColor: "#1e293b" }} />;
    return (
      // FIXED: Using standard HTML img
      <img
        src={safeBg}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: blur ? "blur(20px) scale(1.1)" : "none",
          position: "absolute",
          inset: 0,
        }}
        alt="Background"
      />
    );
  };

  if (styleType === "classic") {
    return (
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: bgOpacity }}>
        {renderBackground()}
        <AbsoluteFill style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }} />
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            gap: 50,
          }}
        >
          <RenderLogo />
          {renderTextContent("white")}
          <div
            style={{
              transform: `scale(${socialSpring})`,
              display: "flex",
              alignItems: "center",
              gap: 15,
              backgroundColor: "rgba(255,255,255,0.15)",
              padding: "20px 40px",
              borderRadius: 100,
              border: "2px solid rgba(255,255,255,0.2)",
            }}
          >
            <InstagramIcon />
            <span
              style={{
                fontSize: socialTextSize,
                fontWeight: "bold",
                color: "white",
              }}
            >
              {socialHandle}
            </span>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  if (styleType === "glass") {
    return (
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: bgOpacity }}>
        {renderBackground(true)}
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            padding: 60,
          }}
        >
          <div
            style={{
              width: "100%",
              padding: "80px 40px",
              backgroundColor: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(40px)",
              borderRadius: 60,
              border: "2px solid rgba(255,255,255,0.3)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 40,
              boxShadow: "0 30px 60px rgba(0,0,0,0.3)",
            }}
          >
            <RenderLogo size={300} rounded={150} />
            {renderTextContent("rgba(255,255,255,0.9)")}
            <div
              style={{
                transform: `scale(${socialSpring})`,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <InstagramIcon size={socialTextSize} />
              <span
                style={{
                  fontSize: socialTextSize,
                  fontWeight: "bold",
                  color: "white",
                }}
              >
                {socialHandle}
              </span>
            </div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  if (styleType === "split") {
    const splitProgress = spring({
      frame,
      fps,
      config: { damping: 15, stiffness: 100 },
    });
    return (
      <AbsoluteFill style={{ backgroundColor: "#0f172a", opacity: bgOpacity }}>
        <AbsoluteFill
          style={{
            height: "50%",
            transform: `translateY(${(1 - splitProgress) * -100}%)`,
          }}
        >
          {renderBackground()}
        </AbsoluteFill>
        <AbsoluteFill
          style={{
            top: "50%",
            height: "50%",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            padding: 60,
            gap: 40,
          }}
        >
          <div style={{ marginTop: -200 }}>
            <RenderLogo size={300} rounded={40} />
          </div>
          {renderTextContent("#cbd5e1")}
          <div
            style={{
              transform: `scale(${socialSpring})`,
              display: "flex",
              alignItems: "center",
              gap: 15,
              color: "#38bdf8",
            }}
          >
            <InstagramIcon color="#38bdf8" />
            <span style={{ fontSize: socialTextSize, fontWeight: "bold" }}>
              {socialHandle}
            </span>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  if (styleType === "bold") {
    return (
      <AbsoluteFill style={{ backgroundColor: "#4f46e5", opacity: bgOpacity }}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            padding: 60,
            gap: 50,
            textAlign: "center",
          }}
        >
          <RenderLogo size={400} rounded={50} />
          <div
            style={{
              opacity: textOpacity,
              transform: `translateY(${textTranslate}px) scale(${textScale})`,
              fontSize: contactTextSize,
              fontWeight: "900",
              whiteSpace: "pre-line",
              lineHeight: 1.2,
              textTransform: "uppercase",
              letterSpacing: 2,
              color: "white",
            }}
          >
            {contactText}
          </div>
          <div
            style={{
              transform: `scale(${socialSpring})`,
              display: "flex",
              alignItems: "center",
              gap: 20,
              backgroundColor: "white",
              color: "#4f46e5",
              padding: "20px 50px",
              borderRadius: 20,
            }}
          >
            <InstagramIcon color="#4f46e5" size={socialTextSize} />
            <span style={{ fontSize: socialTextSize, fontWeight: "900" }}>
              {socialHandle}
            </span>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  if (styleType === "elegant-dark") {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#18181b",
          opacity: bgOpacity,
          justifyContent: "center",
          alignItems: "center",
          padding: "100px 60px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            border: "2px solid #d4af37",
            position: "absolute",
            top: 40,
            bottom: 40,
            left: 40,
            right: 40,
            opacity: textOpacity,
          }}
        />
        <h2
          style={{
            color: "#d4af37",
            opacity: textOpacity,
            transform: `translateY(${textTranslate}px)`,
            fontSize: 50,
            fontWeight: "bold",
            letterSpacing: 4,
            margin: "0 0 60px 0",
          }}
        >
          THANKS FOR
          <br />
          WATCHING!
        </h2>
        <RenderLogo
          size={260}
          rounded={130}
          bg="#18181b"
          border="4px solid #d4af37"
        />
        <h3
          style={{
            color: "#d4af37",
            transform: `scale(${socialSpring})`,
            fontSize: socialTextSize,
            fontWeight: "bold",
            margin: "60px 0 20px 0",
          }}
        >
          FOLLOW
          <br />
          {socialHandle}
        </h3>
        <div
          style={{
            transform: `scale(${socialSpring})`,
            display: "flex",
            gap: 20,
            marginBottom: 50,
          }}
        >
          <InstagramIcon color="#d4af37" size={socialTextSize} />
        </div>
        {renderTextContent("#a1a1aa")}
      </AbsoluteFill>
    );
  }

  if (styleType === "aesthetic-pastel") {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#faeee7",
          opacity: bgOpacity,
          justifyContent: "center",
          alignItems: "center",
          padding: 80,
          textAlign: "center",
        }}
      >
        <AbsoluteFill style={{ opacity: textOpacity, overflow: "hidden" }}>
          <svg
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              position: "absolute",
              top: -100,
              right: -100,
              width: 800,
              transform: "rotate(45deg)",
            }}
          >
            <path
              fill="#f3c5b5"
              d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-46.8C87.4,-34.5,90,-20,89.3,-6.1C88.6,7.8,84.6,21.1,77.5,33.5C70.4,45.9,60.2,57.4,47.9,64.4C35.6,71.4,21.2,73.9,7.6,76.5C-6,79.1,-18.8,81.8,-30.5,78.2C-42.2,74.6,-52.8,64.7,-61.8,53.4C-70.8,42.1,-78.2,29.4,-81.4,15.7C-84.6,2,-83.6,-12.7,-77.7,-25.5C-71.8,-38.3,-61,-49.2,-48.5,-57.1C-36,-65,-21.8,-69.9,-6.9,-68.3C8,-66.7,22.9,-58.6,30.6,-73.6L44.7,-76.4Z"
            />
          </svg>
        </AbsoluteFill>
        <h2
          style={{
            color: "#5c4033",
            opacity: textOpacity,
            transform: `translateY(${textTranslate}px)`,
            fontSize: 55,
            fontWeight: "800",
            letterSpacing: 2,
            margin: "0 0 50px 0",
          }}
        >
          THANKS FOR
          <br />
          WATCHING
        </h2>
        <RenderLogo size={280} rounded={140} bg="transparent" />
        <h3
          style={{
            color: "#5c4033",
            transform: `scale(${socialSpring})`,
            fontSize: socialTextSize,
            fontWeight: "800",
            margin: "50px 0 20px 0",
          }}
        >
          FOLLOW
          <br />
          {socialHandle}
        </h3>
        <div
          style={{
            transform: `scale(${socialSpring})`,
            display: "flex",
            gap: 20,
            marginBottom: 40,
          }}
        >
          <InstagramIcon color="#5c4033" size={socialTextSize} />
        </div>
        {renderTextContent("#5c4033")}
      </AbsoluteFill>
    );
  }

  if (styleType === "modern-corporate") {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#1e293b",
          opacity: bgOpacity,
          padding: 80,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2
          style={{
            color: "#e2e8f0",
            opacity: textOpacity,
            transform: `translateY(${textTranslate}px)`,
            fontSize: 45,
            fontWeight: "600",
            letterSpacing: 4,
            marginTop: 40,
            marginBottom: "auto",
          }}
        >
          STAY
          <br />
          CONNECTED
        </h2>
        <div
          style={{
            margin: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <RenderLogo size={320} bg="transparent" rounded={20} />
          <h3
            style={{
              color: "#38bdf8",
              transform: `scale(${socialSpring})`,
              fontSize: socialTextSize,
              fontWeight: "bold",
              marginTop: 60,
              marginBottom: 20,
            }}
          >
            FOLLOW
            <br />
            {socialHandle}
          </h3>
          <div
            style={{
              transform: `scale(${socialSpring})`,
              display: "flex",
              gap: 20,
            }}
          >
            <InstagramIcon color="#38bdf8" size={socialTextSize} />
          </div>
        </div>
        <div
          style={{
            opacity: textOpacity,
            transform: `translateY(${textTranslate}px) scale(${textScale})`,
            color: "#cbd5e1",
            fontSize: contactTextSize,
            lineHeight: 1.8,
            whiteSpace: "pre-line",
            fontWeight: "400",
            marginTop: "auto",
            borderTop: "2px solid #334155",
            paddingTop: 40,
          }}
        >
          {contactText}
        </div>
      </AbsoluteFill>
    );
  }

  if (styleType === "vibrant-gradient") {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#020024",
          background: "linear-gradient(180deg, #020024 0%, #15093b 100%)",
          opacity: bgOpacity,
          padding: 40,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 40,
            right: 40,
            bottom: 40,
            border: "4px solid #a855f7",
            borderRadius: 30,
            boxShadow:
              "0 0 40px rgba(168, 85, 247, 0.7), inset 0 0 40px rgba(168, 85, 247, 0.7)",
            opacity: textOpacity,
          }}
        />
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              color: "#fff",
              textShadow: "0 0 20px #e879f9",
              opacity: textOpacity,
              transform: `translateY(${textTranslate}px)`,
              fontSize: 48,
              fontWeight: "900",
              letterSpacing: 2,
              margin: "0 0 50px 0",
            }}
          >
            THANKS FOR
            <br />
            WATCHING
          </h2>
          <RenderLogo
            size={250}
            bg="rgba(255,255,255,0.05)"
            border="2px solid #a855f7"
            rounded={125}
          />
          <h3
            style={{
              color: "#fff",
              textShadow: "0 0 20px #a855f7",
              transform: `scale(${socialSpring})`,
              fontSize: socialTextSize,
              fontWeight: "900",
              margin: "50px 0 30px 0",
            }}
          >
            FOLLOW
            <br />
            {socialHandle}
          </h3>
          {renderTextContent("#e2e8f0")}
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  if (styleType === "minimalist-light") {
    return (
      <AbsoluteFill
        style={{ backgroundColor: "#fafafa", opacity: bgOpacity, padding: 40 }}
      >
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 40,
            right: 40,
            bottom: 40,
            border: "1px solid #111",
            opacity: textOpacity,
          }}
        />
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              color: "#111",
              fontFamily: "Georgia, serif",
              opacity: textOpacity,
              transform: `translateY(${textTranslate}px)`,
              fontSize: 45,
              fontWeight: "normal",
              letterSpacing: 1,
              margin: "0 0 60px 0",
            }}
          >
            THANK YOU
            <br />
            FOR WATCHING
          </h2>
          <RenderLogo size={230} bg="transparent" rounded={0} />
          <h3
            style={{
              color: "#111",
              fontFamily: "Arial, sans-serif",
              transform: `scale(${socialSpring})`,
              fontSize: socialTextSize,
              fontWeight: "400",
              letterSpacing: 2,
              margin: "60px 0 20px 0",
            }}
          >
            FOLLOW
            <br />
            {socialHandle}
          </h3>
          <div
            style={{
              transform: `scale(${socialSpring})`,
              display: "flex",
              gap: 15,
              marginBottom: 50,
            }}
          >
            <InstagramIcon color="#111" size={socialTextSize} />
          </div>
          {renderTextContent("#555")}
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  if (styleType === "custom-color") {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: customBgColor || "#4f46e5",
          opacity: bgOpacity,
        }}
      >
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            padding: 60,
            textAlign: "center",
            gap: 40,
          }}
        >
          <RenderLogo
            size={320}
            rounded={40}
            bg="rgba(255,255,255,0.1)"
            border="2px solid rgba(255,255,255,0.3)"
          />
          {renderTextContent("white")}
          <div
            style={{
              transform: `scale(${socialSpring})`,
              display: "flex",
              alignItems: "center",
              gap: 15,
              backgroundColor: "rgba(0,0,0,0.2)",
              padding: "20px 40px",
              borderRadius: 100,
            }}
          >
            <InstagramIcon color="white" />
            <span
              style={{
                fontSize: socialTextSize,
                fontWeight: "bold",
                color: "white",
              }}
            >
              {socialHandle}
            </span>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  if (styleType === "gradient-preset") {
    const activeGradient =
      PRESET_GRADIENTS[gradientIndex] || PRESET_GRADIENTS[0];
    return (
      <AbsoluteFill style={{ background: activeGradient, opacity: bgOpacity }}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            padding: 60,
            textAlign: "center",
            gap: 40,
          }}
        >
          <RenderLogo size={320} rounded={160} bg="white" />
          {renderTextContent("white")}
          <div
            style={{
              transform: `scale(${socialSpring})`,
              display: "flex",
              alignItems: "center",
              gap: 15,
              backgroundColor: "rgba(255,255,255,0.25)",
              backdropFilter: "blur(10px)",
              padding: "20px 40px",
              borderRadius: 100,
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            }}
          >
            <InstagramIcon color="white" />
            <span
              style={{
                fontSize: socialTextSize,
                fontWeight: "bold",
                color: "white",
              }}
            >
              {socialHandle}
            </span>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#ffffff",
        opacity: bgOpacity,
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
        textAlign: "center",
        gap: 40,
      }}
    >
      <RenderLogo size={250} bg="#f8fafc" />
      {renderTextContent("#334155")}
      <div
        style={{
          transform: `scale(${socialSpring})`,
          opacity: textOpacity,
          borderTop: "1px solid #e2e8f0",
          paddingTop: 40,
          width: "80%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 15,
        }}
      >
        <InstagramIcon color="#0f172a" size={socialTextSize} />
        <span
          style={{
            fontSize: socialTextSize,
            fontWeight: "600",
            letterSpacing: 1,
            color: "#0f172a",
          }}
        >
          {socialHandle}
        </span>
      </div>
    </AbsoluteFill>
  );
};
