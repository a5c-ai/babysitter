---
name: generating-gcp-diagrams
description: Generates DrawIO XML diagrams for Google Cloud Platform architectures from text descriptions or images. Analyzes existing .drawio files to extract GCP components. Use for GCP architecture diagrams, cloud infrastructure documentation, or when converting GCP diagram images to editable DrawIO format.
license: MIT
compatibility: Requires image analysis capability for image conversion. Scripts require Python 3 and Bash. DrawIO Desktop optional for validation.
allowed-tools: Read Write
---

# GCP DrawIO Diagram Generator

Generates professional DrawIO XML diagrams for Google Cloud Platform architectures.

## Capabilities

1. **Extract** - Analyze existing DrawIO XML files to identify GCP shapes, connections, and structure
2. **Identify** - Recognize GCP service icons from architecture diagram images
3. **Generate** - Create valid DrawIO XML from images or text descriptions
4. **Convert** - Transform GCP architecture diagrams into editable DrawIO format

## Quick Reference

### GCP Shape Pattern
```
shape=mxgraph.gcp2.{service_name}
```

**Note:** GCP uses **snake_case** for shape names (e.g., `cloud_run`, `cloud_sql`, `cloud_storage`).

**Icon Pattern:** Unlike AWS, GCP uses a **single icon pattern** for all services — there is no service vs instance icon distinction. The same `shape=mxgraph.gcp2.{name}` is used whether labeling the service itself ("Cloud Run") or a specific instance ("Cloud Run (API Handler)"). Differentiate by label text only.

### Common GCP Services

| Service | Shape Code |
|---------|-----------|
| Cloud Run | `mxgraph.gcp2.cloud_run` |
| BigQuery | `mxgraph.gcp2.bigquery` |
| Cloud Storage | `mxgraph.gcp2.cloud_storage` |
| Vertex AI | `mxgraph.gcp2.cloud_machine_learning` |
| Cloud Scheduler | `mxgraph.gcp2.cloud_scheduler` |
| Apigee | `mxgraph.gcp2.apigee_api_platform` |
| Pub/Sub | `mxgraph.gcp2.cloud_pubsub` |
| Cloud SQL | `mxgraph.gcp2.cloud_sql` |
| GKE | `mxgraph.gcp2.compute_engine` |
| Cloud Functions | `mxgraph.gcp2.cloud_functions` |

### GCP Container Types

| Container | Use Case |
|-----------|----------|
| gcp_project | Main project boundary (two-cell pattern) |
| gcp_vpc_sc | VPC Service Controls perimeter (green border) |
| gcp_region | Regional grouping |
| gcp_zone | Zone grouping |
| logical_group_dashed | Logical grouping with dashed border |
| logical_group_solid | Solid border grouping |
| subnet | Subnet boundary |
| firewall_rules | Firewall rules grouping |
| instance_group | Instance group container |

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
| abc | Cloud Run | mxgraph.gcp2.cloud_run | (100,200) | vpc1 |

## Connection Matrix

| From | To | Label | Type |
|------|-----|-------|------|
| Cloud Run | BigQuery | API | solid |

## Container Hierarchy

- VPC-SC (vpc1)
  - Cloud Run (run1)
  - Cloud Run (run2)
  - BigQuery (bq1)

## Style Analysis

### Unique Shapes Found
- mxgraph.gcp2.cloud_run (4 instances)
- mxgraph.gcp2.bigquery (2 instances)
```

---

## Task 2: Convert Image to DrawIO

Use this workflow to recreate a GCP architecture diagram from an image.

### Steps

1. **Analyze image** - Identify all visual elements:
   - GCP service icons (shape, color, label)
   - Containers/boundaries (color, border style)
   - Connections (solid, dashed, arrows)
   - Labels and text

2. **Map to library** - For each identified element:
   - Look up in `assets/gcp-icons.json` by visual signature or label
   - Match containers to `assets/containers.json`
   - Note any unrecognized elements

3. **Estimate layout** - Determine positions:
   - Identify container boundaries first
   - Place icons within containers
   - Estimate x,y coordinates and dimensions
   - Standard icon size: **50x50 pixels**

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
- GCP architecture diagram image (PNG/JPG)

### Output
1. Valid `.drawio` XML file
2. Confidence report (Markdown)

### Confidence Report Format

```markdown
# Conversion Confidence Report

## Overall Confidence: 85%

## Identified Components

### High Confidence (>90%)
- Cloud Run x4 - Clear icon match
- BigQuery x2 - Clear icon match
- VPC-SC container - Green border, correct label

### Medium Confidence (70-90%)
- Vertex AI Search - Icon similar, label confirms

### Low Confidence (<70%)
- Unknown icon at position (300, 400) - Mapped to generic service

## Connection Accuracy
- 12/14 connections clearly visible
- 2 connections inferred from layout

## Notes
- "Same Instance" dashed container identified
- Bidirectional arrows on 3 connections
```

---

## Task 3: Create DrawIO from Description

Use this workflow to generate a new GCP diagram from text specifications.

### Steps

1. **Parse requirements** - Extract from description:
   - Required GCP services
   - Container/grouping needs
   - Connection requirements
   - Layout preferences

2. **Select components** - From libraries:
   - Look up services in `assets/gcp-icons.json`
   - Choose containers from `assets/containers.json`
   - Select connection styles

3. **Plan layout** - Design the arrangement:
   - Determine canvas size
   - Position containers first
   - Arrange services logically (left-to-right data flow, top-to-bottom hierarchy)
   - Standard spacing: **100px between 50x50 icons**

4. **Generate XML** - Build the diagram:
   - Use `assets/templates/drawio-base.xml` as starting point
   - Add elements in order: containers, services, connections
   - Assign unique IDs to all elements

5. **Validate** - Check the output:
   - All requested components present
   - Connections reference valid IDs
   - Layout is logical and readable

### Input
- Text description of desired GCP architecture

### Output
- Valid `.drawio` XML file

### Example Input

```
Create a GCP architecture with:
- VPC-SC container
- Cloud Scheduler triggering Cloud Run
- Cloud Run connecting to BigQuery and Cloud Storage
- Vertex AI Search connected to BigQuery
```

### Example Output Structure

```xml
<mxfile ...>
  <diagram name="GCP Architecture">
    <mxGraphModel ...>
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <!-- VPC-SC Container -->
        <mxCell id="vpc" value="VPC-SC" style="..." vertex="1" parent="1">
          <mxGeometry x="50" y="50" width="700" height="400" />
        </mxCell>
        <!-- Cloud Scheduler -->
        <mxCell id="sched" value="Cloud Scheduler" style="...mxgraph.gcp2.cloud_scheduler" vertex="1" parent="vpc">
          <mxGeometry x="50" y="100" width="50" height="50" />
        </mxCell>
        <!-- More shapes... -->
        <!-- Connections -->
        <mxCell id="conn1" edge="1" source="sched" target="run" style="..." />
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

---

## Shape Library Reference

### Looking Up a GCP Service

1. Open `assets/gcp-icons.json`
2. Search by `service_name` or `recognition_keywords`
3. Use the `drawio_shape.full_style` for complete styling
4. Or construct style using `shape=mxgraph.gcp2.{shape_name}`

**Service Coverage:**
- 46 GCP services across 11 categories
- 40 exact matches, 6 fallback icons
- Categories: compute, database, storage, networking, ai_ml, integration, operations, api_management, data_analytics, devops, security

**Note:** 6 services use fallback icons (Workflows, Eventarc, Artifact Registry, Cloud Deploy, Secret Manager, Identity Platform) as they're newer services not yet in DrawIO's mxgraph.gcp2 stencil. See [references/ICON-COMPATIBILITY.md](references/ICON-COMPATIBILITY.md) for complete validation details.

### GCP Service Categories

| Category | Services |
|----------|----------|
| compute | Cloud Run, Compute Engine, GKE, Cloud Functions, App Engine |
| database | BigQuery, Cloud SQL, Firestore, Spanner, Bigtable, Memorystore |
| storage | Cloud Storage, Filestore, Persistent Disk |
| networking | VPC, Load Balancing, CDN, DNS, Armor, Cloud NAT |
| ai_ml | Vertex AI, AI Platform, Vision, NLP, Speech-to-Text |
| integration | Pub/Sub, Cloud Tasks, Workflows, Eventarc, Scheduler |
| operations | Logging, Monitoring, Trace, Error Reporting |
| api_management | Apigee, API Gateway |
| data_analytics | Dataflow, Dataproc, Cloud Composer |
| devops | Cloud Build, Artifact Registry, Container Registry, Cloud Deploy |
| security | Cloud KMS, Secret Manager, Identity Platform |

---

## Visual Best Practices (Summary)

For detailed visual design guidelines, see [references/DIAGRAM-BEST-PRACTICES.md](references/DIAGRAM-BEST-PRACTICES.md).

### GCP Project Zone (Two-Cell Pattern)

The GCP Project container uses **two cells**, not one:
1. **Container cell**: Plain rectangle with `fillColor=#F6F6F6;strokeColor=none;` and HTML value `<b>Google </b>Cloud Platform`
2. **Logo child cell**: `shape=mxgraph.gcp2.google_cloud_platform` at 23x20px with `relative=1` geometry

See `assets/templates/node-template.xml` for the exact template.

### Font Colors

- Service icon labels: `fontColor=#424242` (dark gray)
- GCP Project zone text: `fontColor=#717171`
- VPC-SC container title: `fontColor=#2E7D32` (dark green)
- Dashed group labels: `fontColor=#424242`

### Icon Spacing

- Icon size: **50x50 pixels**
- Standard spacing: **100px between icons**
- Container padding: **20-30px**

### Connection Labels

Always add these properties to labeled connections:
```
labelBackgroundColor=#FFFFFF;fontSize=10;fontColor=#333333;
```

### Connection Best Practices

- Standard width: `strokeWidth=1` for most connections
- Thick width: `strokeWidth=2` only for primary data paths (use sparingly - max 1-3 per diagram)
- Orthogonal routing: `edgeStyle=orthogonalEdgeStyle` for professional appearance
- When 3+ connections cross same corridor: consolidate into single connection

---

## XML Structure Quick Reference

For complete XML examples and detailed structure, see [references/xml-examples.md](references/xml-examples.md).

The key building blocks:

- **Shape**: `<mxCell id="..." value="Label" style="..." vertex="1" parent="1">` with `<mxGeometry>`
- **Connection**: `<mxCell id="..." edge="1" source="..." target="..." style="...">`
- **Container**: Shape with `container=1` in style; children set `parent` to container ID
- **Root cells**: Every diagram needs `<mxCell id="0"/>` and `<mxCell id="1" parent="0"/>`

For XML parsing and extraction techniques, see [references/xml-parser-guide.md](references/xml-parser-guide.md).

---

## Troubleshooting

### Icon Not Displaying
- Verify shape name matches exactly: `mxgraph.gcp2.cloud_run` (underscore, not hyphen)
- Check [references/ICON-COMPATIBILITY.md](references/ICON-COMPATIBILITY.md) for correct shape names
- Ensure `vertex="1"` is present
- Check that `<mxGeometry>` has valid width/height (50x50)
- For Workflows/Eventarc, note these don't have exact icon matches in DrawIO's library

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
- Verify `fontSize` is reasonable (11-14)
- Ensure `fontColor=#424242` is set

### File Won't Open in DrawIO
- Validate XML structure (proper closing tags)
- Ensure `id="0"` and `id="1"` root cells exist
- Check for special characters in labels (use `&#xa;` for newlines)

---

## Desktop Integration

After generating a `.drawio` file, you can validate and preview it:

1. **Validate**: `python scripts/validate-drawio.py output.drawio --verbose`
2. **Analyze**: `python scripts/analyze-existing.py output.drawio --markdown`
3. **Validate Icons**: `python scripts/validate-gcp-icons.py`
4. **Export PNG**: `./scripts/export-diagram.sh output.drawio png`
5. **Open in DrawIO**: `./scripts/open-diagram.sh output.drawio`

Requires DrawIO Desktop. Install on macOS: `brew install drawio`

---

## Files in This Skill

| File | Purpose |
|------|---------|
| `SKILL.md` | This file - main instructions |
| **Assets** | |
| `assets/gcp-icons.json` | GCP service icon database (46 services) |
| `assets/containers.json` | GCP container and connection styles |
| `assets/templates/drawio-base.xml` | Base XML template |
| `assets/templates/node-template.xml` | Shape insertion template |
| `assets/templates/connection-template.xml` | Connection template |
| **References** | |
| `references/ICON-COMPATIBILITY.md` | Icon validation reference |
| `references/DIAGRAM-BEST-PRACTICES.md` | Visual design and layout guidelines |
| `references/xml-parser-guide.md` | Detailed XML parsing reference |
| `references/xml-examples.md` | Copy-paste XML examples |
| `references/coordinate-system.md` | Positioning and layout guide |
| `references/style-guide.md` | Style string reference |
| **Scripts** | |
| `scripts/validate-drawio.py` | Validate .drawio XML structure |
| `scripts/validate-gcp-icons.py` | Validate GCP icon compatibility |
| `scripts/fix-gcp-icons.py` | Auto-fix icon shape names |
| `scripts/fix-drawio-icons.py` | Bulk fix icon references in .drawio files |
| `scripts/extract-shape-names.py` | Extract available shapes from DrawIO stencil |
| `scripts/analyze-existing.py` | Extract shapes/connections from .drawio files |
| `scripts/export-diagram.sh` | Export to PNG/PDF via DrawIO Desktop CLI |
| `scripts/open-diagram.sh` | Open .drawio file in DrawIO Desktop |
