# DrawIO Style Guide (GCP)

## Style String Format

Styles are semicolon-separated `key=value` pairs:
```
rounded=1;fillColor=#E8F5E9;strokeColor=#4CAF50;strokeWidth=2;
```

## GCP Color Palette

| Color | Hex | Use |
|-------|-----|-----|
| Google Blue | #4285F4 | Primary icons (most services) |
| Google Red | #EA4335 | Errors, alerts |
| Google Yellow | #FBBC04 | Warnings |
| Google Green | #34A853 | Success, VPC |
| Apigee Orange | #FF6D00 | Apigee |
| Firebase Yellow | #FFCA28 | Firestore |

## Common Style Properties

### Shape Properties
| Property | Values | Description |
|----------|--------|-------------|
| `shape` | `mxgraph.gcp2.*` | Shape library reference |
| `fillColor` | `#RRGGBB`, `none` | Background color |
| `strokeColor` | `#RRGGBB`, `none` | Border color |
| `strokeWidth` | `1`, `2`, `3` | Border thickness |
| `rounded` | `0`, `1` | Rounded corners |
| `dashed` | `0`, `1` | Dashed border |
| `opacity` | `0-100` | Transparency |

### Text Properties
| Property | Values | Description |
|----------|--------|-------------|
| `fontSize` | `10`, `11`, `12`, `14` | Font size |
| `fontStyle` | `0`=normal, `1`=bold, `2`=italic, `3`=bold+italic | |
| `fontColor` | `#RRGGBB` | Text color |
| `align` | `left`, `center`, `right` | Horizontal alignment |
| `verticalAlign` | `top`, `middle`, `bottom` | Vertical alignment |

### Label Position (for icons)
```
labelPosition=center;verticalLabelPosition=bottom;
```
Places label below the icon.

## Standard Style Strings

### GCP Service Icon
```
sketch=0;html=1;fillColor=#4285F4;strokeColor=none;verticalAlign=top;labelPosition=center;verticalLabelPosition=bottom;align=center;spacingTop=-6;fontSize=11;fontStyle=0;fontColor=#424242;shape=mxgraph.gcp2.{service}
```

**Note:** GCP uses `fontColor=#424242` (dark gray) for all service labels. Unlike AWS, GCP has a single icon pattern — no service vs instance icon distinction.

### VPC-SC Container
```
rounded=1;whiteSpace=wrap;html=1;fillColor=#E8F5E9;strokeColor=#4CAF50;strokeWidth=2;dashed=0;verticalAlign=top;fontSize=13;fontStyle=1;fontColor=#2E7D32;align=center;arcSize=5;container=1;collapsible=0;recursiveResize=0;
```

### Dashed Logical Group
```
rounded=1;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#757575;strokeWidth=1;dashed=1;dashPattern=5 5;verticalAlign=top;fontSize=11;fontStyle=2;fontColor=#424242;align=center;container=1;collapsible=0;recursiveResize=0;
```

### Solid Logical Group
```
rounded=1;whiteSpace=wrap;html=1;fillColor=#FAFAFA;strokeColor=#9E9E9E;strokeWidth=1;dashed=0;verticalAlign=top;fontSize=11;fontStyle=0;align=center;container=1;collapsible=0;recursiveResize=0;
```

### Solid Arrow Connection
```
edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#333333;strokeWidth=1;endArrow=classic;endFill=1;
```

### Labeled Connection (always add label properties)
```
edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#333333;strokeWidth=1;endArrow=classic;endFill=1;labelBackgroundColor=#FFFFFF;fontSize=10;fontColor=#333333;
```

### Bidirectional Arrow
```
edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#333333;strokeWidth=1;startArrow=classic;startFill=1;endArrow=classic;endFill=1;
```

### Dashed Arrow
```
edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#666666;strokeWidth=1;dashed=1;endArrow=classic;endFill=1;
```

## GCP Container Colors

| Container Type | Fill | Stroke |
|----------------|------|--------|
| GCP Project | #F6F6F6 | none |
| VPC-SC | #E8F5E9 | #4CAF50 |
| Region | #E3F2FD | #1976D2 |
| Zone | #FFF3E0 | #FF9800 |
| Subnet | #E8EAF6 | #3F51B5 |
| Security | #FFEBEE | #F44336 |
| External | #F3E5F5 | #9C27B0 |
| Logical (solid) | #FAFAFA | #9E9E9E |
| Logical (dashed) | none | #757575 |

## GCP Label Rules

- Service labels: 11pt, `fontColor=#424242`
- Container labels: 13-14pt, bold (`fontStyle=1`), color varies by container type
- Connection labels: 10pt, `fontColor=#333333`, always include `labelBackgroundColor=#FFFFFF`
- Max 2 lines per label; use `&#xa;` for line breaks
- Icon size: 50x50 fixed (60x60 for emphasis)

## Special Characters

Use XML entities in `value` attribute:
- Newline: `&#xa;`
- Ampersand: `&amp;`
- Less than: `&lt;`
- Greater than: `&gt;`
- Quote: `&quot;`

Example: `value="Cloud Run&#xa;(API Service)"`
