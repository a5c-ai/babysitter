# Responsive Image Skill

Generate responsive image sets with modern formats and art direction support.

## Overview

This skill automates responsive image generation, creating optimized variants for different devices and supporting modern image formats for better performance.

## Key Features

- **Srcset Generation**: Create multiple resolution variants
- **Modern Formats**: Convert to WebP and AVIF
- **Art Direction**: Crop images differently per breakpoint
- **Markup Generation**: Output ready-to-use picture elements
- **Size Optimization**: Report compression savings

## When to Use

- Building responsive websites with large hero images
- Optimizing image-heavy pages for performance
- Implementing art direction for different viewports
- Migrating to modern image formats

## Output Formats

| Format | Browser Support | Use Case |
|--------|-----------------|----------|
| AVIF | Modern browsers | Best compression |
| WebP | Wide support | Good compression |
| JPEG | Universal | Fallback |

## Related Components

- **Skills**: lighthouse, screenshot-comparison
- **Agents**: performance-auditor-agent, responsive-design-validator
- **Processes**: responsive-design.js
