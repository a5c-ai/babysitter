# GCP Icon Compatibility Reference

**Last Updated:** 2026-02-15
**Provider:** GCP
**Stencil Library:** mxgraph.gcp2
**Validation Status:** 94.3% (33/35 exact matches)

## Validation Summary

This skill's GCP icons have been validated against DrawIO's official `mxgraph.gcp2` stencil library.

### Results
- **Total services:** 35
- **Exact matches:** 33 (94.3%)
- **Fallback icons:** 2 (5.7%)
- **Broken icons:** 0 (0%)

## Validation Methodology

1. Extracted all shape names from DrawIO's gcp2.xml stencil
2. Cross-referenced with `assets/gcp-icons.json`
3. Tested each icon in DrawIO Desktop to verify rendering
4. Documented any services requiring fallback icons

## Services with Fallback Icons

Two newer GCP services don't have dedicated icons in the mxgraph.gcp2 library:

| Service | Shape Name | Status | Fallback Used |
|---------|------------|--------|---------------|
| Workflows | `cloud_workflows` | Not in gcp2 | Generic workflow icon |
| Eventarc | `eventarc` | Not in gcp2 | Generic integration icon |

**Why?** These are newer GCP services (2021+) that weren't included in DrawIO's gcp2 stencil library. The fallback icons are generic but functional.

## Validated Services (33/35)

All of the following services render correctly with exact icon matches:

### Compute (5)
- Cloud Run → `cloud_run`
- Compute Engine → `compute_engine`
- Kubernetes Engine (GKE) → `kubernetes_engine`
- Cloud Functions → `cloud_functions`
- App Engine → `app_engine`

### Database (6)
- BigQuery → `bigquery`
- Cloud SQL → `cloud_sql`
- Firestore → `cloud_firestore`
- Spanner → `cloud_spanner`
- Bigtable → `cloud_bigtable`
- Memorystore → `memorystore`

### Storage (3)
- Cloud Storage → `cloud_storage`
- Filestore → `filestore`
- Persistent Disk → `persistent_disk`

### Networking (5)
- VPC → `virtual_private_cloud`
- Load Balancing → `cloud_load_balancing`
- Cloud CDN → `cloud_cdn`
- Cloud DNS → `cloud_dns`
- Cloud Armor → `cloud_armor`

### AI/ML (5)
- Vertex AI → `cloud_machine_learning`
- AI Platform → `ai_platform`
- Vision API → `vision_api`
- Natural Language API → `natural_language_api`
- Speech-to-Text → `speech_api`

### Integration (3)
- Pub/Sub → `cloud_pubsub`
- Cloud Tasks → `cloud_tasks`
- Cloud Scheduler → `cloud_scheduler`

### Operations (4)
- Cloud Logging → `logging`
- Cloud Monitoring → `monitoring`
- Cloud Trace → `trace`
- Error Reporting → `error_reporting`

### API Management (2)
- Apigee → `apigee_api_platform`
- API Gateway → `api_gateway`

## Naming Convention

GCP uses **snake_case** for shape names:
- ✅ `cloud_run`
- ✅ `cloud_sql`
- ✅ `bigquery`
- ❌ NOT `cloud-run` (hyphens)
- ❌ NOT `CloudRun` (CamelCase)

## Validation Scripts

### Validate Icon Database
```bash
python scripts/validate-gcp-icons.py
```

Expected output:
```
Validating GCP icons against mxgraph.gcp2 library...
✓ 33/35 icons validated (94.3%)
⚠ 2 services use fallback icons
✗ 0 broken icons
```

### Validate Generated Diagram
```bash
python scripts/validate-drawio.py output.drawio
```

Checks:
- XML structure validity
- All shape references exist
- Connection IDs are valid
- Geometry is properly formatted

## Troubleshooting

### Icon Shows as Broken/Missing
1. Check shape name spelling: `mxgraph.gcp2.cloud_run` (underscores!)
2. Verify `vertex="1"` is present
3. Check geometry has width/height (50x50 for GCP)
4. Look up correct name in `assets/gcp-icons.json`

### Wrong Icon Displayed
- Check service_id in `gcp-icons.json`
- Verify you're using the correct shape_name
- Some services have similar icons (e.g., compute_engine for both VM and GKE)

### Icon Too Small/Large
- GCP standard: 50x50 pixels
- Check `<mxGeometry>` width and height attributes
- Containers can be larger (e.g., VPC-SC: 700x400)

## Future Updates

As DrawIO updates its gcp2 stencil library, we'll validate new icons:
- Monitor DrawIO releases for gcp2.xml updates
- Re-run validation scripts
- Update fallback icons to exact matches when available
- Target: 100% exact matches

## References

- DrawIO gcp2 stencil: Built-in to DrawIO Desktop
- Validation source: Manual testing in DrawIO Desktop v22+
- Icon database: `assets/gcp-icons.json`
- Validation script: `scripts/validate-gcp-icons.py`
