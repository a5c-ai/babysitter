import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { colors, fonts, glows } from "../styles/theme";

// Scene 2: The Compounding Problem (frames 120-420, 10 seconds)
// Shows how 80% per step compounds to 33% over 5 steps

const STEPS = [
  { label: "Step 1", multiplier: 0.8 },
  { label: "Step 2", multiplier: 0.64 },
  { label: "Step 3", multiplier: 0.512 },
  { label: "Step 4", multiplier: 0.41 },
  { label: "Step 5", multiplier: 0.328 },
];

const getColorForPercentage = (pct: number): string => {
  if (pct >= 70) return colors.success;
  if (pct >= 50) return colors.warning;
  if (pct >= 35) return colors.primary;
  return colors.error;
};

const getGlowForPercentage = (pct: number): string => {
  if (pct >= 70) return glows.success;
  if (pct >= 50) return glows.warning;
  if (pct >= 35) return glows.primary;
  return glows.error;
};

export const CompoundingError: React.FC = () => {
  const frame = useCurrentFrame();

  // Each step animates over 45 frames, with 15 frame gaps
  const getStepProgress = (stepIndex: number) => {
    const stepStart = stepIndex * 50;
    const progress = interpolate(frame, [stepStart, stepStart + 40], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return progress;
  };

  // Current quality percentage
  const getCurrentQuality = () => {
    let quality = 100;
    for (let i = 0; i < STEPS.length; i++) {
      const progress = getStepProgress(i);
      if (progress > 0) {
        const stepStart = i === 0 ? 100 : STEPS[i - 1].multiplier * 100;
        const stepEnd = STEPS[i].multiplier * 100;
        quality = stepStart - (stepStart - stepEnd) * progress;
      }
    }
    return Math.round(quality);
  };

  const quality = getCurrentQuality();
  const qualityColor = getColorForPercentage(quality);
  const qualityGlow = getGlowForPercentage(quality);

  // Final message
  const showFinalMessage = frame > 260;
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
        gap: 50,
      }}
    >
      {/* Pipeline visualization */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        {STEPS.map((step, index) => {
          const progress = getStepProgress(index);
          const isActive = progress > 0;
          const isComplete = progress >= 1;
          const stepPct = Math.round(step.multiplier * 100);
          const stepColor = isActive
            ? getColorForPercentage(stepPct)
            : colors.textDim;
          const stepGlow = isActive ? getGlowForPercentage(stepPct) : "none";

          return (
            <React.Fragment key={index}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  opacity: interpolate(
                    frame,
                    [index * 50, index * 50 + 15],
                    [0.3, 1],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                  ),
                  transform: `scale(${interpolate(
                    frame,
                    [index * 50, index * 50 + 15],
                    [0.9, 1],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                  )})`,
                }}
              >
                <div
                  style={{
                    width: 100,
                    height: 70,
                    backgroundColor: colors.backgroundLight,
                    border: `2px solid ${stepColor}`,
                    borderRadius: 12,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: isComplete ? stepGlow : "none",
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
                      fontSize: 20,
                      fontWeight: 700,
                      color: stepColor,
                    }}
                  >
                    80%
                  </div>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  style={{
                    width: 30,
                    height: 3,
                    backgroundColor: isComplete ? stepColor : colors.textDim,
                    boxShadow: isComplete ? stepGlow : "none",
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Quality bar */}
      <div style={{ width: 700 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: 24,
              color: colors.textMuted,
            }}
          >
            Overall Quality
          </div>
          <div
            style={{
              fontFamily: fonts.code,
              fontSize: 32,
              fontWeight: 700,
              color: qualityColor,
              textShadow: qualityGlow,
            }}
          >
            {quality}%
          </div>
        </div>
        <div
          style={{
            width: "100%",
            height: 20,
            backgroundColor: colors.backgroundLight,
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${quality}%`,
              height: "100%",
              backgroundColor: qualityColor,
              borderRadius: 10,
              boxShadow: qualityGlow,
              transition: "background-color 0.2s",
            }}
          />
        </div>
      </div>

      {/* Final message */}
      {showFinalMessage && (
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
              marginBottom: 16,
            }}
          >
            5 steps later:{" "}
            <span style={{ color: colors.error, textShadow: glows.error }}>
              33% success rate
            </span>
          </div>
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: 32,
              color: colors.textMuted,
            }}
          >
            Complex workflows fail.
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
