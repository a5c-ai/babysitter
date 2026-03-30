---
name: prototype-interaction
description: Define and document prototype interactions, transitions, and hotspots
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Prototype Interaction Skill

## Purpose

Define prototype interactions, map click/tap actions, configure transitions, and generate interaction specifications for design handoff.

## Capabilities

- Map click/tap interactions to destinations
- Define transition animations and timing
- Set up interactive hotspots
- Generate interaction specification documents
- Export to Figma prototype format
- Create interaction matrices

## Target Processes

- hifi-prototyping.js
- wireframing.js (interactivePrototypeTask)

## Integration Points

- Figma Prototype API
- InVision API
- ProtoPie specifications

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "screens": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "imagePath": { "type": "string" }
        }
      }
    },
    "interactions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "sourceScreen": { "type": "string" },
          "hotspot": {
            "type": "object",
            "properties": {
              "x": { "type": "number" },
              "y": { "type": "number" },
              "width": { "type": "number" },
              "height": { "type": "number" }
            }
          },
          "trigger": {
            "type": "string",
            "enum": ["tap", "click", "hover", "drag", "swipe"]
          },
          "targetScreen": { "type": "string" },
          "transition": {
            "type": "object",
            "properties": {
              "type": { "type": "string" },
              "duration": { "type": "number" },
              "easing": { "type": "string" }
            }
          }
        }
      }
    },
    "outputFormat": {
      "type": "string",
      "enum": ["json", "figma", "invision", "markdown"],
      "default": "json"
    }
  },
  "required": ["screens", "interactions"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "interactionSpec": {
      "type": "object",
      "description": "Complete interaction specification"
    },
    "interactionMatrix": {
      "type": "array",
      "description": "Screen-to-screen interaction matrix"
    },
    "transitionGuide": {
      "type": "object",
      "description": "Transition timing and easing guide"
    },
    "hotspotOverlays": {
      "type": "array",
      "description": "Visual hotspot overlay data"
    },
    "exportPath": {
      "type": "string",
      "description": "Path to exported specification"
    }
  }
}
```

## Usage Example

```javascript
const result = await skill.execute({
  screens: [
    { id: 'home', name: 'Home Screen', imagePath: './screens/home.png' },
    { id: 'detail', name: 'Detail View', imagePath: './screens/detail.png' }
  ],
  interactions: [
    {
      sourceScreen: 'home',
      hotspot: { x: 100, y: 200, width: 150, height: 50 },
      trigger: 'tap',
      targetScreen: 'detail',
      transition: { type: 'slide-left', duration: 300, easing: 'ease-out' }
    }
  ],
  outputFormat: 'markdown'
});
```
