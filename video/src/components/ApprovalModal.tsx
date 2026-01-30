import React from "react";
import { interpolate, useCurrentFrame, spring } from "remotion";
import { colors, fonts, glows, timing } from "../styles/theme";

interface ApprovalModalProps {
  delay?: number;
  approved?: boolean;
  approveFrame?: number;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  delay = 0,
  approved = false,
  approveFrame = 9999,
}) => {
  const frame = useCurrentFrame();

  const scale = spring({
    frame: frame - delay,
    fps: timing.fps,
    config: { damping: 12, stiffness: 80 },
  });

  const opacity = interpolate(frame - delay, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const isApproved = frame >= approveFrame;

  // Fade out after approval
  const fadeOut = isApproved
    ? interpolate(frame - approveFrame, [15, 30], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

  return (
    <div
      style={{
        opacity: opacity * fadeOut,
        transform: `scale(${Math.min(scale, 1)})`,
      }}
    >
      <div
        style={{
          width: 500,
          backgroundColor: colors.backgroundLight,
          borderRadius: 16,
          border: `2px solid ${colors.primary}`,
          boxShadow: `${glows.subtle}, 0 20px 60px rgba(0,0,0,0.5)`,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 24px",
            backgroundColor: "rgba(255,0,224,0.1)",
            borderBottom: `1px solid ${colors.textDim}`,
          }}
        >
          <div
            style={{
              fontFamily: fonts.heading,
              fontSize: 20,
              fontWeight: 700,
              color: colors.primary,
            }}
          >
            Breakpoint: Deploy to Production
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 24 }}>
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: 16,
              color: colors.textMuted,
              marginBottom: 16,
            }}
          >
            Review changes before deployment:
          </div>

          <div
            style={{
              backgroundColor: colors.background,
              borderRadius: 8,
              padding: 16,
              fontFamily: fonts.code,
              fontSize: 14,
              color: colors.text,
              marginBottom: 24,
            }}
          >
            <div style={{ color: colors.success }}>+ 3 files added</div>
            <div style={{ color: colors.warning }}>~ 12 files modified</div>
            <div style={{ color: colors.textMuted }}>
              All tests passing (47/47)
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 16, justifyContent: "flex-end" }}>
            <button
              style={{
                padding: "12px 24px",
                borderRadius: 8,
                border: `1px solid ${colors.textDim}`,
                backgroundColor: "transparent",
                color: colors.textMuted,
                fontFamily: fonts.body,
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reject
            </button>
            <button
              style={{
                padding: "12px 24px",
                borderRadius: 8,
                border: "none",
                backgroundColor: isApproved ? colors.success : colors.primary,
                color: colors.background,
                fontFamily: fonts.body,
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: isApproved ? glows.success : glows.subtle,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {isApproved ? "✓ Approved" : "Approve"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
