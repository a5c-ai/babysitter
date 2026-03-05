# DrawIO XML Examples (AWS)

Quick-reference examples for constructing DrawIO XML elements with AWS services.

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

## Adding an AWS Service

```xml
<mxCell id="lambda1" value="AWS Lambda"
  style="outlineConnect=0;fontColor=#232F3E;gradientColor=none;fillColor=#ED7100;strokeColor=none;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=12;fontStyle=0;aspect=fixed;pointerEvents=1;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.lambda"
  vertex="1" parent="1">
  <mxGeometry x="100" y="100" width="64" height="64" as="geometry" />
</mxCell>
```

## Adding an AWS Instance Icon (No Background)

Use instance icons when representing a specific resource, not the service itself:

```xml
<mxCell id="lambda_order_processor" value="Order Processor"
  style="outlineConnect=0;fontColor=#232F3E;gradientColor=none;fillColor=#ED7100;strokeColor=none;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=12;fontStyle=0;aspect=fixed;pointerEvents=1;shape=mxgraph.aws4.lambda"
  vertex="1" parent="1">
  <mxGeometry x="100" y="100" width="64" height="64" as="geometry" />
</mxCell>
```

**Key difference:** No `resourceIcon` wrapper — the shape name `mxgraph.aws4.lambda` is used directly. **CRITICAL:** Always keep `fillColor` set to the category color, or the icon renders white/invisible.

## Adding an AWS Service (Multi-Line Label)

```xml
<mxCell id="api_gateway" value="Amazon&#xa;API Gateway"
  style="outlineConnect=0;fontColor=#232F3E;gradientColor=none;fillColor=#E7157B;strokeColor=none;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=12;fontStyle=0;aspect=fixed;pointerEvents=1;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.api_gateway"
  vertex="1" parent="1">
  <mxGeometry x="100" y="100" width="64" height="64" as="geometry" />
</mxCell>
```

Use `&#xa;` for line breaks. Max 2 lines recommended.

## Adding a Connection

```xml
<mxCell id="conn1" value=""
  style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#232F3E;strokeWidth=2;endArrow=open;endSize=4;"
  edge="1" parent="1" source="lambda1" target="dynamodb1">
  <mxGeometry relative="1" as="geometry" />
</mxCell>
```

## Adding a Container (VPC)

```xml
<mxCell id="vpc1" value="VPC"
  style="points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_vpc2;strokeColor=#8C4FFF;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#AAB7B8;dashed=0;container=1;collapsible=0;recursiveResize=0;"
  vertex="1" parent="1">
  <mxGeometry x="50" y="50" width="700" height="400" as="geometry" />
</mxCell>

<!-- Child shapes use parent="vpc1" -->
<mxCell id="lambda1" ... parent="vpc1">
```

## Labeled Connection

```xml
<mxCell id="conn1" value="API Call" edge="1" source="a" target="b"
  style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#232F3E;strokeWidth=2;endArrow=open;endSize=4;labelBackgroundColor=#FFFFFF;fontSize=10;fontColor=#232F3E;">
  <mxGeometry relative="1" as="geometry" />
</mxCell>
```

## Bidirectional Connection

```xml
<mxCell id="conn2" value="Sync" edge="1" source="a" target="b"
  style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#232F3E;strokeWidth=2;endArrow=open;endSize=4;startArrow=open;startSize=4;">
  <mxGeometry relative="1" as="geometry" />
</mxCell>
```

## Dashed Connection

```xml
<mxCell id="conn3" value="Optional" edge="1" source="a" target="b"
  style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#232F3E;strokeWidth=2;dashed=1;endArrow=open;endSize=4;">
  <mxGeometry relative="1" as="geometry" />
</mxCell>
```

## Connection with Waypoints

For custom routing (L-shape, U-shape, avoiding obstacles):

```xml
<mxCell id="conn_lambda_to_s3" value="store" edge="1" source="lambda" target="s3"
  style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#232F3E;strokeWidth=2;endArrow=open;endSize=4;labelBackgroundColor=#FFFFFF;fontSize=10;fontColor=#232F3E;">
  <mxGeometry relative="1" as="geometry">
    <Array as="points">
      <mxPoint x="300" y="500" />
      <mxPoint x="600" y="500" />
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
        <!-- VPC Container -->
        <mxCell id="vpc" value="VPC"
          style="points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_vpc2;strokeColor=#8C4FFF;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#AAB7B8;dashed=0;container=1;collapsible=0;recursiveResize=0;"
          vertex="1" parent="1">
          <mxGeometry x="50" y="50" width="700" height="400" as="geometry" />
        </mxCell>
        <!-- API Gateway (outside VPC) -->
        <mxCell id="apigw" value="Amazon&#xa;API Gateway"
          style="outlineConnect=0;fontColor=#232F3E;gradientColor=none;fillColor=#E7157B;strokeColor=none;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=12;fontStyle=0;aspect=fixed;pointerEvents=1;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.api_gateway"
          vertex="1" parent="1">
          <mxGeometry x="50" y="500" width="64" height="64" as="geometry" />
        </mxCell>
        <!-- Lambda (inside VPC) -->
        <mxCell id="lambda1" value="AWS Lambda"
          style="outlineConnect=0;fontColor=#232F3E;gradientColor=none;fillColor=#ED7100;strokeColor=none;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=12;fontStyle=0;aspect=fixed;pointerEvents=1;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.lambda"
          vertex="1" parent="vpc">
          <mxGeometry x="100" y="100" width="64" height="64" as="geometry" />
        </mxCell>
        <!-- DynamoDB (inside VPC) -->
        <mxCell id="ddb1" value="Amazon DynamoDB"
          style="outlineConnect=0;fontColor=#232F3E;gradientColor=none;fillColor=#C925D1;strokeColor=none;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=12;fontStyle=0;aspect=fixed;pointerEvents=1;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.dynamodb"
          vertex="1" parent="vpc">
          <mxGeometry x="350" y="100" width="64" height="64" as="geometry" />
        </mxCell>
        <!-- Connections -->
        <mxCell id="c1" edge="1" source="apigw" target="lambda1"
          style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#232F3E;strokeWidth=2;endArrow=open;endSize=4;">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="c2" edge="1" source="lambda1" target="ddb1"
          style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#232F3E;strokeWidth=2;endArrow=open;endSize=4;">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```
