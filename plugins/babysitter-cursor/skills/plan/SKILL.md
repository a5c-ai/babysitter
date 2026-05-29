---
name: plan
description: Plan a babysitter run. use this command to plan a complex workflow, without actually running it.
---

# plan

Invoke the babysitter:babysit skill (using the Skill tool) and follow its instructions (SKILL.md). focus on creating the best process possible, but without creating and running the actual run.

## HYPOTHESES authoring requirement

When the process file you author exports a top-level `HYPOTHESES` array (for hypothesis-driven debugging or investigation runs), every entry MUST set `falsifying_observation` (or camelCase `falsifyingObservation`) to a non-empty string that names the specific observation that would falsify the hypothesis.

The `check:processes` lint enforces this. Run `npm run check:processes` to verify before creating the run.

### Why this is required

Hypothesis ranking without falsification criteria is noise — an unfalsifiable hypothesis cannot be ranked, deprioritized, or eliminated by observation. The cookbook's VI-9 iOS Safari forensics demoted the actual root cause (H3) to LOW likelihood based on a soft argument; a required `falsifying_observation` field would have surfaced the missing criterion before two wasted forensic cycles.

### Shape

```js
export const HYPOTHESES = [
  {
    id: 'H1',
    title: 'Web Audio context auto-suspends',
    prediction: 'cycle 2 wedges if AudioContext.state !== "running"',
    falsifying_observation: 'cycle 2 wedges even when AudioContext.state === "running" at cycle-2 start',
    likelihood: 'medium',
  },
  // ...
];
```
