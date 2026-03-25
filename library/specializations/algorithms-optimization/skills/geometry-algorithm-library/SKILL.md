---
name: geometry-algorithm-library
description: Implement computational geometry algorithms
allowed-tools:
  - Read
  - Write
  - Grep
  - Glob
  - Edit
---

# Geometry Algorithm Library Skill

## Purpose

Implement computational geometry algorithms for competitive programming and algorithmic problems.

## Capabilities

- Convex hull (Graham scan, Andrew's monotone chain)
- Line intersection algorithms
- Closest pair of points
- Point in polygon tests
- Voronoi diagram, Delaunay triangulation
- Polygon clipping

## Target Processes

- computational-geometry

## Algorithm Catalog

### Convex Hull
- Graham scan O(n log n)
- Andrew's monotone chain O(n log n)
- Jarvis march O(nh)

### Intersection Algorithms
- Line sweep for segment intersection
- Bentley-Ottmann algorithm
- Polygon intersection

### Distance Problems
- Closest pair of points O(n log n)
- Farthest pair (rotating calipers)
- Point-polygon distance

### Triangulation
- Ear clipping O(n^2)
- Delaunay triangulation
- Voronoi diagram

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "algorithm": { "type": "string" },
    "variant": { "type": "string" },
    "language": {
      "type": "string",
      "enum": ["cpp", "python", "java"]
    },
    "includeVisualization": { "type": "boolean", "default": false }
  },
  "required": ["algorithm"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "code": { "type": "string" },
    "complexity": { "type": "object" },
    "usage": { "type": "string" }
  },
  "required": ["success", "code"]
}
```
