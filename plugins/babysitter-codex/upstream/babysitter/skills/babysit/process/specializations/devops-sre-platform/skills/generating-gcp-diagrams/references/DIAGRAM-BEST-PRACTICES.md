# DrawIO Diagram Best Practices

**Last Updated:** 2026-01-31
**Applies to:** GCP Architecture Diagrams

This document provides best practices for creating professional, readable architecture diagrams. These guidelines are based on real-world usage and manual refinements.

---

## Table of Contents

1. [Connection Width Standards](#connection-width-standards)
2. [Connection Routing & Spacing](#connection-routing--spacing)
3. [Text & Label Positioning](#text--label-positioning)
4. [Container Organization](#container-organization)
5. [Icon Spacing & Alignment](#icon-spacing--alignment)
6. [Color Usage](#color-usage)
7. [Common Anti-Patterns](#common-anti-patterns)

---

## Connection Width Standards

### Standard Width: 1pt (Default)

Use `strokeWidth=1` for most connections:
- Standard data flows
- API calls
- Read/write operations
- Service-to-service communication
- Default for 95% of connections

**Example:**
```xml
style="strokeColor=#333333;strokeWidth=1;endArrow=classic;endFill=1;"
```

### Thick Width: 2pt (Emphasis)

Use `strokeWidth=2` **only** for:
- Primary/critical data paths
- Main architectural flow to emphasize
- Consolidated connections (replacing 3+ parallel connections)
- High-volume data pipelines

**Example:**
```xml
style="strokeColor=#333333;strokeWidth=2;endArrow=classic;endFill=1;"
```

### When NOT to Use 2pt

❌ **Don't use 2pt for:**
- Regular service connections
- Monitoring/logging flows
- Trigger/event connections
- Read-only queries
- Random connections (creates visual inconsistency)

### Visual Consistency Rule

Within a single diagram:
- **Maximum 1-3 connections** should use strokeWidth=2
- All other connections should be strokeWidth=1
- Thick lines lose meaning if overused

---

## Connection Routing & Spacing

### Orthogonal Routing (Default)

Use `edgeStyle=orthogonalEdgeStyle` for clean, professional diagrams:
```xml
style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;..."
```

Benefits:
- Creates right-angle bends
- Looks professional and organized
- Automatic routing around obstacles

### Consolidate Parallel Connections

When 3+ connections cross the same corridor between two groups:
- **Consolidate** them into a single connection
- Use a combined label (e.g., "write / load")
- Optionally use `strokeWidth=2` to indicate it's consolidated
- Target the container group instead of individual nodes

**Before (cluttered):**
```
CloudRun --"write"--> Storage
CloudRun --"read"--> Storage
CloudRun --"delete"--> Storage
```

**After (clean):**
```
CloudRun --"read/write"--[thick line]--> Storage
```

### Connection Spacing

**Minimum clearance:**
- 30-40px between parallel connections
- 50px+ for connections crossing busy areas
- Use waypoints for complex routing

**Waypoints for clarity:**
```xml
<mxGeometry relative="1" as="geometry">
  <Array as="points">
    <mxPoint x="400" y="200" />
    <mxPoint x="400" y="350" />
  </Array>
</mxGeometry>
```

---

## Text & Label Positioning

### Connection Labels

**Standard placement:**
```xml
value="query"
style="...;labelBackgroundColor=#FFFFFF;fontSize=10;fontColor=#333333;"
```

**Key guidelines:**
- Always use `labelBackgroundColor=#FFFFFF` (prevents overlap)
- Font size: 10px for connection labels
- Font color: `#333333` (dark gray, not black)
- Keep labels concise (1-3 words)

**Good labels:**
- "query"
- "trigger"
- "write / load"
- "async process"

**Bad labels:**
- "This is where the Cloud Run service queries BigQuery for data" (too long)
- "" (blank - add label if connection needs explanation)

### Service Icon Labels

**Standard style:**
```xml
value="Cloud Run&#xa;(API Service)"
style="...;fontColor=#424242;fontSize=11;verticalAlign=top;labelPosition=center;verticalLabelPosition=bottom;..."
```

**Guidelines:**
- Font size: 11px for service labels
- Font color: `#424242` (validated standard)
- Use `&#xa;` for line breaks
- Primary name + secondary descriptor format

**Good patterns:**
```
Cloud Run
(API Service)

BigQuery
(Warehouse)

Pub/Sub
(Ingest Topic)
```

### Text Annotations

When adding explanatory text boxes:
- Font size: 12px
- Color: `#333333`
- Use white or transparent background
- Position 10-20px away from related elements

---

## Container Organization

### Nesting Order (Large to Small)

1. **GCP Project Zone** (outermost)
2. **VPC or Region**
3. **Logical Groups** (layers: ingestion, processing, storage)
4. **Services** (innermost)

### Container Margins

**Internal padding:**
- Top: 60-80px (for container label)
- Sides: 30-40px
- Bottom: 30-40px

**Between containers (side by side):**
- Horizontal spacing: 60-80px
- Vertical spacing: 40-60px

**Between nested containers (parent → child):**
- VPC-SC inside GCP Project: 15-20px gap from parent edges
- Logical Groups inside VPC-SC: 15px gap from VPC-SC edges
- Example: VPC-SC at x=20 inside GCP Project = 20px left margin

### Container Labels

**Positioning:**
- `verticalAlign=top` (label at top of container)
- `align=center` or `align=left` depending on style
- Use descriptive names: "Ingestion Layer", "ML & Intelligence"

---

## Icon Spacing & Alignment

### Grid Alignment

Use DrawIO's grid (10px or 20px):
- Snap all icons to grid
- Creates visual order
- Makes manual adjustments easier

### Icon Spacing Within Containers

**Standard spacing:**
- Horizontal: 80-120px between icons
- Vertical: 80-120px between rows
- Minimum: 60px to avoid crowding

**For small containers:**
- Can reduce to 60px horizontal
- Maintain readability

### Icon Sizing

**Standard:** 50x50px for most services
```xml
<mxGeometry x="100" y="100" width="50" height="50" as="geometry" />
```

**Larger:** 60x60px for emphasis
```xml
<mxGeometry x="100" y="100" width="60" height="60" as="geometry" />
```

**Never smaller than 40x40px** - icons become unrecognizable

---

## Color Usage

### Standard Color Palette

**Services (most common):**
- Blue: `#4285F4` (Google Cloud blue - default for most services)

**Special services:**
- Firestore: `#FFCA28` (yellow/gold)
- Apigee: `#FF6D00` (orange)
- Error Reporting: `#EA4335` (red)

**Containers:**
- VPC-SC: `fillColor=#E8F5E9` (light green), `strokeColor=#4CAF50`
- Region: `fillColor=#E3F2FD` (light blue), `strokeColor=#1976D2`
- Logical Group: `fillColor=none`, `strokeColor=#757575` (dashed)

**Connections:**
- Standard: `#333333` (dark gray, not black)
- Data flow: `#4285F4` (blue)
- Success/sync: `#34A853` (green)
- Async/warning: `#FBBC04` (yellow/orange)

### Text Colors

- Service labels: `#424242` (standard dark gray)
- Connection labels: `#333333` (slightly darker)
- Container labels: Varies by container type
- Annotations: `#333333`

---

## Common Anti-Patterns

### ❌ Avoid These Mistakes

**1. Too Many Thick Lines**
```
❌ Using strokeWidth=2 for every connection
✅ Use strokeWidth=1 as default, strokeWidth=2 for 1-3 key paths only
```

**2. Parallel Connection Clutter**
```
❌ 5 separate arrows between same two groups
✅ Consolidate into 1-2 arrows with combined labels
```

**3. Inconsistent Spacing**
```
❌ Icons randomly placed at 43px, 87px, 132px intervals
✅ Use grid (50px, 100px, 150px, etc.)
```

**4. Missing Label Backgrounds**
```
❌ style="...;fontSize=10;" (label overlaps connectors)
✅ style="...;labelBackgroundColor=#FFFFFF;fontSize=10;"
```

**5. Crowded Containers**
```
❌ 8 icons in a 200x150px container
✅ Expand container or break into sub-groups
```

**6. Long Connection Labels**
```
❌ "This connection represents the async data processing pipeline"
✅ "async process"
```

**7. Incorrect Font Colors**
```
❌ fontColor=#999999 (too light, poor readability)
✅ fontColor=#424242 (standard, readable)
```

---

## Layout Workflow

### Recommended Process

1. **Start with containers** (largest to smallest)
   - Define regions, VPCs, logical groups
   - Leave generous padding

2. **Place key services** (anchors)
   - Entry points (e.g., Load Balancer, API Gateway)
   - Data stores (e.g., BigQuery, Storage)
   - Exit points (e.g., external APIs)

3. **Add remaining services**
   - Group by function
   - Maintain consistent spacing

4. **Add connections**
   - Start with main flows (strokeWidth=1)
   - Add secondary connections
   - Identify 1-2 primary paths for strokeWidth=2

5. **Refine & adjust**
   - Align icons to grid
   - Adjust connector routing
   - Add labels with backgrounds
   - Verify spacing consistency

---

## Manual Refinement Tips

### After Generation

Generated diagrams often need these manual adjustments:

**Common fixes:**
- Reposition connector waypoints for cleaner routing
- Adjust label positions to avoid overlap
- Align icons that are slightly off-grid
- Expand containers that feel cramped
- Change 1-2 key connectors to strokeWidth=2 for emphasis

**Testing in DrawIO:**
1. Export to PNG at 200% scale
2. Review at actual size
3. Check label readability
4. Verify no overlapping elements
5. Ensure visual hierarchy is clear

---

## Real-World Example

From `data-pipeline-architecture.drawio`:

**What worked well:**
- Logical groups clearly separate ingestion, processing, storage, ML, observability
- Icons consistently spaced at ~100-200px intervals
- Most connections use strokeWidth=1 (clean, not overwhelming)
- Font colors standardized to `#424242`

**Manual improvements made:**
- Repositioned connector waypoints for better routing
- Adjusted text label positions
- Some connectors needed consistency (2pt → 1pt)
- Ensured proper spacing between parallel flows

---

## Quick Reference Card

### Connections
| Type | Width | Use Case |
|------|-------|----------|
| Standard | 1pt | Default for all connections |
| Emphasis | 2pt | 1-3 primary paths only |

### Spacing
| Element | Spacing |
|---------|---------|
| Icons (horizontal) | 80-120px |
| Icons (vertical) | 80-120px |
| Containers (between) | 60-80px |
| Container padding | 30-40px (sides), 60-80px (top) |

### Font Sizes
| Element | Size |
|---------|------|
| Service labels | 11px |
| Connection labels | 10px |
| Container labels | 11-13px |
| Text annotations | 12px |

### Font Colors
| Element | Color |
|---------|-------|
| Service labels | `#424242` |
| Connection labels | `#333333` |
| Annotations | `#333333` |

---

## Validation Checklist

Before finalizing a diagram:

- [ ] All connections are strokeWidth=1 except 1-3 key paths (strokeWidth=2)
- [ ] No more than 3 parallel connections between same groups
- [ ] All connection labels have `labelBackgroundColor=#FFFFFF`
- [ ] All service labels use `fontColor=#424242`
- [ ] Icons aligned to 10px or 20px grid
- [ ] Minimum 60px spacing between icons
- [ ] Container padding is 30-40px minimum
- [ ] No label overlaps or unreadable text
- [ ] Visual hierarchy is clear (can understand flow in 5 seconds)
- [ ] Exported PNG is readable at actual size

---

## Related Documentation

- [Icon Compatibility Reference](../assets/ICON-COMPATIBILITY.md) - Valid icon shape names
- [Node Template](../assets/templates/node-template.xml) - Shape templates
- [Connection Template](../assets/templates/connection-template.xml) - Connection styles
- [Container Styles](../assets/containers.json) - Container definitions

---

**Remember:** Consistency matters more than perfection. Use these guidelines as a framework, but prioritize clarity and readability for your specific audience.
