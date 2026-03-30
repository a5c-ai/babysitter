# DrawIO XML Parser Guide (AWS)

## Overview

DrawIO files (`.drawio`) are XML documents that describe diagrams. Understanding this structure is essential for extracting shapes, analyzing existing diagrams, and generating new ones.

## File Structure

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

| Attribute | Description |
|-----------|-------------|
| `host` | Application that created the file |
| `modified` | Last modification timestamp |
| `version` | DrawIO version |

### 2. `<diagram>` - Page Container

| Attribute | Description |
|-----------|-------------|
| `name` | Page name displayed in tab |
| `id` | Unique identifier for the page |

### 3. `<mxGraphModel>` - Canvas Settings

| Attribute | Description | Common Values |
|-----------|-------------|---------------|
| `dx` | Horizontal scroll offset | 0-2000 |
| `dy` | Vertical scroll offset | 0-2000 |
| `grid` | Show grid | 0 or 1 |
| `gridSize` | Grid cell size in pixels | 10 |
| `pageWidth` | Page width in pixels | 827, 1169, 1600 |
| `pageHeight` | Page height in pixels | 1169, 827, 900 |

### 4. `<mxCell>` - Shapes and Connections

#### Reserved Cells
- `id="0"` - Root cell (always present)
- `id="1"` - Default parent layer (always present, parent="0")

#### Shape Cell

```xml
<mxCell id="lambda1" value="AWS Lambda" style="..." vertex="1" parent="1">
  <mxGeometry x="100" y="200" width="64" height="64" as="geometry" />
</mxCell>
```

| Attribute | Description |
|-----------|-------------|
| `id` | Unique identifier |
| `value` | Label/text displayed on shape |
| `style` | Semicolon-separated style properties |
| `vertex` | "1" indicates this is a shape |
| `parent` | ID of parent cell (container or "1" for root) |

#### Connection Cell

```xml
<mxCell id="conn1" value="" style="..." edge="1" parent="1" source="lambda1" target="ddb1">
  <mxGeometry relative="1" as="geometry" />
</mxCell>
```

| Attribute | Description |
|-----------|-------------|
| `edge` | "1" indicates this is a connection |
| `source` | ID of the source shape |
| `target` | ID of the target shape |

### 5. `<mxGeometry>` - Position and Size

#### For Shapes (vertex)
```xml
<mxGeometry x="100" y="200" width="64" height="64" as="geometry" />
```

#### For Connections (edge)
```xml
<mxGeometry relative="1" as="geometry">
  <Array as="points">
    <mxPoint x="200" y="225" />
  </Array>
</mxGeometry>
```

## Style String Format

Styles are semicolon-separated key=value pairs:
```
shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.lambda;fillColor=#ED7100;
```

### Common Style Properties

| Property | Description | Example Values |
|----------|-------------|----------------|
| `shape` | Shape type/library reference | `mxgraph.aws4.resourceIcon` |
| `resIcon` | AWS icon reference | `mxgraph.aws4.lambda` |
| `fillColor` | Background color | `#ED7100`, `none` |
| `strokeColor` | Border color | `#232F3E`, `none` |
| `fontColor` | Text color | `#232F3E` |
| `fontSize` | Text size | `12` |
| `container` | Makes shape a container | `1` |

### AWS Shape Style Pattern

```
outlineConnect=0;fontColor=#232F3E;gradientColor=none;fillColor={CATEGORY_COLOR};
strokeColor=none;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;
align=center;html=1;fontSize=12;fontStyle=0;aspect=fixed;pointerEvents=1;
shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.{shape_name}
```

**CRITICAL:** Always use `resourceIcon`/`resIcon`, NEVER `productIcon`/`prIcon`.

## Extracting Information

### Finding All Shapes
```
//mxCell[@vertex="1"]
```

### Finding All Connections
```
//mxCell[@edge="1"]
```

### Finding AWS Services
```
//mxCell[contains(@style, "mxgraph.aws4")]
```

### Finding Containers
```
//mxCell[contains(@style, "container=1")]
```

### Extracting Shape Type from Style

```python
import re

def extract_shape_type(style):
    match = re.search(r'resIcon=([^;]+)', style)
    if match:
        return match.group(1)
    match = re.search(r'shape=([^;]+)', style)
    return match.group(1) if match else None
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
```

## Building a Shape Inventory

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

        if cell_id in ('0', '1'):
            continue

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
        ├── mxCell id="lambda1" parent="vpc" (Lambda inside VPC)
        └── mxCell id="ddb1" parent="vpc" (DynamoDB inside VPC)
```

## Troubleshooting

### Shape Not Rendering
- Verify `shape=mxgraph.aws4.resourceIcon` and `resIcon=mxgraph.aws4.{name}` are present
- Never use `productIcon`/`prIcon`
- Multi-word names use underscores: `step_functions`, not `step functions`
- Ensure `vertex="1"` is set

### Connection Not Showing
- Verify `source` and `target` IDs exist
- Check that `edge="1"` is set

### Container Not Containing Children
- Verify child shapes have correct `parent` attribute
- Check that container has `container=1` in style
- Ensure child positions are within container bounds
