---
name: generating-aws-diagrams
description: Generates DrawIO XML diagrams for Amazon Web Services architectures from text descriptions or images. Analyzes existing .drawio files to extract AWS components. Use for AWS architecture diagrams, cloud infrastructure documentation, or when converting AWS diagram images to editable DrawIO format.
license: MIT
compatibility: Requires image analysis capability for image conversion. Scripts require Python 3 and Bash. DrawIO Desktop optional for validation.
allowed-tools: Read Write
---

# AWS DrawIO Diagram Generator

Generates professional DrawIO XML diagrams for Amazon Web Services architectures.

## Capabilities

1. **Extract** - Analyze existing DrawIO XML files to identify AWS shapes, connections, and structure
2. **Identify** - Recognize AWS service icons from architecture diagram images
3. **Generate** - Create valid DrawIO XML from images or text descriptions
4. **Convert** - Transform AWS architecture diagrams into editable DrawIO format

## Quick Reference

### AWS Shape Patterns

There are two icon types. Use **service icons** when labeling the AWS service itself, and **instance icons** when representing a specific resource.

**Service icon** (colored square background) — for labeling the service:
```
shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.{shape_name}
```

**Instance icon** (bare icon, no background) — for specific resources:
```
shape=mxgraph.aws4.{shape_name};fillColor={category_color}
```
> **CRITICAL:** Always keep `fillColor` set to the category color. Without it the icon renders white/invisible. The only difference from a service icon is the absence of the `resourceIcon` background square — never remove `fillColor` when using an instance icon.

| Scenario | Icon Type | Label Example |
|----------|-----------|---------------|
| The AWS service itself | **Service** (with background) | "AWS Lambda", "Amazon RDS" |
| A specific resource/instance | **Instance** (no background) | "Order Processor", "Users Table" |
| Multiple instances of same service | **Instance** (no background) | "ECS Task 1", "ECS Task 2" |

### CRITICAL: Underscore-Separated Names

**Multi-word AWS shape names use UNDERSCORES in style properties!**

- `step_functions` (correct)
- `api_gateway` (correct)
- `kinesis_data_streams` (correct)
- `step functions` (WRONG - will not render)
- `api gateway` (WRONG - will not render)

The aws4.xml stencil defines names with spaces, but DrawIO's style parser requires underscores.

**Always look up exact names in `assets/aws-icons.json` before using.**

### Common AWS Services

| Service | Service Icon (with background) | Instance Icon (no background) |
|---------|-------------------------------|-------------------------------|
| Lambda | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.lambda` | `shape=mxgraph.aws4.lambda` |
| Amazon S3 | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.s3` | `shape=mxgraph.aws4.s3` |
| Amazon EC2 | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.ec2` | `shape=mxgraph.aws4.ec2` |
| DynamoDB | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.dynamodb` | `shape=mxgraph.aws4.dynamodb` |
| API Gateway | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.api_gateway` | `shape=mxgraph.aws4.api_gateway` |
| Amazon SQS | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.sqs` | `shape=mxgraph.aws4.sqs` |
| Amazon SNS | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.sns` | `shape=mxgraph.aws4.sns` |
| Step Functions | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.step_functions` | `shape=mxgraph.aws4.step_functions` |
| Amazon ECS | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.ecs` | `shape=mxgraph.aws4.ecs` |
| Amazon RDS | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.rds` | `shape=mxgraph.aws4.rds` |

### AWS Container Types

| Container | Use Case |
|-----------|----------|
| aws_cloud | Top-level AWS Cloud boundary |
| aws_region | Region grouping |
| aws_availability_zone | AZ grouping |
| aws_vpc | VPC boundary |
| aws_public_subnet | Public subnet |
| aws_private_subnet | Private subnet |
| aws_security_group | Security group boundary |
| aws_auto_scaling_group | Auto scaling group |
| aws_account | AWS Account boundary |
| aws_corporate_datacenter | Corporate datacenter |
| aws_generic_group | Generic grouping |
| aws_step_functions_workflow | Step Functions workflow |
| aws_elastic_beanstalk_container | Elastic Beanstalk app |

---

## Task 1: Analyze a DrawIO File

Use this workflow to extract and document all components from an existing DrawIO file.

### Steps

1. **Read the file** - Load the `.drawio` XML file
2. **Parse structure** - Extract all `<mxCell>` elements
3. **Identify shapes** - Find cells with `vertex="1"`
4. **Identify connections** - Find cells with `edge="1"`
5. **Extract styles** - Parse style strings for each element
6. **Map hierarchy** - Build container/child relationships using `parent` attribute
7. **Generate report** - Output findings in structured format

### Input
- Path to `.drawio` file

### Output
Generate a Markdown report with:

```markdown
# DrawIO Analysis Report

## Summary
- Total shapes: X
- Total connections: Y
- Containers: Z

## Shape Inventory

| ID | Label | Type | Position | Parent |
|----|-------|------|----------|--------|
| abc | Lambda | mxgraph.aws4.lambda | (100,200) | vpc1 |

## Connection Matrix

| From | To | Label | Type |
|------|-----|-------|------|
| Lambda | DynamoDB | API | solid |

## Container Hierarchy

- VPC (vpc1)
  - Lambda (lambda1)
  - Lambda (lambda2)
  - DynamoDB (db1)

## Style Analysis

### Unique Shapes Found
- mxgraph.aws4.lambda (4 instances)
- mxgraph.aws4.dynamodb (2 instances)
```

---

## Task 2: Convert Image to DrawIO

Use this workflow to recreate an AWS architecture diagram from an image.

### Steps

1. **Analyze image** - Identify all visual elements:
   - AWS service icons (shape, color, label)
   - Containers/boundaries (color, border style)
   - Connections (solid, dashed, arrows)
   - Labels and text

2. **Map to library** - For each identified element:
   - Look up in `assets/aws-icons.json` by visual signature or label
   - Match containers to `assets/aws-containers.json`
   - **CRITICAL:** Verify underscore-separated names for multi-word services (e.g., `step_functions`, not `step functions`)
   - Note any unrecognized elements

3. **Estimate layout** - Determine positions:
   - Identify container boundaries first
   - Place icons within containers
   - Estimate x,y coordinates and dimensions
   - Standard icon size: **64x64 pixels**

4. **Generate XML** - Build the DrawIO structure:
   - Start with base template from `assets/templates/drawio-base.xml`
   - Add containers first (they become parents)
   - Add service icons with correct parent references
   - Add connections between shapes

5. **Create confidence report** - Document accuracy:
   - List all identified components
   - Note any uncertain matches
   - Flag potential issues

### Input
- AWS architecture diagram image (PNG/JPG)

### Output
1. Valid `.drawio` XML file
2. Confidence report (Markdown)

### Confidence Report Format

```markdown
# Conversion Confidence Report

## Overall Confidence: 85%

## Identified Components

### High Confidence (>90%)
- Lambda x4 - Clear icon match
- DynamoDB x2 - Clear icon match
- VPC container - Purple border, correct label

### Medium Confidence (70-90%)
- Step Functions - Icon similar, label confirms (using `step_functions` with underscores)

### Low Confidence (<70%)
- Unknown icon at position (300, 400) - Mapped to generic service

## Connection Accuracy
- 12/14 connections clearly visible
- 2 connections inferred from layout

## Notes
- VPC subnet grouping identified
- Bidirectional arrows on 3 connections
```

---

## Task 3: Create DrawIO from Description

Use this workflow to generate a new AWS diagram from text specifications.

### Steps

1. **Parse requirements** - Extract from description:
   - Required AWS services
   - Container/grouping needs
   - Connection requirements
   - Layout preferences

2. **Select components** - From libraries:
   - Look up services in `assets/aws-icons.json`
   - Choose containers from `assets/aws-containers.json`
   - **Choose icon type:** Use **service icons** (with background) for generic service labels, **instance icons** (no background) for specific resources (see Quick Reference)
   - **VERIFY:** Underscore-separated names for multi-word services in style strings
   - Select connection styles

3. **Plan layout** - Design the arrangement:
   - Determine canvas size
   - Position containers first
   - Arrange services logically (left-to-right data flow, top-to-bottom hierarchy)
   - Standard spacing: **120px between 64x64 icons**

4. **Generate XML** - Build the diagram:
   - Use `assets/templates/drawio-base.xml` as starting point
   - Add elements in order: containers, services, connections
   - Assign unique IDs to all elements

5. **Validate** - Check the output:
   - All requested components present
   - Connections reference valid IDs
   - Layout is logical and readable

### Input
- Text description of desired AWS architecture

### Output
- Valid `.drawio` XML file

### Example Input

```
Create an AWS serverless architecture with:
- VPC container
- API Gateway triggering Lambda
- Lambda connecting to DynamoDB and S3
- Step Functions orchestrating the workflow
```

### Example Output Structure

```xml
<mxfile ...>
  <diagram name="AWS Architecture">
    <mxGraphModel ...>
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <!-- VPC Container -->
        <mxCell id="vpc" value="VPC" style="..." vertex="1" parent="1">
          <mxGeometry x="50" y="50" width="700" height="400" />
        </mxCell>
        <!-- API Gateway -->
        <mxCell id="api_gateway" value="API Gateway" style="...resIcon=mxgraph.aws4.api_gateway" vertex="1" parent="vpc">
          <mxGeometry x="50" y="100" width="64" height="64" />
        </mxCell>
        <!-- More shapes... -->
        <!-- Connections -->
        <mxCell id="conn_api_gateway_to_lambda" edge="1" source="api_gateway" target="lambda" style="..." />
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

---

## Shape Library Reference

### Looking Up an AWS Service

1. Open `assets/aws-icons.json`
2. Search by `service_name` or `recognition_keywords`
3. Use the `drawio_shape.full_style` for complete styling
4. Or construct style using: `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.{shape_name}`

**Service Coverage:**
- 264 AWS services across 24 categories
- 96.6% validated against mxgraph.aws4 library (255/264 services)
- 9 unvalidated services (deprecated or newer than aws4.xml stencil) — see `references/ICON-COMPATIBILITY.md` for the list. For these, use a visually similar validated service icon or a generic shape.

### Key AWS Specifications

- Icon size: **64x64 pixels**
- Font color: **#232F3E** universally (dark gray)
- Fill color varies by **category** (not per-service)
- Arrow style: open arrow, 2pt stroke, `#232F3E`

Look up the exact `category`, `fillColor`, and `full_style` for any service in `assets/aws-icons.json`. All 24 categories with colors are listed there.

---

## Visual Best Practices

See [references/DIAGRAM-BEST-PRACTICES.md](references/DIAGRAM-BEST-PRACTICES.md) for full guidelines. Key rules:

- **Connection labels** — always add: `labelBackgroundColor=#FFFFFF;fontSize=10;fontColor=#232F3E;`
- **strokeWidth** — use `1` for most connections, `2` only for primary data paths (max 1–3 per diagram)
- **Consolidate** connections when 3+ cross the same corridor into a single labeled edge

---

## XML Structure Quick Reference

For complete XML examples and detailed structure, see [references/xml-examples.md](references/xml-examples.md).

The key building blocks:

- **Shape**: `<mxCell id="api_gateway" value="Label" style="..." vertex="1" parent="1">` with `<mxGeometry>`
- **Connection**: `<mxCell id="conn_api_gateway_to_lambda" edge="1" source="api_gateway" target="lambda" style="...">`
- **Container**: Shape with `container=1` in style; children set `parent` to container ID
- **Root cells**: Every diagram needs `<mxCell id="0"/>` and `<mxCell id="1" parent="0"/>`

### ID Naming Rules

- **Full service names** — `api_gateway`, not `apigw`; `step_functions`, not `stepfn`
- **Role suffixes for duplicates** — `lambda_api_handler`, `lambda_processor`, not `lambda1`, `lambda2`
- **Connection IDs** — `conn_{source}_to_{target}` using full IDs

See [references/DIAGRAM-BEST-PRACTICES.md](references/DIAGRAM-BEST-PRACTICES.md) for complete ID naming convention.

For XML parsing and extraction techniques, see [references/xml-parser-guide.md](references/xml-parser-guide.md).

---

## Troubleshooting

### Icon Not Displaying
- **CRITICAL:** Verify multi-word shape names use UNDERSCORES: `step_functions`, NOT `step functions`
- For **service icons**: verify both `shape=mxgraph.aws4.resourceIcon` AND `resIcon=mxgraph.aws4.{name}` are present
- For **instance icons**: verify `shape=mxgraph.aws4.{name}` is used directly (no `resourceIcon` wrapper)
- **NEVER** use `productIcon`/`prIcon` — always use `resourceIcon`/`resIcon` for service icons
- Check [assets/aws-icons.json](assets/aws-icons.json) for exact shape name
- Ensure `vertex="1"` is present
- Check that `<mxGeometry>` has valid width/height (64x64)

### Wrong Icon Type (Background vs No Background)
See the Quick Reference section for the full definition of each icon type. In summary:
- **Service icon**: `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.{name}` — labels the AWS service itself
- **Instance icon**: `shape=mxgraph.aws4.{name};fillColor={category_color}` — represents a specific resource; `fillColor` is required or the icon renders white

### Connection Not Rendering
- Verify source and target IDs exist
- Ensure `edge="1"` is set
- Check that source/target shapes are vertices

### Shapes Not Inside Container
- Set child's `parent` attribute to container's ID
- Ensure container has `container=1` in style
- Position child coordinates relative to container (not absolute)

### Label Not Showing
- Check `value` attribute is set
- Verify `fontSize` is reasonable (12-14 for AWS)
- Ensure `fontColor=#232F3E` is set

### File Won't Open in DrawIO
- Validate XML structure (proper closing tags)
- Ensure `id="0"` and `id="1"` root cells exist
- Check for special characters in labels (use `&#xa;` for newlines)

---

## Desktop Integration

After generating a `.drawio` file, you can validate and preview it:

1. **Validate**: `python scripts/validate-drawio.py output.drawio --verbose`
2. **Analyze**: `python scripts/analyze-existing.py output.drawio --markdown`
3. **Validate Icons**: `python scripts/validate-aws-icons.py`
4. **Export PNG**: `./scripts/export-diagram.sh output.drawio png`
5. **Open in DrawIO**: `./scripts/open-diagram.sh output.drawio`

Requires DrawIO Desktop. Install on macOS: `brew install drawio`

---

## Files in This Skill

| File | Purpose |
|------|---------|
| `SKILL.md` | This file - main instructions |
| **Assets** | |
| `assets/aws-icons.json` | AWS service icon database (264 services) |
| `assets/aws-containers.json` | AWS container/group and connection styles |
| `assets/templates/drawio-base.xml` | Base XML template |
| `assets/templates/node-template.xml` | Shape insertion template |
| `assets/templates/connection-template.xml` | Connection template |
| **References** | |
| `references/ICON-COMPATIBILITY.md` | Icon validation reference (255/264 validated) |
| `references/DIAGRAM-BEST-PRACTICES.md` | Visual design and layout guidelines |
| `references/xml-parser-guide.md` | Detailed XML parsing reference |
| `references/xml-examples.md` | Copy-paste XML examples |
| `references/coordinate-system.md` | Positioning and layout guide |
| `references/style-guide.md` | Style string reference |
| **Scripts** | |
| `scripts/validate-drawio.py` | Validate .drawio XML structure |
| `scripts/validate-aws-icons.py` | Validate AWS icon compatibility |
| `scripts/fix-aws-icons.py` | Auto-fix icon shape names |
| `scripts/fix-drawio-icons.py` | Bulk fix icon references in .drawio files |
| `scripts/extract-shape-names.py` | Extract available shapes from DrawIO stencil |
| `scripts/analyze-existing.py` | Extract shapes/connections from .drawio files |
| `scripts/export-diagram.sh` | Export to PNG/PDF via DrawIO Desktop CLI |
| `scripts/open-diagram.sh` | Open .drawio file in DrawIO Desktop |
