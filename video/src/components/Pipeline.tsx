import React from "react";
import { interpolate, useCurrentFrame, spring } from "remotion";
import { colors, fonts, glows, timing } from "../styles/theme";

interface PipelineStepProps {
  label: string;
  percentage?: number;
  status: "pending" | "active" | "success" | "failed" | "retrying";
  delay?: number;
  showRetryLoop?: boolean;
}

export const PipelineStep: React.FC<PipelineStepProps> = ({
  label,
  percentage,
  status,
  delay = 0,
  showRetryLoop = false,
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame - delay, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = spring({
    frame: frame - delay,
    fps: timing.fps,
    config: { damping: 12, stiffness: 100 },
  });

  const getStatusColor = () => {
    switch (status) {
      case "success":
        return colors.success;
      case "failed":
        return colors.error;
      case "active":
      case "retrying":
        return colors.primary;
      default:
        return colors.textDim;
    }
  };

  const getStatusGlow = () => {
    switch (status) {
      case "success":
        return glows.success;
      case "failed":
        return glows.error;
      case "active":
      case "retrying":
        return glows.primary;
      default:
        return "none";
    }
  };

  const statusColor = getStatusColor();
  const statusGlow = getStatusGlow();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        opacity,
        transform: `scale(${Math.min(scale, 1)})`,
      }}
    >
      <div
        style={{
          width: 120,
          height: 80,
          backgroundColor: colors.backgroundLight,
          border: `2px solid ${statusColor}`,
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: statusGlow,
          position: "relative",
        }}
      >
        <div
          style={{
            fontFamily: fonts.code,
            fontSize: 14,
            color: colors.textMuted,
          }}
        >
          {label}
        </div>
        {percentage !== undefined && (
          <div
            style={{
              fontFamily: fonts.code,
              fontSize: 24,
              fontWeight: 700,
              color: statusColor,
            }}
          >
            {percentage}%
          </div>
        )}
        {status === "success" && (
          <div
            style={{
              position: "absolute",
              top: -10,
              right: -10,
              width: 28,
              height: 28,
              backgroundColor: colors.success,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              boxShadow: glows.success,
            }}
          >
            ✓
          </div>
        )}
        {showRetryLoop && status === "retrying" && (
          <div
            style={{
              position: "absolute",
              top: -10,
              right: -10,
              width: 28,
              height: 28,
              backgroundColor: colors.primary,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              boxShadow: glows.primary,
            }}
          >
            ↻
          </div>
        )}
      </div>
    </div>
  );
};

interface PipelineProps {
  steps: Array<{
    label: string;
    percentage?: number;
    status: "pending" | "active" | "success" | "failed" | "retrying";
  }>;
  delay?: number;
}

export const Pipeline: React.FC<PipelineProps> = ({ steps, delay = 0 }) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
      }}
    >
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <PipelineStep
            label={step.label}
            percentage={step.percentage}
            status={step.status}
            delay={delay + index * 8}
            showRetryLoop={step.status === "retrying"}
          />
          {index < steps.length - 1 && (
            <div
              style={{
                width: 40,
                height: 3,
                backgroundColor:
                  step.status === "success" ? colors.success : colors.textDim,
                boxShadow:
                  step.status === "success" ? glows.success : "none",
                opacity: interpolate(
                  frame - delay - index * 8,
                  [0, 15],
                  [0, 1],
                  {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }
                ),
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
