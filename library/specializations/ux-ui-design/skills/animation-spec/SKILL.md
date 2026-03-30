---
name: animation-spec
description: Generate animation specifications, easing curves, and motion design documentation
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Animation Spec Skill

## Purpose

Generate comprehensive animation specifications including easing curves, timing values, and motion design guidelines for consistent UI animations.

## Capabilities

- Define custom easing curves (cubic-bezier)
- Calculate animation timing for different contexts
- Generate CSS animation keyframes
- Create Lottie animation specifications
- Document motion design guidelines
- Export animation tokens

## Target Processes

- component-library.js (interactionAnimationTask)
- hifi-prototyping.js
- design-system.js

## Integration Points

- CSS animations
- Lottie animations
- Framer Motion
- GSAP

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "animationType": {
      "type": "string",
      "enum": ["entrance", "exit", "emphasis", "transition", "loading", "feedback"],
      "description": "Category of animation"
    },
    "duration": {
      "type": "object",
      "properties": {
        "fast": { "type": "number", "default": 150 },
        "normal": { "type": "number", "default": 300 },
        "slow": { "type": "number", "default": 500 }
      }
    },
    "easing": {
      "type": "object",
      "properties": {
        "standard": { "type": "string" },
        "decelerate": { "type": "string" },
        "accelerate": { "type": "string" }
      }
    },
    "elements": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "properties": { "type": "array" },
          "stagger": { "type": "number" }
        }
      }
    },
    "outputFormat": {
      "type": "string",
      "enum": ["css", "js", "lottie", "tokens"],
      "default": "css"
    }
  },
  "required": ["animationType"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "animationSpec": {
      "type": "object",
      "description": "Complete animation specification"
    },
    "easingCurves": {
      "type": "object",
      "description": "Cubic-bezier values"
    },
    "cssKeyframes": {
      "type": "string",
      "description": "CSS @keyframes code"
    },
    "tokens": {
      "type": "object",
      "description": "Animation design tokens"
    },
    "documentation": {
      "type": "string",
      "description": "Motion design guidelines"
    }
  }
}
```

## Usage Example

```javascript
const result = await skill.execute({
  animationType: 'entrance',
  duration: { fast: 150, normal: 300, slow: 500 },
  easing: {
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)'
  },
  outputFormat: 'css'
});
```
