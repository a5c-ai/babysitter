# AWS Icon Compatibility Reference

**Last Updated:** 2026-02-15
**Provider:** AWS
**Stencil Library:** mxgraph.aws4
**Validation Status:** 96.6% (255/264 validated)

## Validation Summary

This skill's AWS icons have been validated against DrawIO's official `mxgraph.aws4` stencil library from github.com/jgraph/drawio.

### Results
- **Total services:** 264 (Part 1 + Part 2 Complete)
- **Validated services:** 255 (96.6%)
- **Unvalidated services:** 9 (3.4% - likely deprecated or new services not yet in aws4.xml)
- **Fallback icons:** 0
- **Coverage:** 27 AWS service categories

### Part 1 Services (112 - 100% validated)
Categories: Analytics, Application Integration, Artificial Intelligence, Blockchain, Business Applications, Cloud Financial Management, Compute, Containers, Customer Enablement, Customer Experience

### Part 2 Services (152 - 94.7% validated)
Categories: Databases, Developer Tools, End User Computing, Front-End Web & Mobile, Games, Internet of Things, Management Tools, Media Services, Migration & Modernization, Multicloud & Hybrid, Networking & Content Delivery, Quantum Technologies, Satellite, Security & Identity, Storage

### Unvalidated Services
The following 9 services do not have exact shape matches in aws4.xml (likely deprecated or newer services):
1. AWS IoT 1-Click
2. AWS AppConfig
3. AWS Launch Wizard
4. AWS Elemental Conductor (on-premises appliance)
5. AWS Elemental Delta (on-premises appliance)
6. AWS Elemental Live (on-premises appliance)
7. AWS Elemental Server (on-premises appliance)
8. AWS Security Agent
9. AWS Elastic Disaster Recovery

## Shape Name Conventions

There are two different name formats depending on context — it is important not to confuse them:

| Context | Format | Example |
|---------|--------|---------|
| **DrawIO style strings** (what you write in XML) | **Underscores** | `step_functions`, `api_gateway` |
| Raw aws4.xml stencil names (validation reference only) | Spaces | `step functions`, `api gateway` |

**Always use underscores in DrawIO style strings.** The stencil file internally stores names with spaces, but DrawIO's style parser requires underscores for multi-word names. This was empirically verified by testing all naming variants in DrawIO Desktop — only underscores render correctly.

### Examples

| Service | Correct (style string) | Raw stencil name (reference only) |
|---------|------------------------|-----------------------------------|
| Step Functions | ✅ `step_functions` | `step functions` |
| API Gateway | ✅ `api_gateway` | `api gateway` |
| Kinesis Data Streams | ✅ `kinesis_data_streams` | `kinesis data streams` |
| Elastic Beanstalk | ✅ `elastic_beanstalk` | `elastic beanstalk` |
| AWS Managed Blockchain | ✅ `managed_blockchain` | `managed blockchain` |
| EC2 Image Builder | ✅ `ec2_image_builder` | `ec2 image builder` |

### Single-Word Services

These services have single-word names — same in both contexts:
- `lambda`, `ec2`, `s3`, `sqs`, `sns`, `dynamodb`, `ecs`, `eks`, `rds`, `kinesis`

## Validation Methodology

1. Downloaded official AWS4 stencil from DrawIO GitHub repository
2. Extracted all 1,031 available shape names from `aws4.xml`
3. Cross-referenced with `assets/aws-icons.json` (112 services)
4. Tested each icon in DrawIO Desktop to verify rendering
5. Confirmed 100% exact matches (no fallback icons needed)

## Validated Services (112/112)

All services render correctly with exact icon matches.

> **Note:** The names shown below are raw stencil names from aws4.xml — for cross-reference and validation only. In DrawIO style strings, always use the underscore form (e.g. `kinesis_data_streams`, not `kinesis data streams`). The ⚠️ markers flag multi-word stencil names where the underscore equivalent must be used in style strings.

### Analytics (6 services)
- CloudSearch → `cloudsearch`
- Amazon EMR → `emr`
- AWS Glue → `glue`
- Amazon Kinesis → `kinesis`
- Amazon Kinesis Data Streams → `kinesis data streams` ⚠️ spaces
- QuickSight → `quicksight`

### Application Integration (9 services)
- API Gateway → `api gateway` ⚠️ spaces
- AppFlow → `appflow`
- Amazon EventBridge → `eventbridge`
- Amazon MQ → `mq`
- Amazon SNS → `sns`
- Amazon SQS → `sqs`
- AWS Step Functions → `step functions` ⚠️ spaces
- Amazon AppSync → `appsync`
- AWS AppConfig → `appconfig`

### Artificial Intelligence (11 services)
- Amazon Bedrock → `bedrock`
- SageMaker → `sagemaker`
- Amazon Lex → `lex`
- Amazon Polly → `polly`
- Amazon Rekognition → `rekognition`
- Amazon Textract → `textract`
- Amazon Comprehend → `comprehend`
- Amazon Translate → `translate`
- Amazon Transcribe → `transcribe`
- Amazon Kendra → `kendra`
- Amazon Personalize → `personalize`

### Blockchain (1 service)
- Amazon Managed Blockchain → `managed blockchain` ⚠️ spaces

### Business Applications (7 services)
- Amazon Connect → `connect`
- Amazon SES → `ses`
- Amazon Pinpoint → `pinpoint`
- Amazon WorkSpaces → `workspaces`
- Amazon Chime → `chime`
- Amazon WorkDocs → `workdocs`
- Amazon WorkMail → `workmail`

### Cloud Financial Management (3 services)
- AWS Cost Explorer → `cost explorer` ⚠️ spaces
- AWS Budgets → `budgets`
- AWS Billing → `billing`

### Compute (19 services)
- Amazon EC2 → `ec2`
- AWS Lambda → `lambda`
- Amazon Lightsail → `lightsail`
- AWS Batch → `batch`
- AWS Elastic Beanstalk → `elastic beanstalk` ⚠️ spaces
- AWS Serverless Application Repository → `serverless application repository` ⚠️ spaces
- AWS Outposts → `outposts`
- AWS Local Zones → `local zones` ⚠️ spaces
- AWS Wavelength → `wavelength`
- EC2 Image Builder → `ec2 image builder` ⚠️ spaces
- AWS App Runner → `app runner` ⚠️ spaces
- AWS Compute Optimizer → `compute optimizer` ⚠️ spaces
- AWS Nitro Enclaves → `nitro enclaves` ⚠️ spaces
- AWS ParallelCluster → `parallelcluster`
- VMware Cloud on AWS → `vmware cloud on aws` ⚠️ spaces
- AWS Thinkbox Deadline → `thinkbox deadline` ⚠️ spaces
- AWS Thinkbox Frost → `thinkbox frost` ⚠️ spaces
- AWS Thinkbox Krakatoa → `thinkbox krakatoa` ⚠️ spaces
- AWS Thinkbox Sequoia → `thinkbox sequoia` ⚠️ spaces

### Containers (9 services)
- Amazon ECS → `ecs`
- Amazon EKS → `eks`
- AWS Fargate → `fargate`
- Amazon ECR → `ecr`
- AWS App2Container → `app2container`
- Red Hat OpenShift Service on AWS → `red hat openshift` ⚠️ spaces
- AWS Copilot → `copilot`
- Amazon ECS Anywhere → `ecs anywhere` ⚠️ spaces
- Amazon EKS Anywhere → `eks anywhere` ⚠️ spaces

### Customer Enablement (4 services)
- AWS Support → `support`
- AWS Managed Services → `managed services` ⚠️ spaces
- AWS IQ → `iq`
- AWS re:Post → `repost`

### Customer Experience (1 service)
- Amazon Connect → `connect`

## Validation Statistics

- **Multi-word services (require underscores in style strings):** ~45% of services (50/112)
- **Single-word services (no difference):** ~55% of services (62/112)
- **Longest multi-word name:** 4 words (e.g., `serverless_application_repository`)

## Validation Scripts

### Validate Icon Database
```bash
python scripts/validate-aws-icons.py
```

Expected output:
```
Validating AWS icons against mxgraph.aws4 library...
✓ 112/112 icons validated (100%)
⚠ 0 services use fallback icons
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
1. **Check underscores:** Multi-word names require UNDERSCORES (`step_functions`, NOT `step functions`)
2. Verify shape code includes both parts using `resourceIcon`/`resIcon` (NOT `productIcon`/`prIcon`):
   - `shape=mxgraph.aws4.resourceIcon`
   - `resIcon=mxgraph.aws4.{shape_name}`
3. Look up exact name in `assets/aws-icons.json`
4. Ensure `vertex="1"` is present
5. Check geometry has width/height (64x64 for AWS)

### Wrong Icon Displayed
- Verify exact spelling (case-sensitive)
- Check for spaces vs underscores
- Confirm using mxgraph.aws4 (not gcp2 or azure)

### Icon Too Small/Large
- AWS standard: 64x64 pixels (larger than GCP's 50x50)
- Check `<mxGeometry>` width and height attributes
- Containers can be larger (e.g., VPC: 700x400)

## Stencil Source

The validation is based on DrawIO's official aws4.xml stencil:
- **Source:** https://raw.githubusercontent.com/jgraph/drawio/refs/heads/dev/src/main/webapp/stencils/aws4.xml
- **Local copy:** `.archive/aws4.xml` (project root)
- **Extracted shapes:** `.archive/aws4-available-shapes.txt` (1,031 total shapes)
- **Validation date:** 2026-02-14

## References

- DrawIO aws4 stencil: Built-in to DrawIO Desktop
- Validation source: github.com/jgraph/drawio aws4.xml
- Icon database: `assets/aws-icons.json`
- Validation script: `scripts/validate-aws-icons.py`
- Available shapes list: `.archive/aws4-available-shapes.txt`
