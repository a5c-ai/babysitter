import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, spring } from "remotion";
import { colors, fonts, glows, timing } from "../styles/theme";
import { ApprovalModal } from "../components/ApprovalModal";

// Scene 5: Human Breakpoints (frames 960-1200, 8 seconds)
// Workflow pauses before deploy, shows approval modal

export const Breakpoints: React.FC = () => {
  const frame = useCurrentFrame();

  // Phase 1: Workflow progressing (0-60)
  // Phase 2: Pause at deploy (60-80)
  // Phase 3: Modal appears (80-160)
  // Phase 4: Approved (160-240)

  const steps = [
    { label: "Build", done: true },
    { label: "Test", done: true },
    { label: "Review", done: true },
    { label: "Deploy", done: false, breakpoint: true },
  ];

  // Animate steps completing
  const getStepDone = (index: number) => {
    if (index < 3) {
      return frame >= index * 15 + 10;
    }
    return frame >= 180; // Deploy completes after approval
  };

  // Modal timing
  const modalDelay = 70;
  const approveFrame = 150;
  const isApproved = frame >= approveFrame;

  // Title
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Final message
  const finalOpacity = interpolate(frame, [180, 200], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Workflow paused indicator
  const pausedOpacity = interpolate(frame, [50, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pausedFadeOut = interpolate(frame, [80, 95], [1, 0], {
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
      {/* Pipeline */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          marginBottom: 20,
        }}
      >
        {steps.map((step, index) => {
          const isDone = getStepDone(index);
          const isBreakpoint = step.breakpoint && !isApproved;
          const isPaused = isBreakpoint && frame >= 50 && frame < 180;

          const stepOpacity = interpolate(
            frame,
            [index * 12, index * 12 + 15],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          const borderColor = isDone
            ? colors.success
            : isPaused
            ? colors.warning
            : colors.textDim;

          const glow = isDone
            ? glows.success
            : isPaused
            ? glows.warning
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
                    width: 100,
                    height: 70,
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
                      fontSize: 16,
                      fontWeight: 600,
                      color: isDone ? colors.success : isPaused ? colors.warning : colors.textMuted,
                    }}
                  >
                    {step.label}
                  </div>

                  {/* Breakpoint indicator */}
                  {step.breakpoint && !isDone && (
                    <div
                      style={{
                        position: "absolute",
                        top: -10,
                        right: -10,
                        width: 24,
                        height: 24,
                        backgroundColor: isPaused ? colors.warning : colors.textDim,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        color: colors.background,
                        fontWeight: 700,
                        boxShadow: isPaused ? glows.warning : "none",
                      }}
                    >
                      ⏸
                    </div>
                  )}

                  {/* Success checkmark */}
                  {isDone && (
                    <div
                      style={{
                        position: "absolute",
                        top: -10,
                        right: -10,
                        width: 24,
                        height: 24,
                        backgroundColor: colors.success,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
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

              {index < steps.length - 1 && (
                <div
                  style={{
                    width: 40,
                    height: 3,
                    backgroundColor: getStepDone(index) ? colors.success : colors.textDim,
                    boxShadow: getStepDone(index) ? glows.success : "none",
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* "Workflow paused" text */}
      {frame >= 50 && frame < 95 && (
        <div
          style={{
            opacity: pausedOpacity * pausedFadeOut,
            fontFamily: fonts.body,
            fontSize: 24,
            color: colors.warning,
            textShadow: glows.warning,
          }}
        >
          Workflow paused - awaiting approval
        </div>
      )}

      {/* Approval Modal */}
      {frame >= modalDelay && frame < 200 && (
        <ApprovalModal
          delay={modalDelay}
          approved={isApproved}
          approveFrame={approveFrame}
        />
      )}

      {/* Final message */}
      {frame >= 180 && (
        <div
          style={{
            opacity: finalOpacity,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: fonts.heading,
              fontSize: 48,
              fontWeight: 700,
              color: colors.text,
            }}
          >
            You approve.{" "}
            <span style={{ color: colors.success, textShadow: glows.success }}>
              Then it deploys.
            </span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
