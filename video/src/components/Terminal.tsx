import React from "react";
import { interpolate, useCurrentFrame, spring } from "remotion";
import { colors, fonts, timing } from "../styles/theme";

interface TerminalProps {
  children: React.ReactNode;
  delay?: number;
  width?: number;
  height?: number;
  showControls?: boolean;
}

export const Terminal: React.FC<TerminalProps> = ({
  children,
  delay = 0,
  width = 900,
  height = 400,
  showControls = true,
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame - delay, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = spring({
    frame: frame - delay,
    fps: timing.fps,
    config: {
      damping: 15,
      stiffness: 80,
    },
  });

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: colors.backgroundLight,
        borderRadius: 12,
        border: `1px solid ${colors.textDim}`,
        overflow: "hidden",
        opacity,
        transform: `scale(${Math.min(scale, 1)})`,
        boxShadow: `0 20px 60px rgba(0,0,0,0.5)`,
      }}
    >
      {showControls && (
        <div
          style={{
            height: 36,
            backgroundColor: "#2A2A2A",
            display: "flex",
            alignItems: "center",
            paddingLeft: 12,
            gap: 8,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#FF5F56",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#FFBD2E",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#27CA3F",
            }}
          />
        </div>
      )}
      <div
        style={{
          padding: 24,
          fontFamily: fonts.code,
          fontSize: 18,
          color: colors.text,
          lineHeight: 1.6,
        }}
      >
        {children}
      </div>
    </div>
  );
};
