# DrawIO Style Guide (AWS)

## Style String Format

Styles are semicolon-separated `key=value` pairs:
```
rounded=1;fillColor=#E9F3E6;strokeColor=#248814;strokeWidth=2;
```

## AWS Color Palette

### AWS Category Colors
| Category | Hex | Color Name |
|----------|-----|-----------|
| Analytics | #8C4FFF | Purple |
| Application Integration | #E7157B | Pink |
| Artificial Intelligence | #01A88D | Teal |
| Blockchain | #ED7100 | Orange |
| Business Applications | #DD344C | Red/Pink |
| Cloud Financial Management | #7AA116 | Green/Olive |
| Compute | #ED7100 | Orange |
| Containers | #ED7100 | Orange |
| Customer Enablement | #C7131F | Dark Red |
| Databases | #C925D1 | Purple |
| Developer Tools | #C925D1 | Purple |
| End User Computing | #ED7100 | Orange |
| Front-End Web & Mobile | #DD344C | Red/Pink |
| Game Tech | #ED7100 | Orange |
| Internet of Things | #3F8624 | Green |
| Management & Governance | #E7157B | Pink |
| Media Services | #ED7100 | Orange |
| Migration & Transfer | #ED7100 | Orange |
| Networking | #8C4FFF | Purple |
| Quantum Technologies | #8C4FFF | Purple |
| Robotics | #ED7100 | Orange |
| Satellite | #ED7100 | Orange |
| Security & Identity | #DD344C | Red |
| Storage | #3F8624 | Green |

### AWS Text & Line Colors
| Element | Hex | Notes |
|---------|-----|-------|
| Font Color | #232F3E | Universal dark gray for all labels |
| Arrow Stroke | #232F3E | 2pt stroke width |
| Group Border (neutral) | #879196 | Generic groups |

## Common Style Properties

### Shape Properties
| Property | Values | Description |
|----------|--------|-------------|
| `shape` | `mxgraph.aws4.*` | Shape library reference |
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

### AWS Service Icon (with colored square background)
Use when labeling the AWS service itself (e.g., "AWS Lambda", "Amazon S3").
```
sketch=0;points=[[0,0,0],[0.25,0,0],[0.5,0,0],[0.75,0,0],[1,0,0],[0,1,0],[0.25,1,0],[0.5,1,0],[0.75,1,0],[1,1,0],[0,0.25,0],[0,0.5,0],[0,0.75,0],[1,0.25,0],[1,0.5,0],[1,0.75,0]];outlineConnect=0;fontColor=#232F3E;fillColor={CATEGORY_COLOR};strokeColor=#ffffff;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=12;fontStyle=0;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.{SHAPE_NAME}
```

### AWS Instance Icon (bare icon, no background)
Use when representing a specific resource or instance (e.g., "Order Processor", "Users Table", "Web Server").
```
sketch=0;outlineConnect=0;fontColor=#232F3E;fillColor={CATEGORY_COLOR};strokeColor=none;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=12;fontStyle=0;aspect=fixed;shape=mxgraph.aws4.{SHAPE_NAME}
```
The only difference from service icons: no `resourceIcon` wrapper, no `points`, and `strokeColor=none` (instance icons have no background square to outline).

### Sub-Resource Instance Icons

Some services have dedicated sub-resource icons for specific resource types. Use these instead of the bare service shape when the diagram represents a specific deployed resource:

| Service | Sub-Resource Icon | Shape Name | Use When |
|---------|------------------|------------|----------|
| AWS Lambda | Lambda Function | `lambda_function` | A specific deployed function ("Order Processor", "Auth Handler") |
| Amazon EC2 | EC2 Instance | `ec2_instance` | A specific running server instance |
| Amazon S3 | S3 Bucket | `bucket` | A specific named bucket (**NOT** `s3_bucket` — that shape does not exist) |
| Amazon S3 | S3 Bucket with Objects | `bucket_with_objects` | A bucket shown with contents |
| Amazon RDS | RDS Instance | `rds_instance` | A specific database instance |

**Rule:** If the label names a specific resource (not the service itself), use the sub-resource icon.

Example — Lambda:
```
"AWS Lambda"         → service icon: resourceIcon;resIcon=mxgraph.aws4.lambda
"Order Processor"    → instance icon: shape=mxgraph.aws4.lambda_function
"Auth Handler"       → instance icon: shape=mxgraph.aws4.lambda_function
```

### When to Use Each
| Scenario | Icon Type | Shape | Label Example |
|----------|-----------|-------|---------------|
| The AWS service itself | **Service** (with background) | `resourceIcon;resIcon=...` | "AWS Lambda", "Amazon RDS" |
| A specific deployed function | **Sub-resource** (no background) | `lambda_function` | "Order Processor", "Auth Handler" |
| A specific EC2 server | **Sub-resource** (no background) | `ec2_instance` | "Web Server", "Bastion Host" |
| Generic service instance | **Instance** (no background) | `{service_name}` | "ECS Task 1", "ECS Task 2" |

### CRITICAL: Always Set strokeColor Explicitly

**Never omit `strokeColor`** from any shape. DrawIO Desktop can auto-inject `strokeColor=light-dark(#ffffff, #ededed)` (a CSS `light-dark()` function) when shapes are edited interactively — making container borders **invisible**.

Always use explicit values:

| Shape Type | Required strokeColor |
|------------|---------------------|
| Service icons (resourceIcon) | `strokeColor=#ffffff` |
| Instance/sub-resource icons | `strokeColor=none` |
| AWS Cloud container | `strokeColor=#AAB7B8` |
| VPC container | `strokeColor=#8C4FFF` |
| Public subnet | `strokeColor=#248814` |
| Private subnet | `strokeColor=#147EBA` |
| Security Group | `strokeColor=#DD3522` |

**Why `#ffffff` for service icons:** The DrawIO stencil uses `strokeColor=#ffffff` (white) on service icons — not `none`. This is what enables the icon's internal white line artwork to render correctly against the colored background square. Instance icons use `none` because they have no background square.

**If you see `light-dark(...)` in a diagram's XML**, replace it with the correct explicit value from this table.

**IMPORTANT:** `{SHAPE_NAME}` uses **underscores** for multi-word names (e.g., `kinesis_data_streams`, `step_functions`, `elastic_beanstalk`). Single-word names are unaffected (e.g., `lambda`, `ec2`, `sqs`). Look up exact names in `assets/aws-icons.json`.

**CRITICAL:** For service icons, always use `resourceIcon`/`resIcon`. Do **not** use `productIcon`/`prIcon` or `mxgraph.aws3.*` shapes when generating new diagrams — see [Legacy Patterns](#legacy-shape-patterns-for-parsing-only) below.

### AWS Arrow Style
```
edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#232F3E;strokeWidth=2;endArrow=open;endSize=4;
```
Open arrow, size 4, orthogonal routing, 2pt stroke.

### Dashed Arrow
```
edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#232F3E;strokeWidth=2;endArrow=open;endSize=4;dashed=1;
```

### Bidirectional Arrow
```
edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#232F3E;strokeWidth=2;endArrow=open;endSize=4;startArrow=open;startSize=4;
```

### AWS Label Rules
- Font: 12pt, color `#232F3E`
- Max 2 lines for service labels
- "AWS" or "Amazon" stays on same line as service name
- Break after 2nd word if needed
- Icon size: 64x64 fixed

## AWS Container Styles

AWS containers use `shape=mxgraph.aws4.group` with a `grIcon` parameter for the corner icon.

### Container Pattern
```
shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.{GROUP_ICON_NAME}
```

`grStroke=0` suppresses the icon's own stroke (used when the icon should inherit the border color).

### Complete Container Style Strings

**AWS Cloud** (`grIcon=mxgraph.aws4.group_aws_cloud`, gray)
```
points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_aws_cloud;strokeColor=#AAB7B8;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#AAB7B8;dashed=0;container=1;collapsible=0;recursiveResize=0;
```

**VPC** (`grIcon=mxgraph.aws4.group_vpc2`, purple)
```
points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=1;fontColor=#AAB7B8;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_vpc2;strokeColor=#8C4FFF;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;dashed=0;container=1;collapsible=0;recursiveResize=0;
```

**Availability Zone** (`grIcon=mxgraph.aws4.group_availability_zone`, teal dashed)
```
points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_availability_zone;strokeColor=#00A4A6;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#00A4A6;dashed=1;container=1;collapsible=0;recursiveResize=0;
```

**Public Subnet** (`grIcon=mxgraph.aws4.group_security_group;grStroke=0`, green filled)
```
points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=1;fontColor=#248814;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_security_group;grStroke=0;strokeColor=#248814;fillColor=#E9F3E6;verticalAlign=top;align=left;spacingLeft=30;dashed=0;container=1;collapsible=0;recursiveResize=0;
```

**Private Subnet** (`grIcon=mxgraph.aws4.group_security_group;grStroke=0`, blue filled)
```
points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=1;fontColor=#147EBA;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_security_group;grStroke=0;strokeColor=#147EBA;fillColor=#E6F2F8;verticalAlign=top;align=left;spacingLeft=30;dashed=0;container=1;collapsible=0;recursiveResize=0;
```

**Security Group** (`grIcon=mxgraph.aws4.group_security_group`, red filled)
```
points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=1;fontColor=#DD3522;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_security_group;strokeColor=#DD3522;fillColor=#F2DEDE;verticalAlign=top;align=left;spacingLeft=30;dashed=0;container=1;collapsible=0;recursiveResize=0;
```

### Container Color Reference

| Container Type | grIcon | Fill | Stroke |
|----------------|--------|------|--------|
| AWS Cloud | `group_aws_cloud` | none | #AAB7B8 |
| Region | *(no grIcon — plain rect)* | none | #00A4A6 |
| Availability Zone | `group_availability_zone` | none | #00A4A6 (dashed) |
| VPC | `group_vpc2` | none | #8C4FFF |
| Public Subnet | `group_security_group` + `grStroke=0` | #E9F3E6 | #248814 |
| Private Subnet | `group_security_group` + `grStroke=0` | #E6F2F8 | #147EBA |
| Security Group | `group_security_group` | #F2DEDE | #DD3522 |
| Auto Scaling | *(no grIcon — plain rect)* | #FFF4E8 | #ED7100 |
| AWS Account | *(no grIcon — plain rect)* | none | #CD2264 |
| Generic Group | *(no grIcon — plain rect)* | none | #879196 |

## Legacy Shape Patterns (for Parsing Only)

When **reading or converting** existing AWS diagrams, you may encounter these older patterns. Recognize them but **never generate** them in new diagrams.

| Pattern | Example | Status | When to Encounter |
|---------|---------|--------|-------------------|
| `mxgraph.aws4.productIcon;prIcon=...` | `shape=mxgraph.aws4.productIcon;prIcon=mxgraph.aws4.lambda` | Legacy (aws4 v1) | Diagrams created before ~2021 |
| `mxgraph.aws3.*` | `shape=mxgraph.aws3.lambda` | Legacy (aws3) | Very old diagrams, pre-2018 |

**Mapping legacy → current:**
- `productIcon;prIcon=mxgraph.aws4.{name}` → `resourceIcon;resIcon=mxgraph.aws4.{name}`
- `mxgraph.aws3.{name}` → `resourceIcon;resIcon=mxgraph.aws4.{name}` (verify shape name still exists)

**Why `productIcon` renders incorrectly:** DrawIO's current renderer applies different sizing and background logic to `productIcon` vs `resourceIcon`. The rendered output looks wrong — misaligned background square, incorrect icon scale. Always replace with `resourceIcon` when editing.

## Special Characters

Use XML entities in `value` attribute:
- Newline: `&#xa;`
- Ampersand: `&amp;`
- Less than: `&lt;`
- Greater than: `&gt;`
- Quote: `&quot;`

Example: `value="Amazon&#xa;API Gateway"`
