import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { colors, fonts, glows } from "../styles/theme";

// Scene 3: Quality Convergence (frames 420-720, 10 seconds)
// Same pipeline, but with retry loops until success

const STEPS = [
  { label: "Step 1", retries: [80, 95, 100] },
  { label: "Step 2", retries: [80, 90, 100] },
  { label: "Step 3", retries: [80, 92, 100] },
  { label: "Step 4", retries: [80, 88, 97, 100] },
  { label: "Step 5", retries: [80, 91, 100] },
];

export const QualityConvergence: React.FC = () => {
  const frame = useCurrentFrame();

  // Title fade in
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Each step takes ~50 frames, retries animate within
  const getStepState = (stepIndex: number) => {
    const stepStart = 30 + stepIndex * 45;
    const localFrame = frame - stepStart;

    if (localFrame < 0) {
      return { percentage: 80, retryIndex: -1, isComplete: false };
    }

    const retries = STEPS[stepIndex].retries;
    const framesPerRetry = 12;
    const retryIndex = Math.min(
      Math.floor(localFrame / framesPerRetry),
      retries.length - 1
    );
    const percentage = retries[retryIndex];
    const isComplete = percentage === 100;

    return { percentage, retryIndex, isComplete };
  };

  // CLI command fade in
  const cliOpacity = interpolate(frame, [200, 220], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Final message
  const finalOpacity = interpolate(frame, [260, 280], [0, 1], {
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
        gap: 40,
      }}
    >
      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          fontFamily: fonts.heading,
          fontSize: 48,
          fontWeight: 700,
          color: colors.primary,
          textShadow: glows.primary,
        }}
      >
        Babysitter loops until it works.
      </div>

      {/* Pipeline with retry loops */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        {STEPS.map((step, index) => {
          const state = getStepState(index);
          const stepStart = 30 + index * 45;
          const isVisible = frame >= stepStart - 10;

          const stepOpacity = interpolate(
            frame,
            [stepStart - 10, stepStart],
            [0.3, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          const borderColor = state.isComplete
            ? colors.success
            : state.retryIndex >= 0
            ? colors.primary
            : colors.textDim;

          const glow = state.isComplete
            ? glows.success
            : state.retryIndex >= 0
            ? glows.subtle
            : "none";

          return (
            <React.Fragment key={index}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  opacity: stepOpacity,
                }}
              >
                <div
                  style={{
                    width: 110,
                    height: 80,
                    backgroundColor: colors.backgroundLight,
                    border: `2px solid ${borderColor}`,
                    borderRadius: 12,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: glow,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      fontFamily: fonts.code,
                      fontSize: 12,
                      color: colors.textMuted,
                    }}
                  >
                    {step.label}
                  </div>
                  <div
                    style={{
                      fontFamily: fonts.code,
                      fontSize: 24,
                      fontWeight: 700,
                      color: state.isComplete ? colors.success : colors.primary,
                      textShadow: state.isComplete ? glows.success : "none",
                    }}
                  >
                    {state.percentage}%
                  </div>

                  {/* Retry indicator */}
                  {state.retryIndex >= 0 && !state.isComplete && (
                    <div
                      style={{
                        position: "absolute",
                        top: -12,
                        right: -12,
                        width: 28,
                        height: 28,
                        backgroundColor: colors.primary,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        color: colors.background,
                        fontWeight: 700,
                        boxShadow: glows.primary,
                      }}
                    >
                      ↻
                    </div>
                  )}

                  {/* Success checkmark */}
                  {state.isComplete && (
                    <div
                      style={{
                        position: "absolute",
                        top: -12,
                        right: -12,
                        width: 28,
                        height: 28,
                        backgroundColor: colors.success,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        color: colors.background,
                        fontWeight: 700,
                        boxShadow: glows.success,
                      }}
                    >
                      ✓
                    </div>
                  )}
                </div>
              </div>

              {index < STEPS.length - 1 && (
                <div
                  style={{
                    width: 24,
                    height: 3,
                    backgroundColor: state.isComplete
                      ? colors.success
                      : colors.textDim,
                    boxShadow: state.isComplete ? glows.success : "none",
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* CLI command */}
      <div
        style={{
          opacity: cliOpacity,
          backgroundColor: colors.backgroundLight,
          padding: "16px 32px",
          borderRadius: 8,
          border: `1px solid ${colors.textDim}`,
        }}
      >
        <span style={{ fontFamily: fonts.code, fontSize: 20, color: colors.success }}>
          $
        </span>
        <span style={{ fontFamily: fonts.code, fontSize: 20, color: colors.text }}>
          {" "}
          /babysit{" "}
        </span>
        <span style={{ fontFamily: fonts.code, fontSize: 20, color: colors.textMuted }}>
          "build API with 85% coverage"
        </span>
      </div>

      {/* Final quality */}
      <div
        style={{
          opacity: finalOpacity,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: fonts.heading,
            fontSize: 40,
            fontWeight: 700,
            color: colors.text,
          }}
        >
          Final quality:{" "}
          <span style={{ color: colors.success, textShadow: glows.success }}>
            100%
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
