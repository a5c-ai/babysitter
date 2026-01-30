import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, spring } from "remotion";
import { colors, fonts, glows, timing } from "../styles/theme";

// Scene 4: Resumability (frames 720-960, 8 seconds)
// Session closes mid-workflow, reopens with state preserved

export const Resumability: React.FC = () => {
  const frame = useCurrentFrame();

  // Phase 1: Show workflow in progress (0-60)
  // Phase 2: Terminal closes (60-100)
  // Phase 3: Terminal reopens (100-160)
  // Phase 4: Same state shown (160-240)

  const isClosing = frame >= 60 && frame < 100;
  const isClosed = frame >= 100 && frame < 130;
  const isReopening = frame >= 130;

  // Terminal scale animation
  const terminalScale = (() => {
    if (frame < 60) return 1;
    if (frame < 100) {
      return interpolate(frame, [60, 95], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
    }
    if (frame < 130) return 0;
    return spring({
      frame: frame - 130,
      fps: timing.fps,
      config: { damping: 12, stiffness: 80 },
    });
  })();

  // Message opacity
  const closedMessageOpacity = interpolate(frame, [100, 115], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const resumeMessageOpacity = interpolate(frame, [170, 190], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Current step indicator
  const currentStep = 3;

  const steps = [
    { label: "Plan", done: true },
    { label: "Implement", done: true },
    { label: "Test", done: false, current: true },
    { label: "Refine", done: false },
    { label: "Deploy", done: false },
  ];

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
      {/* Terminal with workflow */}
      <div
        style={{
          transform: `scale(${terminalScale})`,
          opacity: terminalScale,
        }}
      >
        <div
          style={{
            width: 900,
            backgroundColor: colors.backgroundLight,
            borderRadius: 12,
            border: `1px solid ${colors.textDim}`,
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          {/* Terminal header */}
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
                backgroundColor: isClosing ? "#FF5F56" : "#FF5F56",
                boxShadow: isClosing ? "0 0 8px #FF5F56" : "none",
              }}
            />
            <div
              style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#FFBD2E" }}
            />
            <div
              style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#27CA3F" }}
            />
            <div
              style={{
                marginLeft: "auto",
                marginRight: 16,
                fontFamily: fonts.code,
                fontSize: 12,
                color: colors.textMuted,
              }}
            >
              babysitter - running
            </div>
          </div>

          {/* Workflow progress */}
          <div style={{ padding: 24 }}>
            <div
              style={{
                fontFamily: fonts.code,
                fontSize: 14,
                color: colors.textMuted,
                marginBottom: 20,
              }}
            >
              Process: build-feature-auth
            </div>

            {/* Step indicators */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 24,
              }}
            >
              {steps.map((step, i) => (
                <React.Fragment key={i}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        backgroundColor: step.done
                          ? colors.success
                          : step.current
                          ? colors.primary
                          : colors.backgroundLight,
                        border: `2px solid ${
                          step.done
                            ? colors.success
                            : step.current
                            ? colors.primary
                            : colors.textDim
                        }`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: fonts.code,
                        fontSize: 14,
                        color: step.done || step.current ? colors.background : colors.textMuted,
                        fontWeight: 700,
                        boxShadow: step.current ? glows.primary : step.done ? glows.success : "none",
                      }}
                    >
                      {step.done ? "✓" : i + 1}
                    </div>
                    <div
                      style={{
                        fontFamily: fonts.code,
                        fontSize: 11,
                        color: step.current ? colors.primary : colors.textMuted,
                      }}
                    >
                      {step.label}
                    </div>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      style={{
                        flex: 1,
                        height: 2,
                        backgroundColor: step.done ? colors.success : colors.textDim,
                        marginBottom: 20,
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Current task */}
            <div
              style={{
                backgroundColor: colors.background,
                padding: 16,
                borderRadius: 8,
                border: `1px solid ${colors.primary}`,
              }}
            >
              <div
                style={{
                  fontFamily: fonts.code,
                  fontSize: 14,
                  color: colors.primary,
                  marginBottom: 8,
                }}
              >
                Current: Running tests...
              </div>
              <div
                style={{
                  fontFamily: fonts.code,
                  fontSize: 12,
                  color: colors.textMuted,
                }}
              >
                ▸ 23/47 tests passing{frame % 30 < 15 && <span style={{ color: colors.primary }}> ▊</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* "Session closed" message */}
      {isClosed && (
        <div
          style={{
            opacity: closedMessageOpacity,
            fontFamily: fonts.body,
            fontSize: 28,
            color: colors.textMuted,
          }}
        >
          Session ended.
        </div>
      )}

      {/* Resume message */}
      {isReopening && (
        <div
          style={{
            opacity: resumeMessageOpacity,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: fonts.heading,
              fontSize: 48,
              fontWeight: 700,
              color: colors.text,
              marginBottom: 12,
            }}
          >
            Context saved.{" "}
            <span style={{ color: colors.success, textShadow: glows.success }}>
              Resume anytime.
            </span>
          </div>
          <div
            style={{
              fontFamily: fonts.code,
              fontSize: 18,
              color: colors.textMuted,
            }}
          >
            .a5c/journal.jsonl
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
