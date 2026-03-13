# DrawIO Diagram Best Practices (AWS)

Best practices for creating professional, readable AWS architecture diagrams.

---

## Connection Width Standards

### Standard Width: 1pt (Default)

Use `strokeWidth=1` for most connections:
- Standard data flows
- API calls
- Read/write operations
- Service-to-service communication

**Example:**
```xml
style="strokeColor=#232F3E;strokeWidth=1;endArrow=open;endSize=4;"
```

### Thick Width: 2pt (Emphasis)

Use `strokeWidth=2` **only** for:
- Primary/critical data paths
- Main architectural flow to emphasize
- Consolidated connections (replacing 3+ parallel connections)

### Visual Consistency Rule

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

### Consolidate Parallel Connections

When 3+ connections cross the same corridor:
- **Consolidate** into a single connection
- Use a combined label (e.g., "write / load")
- Target the container group instead of individual nodes

### Connection Spacing

- 30-40px between parallel connections
- 50px+ for connections crossing busy areas
- Use waypoints for complex routing:

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

```xml
value="query"
style="...;labelBackgroundColor=#FFFFFF;fontSize=10;fontColor=#232F3E;"
```

- Always use `labelBackgroundColor=#FFFFFF` (prevents overlap)
- Font size: 10px for connection labels
- Font color: `#232F3E`
- Keep labels concise (1-3 words)

### Service Icon Labels

```xml
value="AWS Lambda&#xa;(Processing)"
style="...;fontColor=#232F3E;fontSize=12;..."
```

- Font size: 12px
- Font color: `#232F3E`
- Use `&#xa;` for line breaks
- Primary name + optional descriptor

---

## Container Organization

### Nesting Order (Outermost to Innermost)

1. **AWS Cloud**
2. **AWS Account**
3. **Region**
4. **VPC**
5. **Availability Zone**
6. **Subnet** (public/private)
7. **Security Group / Auto Scaling Group**
8. **Service Icons**

### Container Margins

- Top: 40-60px (for label)
- Sides: 20-30px
- Bottom: 20-30px
- Between containers: 60-80px

---

## Icon Spacing & Alignment

- Standard icon size: **64x64px**
- Horizontal spacing: 100-120px
- Vertical spacing: 100-120px
- Minimum: 80px to avoid crowding
- Snap to 10px grid

---

## ID Naming Convention

### Service IDs

Use the full service name from `aws-icons.json` `service_id` field — never abbreviate:

| Correct | Wrong |
|---------|-------|
| `api_gateway` | `apigw` |
| `step_functions` | `stepfn` |
| `cloudwatch` | `cw` |
| `dynamodb` | `ddb` |
| `elastic_load_balancing` | `elb` |

### Multiple Instances of the Same Service

Append a descriptive **role** suffix — never use numeric suffixes:

| Correct | Wrong |
|---------|-------|
| `lambda_api_handler` | `lambda1` |
| `lambda_processor` | `lambda2` |
| `s3_static_assets` | `s3_1` |
| `s3_logs` | `s3_2` |

### Text Labels and Non-Service Elements

Use a clear, descriptive name — no type suffixes like `_label` or `_text`:

| Correct | Wrong |
|---------|-------|
| `users` | `users_label` |
| `on_premises` | `on_prem_text` |

### Connection IDs

Use `conn_{source}_to_{target}` with full source/target IDs:

| Correct | Wrong |
|---------|-------|
| `conn_api_gateway_to_lambda_api_handler` | `conn_apigw_lambda` |
| `conn_lambda_processor_to_dynamodb` | `conn1` |
| `conn_sqs_to_sns` | `conn_sqs_sns` |

---

## Common Anti-Patterns

1. **Wrong icon pattern** — Use `resourceIcon`/`resIcon`, NEVER `productIcon`/`prIcon`
2. **Spaces in shape names** — Use underscores: `step_functions`, not `step functions`
3. **Abbreviated IDs** — Use full names: `api_gateway`, not `apigw`
4. **Numeric suffixes** — Use role names: `lambda_processor`, not `lambda2`
5. **Too many thick lines** — Max 1-3 connections at strokeWidth=2
6. **Parallel connection clutter** — Consolidate 3+ into combined labels
7. **Missing label backgrounds** — Always use `labelBackgroundColor=#FFFFFF`
8. **Inconsistent spacing** — Use grid alignment (100px, 120px intervals)

---

## Layout Workflow

1. **Containers first** — AWS Cloud, Region, VPC, subnets
2. **Anchor services** — Entry points (API Gateway, ALB), data stores (RDS, S3)
3. **Remaining services** — Group by function, consistent spacing
4. **Connections** — Main flows first, then secondary
5. **Refine** — Grid alignment, label positioning, spacing consistency

---

## Quick Reference

| Element | Value |
|---------|-------|
| Icon size | 64x64px |
| Icon spacing | 100-120px |
| Container padding (top) | 40-60px |
| Container padding (sides) | 20-30px |
| Font color | #232F3E |
| Font size (labels) | 12px |
| Font size (connections) | 10px |
| Connection width | 1pt (default), 2pt (emphasis) |

---

## Validation Checklist

- [ ] All icons use `resourceIcon`/`resIcon`
- [ ] Multi-word shape names use underscores
- [ ] IDs use full service names, no abbreviations
- [ ] Multiple instances use role suffixes, not numbers
- [ ] Connection IDs follow `conn_{source}_to_{target}` pattern
- [ ] Max 1-3 thick connections
- [ ] Connection labels have `labelBackgroundColor=#FFFFFF`
- [ ] Labels use `fontColor=#232F3E`
- [ ] Icons are 64x64, grid-aligned
- [ ] Min 80px spacing between icons
