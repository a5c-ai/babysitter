// a5c.ai Brand Colors
export const colors = {
  background: "#0A0A0A",
  backgroundLight: "#1A1A1A",
  primary: "#FF00E0", // Magenta - babysitter brand
  success: "#00FFFF", // Cyan - completion states
  warning: "#FFE600", // Yellow - attention
  error: "#FF3366", // Red-pink - failures
  text: "#FFFFFF",
  textMuted: "rgba(255,255,255,0.7)",
  textDim: "rgba(255,255,255,0.4)",
};

// Typography
export const fonts = {
  heading: "Inter, system-ui, sans-serif",
  body: "Inter, system-ui, sans-serif",
  code: "JetBrains Mono, monospace",
};

// Neon glow effects
export const glows = {
  primary: `0 0 10px ${colors.primary}, 0 0 20px ${colors.primary}, 0 0 40px ${colors.primary}`,
  success: `0 0 10px ${colors.success}, 0 0 20px ${colors.success}, 0 0 40px ${colors.success}`,
  warning: `0 0 10px ${colors.warning}, 0 0 20px ${colors.warning}`,
  error: `0 0 10px ${colors.error}, 0 0 20px ${colors.error}`,
  subtle: `0 0 5px ${colors.primary}, 0 0 10px ${colors.primary}`,
};

// Timing constants (in frames at 30fps)
export const timing = {
  fps: 30,
  sceneFade: 8, // ~0.27s
  springConfig: {
    damping: 12,
    stiffness: 100,
    mass: 0.5,
  },
};

// Video dimensions
export const dimensions = {
  width: 1920,
  height: 1080,
};
