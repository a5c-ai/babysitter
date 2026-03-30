# DrawIO XML Examples

Quick-reference examples for constructing DrawIO XML elements.

## Minimum Valid Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net">
  <diagram name="Architecture" id="arch">
    <mxGraphModel dx="1434" dy="844" grid="1" gridSize="10">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <!-- Add shapes here -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

## Adding a GCP Service

```xml
<mxCell id="cloud_run" value="Cloud Run"
  style="sketch=0;html=1;fillColor=#4285F4;strokeColor=none;verticalAlign=top;labelPosition=center;verticalLabelPosition=bottom;align=center;spacingTop=-6;fontSize=11;fontStyle=0;fontColor=#424242;shape=mxgraph.gcp2.cloud_run"
  vertex="1" parent="1">
  <mxGeometry x="100" y="100" width="50" height="50" as="geometry" />
</mxCell>
```

## Adding a GCP Service (Multi-Line Label)

```xml
<mxCell id="cloud_run_api" value="Cloud Run&#xa;(API Service)"
  style="sketch=0;html=1;fillColor=#4285F4;strokeColor=none;verticalAlign=top;labelPosition=center;verticalLabelPosition=bottom;align=center;spacingTop=-6;fontSize=11;fontStyle=0;fontColor=#424242;shape=mxgraph.gcp2.cloud_run"
  vertex="1" parent="1">
  <mxGeometry x="100" y="100" width="50" height="50" as="geometry" />
</mxCell>
```

Use `&#xa;` for line breaks. Max 2 lines recommended.

## Adding a Connection

```xml
<mxCell id="conn_cloud_run_to_bigquery" value=""
  style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#333333;strokeWidth=1;endArrow=classic;endFill=1;"
  edge="1" parent="1" source="cloud_run" target="bigquery">
  <mxGeometry relative="1" as="geometry" />
</mxCell>
```

## Adding a Container

```xml
<mxCell id="vpc_sc" value="VPC Service Controls"
  style="rounded=1;whiteSpace=wrap;html=1;fillColor=#E8F5E9;strokeColor=#4CAF50;strokeWidth=2;dashed=0;verticalAlign=top;fontSize=13;fontStyle=1;fontColor=#2E7D32;align=center;arcSize=5;container=1;collapsible=0;recursiveResize=0;"
  vertex="1" parent="1">
  <mxGeometry x="50" y="50" width="600" height="400" as="geometry" />
</mxCell>

<!-- Child shapes use parent="vpc_sc" -->
<mxCell id="cloud_run" ... parent="vpc_sc">
```

## Labeled Connection

```xml
<mxCell id="conn_cloud_run_to_bigquery" value="API Call" edge="1" source="cloud_run" target="bigquery"
  style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#333333;strokeWidth=1;endArrow=classic;endFill=1;labelBackgroundColor=#FFFFFF;fontSize=10;fontColor=#333333;">
  <mxGeometry relative="1" as="geometry" />
</mxCell>
```

**Always include** `labelBackgroundColor=#FFFFFF;fontSize=10;fontColor=#333333;` on labeled connections to prevent text overlapping icons.

## Bidirectional Connection

```xml
<mxCell id="conn_cloud_run_to_cloud_sql" value="read/write" edge="1" source="cloud_run" target="cloud_sql"
  style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#333333;strokeWidth=1;startArrow=classic;startFill=1;endArrow=classic;endFill=1;labelBackgroundColor=#FFFFFF;fontSize=10;fontColor=#333333;">
  <mxGeometry relative="1" as="geometry" />
</mxCell>
```

## Dashed Connection

```xml
<mxCell id="conn_monitoring_to_logging" value="optional" edge="1" source="cloud_monitoring" target="cloud_logging"
  style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#666666;strokeWidth=1;dashed=1;endArrow=classic;endFill=1;labelBackgroundColor=#FFFFFF;fontSize=10;fontColor=#333333;">
  <mxGeometry relative="1" as="geometry" />
</mxCell>
```

## Connection with Waypoints

For custom routing (L-shape, U-shape, avoiding obstacles):

```xml
<mxCell id="conn_storage_to_bigquery" value="load" edge="1" source="cloud_storage" target="bigquery"
  style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#333333;strokeWidth=1;endArrow=classic;endFill=1;labelBackgroundColor=#FFFFFF;fontSize=10;fontColor=#333333;">
  <mxGeometry relative="1" as="geometry">
    <Array as="points">
      <mxPoint x="300" y="400" />
      <mxPoint x="500" y="400" />
    </Array>
  </mxGeometry>
</mxCell>
```

Add `<mxPoint>` elements for each waypoint. Useful when orthogonal routing creates unwanted overlaps.

## Complete Small Diagram Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net">
  <diagram name="Architecture" id="arch">
    <mxGraphModel dx="1434" dy="844" grid="1" gridSize="10">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <!-- VPC-SC Container -->
        <mxCell id="vpc_sc" value="VPC Service Controls"
          style="rounded=1;whiteSpace=wrap;html=1;fillColor=#E8F5E9;strokeColor=#4CAF50;strokeWidth=2;dashed=0;verticalAlign=top;fontSize=13;fontStyle=1;fontColor=#2E7D32;align=center;arcSize=5;container=1;collapsible=0;recursiveResize=0;"
          vertex="1" parent="1">
          <mxGeometry x="50" y="50" width="700" height="400" as="geometry" />
        </mxCell>
        <!-- Cloud Scheduler (outside VPC) -->
        <mxCell id="cloud_scheduler" value="Cloud Scheduler"
          style="sketch=0;html=1;fillColor=#4285F4;strokeColor=none;verticalAlign=top;labelPosition=center;verticalLabelPosition=bottom;align=center;spacingTop=-6;fontSize=11;fontStyle=0;fontColor=#424242;shape=mxgraph.gcp2.cloud_scheduler"
          vertex="1" parent="1">
          <mxGeometry x="50" y="500" width="50" height="50" as="geometry" />
        </mxCell>
        <!-- Cloud Run (inside VPC) -->
        <mxCell id="cloud_run" value="Cloud Run"
          style="sketch=0;html=1;fillColor=#4285F4;strokeColor=none;verticalAlign=top;labelPosition=center;verticalLabelPosition=bottom;align=center;spacingTop=-6;fontSize=11;fontStyle=0;fontColor=#424242;shape=mxgraph.gcp2.cloud_run"
          vertex="1" parent="vpc_sc">
          <mxGeometry x="100" y="100" width="50" height="50" as="geometry" />
        </mxCell>
        <!-- BigQuery (inside VPC) -->
        <mxCell id="bigquery" value="BigQuery"
          style="sketch=0;html=1;fillColor=#4285F4;strokeColor=none;verticalAlign=top;labelPosition=center;verticalLabelPosition=bottom;align=center;spacingTop=-6;fontSize=11;fontStyle=0;fontColor=#424242;shape=mxgraph.gcp2.bigquery"
          vertex="1" parent="vpc_sc">
          <mxGeometry x="300" y="100" width="50" height="50" as="geometry" />
        </mxCell>
        <!-- Connections -->
        <mxCell id="conn_scheduler_to_cloud_run" edge="1" source="cloud_scheduler" target="cloud_run"
          style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#333333;strokeWidth=1;endArrow=classic;endFill=1;">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="conn_cloud_run_to_bigquery" edge="1" source="cloud_run" target="bigquery"
          style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#333333;strokeWidth=1;endArrow=classic;endFill=1;">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```
