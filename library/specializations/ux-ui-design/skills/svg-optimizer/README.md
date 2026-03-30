# SVG Optimizer Skill

Optimize SVG assets, generate sprites, and convert to framework components.

## Overview

This skill automates SVG optimization workflows, reducing file sizes while maintaining visual quality and generating reusable icon components.

## Key Features

- **File Optimization**: Remove metadata, optimize paths, minify
- **Sprite Generation**: Create SVG sprite sheets for icon systems
- **Component Conversion**: Generate React, Vue, or Svelte components
- **Accessibility**: Add ARIA attributes automatically
- **Size Reporting**: Track file size reductions

## When to Use

- Building icon systems for design systems
- Optimizing SVG exports from design tools
- Converting icon libraries to framework components
- Reducing asset payload sizes

## Optimization Levels

| Level | Actions | Use Case |
|-------|---------|----------|
| Minimal | Remove comments, metadata | Preserve editability |
| Standard | + Optimize paths, merge | Production use |
| Aggressive | + Remove hidden, simplify | Maximum compression |

## Related Components

- **Skills**: design-token-transformer
- **Agents**: iconography-system-agent
- **Processes**: component-library.js, design-system.js
