# Animation Spec Skill

Generate animation specifications and motion design documentation.

## Overview

This skill creates comprehensive animation specifications for design systems, including easing curves, timing guidelines, and exportable animation code.

## Key Features

- **Easing Curves**: Define cubic-bezier curves
- **Timing Systems**: Consistent duration scales
- **CSS Export**: Generate @keyframes and transitions
- **Token Generation**: Animation design tokens
- **Documentation**: Motion design guidelines

## When to Use

- Establishing motion design foundations
- Creating consistent UI animations
- Documenting interaction animations
- Generating animation code from specs

## Animation Categories

| Category | Duration | Use Case |
|----------|----------|----------|
| Entrance | 200-400ms | Elements appearing |
| Exit | 150-300ms | Elements leaving |
| Emphasis | 200-400ms | Attention drawing |
| Transition | 200-500ms | State changes |
| Loading | Variable | Progress indication |
| Feedback | 100-200ms | User input response |

## Easing Presets

- **Standard**: Natural movement (0.4, 0.0, 0.2, 1)
- **Decelerate**: Enter screen (0.0, 0.0, 0.2, 1)
- **Accelerate**: Exit screen (0.4, 0.0, 1, 1)

## Related Components

- **Skills**: prototype-interaction
- **Agents**: interaction-design-agent
- **Processes**: component-library.js, hifi-prototyping.js
