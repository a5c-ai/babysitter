---
name: geometry-primitive-library
description: Provide robust computational geometry primitives
allowed-tools:
  - Read
  - Write
  - Grep
  - Glob
  - Edit
---

# Geometry Primitive Library Skill

## Purpose

Provide robust implementations of computational geometry primitives with proper handling of edge cases and numerical precision.

## Capabilities

- Point, line, segment, polygon classes
- Cross product, dot product operations
- CCW/CW orientation tests
- Area calculations
- Intersection tests
- Distance calculations

## Target Processes

- computational-geometry

## Geometric Primitives

### Point Operations
- Point addition, subtraction
- Scalar multiplication
- Dot product
- Cross product
- Distance calculation

### Line/Segment Operations
- Line-line intersection
- Segment-segment intersection
- Point-line distance
- Point-segment distance
- Parallel/perpendicular tests

### Polygon Operations
- Area calculation (signed and unsigned)
- Point in polygon test
- Polygon centroid
- Convexity test

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "primitive": {
      "type": "string",
      "enum": ["point", "line", "segment", "polygon", "circle"]
    },
    "operations": { "type": "array" },
    "language": {
      "type": "string",
      "enum": ["cpp", "python", "java"]
    },
    "useInteger": { "type": "boolean", "default": false },
    "epsilon": { "type": "number" }
  },
  "required": ["primitive"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "code": { "type": "string" },
    "operations": { "type": "array" },
    "precisionNotes": { "type": "string" }
  },
  "required": ["success", "code"]
}
```
