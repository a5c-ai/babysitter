import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { colors, fonts, glows } from "../styles/theme";

interface NeonTextProps {
  children: React.ReactNode;
  color?: string;
  glow?: string;
  size?: number;
  delay?: number;
  style?: React.CSSProperties;
}

export const NeonText: React.FC<NeonTextProps> = ({
  children,
  color = colors.text,
  glow = glows.primary,
  size = 72,
  delay = 0,
  style,
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame - delay, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = interpolate(frame - delay, [0, 15], [0.95, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        fontFamily: fonts.heading,
        fontSize: size,
        fontWeight: 700,
        color,
        textShadow: glow,
        opacity,
        transform: `scale(${scale})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
