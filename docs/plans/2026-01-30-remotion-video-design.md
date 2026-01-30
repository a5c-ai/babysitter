# Babysitter Explainer Video - Design Document

## Overview

A 45-second teaser video explaining Babysitter to experienced Claude Code users. The video focuses on the compounding error problem in multi-step AI workflows and how Babysitter solves it.

## Target Audience

Experienced Claude Code users who understand the pain points of AI-assisted development but haven't yet discovered Babysitter.

## Key Message

AI agents are ~80% reliable per step. In complex multi-step workflows, that compounds to catastrophic failure rates. Babysitter loops until quality targets are met, preserves context across sessions, and requires human approval for critical steps.

## Video Specifications

- **Duration:** 45 seconds (1350 frames)
- **Resolution:** 1920x1080 (1080p)
- **Frame Rate:** 30 FPS
- **Format:** MP4

## Brand Identity

### Colors
| Name | Hex | Usage |
|------|-----|-------|
| Background | `#0A0A0A` | Night black base |
| Primary | `#FF00E0` | Magenta - babysitter brand, highlights |
| Success | `#00FFFF` | Cyan - completion states, checkmarks |
| Warning | `#FFE600` | Yellow - attention, degrading quality |
| Error | `#FF3366` | Red-pink - failures |
| Text | `#FFFFFF` | Primary text |
| Text Muted | `rgba(255,255,255,0.7)` | Secondary text |

### Typography
- **Headlines:** Inter Bold, 72px, white
- **Body:** Inter Medium, 36px, white at 70% opacity
- **Code:** JetBrains Mono, 28px, syntax highlighted

### Effects
Neon glow on key elements:
```css
text-shadow: 0 0 10px #FF00E0, 0 0 20px #FF00E0, 0 0 40px #FF00E0;
```

## Scene Breakdown

### Scene 1: Hook (0:00-0:04, frames 0-120)

**Visual:** Terminal window with code, confident cursor blinking

**Text:** "Your AI agent is 80% reliable."

**Tone:** Seems acceptable, right?

**Animation:** Fade in terminal, then fade in text

---

### Scene 2: The Compounding Problem (0:04-0:14, frames 120-420)

**Visual:** Pipeline visualization with 5 sequential steps, each labeled "80%"

**Animation:** Quality progress bar degrades through each step:
- Step 1: 100% → 80% (cyan)
- Step 2: 80% → 64% (cyan → yellow)
- Step 3: 64% → 51% (yellow)
- Step 4: 51% → 41% (yellow → magenta)
- Step 5: 41% → 33% (magenta → red)

**Text sequence:**
1. "Step 1: 80%"
2. "Step 2: 64%"
3. "Step 3: 51%"
4. "Step 4: 41%"
5. "Step 5: 33%"
6. Final: "5 steps later: 33% success rate"
7. "Complex workflows fail."

**Key insight:** 0.8^5 = 0.328 (32.8%)

---

### Scene 3: Quality Convergence (0:14-0:24, frames 420-720)

**Visual:** Same 5-step pipeline, but with retry loops visualized

**Animation:** Each step shows:
- Initial attempt: 80%
- Retry 1: 95%
- Retry 2: 100% ✓ (cyan checkmark, glow effect)

**Text:** "Babysitter loops until it works."

**CLI snippet:** `/babysit "build API with 85% coverage"`

**End state:** All 5 steps glowing cyan with checkmarks

---

### Scene 4: Resumability (0:24-0:32, frames 720-960)

**Visual:**
1. Workflow in progress (step 3 of 5 highlighted)
2. Terminal window "closes" (shrink + fade animation)
3. Terminal reopens
4. Same state restored - step 3 still highlighted, ready to continue

**Text:** "Context saved. Resume anytime."

**Detail:** Brief flash of `.a5c/journal.jsonl` file

---

### Scene 5: Human Breakpoints (0:32-0:40, frames 960-1200)

**Visual:**
1. Workflow progressing through steps
2. PAUSE before "Deploy" step
3. Approval modal slides in with:
   - Context preview (what will be deployed)
   - "Approve" button (cyan)
   - "Reject" button (muted)
4. Click "Approve" → checkmark → workflow continues

**Text:** "You approve critical steps."

---

### Scene 6: CTA (0:40-0:45, frames 1200-1350)

**Visual:**
1. a5c.ai logo fades in with neon magenta glow
2. "babysitter" text below logo
3. Install command appears: `npm i -g @a5c-ai/babysitter`

**End card:** Logo + URL remain for final frames

---

## Project Structure

```
video/
├── package.json
├── remotion.config.ts
├── tsconfig.json
├── src/
│   ├── Root.tsx                    # Composition registry
│   ├── Video.tsx                   # Main composition (sequences scenes)
│   ├── scenes/
│   │   ├── Hook.tsx                # Scene 1
│   │   ├── CompoundingError.tsx    # Scene 2
│   │   ├── QualityConvergence.tsx  # Scene 3
│   │   ├── Resumability.tsx        # Scene 4
│   │   ├── Breakpoints.tsx         # Scene 5
│   │   └── CTA.tsx                 # Scene 6
│   ├── components/
│   │   ├── Terminal.tsx            # Reusable terminal window
│   │   ├── ProgressBar.tsx         # Animated quality bar
│   │   ├── Pipeline.tsx            # Step visualization (5 boxes)
│   │   ├── PipelineStep.tsx        # Individual step with retry animation
│   │   ├── NeonText.tsx            # Glowing text component
│   │   ├── ApprovalModal.tsx       # Breakpoint approval UI
│   │   └── Logo.tsx                # a5c.ai logo
│   └── styles/
│       └── theme.ts                # Colors, fonts, shared styles
```

## Animation Guidelines

### Timing
- Scene transitions: 8 frames (0.27s) fade
- Element entrances: Spring animation, damping: 12, stiffness: 100
- Progress bars: Linear interpolation, 15-20 frames per step
- Checkmarks: Scale from 0 with spring, + glow pulse

### Remotion Utilities
- `spring()` for organic motion
- `interpolate()` for progress and opacity
- `Sequence` for scene timing
- `useCurrentFrame()` for animation state

## Dependencies

```json
{
  "dependencies": {
    "@remotion/cli": "^4.0.0",
    "remotion": "^4.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "typescript": "^5.0.0"
  }
}
```

## Build Commands

```bash
# Development preview
npm run dev

# Render final video
npm run build

# Render to specific format
npx remotion render src/index.ts Video out/babysitter-explainer.mp4
```

## Success Criteria

1. Video renders without errors at 1080p/30fps
2. All 6 scenes flow smoothly with proper timing
3. Brand colors and typography match a5c.ai identity
4. Compounding error visualization is clear and impactful
5. CTA is prominent with correct install command
