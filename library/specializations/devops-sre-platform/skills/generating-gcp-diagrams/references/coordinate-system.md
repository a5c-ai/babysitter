# DrawIO Coordinate System Guide

## Coordinate Basics

DrawIO uses a standard screen coordinate system:
- **Origin (0,0)**: Top-left corner of the canvas
- **X-axis**: Increases to the right
- **Y-axis**: Increases downward
- **Units**: Pixels

```
(0,0) ────────────────────────► X
  │
  │     (100,50)
  │        ┌─────────┐
  │        │  Shape  │
  │        └─────────┘
  │
  ▼
  Y
```

## Shape Positioning

### mxGeometry Attributes

```xml
<mxGeometry x="100" y="200" width="50" height="50" as="geometry" />
```

| Attribute | Description |
|-----------|-------------|
| `x` | Left edge position (pixels from canvas left) |
| `y` | Top edge position (pixels from canvas top) |
| `width` | Shape width in pixels |
| `height` | Shape height in pixels |

### Position Reference Points

The position (x, y) refers to the **top-left corner** of the shape:

```
     x
     │
     ▼
y ─► ┌─────────────┐
     │             │
     │    Shape    │  height
     │             │
     └─────────────┘
           width
```

### Center Point Calculation

```
centerX = x + (width / 2)
centerY = y + (height / 2)
```

## Standard Sizes

### GCP Service Icons

| Type | Width | Height |
|------|-------|--------|
| Standard icon | 50 | 50 |
| Large icon | 60 | 60 |
| Small icon | 40 | 40 |

### Containers

| Type | Typical Width | Typical Height |
|------|---------------|----------------|
| VPC-SC | 600-800 | 400-600 |
| Region | 300-500 | 200-400 |
| Logical Group | 150-250 | 100-200 |

## Spacing Guidelines

### Between Icons

```
┌──────┐         ┌──────┐
│ Icon │◄─100px─►│ Icon │
└──────┘         └──────┘
```

**Recommended spacing:**
- Horizontal: 100px between icon edges
- Vertical: 80px between icon edges
- Minimum: 60px (tight layouts)

### Inside Containers

```
┌─────────────────────────────────────┐
│ Container                           │
│  ┌──────────────────────────────┐  │
│  │        Content Area          │  │ ◄─ padding-top: 50px
│  │  ┌────┐       ┌────┐        │  │
│  │  │Icon│       │Icon│        │  │
│  │  └────┘       └────┘        │  │
│  └──────────────────────────────┘  │
│ ◄─────── padding: 20px ──────────► │
└─────────────────────────────────────┘
```

**Standard padding:**
- Top: 50px (space for container label)
- Left/Right: 20px
- Bottom: 20px

## Layout Patterns

### Left-to-Right Flow

Data flows from left to right:

```
┌─────┐     ┌─────┐     ┌─────┐     ┌─────┐
│ In  │────►│ Svc │────►│ Svc │────►│ Out │
└─────┘     └─────┘     └─────┘     └─────┘
  x=50       x=200       x=350       x=500
```

**Positions:**
- Start at x=50 or x=100
- Increment by 150px (icon width 50 + spacing 100)

### Top-to-Bottom Hierarchy

Layers from top to bottom:

```
        ┌───────────┐
        │  Trigger  │  y=50
        └───────────┘
              │
              ▼
        ┌───────────┐
        │  Process  │  y=180
        └───────────┘
              │
              ▼
        ┌───────────┐
        │  Storage  │  y=310
        └───────────┘
```

**Positions:**
- Start at y=50 or y=100
- Increment by 130px (icon height 50 + spacing 80)

### Grid Layout

For multiple similar services:

```
┌─────┐  ┌─────┐  ┌─────┐
│ A1  │  │ A2  │  │ A3  │   Row 1: y=100
└─────┘  └─────┘  └─────┘

┌─────┐  ┌─────┐  ┌─────┐
│ B1  │  │ B2  │  │ B3  │   Row 2: y=230
└─────┘  └─────┘  └─────┘

 x=100   x=250    x=400
```

**Grid formula:**
```
x = startX + (column * (iconWidth + horizontalSpacing))
y = startY + (row * (iconHeight + verticalSpacing))
```

### Hub and Spoke

Central service with connections to multiple services:

```
              ┌─────┐
              │ Svc │
              └─────┘
                 ▲
                 │
    ┌─────┐  ┌─────┐  ┌─────┐
    │ Svc │◄─│ Hub │─►│ Svc │
    └─────┘  └─────┘  └─────┘
                 │
                 ▼
              ┌─────┐
              │ Svc │
              └─────┘
```

**Positions:**
- Hub center: (300, 250)
- Spokes at 150px radius from center

## Nested Containers

### Child Position Relativity

When a shape has a `parent` attribute pointing to a container, positions are **relative to the container's origin**:

```xml
<!-- Container at (100, 100) -->
<mxCell id="vpc" ... parent="1">
  <mxGeometry x="100" y="100" width="400" height="300" />
</mxCell>

<!-- Child at (50, 80) RELATIVE to container -->
<mxCell id="service" ... parent="vpc">
  <mxGeometry x="50" y="80" width="50" height="50" />
</mxCell>

<!-- Actual canvas position: (150, 180) -->
```

### Visual representation:

```
Canvas (0,0)
│
└──► Container at (100, 100)
     │
     └──► Child at (50, 80) relative
          = (150, 180) absolute
```

### Deep Nesting Example (3 Levels)

GCP Project → VPC-SC → Logical Group → Service:

```xml
<!-- GCP Project at absolute (110, 20) -->
<mxCell id="gcp_project" parent="1">
  <mxGeometry x="110" y="20" width="1050" height="710" />
</mxCell>

<!-- VPC-SC at (20, 55) relative to GCP Project -->
<!-- Absolute: (110+20, 20+55) = (130, 75) -->
<mxCell id="vpc_sc" parent="gcp_project">
  <mxGeometry x="20" y="55" width="820" height="520" />
</mxCell>

<!-- Logical Group at (15, 35) relative to VPC-SC -->
<!-- Absolute: (130+15, 75+35) = (145, 110) -->
<mxCell id="processing_group" parent="vpc_sc">
  <mxGeometry x="15" y="35" width="200" height="300" />
</mxCell>

<!-- Service at (75, 50) relative to Logical Group -->
<!-- Absolute: (145+75, 110+50) = (220, 160) -->
<mxCell id="dataflow" parent="processing_group">
  <mxGeometry x="75" y="50" width="50" height="50" />
</mxCell>
```

**Key rule:** Each child's (x, y) is relative to its immediate parent. To find absolute position, sum all ancestor positions.

### Container Content Area

Account for container label when positioning children:

```
┌──────────────────────────────────┐ (0, 0) container origin
│ VPC-SC                           │
│──────────────────────────────────│ y=40 (label height)
│                                  │
│   ┌────┐ (20, 60) - safe start  │
│   │Icon│                         │
│   └────┘                         │
│                                  │
└──────────────────────────────────┘
```

**Safe content area start:** (20, 50-60)

## Connection Geometry

### Automatic Routing

DrawIO automatically routes connections with `edgeStyle=orthogonalEdgeStyle`:

```xml
<mxCell id="conn1" edge="1" source="a" target="b"
  style="edgeStyle=orthogonalEdgeStyle;...">
  <mxGeometry relative="1" as="geometry" />
</mxCell>
```

### Manual Waypoints

For custom routing, add waypoints:

```xml
<mxGeometry relative="1" as="geometry">
  <Array as="points">
    <mxPoint x="200" y="100" />  <!-- Waypoint 1 -->
    <mxPoint x="200" y="250" />  <!-- Waypoint 2 -->
  </Array>
</mxGeometry>
```

### Connection Points

Shapes have default connection points on edges:

```
        (0.5, 0)
           │
    ┌──────┴──────┐
    │             │
(0,0.5)──  Shape  ──(1, 0.5)
    │             │
    └──────┬──────┘
           │
        (0.5, 1)
```

Values are relative (0-1) to shape dimensions.

## Canvas Size

### mxGraphModel Dimensions

```xml
<mxGraphModel dx="1434" dy="844" ... pageWidth="1600" pageHeight="900">
```

| Attribute | Description |
|-----------|-------------|
| `dx` | Horizontal scroll/pan offset |
| `dy` | Vertical scroll/pan offset |
| `pageWidth` | Page width in pixels |
| `pageHeight` | Page height in pixels |

### Common Page Sizes

| Name | Width | Height |
|------|-------|--------|
| Letter | 850 | 1100 |
| A4 | 827 | 1169 |
| Wide/16:9 | 1600 | 900 |
| **GCP Standard** | **1200** | **780** |
| Large | 2000 | 1500 |

### GCP Diagram Template (Critical)

**Always use these exact dimensions for GCP diagrams** — deviations cause tiny/zoomed-out rendering in DrawIO Desktop:

```xml
<mxGraphModel dx="1434" dy="844" ... pageWidth="1200" pageHeight="780">
```

GCP Project Zone must be positioned at:
```
x="110" y="20" width="1050" height="710"
```

This template has been empirically verified. See `output/gcp-secure-internet-to-storage.drawio` for the working reference.

## Alignment Tips

### Centering Horizontally

To center a shape on a page:
```
x = (pageWidth - shapeWidth) / 2
```

Example: 50px icon on 1600px page:
```
x = (1600 - 50) / 2 = 775
```

### Aligning Multiple Shapes

To align shapes in a row:
```
y = same for all shapes
x = startX + (index * spacing)
```

To align shapes in a column:
```
x = same for all shapes
y = startY + (index * spacing)
```

### Grid Snapping

DrawIO uses gridSize=10 by default. For clean alignment:
- Use positions divisible by 10 (50, 100, 150, etc.)
- Standard icon at (100, 100), (200, 100), etc.

## Quick Reference

### Typical Starting Points

| Element | X | Y |
|---------|---|---|
| Main container | 50 | 50 |
| First icon (in container) | 30 | 60 |
| External trigger | 50 | 100 |
| Left-side services | 100 | varies |

### Spacing Cheat Sheet

| Relationship | Distance |
|--------------|----------|
| Icon to icon (horizontal) | 100-150px |
| Icon to icon (vertical) | 80-130px |
| Container padding (sides) | 20px |
| Container padding (top) | 50px |
| Container to container | 50px |

### Position Formulas

```python
# Grid position
x = startX + (col * (iconWidth + hSpacing))
y = startY + (row * (iconHeight + vSpacing))

# Center in container
x = (containerWidth - iconWidth) / 2
y = labelHeight + ((containerHeight - labelHeight - iconHeight) / 2)

# Equal distribution of N icons across width W
spacing = W / (N + 1)
positions = [spacing * i for i in range(1, N + 1)]
```
