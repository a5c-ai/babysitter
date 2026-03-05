# GCP Icon Compatibility Reference

**Last Updated:** 2026-02-19
**Provider:** GCP
**Stencil Library:** mxgraph.gcp2
**Validation Status:** 40/46 exact matches, 6 fallback icons

## Validation Summary

This skill's GCP icons have been validated against DrawIO's official `mxgraph.gcp2` stencil library.

### Results
- **Total services:** 46
- **Exact matches:** 40 (87.0%)
- **Fallback icons:** 6 (13.0%)
- **Broken icons:** 0 (0%)

## Validation Methodology

1. Extracted all shape names from DrawIO's gcp2.xml stencil (via `.archive/gcp2-available-shapes.txt`)
2. Cross-referenced with `assets/gcp-icons.json`
3. Tested each icon in DrawIO Desktop to verify rendering
4. Documented any services requiring fallback icons

## Services with Fallback Icons

Six GCP services don't have dedicated icons in the mxgraph.gcp2 library:

| Service | Uses Shape | Fallback Reason |
|---------|-----------|-----------------|
| Workflows | `workflows` | Newer service, not in original gcp2 stencil |
| Eventarc | `eventarc` | Newer service, not in original gcp2 stencil |
| Artifact Registry | `container_registry` | Not in stencil; uses Container Registry icon |
| Cloud Deploy | `container_builder` | Not in stencil; uses Cloud Build icon |
| Secret Manager | `key_management_service` | Not in stencil; uses Cloud KMS icon |
| Identity Platform | `gateway` | Not in stencil; uses API Gateway icon |

## Validated Services (40/46)

All of the following services render correctly with exact icon matches:

### Compute (5)
- Cloud Run → `cloud_run`
- Compute Engine → `compute_engine`
- Kubernetes Engine (GKE) → `container_engine`
- Cloud Functions → `cloud_functions`
- App Engine → `app_engine`

### Database (6)
- BigQuery → `bigquery`
- Cloud SQL → `cloud_sql`
- Firestore → `cloud_firestore`
- Spanner → `cloud_spanner`
- Bigtable → `cloud_bigtable`
- Memorystore → `cloud_memorystore`

### Storage (3)
- Cloud Storage → `cloud_storage`
- Filestore → `cloud_filestore`
- Persistent Disk → `persistent_disk`

### Networking (6)
- VPC → `virtual_private_cloud`
- Load Balancing → `cloud_load_balancing`
- Cloud CDN → `cloud_cdn`
- Cloud DNS → `cloud_dns`
- Cloud Armor → `cloud_armor`
- Cloud NAT → `cloud_nat`

### AI/ML (5)
- Vertex AI → `cloud_machine_learning`
- AI Platform → `cloud_machine_learning`
- Vision API → `cloud_vision_api`
- Natural Language API → `cloud_natural_language_api`
- Speech-to-Text → `cloud_speech_api`

### Integration (5)
- Pub/Sub → `cloud_pubsub`
- Cloud Tasks → `cloud_tasks`
- Cloud Scheduler → `cloud_scheduler`
- Workflows → `workflows` (fallback)
- Eventarc → `eventarc` (fallback)

### Operations (4)
- Cloud Logging → `logging`
- Cloud Monitoring → `cloud_monitoring`
- Cloud Trace → `trace`
- Error Reporting → `error_reporting`

### API Management (2)
- Apigee → `apigee_api_platform`
- API Gateway → `gateway`

### Data & Analytics (3)
- Cloud Dataflow → `cloud_dataflow`
- Cloud Dataproc → `cloud_dataproc`
- Cloud Composer → `cloud_composer`

### DevOps & CI/CD (4)
- Cloud Build → `container_builder`
- Container Registry → `container_registry`
- Artifact Registry → `container_registry` (fallback)
- Cloud Deploy → `container_builder` (fallback)

### Security (3)
- Cloud KMS → `key_management_service`
- Secret Manager → `key_management_service` (fallback)
- Identity Platform → `gateway` (fallback)

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

### Validate Generated Diagram
```bash
python scripts/validate-drawio.py output.drawio
```

Checks:
- XML structure validity
- All shape references exist
- Connection IDs are valid
- Geometry is properly formatted

## References

- DrawIO gcp2 stencil: Built-in to DrawIO Desktop
- Available shapes: `.archive/gcp2-available-shapes.txt`
- Icon database: `assets/gcp-icons.json`
- Validation script: `scripts/validate-gcp-icons.py`
