# DrawIO XML Parser Guide

## Overview

DrawIO files (`.drawio`) are XML documents that describe diagrams. Understanding this structure is essential for extracting shapes, analyzing existing diagrams, and generating new ones.

## File Structure

A DrawIO file has this hierarchical structure:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="..." agent="..." version="...">
  <diagram name="Page-1" id="...">
    <mxGraphModel dx="..." dy="..." grid="1" ...>
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <!-- All shapes and connections go here -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

## Key Elements

### 1. `<mxfile>` - Root Element

The container for the entire diagram file.

| Attribute | Description |
|-----------|-------------|
| `host` | Application that created the file (e.g., "app.diagrams.net") |
| `modified` | Last modification timestamp |
| `agent` | Browser/application user agent |
| `version` | DrawIO version |

### 2. `<diagram>` - Page Container

Each `<diagram>` represents a page/tab in the file.

| Attribute | Description |
|-----------|-------------|
| `name` | Page name displayed in tab |
| `id` | Unique identifier for the page |

### 3. `<mxGraphModel>` - Canvas Settings

Defines the drawing canvas properties.

| Attribute | Description | Common Values |
|-----------|-------------|---------------|
| `dx` | Horizontal scroll offset | 0-2000 |
| `dy` | Vertical scroll offset | 0-2000 |
| `grid` | Show grid | 0 or 1 |
| `gridSize` | Grid cell size in pixels | 10 |
| `guides` | Enable alignment guides | 0 or 1 |
| `tooltips` | Show tooltips | 0 or 1 |
| `connect` | Enable connection points | 0 or 1 |
| `arrows` | Show connection arrows | 0 or 1 |
| `page` | Show page boundaries | 0 or 1 |
| `pageWidth` | Page width in pixels | 827, 1169, 1600 |
| `pageHeight` | Page height in pixels | 1169, 827, 900 |

### 4. `<mxCell>` - Shapes and Connections

Every shape, container, and connection is an `mxCell`.

#### Reserved Cells
- `id="0"` - Root cell (always present)
- `id="1"` - Default parent layer (always present, parent="0")

#### Shape Cell

```xml
<mxCell id="ABC123" value="Cloud Run" style="..." vertex="1" parent="1">
  <mxGeometry x="100" y="200" width="50" height="50" as="geometry" />
</mxCell>
```

| Attribute | Description |
|-----------|-------------|
| `id` | Unique identifier (auto-generated) |
| `value` | Label/text displayed on shape |
| `style` | Semicolon-separated style properties |
| `vertex` | "1" indicates this is a shape (not a connection) |
| `parent` | ID of parent cell (container or "1" for root) |

#### Connection Cell

```xml
<mxCell id="DEF456" value="" style="..." edge="1" parent="1" source="ABC123" target="XYZ789">
  <mxGeometry relative="1" as="geometry" />
</mxCell>
```

| Attribute | Description |
|-----------|-------------|
| `edge` | "1" indicates this is a connection |
| `source` | ID of the source shape |
| `target` | ID of the target shape |

### 5. `<mxGeometry>` - Position and Size

Defines the position and dimensions of a cell.

#### For Shapes (vertex)

```xml
<mxGeometry x="100" y="200" width="50" height="50" as="geometry" />
```

| Attribute | Description |
|-----------|-------------|
| `x` | X position (pixels from left) |
| `y` | Y position (pixels from top) |
| `width` | Width in pixels |
| `height` | Height in pixels |

#### For Connections (edge)

```xml
<mxGeometry relative="1" as="geometry">
  <mxPoint x="150" y="225" as="sourcePoint" />
  <mxPoint x="300" y="225" as="targetPoint" />
  <Array as="points">
    <mxPoint x="200" y="225" />
    <mxPoint x="200" y="300" />
  </Array>
</mxGeometry>
```

## Style String Format

Styles are semicolon-separated key=value pairs:

```
shape=mxgraph.gcp2.cloud_run;fillColor=#4285F4;strokeColor=none;fontSize=11;
```

### Common Style Properties

| Property | Description | Example Values |
|----------|-------------|----------------|
| `shape` | Shape type/library reference | `mxgraph.gcp2.cloud_run` |
| `fillColor` | Background color | `#4285F4`, `none` |
| `strokeColor` | Border color | `#333333`, `none` |
| `strokeWidth` | Border thickness | `1`, `2` |
| `fontColor` | Text color | `#333333` |
| `fontSize` | Text size | `11`, `14` |
| `fontStyle` | Text style | `0`=normal, `1`=bold, `2`=italic |
| `align` | Horizontal text alignment | `left`, `center`, `right` |
| `verticalAlign` | Vertical text alignment | `top`, `middle`, `bottom` |
| `rounded` | Rounded corners | `0`, `1` |
| `dashed` | Dashed border | `0`, `1` |
| `html` | Enable HTML in labels | `1` |
| `whiteSpace` | Text wrapping | `wrap` |

### GCP Shape Style Pattern

```
sketch=0;html=1;fillColor=#4285F4;strokeColor=none;verticalAlign=top;
labelPosition=center;verticalLabelPosition=bottom;align=center;
spacingTop=-6;fontSize=11;fontStyle=0;fontColor=#424242;
shape=mxgraph.gcp2.{service_name}
```

### Container Style Pattern

```
rounded=1;whiteSpace=wrap;html=1;fillColor=#E8F5E9;strokeColor=#4CAF50;
strokeWidth=2;verticalAlign=top;fontSize=14;fontStyle=1;align=center;
arcSize=5;container=1;collapsible=0;recursiveResize=0;
```

## Extracting Information

### Finding All Shapes

Look for `<mxCell>` elements with `vertex="1"`:

```
//mxCell[@vertex="1"]
```

### Finding All Connections

Look for `<mxCell>` elements with `edge="1"`:

```
//mxCell[@edge="1"]
```

### Finding GCP Services

Search for shapes with `mxgraph.gcp2` in style:

```
//mxCell[contains(@style, "mxgraph.gcp2")]
```

### Finding Containers

Look for shapes with `container=1` in style:

```
//mxCell[contains(@style, "container=1")]
```

### Extracting Shape Type from Style

Parse the `shape=` value from the style string:

```python
import re

def extract_shape_type(style):
    match = re.search(r'shape=([^;]+)', style)
    return match.group(1) if match else None

# Example
style = "shape=mxgraph.gcp2.cloud_run;fillColor=#4285F4"
shape_type = extract_shape_type(style)  # "mxgraph.gcp2.cloud_run"
```

### Parsing Style String to Dictionary

```python
def parse_style(style_string):
    if not style_string:
        return {}
    properties = {}
    for item in style_string.split(';'):
        if '=' in item:
            key, value = item.split('=', 1)
            properties[key] = value
    return properties

# Example
style = "rounded=1;fillColor=#E8F5E9;strokeWidth=2"
props = parse_style(style)
# {'rounded': '1', 'fillColor': '#E8F5E9', 'strokeWidth': '2'}
```

## Building a Shape Inventory

To analyze a DrawIO file and extract all shapes:

```python
import xml.etree.ElementTree as ET

def analyze_drawio(file_path):
    tree = ET.parse(file_path)
    root = tree.getroot()

    shapes = []
    connections = []

    for cell in root.iter('mxCell'):
        cell_id = cell.get('id')
        style = cell.get('style', '')
        value = cell.get('value', '')

        # Skip root cells
        if cell_id in ('0', '1'):
            continue

        # Get geometry
        geometry = cell.find('mxGeometry')
        geo_data = {}
        if geometry is not None:
            geo_data = {
                'x': geometry.get('x'),
                'y': geometry.get('y'),
                'width': geometry.get('width'),
                'height': geometry.get('height')
            }

        if cell.get('vertex') == '1':
            shapes.append({
                'id': cell_id,
                'label': value,
                'style': parse_style(style),
                'geometry': geo_data,
                'parent': cell.get('parent')
            })
        elif cell.get('edge') == '1':
            connections.append({
                'id': cell_id,
                'label': value,
                'source': cell.get('source'),
                'target': cell.get('target'),
                'style': parse_style(style)
            })

    return {'shapes': shapes, 'connections': connections}
```

## Container Hierarchy

Containers are shapes that hold other shapes. The hierarchy is determined by the `parent` attribute:

```
mxCell id="1" (root layer)
  └── mxCell id="vpc" parent="1" (VPC container)
        ├── mxCell id="run1" parent="vpc" (Cloud Run inside VPC)
        └── mxCell id="run2" parent="vpc" (Cloud Run inside VPC)
```

### Building Container Tree

```python
def build_hierarchy(shapes):
    # Create lookup by ID
    by_id = {s['id']: s for s in shapes}

    # Find children for each shape
    for shape in shapes:
        shape['children'] = []

    for shape in shapes:
        parent_id = shape.get('parent')
        if parent_id and parent_id in by_id:
            by_id[parent_id]['children'].append(shape)

    # Return root-level shapes
    return [s for s in shapes if s.get('parent') == '1']
```

## Connection Mapping

### Building Connection Matrix

```python
def build_connection_matrix(shapes, connections):
    # Get all shape IDs and labels
    shape_labels = {s['id']: s['label'] for s in shapes}

    matrix = []
    for conn in connections:
        source = shape_labels.get(conn['source'], conn['source'])
        target = shape_labels.get(conn['target'], conn['target'])
        matrix.append({
            'from': source,
            'to': target,
            'label': conn.get('label', ''),
            'bidirectional': 'startArrow' in conn.get('style', {})
        })

    return matrix
```

## Common Patterns

### GCP Service Icons

All GCP service icons follow this pattern:
- Shape: `mxgraph.gcp2.{service_name}`
- Size: 50x50 pixels (standard)
- Label position: Below the icon

### VPC-SC Container

- Style includes: `container=1`, green fill/stroke
- Label at top: "Google Cloud Platform\nVPC-SC"
- Children have `parent` pointing to container ID

### Connections with Labels

```xml
<mxCell id="conn1" value="API Call" edge="1" source="a" target="b" style="...">
  <mxGeometry relative="1" as="geometry" />
</mxCell>
```

## Troubleshooting

### Shape Not Rendering
- Verify `shape=` value matches DrawIO library name exactly
- Check that required style properties are present
- Ensure `vertex="1"` is set

### Connection Not Showing
- Verify `source` and `target` IDs exist
- Check that `edge="1"` is set
- Ensure source/target shapes have valid geometry

### Container Not Containing Children
- Verify child shapes have correct `parent` attribute
- Check that container has `container=1` in style
- Ensure child positions are within container bounds
