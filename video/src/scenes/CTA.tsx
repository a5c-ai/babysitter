import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, spring } from "remotion";
import { colors, fonts, glows, timing } from "../styles/theme";
import { Logo } from "../components/Logo";

// Scene 6: CTA (frames 1200-1350, 5 seconds)
// Logo, product name, install command

export const CTA: React.FC = () => {
  const frame = useCurrentFrame();

  // Install command fade in
  const installOpacity = interpolate(frame, [60, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const installScale = spring({
    frame: frame - 60,
    fps: timing.fps,
    config: { damping: 15, stiffness: 80 },
  });

  // URL fade in
  const urlOpacity = interpolate(frame, [90, 110], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 50,
      }}
    >
      {/* Logo and product name */}
      <Logo delay={0} />

      {/* Install command */}
      <div
        style={{
          opacity: installOpacity,
          transform: `scale(${Math.min(installScale, 1)})`,
        }}
      >
        <div
          style={{
            backgroundColor: colors.backgroundLight,
            padding: "20px 40px",
            borderRadius: 12,
            border: `1px solid ${colors.textDim}`,
            boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
          }}
        >
          <span
            style={{
              fontFamily: fonts.code,
              fontSize: 22,
              color: colors.success,
            }}
          >
            $
          </span>
          <span
            style={{
              fontFamily: fonts.code,
              fontSize: 22,
              color: colors.text,
            }}
          >
            {" "}
            npm i -g{" "}
          </span>
          <span
            style={{
              fontFamily: fonts.code,
              fontSize: 22,
              color: colors.primary,
              textShadow: glows.subtle,
            }}
          >
            @a5c-ai/babysitter
          </span>
        </div>
      </div>

      {/* URL */}
      <div
        style={{
          opacity: urlOpacity,
          fontFamily: fonts.heading,
          fontSize: 32,
          color: colors.textMuted,
        }}
      >
        <span style={{ color: colors.primary, textShadow: glows.subtle }}>
          a5c.ai
        </span>
      </div>
    </AbsoluteFill>
  );
};
