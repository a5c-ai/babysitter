import React from "react";
import { interpolate, useCurrentFrame, spring } from "remotion";
import { colors, fonts, glows, timing } from "../styles/theme";

interface LogoProps {
  delay?: number;
}

export const Logo: React.FC<LogoProps> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame - delay, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = spring({
    frame: frame - delay,
    fps: timing.fps,
    config: { damping: 12, stiffness: 60 },
  });

  // Pulsing glow effect
  const glowIntensity = interpolate(
    Math.sin((frame - delay) * 0.1),
    [-1, 1],
    [0.7, 1]
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        opacity,
        transform: `scale(${Math.min(scale, 1)})`,
      }}
    >
      {/* Logo mark */}
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 24,
          backgroundColor: colors.backgroundLight,
          border: `3px solid ${colors.primary}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: glows.primary,
          opacity: glowIntensity,
        }}
      >
        <div
          style={{
            fontFamily: fonts.heading,
            fontSize: 48,
            fontWeight: 700,
            color: colors.primary,
            textShadow: glows.primary,
          }}
        >
          a5c
        </div>
      </div>

      {/* Product name */}
      <div
        style={{
          fontFamily: fonts.heading,
          fontSize: 64,
          fontWeight: 700,
          color: colors.text,
          textShadow: glows.primary,
          letterSpacing: "-0.02em",
        }}
      >
        babysitter
      </div>
    </div>
  );
};
