import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { colors, fonts, glows } from "../styles/theme";

interface ProgressBarProps {
  progress: number; // 0-100
  delay?: number;
  width?: number;
  height?: number;
  showLabel?: boolean;
  color?: string;
}

const getColorForProgress = (progress: number): string => {
  if (progress >= 80) return colors.success;
  if (progress >= 60) return colors.warning;
  if (progress >= 40) return colors.primary;
  return colors.error;
};

const getGlowForProgress = (progress: number): string => {
  if (progress >= 80) return glows.success;
  if (progress >= 60) return glows.warning;
  if (progress >= 40) return glows.primary;
  return glows.error;
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  delay = 0,
  width = 600,
  height = 24,
  showLabel = true,
  color,
}) => {
  const frame = useCurrentFrame();

  const animatedProgress = interpolate(frame - delay, [0, 30], [0, progress], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const barColor = color || getColorForProgress(progress);
  const glow = getGlowForProgress(progress);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <div
        style={{
          width,
          height,
          backgroundColor: colors.backgroundLight,
          borderRadius: height / 2,
          overflow: "hidden",
          border: `1px solid ${colors.textDim}`,
        }}
      >
        <div
          style={{
            width: `${animatedProgress}%`,
            height: "100%",
            backgroundColor: barColor,
            borderRadius: height / 2,
            boxShadow: glow,
            transition: "background-color 0.3s",
          }}
        />
      </div>
      {showLabel && (
        <div
          style={{
            fontFamily: fonts.code,
            fontSize: 28,
            fontWeight: 700,
            color: barColor,
            textShadow: glow,
            minWidth: 80,
          }}
        >
          {Math.round(animatedProgress)}%
        </div>
      )}
    </div>
  );
};

// Animated progress bar that interpolates between values
interface AnimatedProgressBarProps {
  startProgress: number;
  endProgress: number;
  startFrame: number;
  duration: number;
  width?: number;
  height?: number;
  showLabel?: boolean;
}

export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  startProgress,
  endProgress,
  startFrame,
  duration,
  width = 600,
  height = 24,
  showLabel = true,
}) => {
  const frame = useCurrentFrame();

  const progress = interpolate(
    frame,
    [startFrame, startFrame + duration],
    [startProgress, endProgress],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const barColor = getColorForProgress(progress);
  const glow = getGlowForProgress(progress);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <div
        style={{
          width,
          height,
          backgroundColor: colors.backgroundLight,
          borderRadius: height / 2,
          overflow: "hidden",
          border: `1px solid ${colors.textDim}`,
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            backgroundColor: barColor,
            borderRadius: height / 2,
            boxShadow: glow,
          }}
        />
      </div>
      {showLabel && (
        <div
          style={{
            fontFamily: fonts.code,
            fontSize: 28,
            fontWeight: 700,
            color: barColor,
            textShadow: glow,
            minWidth: 80,
          }}
        >
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
};
