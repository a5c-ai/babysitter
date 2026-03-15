# Typography Calculator Skill

Calculate typography scales, metrics, and responsive font sizing for design systems.

## Overview

This skill automates typography system creation by calculating modular scales, optimal line heights, and fluid typography values for responsive designs.

## Key Features

- **Modular Scales**: Generate scales using various ratios (golden ratio, perfect fourth, etc.)
- **Line Height Optimization**: Calculate optimal line heights for readability
- **Fluid Typography**: Generate CSS clamp() values for smooth scaling
- **Vertical Rhythm**: Calculate baseline grid and spacing values
- **Token Generation**: Export as design tokens

## When to Use

- Establishing typography foundations for a design system
- Converting static typography to fluid/responsive
- Auditing and improving typography consistency
- Creating typography documentation

## Scale Ratios

| Ratio | Value | Use Case |
|-------|-------|----------|
| Minor Second | 1.067 | Subtle hierarchy |
| Major Second | 1.125 | Compact interfaces |
| Minor Third | 1.2 | General purpose |
| Major Third | 1.25 | Blog/editorial |
| Perfect Fourth | 1.333 | Marketing sites |
| Golden Ratio | 1.618 | Bold statements |

## Related Components

- **Skills**: design-token-transformer
- **Agents**: typography-system-agent
- **Processes**: component-library.js, responsive-design.js
