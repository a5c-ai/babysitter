---
name: responsive-image
description: Generate responsive image sets with srcset, WebP/AVIF conversion, and art direction
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Responsive Image Skill

## Purpose

Generate responsive image sets for optimal performance across devices, including srcset variants, modern format conversion, and art direction.

## Capabilities

- Generate srcset image variants at multiple resolutions
- Convert to WebP and AVIF formats
- Calculate art direction crops for different viewports
- Generate picture element markup
- Create responsive image configuration
- Optimize images for performance

## Target Processes

- responsive-design.js
- component-library.js

## Integration Points

- Sharp for image processing
- ImageMagick for advanced transformations
- libvips for high-performance operations

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "inputPath": {
      "type": "string",
      "description": "Path to source image"
    },
    "outputPath": {
      "type": "string",
      "description": "Output directory"
    },
    "widths": {
      "type": "array",
      "items": { "type": "number" },
      "default": [320, 640, 960, 1280, 1920]
    },
    "formats": {
      "type": "array",
      "items": { "type": "string" },
      "default": ["webp", "avif", "jpg"]
    },
    "quality": {
      "type": "number",
      "default": 80
    },
    "artDirection": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "breakpoint": { "type": "number" },
          "crop": { "type": "object" }
        }
      }
    },
    "generateMarkup": {
      "type": "boolean",
      "default": true
    }
  },
  "required": ["inputPath"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "generatedImages": {
      "type": "array",
      "description": "List of generated image files"
    },
    "srcset": {
      "type": "string",
      "description": "srcset attribute value"
    },
    "pictureMarkup": {
      "type": "string",
      "description": "HTML picture element markup"
    },
    "sizeSavings": {
      "type": "object",
      "description": "File size comparison"
    }
  }
}
```

## Usage Example

```javascript
const result = await skill.execute({
  inputPath: './hero-image.jpg',
  outputPath: './responsive',
  widths: [320, 640, 960, 1280, 1920],
  formats: ['webp', 'avif', 'jpg'],
  generateMarkup: true
});
```
