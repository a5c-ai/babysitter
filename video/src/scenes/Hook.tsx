import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { colors, fonts, glows } from "../styles/theme";
import { Terminal } from "../components/Terminal";

// Scene 1: Hook (frames 0-120, 4 seconds)
// "Your AI agent is 80% reliable."

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();

  // Code typing effect
  const codeLines = [
    "$ claude 'build user auth'",
    "Creating authentication module...",
    "Writing login component...",
    "Adding session handling...",
    "Implementing JWT tokens...",
  ];

  const visibleLines = Math.min(
    Math.floor(frame / 15),
    codeLines.length
  );

  // Main text fade in
  const textOpacity = interpolate(frame, [50, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const textScale = interpolate(frame, [50, 70], [0.9, 1], {
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
      <Terminal delay={0} width={800} height={280}>
        {codeLines.slice(0, visibleLines).map((line, i) => (
          <div
            key={i}
            style={{
              color: i === 0 ? colors.success : colors.textMuted,
              marginBottom: 8,
            }}
          >
            {line}
            {i === visibleLines - 1 && frame % 30 < 15 && (
              <span style={{ color: colors.primary }}>▊</span>
            )}
          </div>
        ))}
      </Terminal>

      <div
        style={{
          opacity: textOpacity,
          transform: `scale(${textScale})`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: fonts.heading,
            fontSize: 64,
            fontWeight: 700,
            color: colors.text,
          }}
        >
          Your AI agent is{" "}
          <span
            style={{
              color: colors.success,
              textShadow: glows.success,
            }}
          >
            80%
          </span>{" "}
          reliable.
        </div>
      </div>
    </AbsoluteFill>
  );
};
