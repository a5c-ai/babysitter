# Responsive Verifier Agent

Responsive design verification agent that ensures pixel-perfect implementation across all specified viewports.

## Overview

This agent verifies that the UI implementation maintains design fidelity across different screen sizes and devices, identifying responsive breakpoint issues and viewport-specific problems.

## Viewport Testing

Default viewports tested:

| Name | Width | Height | Use Case |
|------|-------|--------|----------|
| mobile | 375 | 667 | iPhone SE |
| tablet | 768 | 1024 | iPad Portrait |
| desktop | 1920 | 1080 | Standard Desktop |

## Issues Detected

- **Horizontal Overflow**: Content wider than viewport
- **Element Overlap**: Elements colliding at smaller sizes
- **Missing Elements**: Elements disappearing unexpectedly
- **Touch Targets**: Buttons too small for touch (< 44x44px)
- **Text Scaling**: Font sizes too small for readability

## Usage

This agent is called as an optional phase when `includeResponsive: true`.

### Example Input

```json
{
  "targetUrl": "http://localhost:3000",
  "viewports": [
    { "name": "mobile", "width": 375, "height": 667 },
    { "name": "tablet", "width": 768, "height": 1024 },
    { "name": "desktop", "width": 1920, "height": 1080 }
  ],
  "criticalElements": ["nav", "main-content", "footer"]
}
```

### Example Output

```json
{
  "overallStatus": "warning",
  "viewportResults": [
    {
      "viewport": { "name": "mobile", "width": 375 },
      "status": "warning",
      "issues": [
        {
          "severity": "major",
          "type": "touch-target",
          "element": "nav-menu-button",
          "description": "Touch target too small: 32x32px"
        }
      ]
    },
    ...
  ],
  "recommendations": [
    "Increase nav button size to 44x44px minimum"
  ]
}
```

## Related

- [pixel-perfect-implementation.js](../../pixel-perfect-implementation.js) - Main process
- [accessibility-verifier](../accessibility-verifier/) - Accessibility agent
