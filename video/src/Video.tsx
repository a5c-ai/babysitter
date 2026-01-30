import { AbsoluteFill, Sequence } from "remotion";
import { colors } from "./styles/theme";
import { Hook } from "./scenes/Hook";
import { CompoundingError } from "./scenes/CompoundingError";
import { QualityConvergence } from "./scenes/QualityConvergence";
import { Resumability } from "./scenes/Resumability";
import { Breakpoints } from "./scenes/Breakpoints";
import { CTA } from "./scenes/CTA";

// Frame timing for 45-second video at 30fps (1350 total frames)
const SCENES = {
  hook: { from: 0, duration: 120 }, // 0:00-0:04 (4s)
  compounding: { from: 120, duration: 300 }, // 0:04-0:14 (10s)
  quality: { from: 420, duration: 300 }, // 0:14-0:24 (10s)
  resumability: { from: 720, duration: 240 }, // 0:24-0:32 (8s)
  breakpoints: { from: 960, duration: 240 }, // 0:32-0:40 (8s)
  cta: { from: 1200, duration: 150 }, // 0:40-0:45 (5s)
};

export const Video: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      {/* Scene 1: Hook - "Your AI agent is 80% reliable" */}
      <Sequence from={SCENES.hook.from} durationInFrames={SCENES.hook.duration}>
        <Hook />
      </Sequence>

      {/* Scene 2: Compounding Error - Quality degrades through steps */}
      <Sequence
        from={SCENES.compounding.from}
        durationInFrames={SCENES.compounding.duration}
      >
        <CompoundingError />
      </Sequence>

      {/* Scene 3: Quality Convergence - Babysitter loops until success */}
      <Sequence
        from={SCENES.quality.from}
        durationInFrames={SCENES.quality.duration}
      >
        <QualityConvergence />
      </Sequence>

      {/* Scene 4: Resumability - Session closes, reopens with state */}
      <Sequence
        from={SCENES.resumability.from}
        durationInFrames={SCENES.resumability.duration}
      >
        <Resumability />
      </Sequence>

      {/* Scene 5: Breakpoints - Human approval before deploy */}
      <Sequence
        from={SCENES.breakpoints.from}
        durationInFrames={SCENES.breakpoints.duration}
      >
        <Breakpoints />
      </Sequence>

      {/* Scene 6: CTA - Logo, install command, URL */}
      <Sequence from={SCENES.cta.from} durationInFrames={SCENES.cta.duration}>
        <CTA />
      </Sequence>
    </AbsoluteFill>
  );
};
