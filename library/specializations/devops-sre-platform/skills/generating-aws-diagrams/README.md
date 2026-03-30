# AWS DrawIO Diagram Generator

Generate professional DrawIO architecture diagrams for Amazon Web Services.

## Features

- **264 AWS service icons** (96.6% validated against mxgraph.aws4 library)
- **13 container/group types** (VPC, Subnet, Security Group, and more)
- **Underscore-separated naming** (`step_functions`, `api_gateway`, `kinesis_data_streams`)
- Supports analyzing existing diagrams
- Generates diagrams from text descriptions or images
- Validates against DrawIO's built-in aws4 stencil library

## CRITICAL: Icon Pattern

**Always use `resourceIcon`/`resIcon`, NEVER `productIcon`/`prIcon`:**
```
shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.{shape_name}
```

## CRITICAL: Underscore-Separated Names

**Multi-word AWS shape names use UNDERSCORES in style properties!**

```
CORRECT:                    WRONG:
- step_functions            - step functions
- api_gateway               - api gateway
- kinesis_data_streams      - kinesis data streams
- elastic_beanstalk         - elastic beanstalk
```

The aws4.xml stencil defines names with spaces, but DrawIO's style parser requires underscores.

Always verify names in `assets/aws-icons.json`.

## Quick Start

### Generate from Description

```
Create an AWS serverless architecture with:
- API Gateway for REST API
- Lambda for compute
- DynamoDB for database
- S3 for storage
- Step Functions for orchestration
- All inside a VPC
```

The skill will generate a valid `.drawio` file with proper AWS icons and layout.

### Analyze Existing Diagram

Provide a path to an existing `.drawio` file to extract:
- All AWS service shapes
- Container hierarchy (VPC, subnets, security groups)
- Connection patterns
- Style information

### Convert from Image

Upload an AWS architecture diagram image and the skill will:
- Identify AWS service icons
- Match to validated shape names (with correct spaces!)
- Recreate as editable DrawIO XML
- Provide confidence report

## Service Coverage

264 services across 24 categories. Key categories:

| Category | Services | Color |
|----------|----------|-------|
| Analytics | 20 | #8C4FFF |
| Application Integration | 10 | #E7157B |
| Artificial Intelligence | 34 | #01A88D |
| Compute | 18 | #ED7100 |
| Containers | 8 | #ED7100 |
| Databases | 10 | #C925D1 |
| Management Tools | 25 | #E7157B |
| Networking & Content Delivery | 18 | #8C4FFF |
| Security & Identity | 27 | #DD344C |
| Storage | 14 | #3F8624 |

**Full list:** See `assets/aws-icons.json` for all services with exact shape names.

## Container Types

| Container | Description | Border/Fill Color |
|-----------|-------------|-------------------|
| `aws_cloud` | Top-level AWS Cloud boundary | Gray border |
| `aws_region` | Region grouping | Teal border |
| `aws_availability_zone` | Availability Zone grouping | Teal dashed border |
| `aws_vpc` | VPC boundary | Purple border |
| `aws_public_subnet` | Public subnet | Green filled |
| `aws_private_subnet` | Private subnet | Blue filled |
| `aws_security_group` | Security group boundary | Red filled |
| `aws_auto_scaling_group` | Auto scaling group | Orange filled |
| `aws_account` | AWS Account boundary | Pink border |
| `aws_corporate_datacenter` | Corporate datacenter | Gray |
| `aws_generic_group` | Generic grouping | Gray border |
| `aws_step_functions_workflow` | Step Functions workflow | Green |
| `aws_elastic_beanstalk_container` | Elastic Beanstalk app | Orange |

## Design Guidelines

### Icon Specifications
- **Size:** 64x64 pixels
- **Spacing:** 120px between icons
- **Font color:** `#232F3E` universally (AWS dark gray)
- **Stencil library:** `mxgraph.aws4`

### Fill Colors by Category
- Analytics: `#8C4FFF` (purple)
- Application Integration: `#E7157B` (pink)
- AI: `#01A88D` (teal)
- Compute/Containers: `#ED7100` (orange)
- Databases: `#C925D1` (purple)
- Security: `#DD344C` (red)
- Storage: `#3F8624` (green)

### Best Practices
- Use VPC container for network boundaries
- Group by subnets (public/private)
- Apply security group containers for firewall rules
- Use consistent connection styles (2pt open arrow, `#232F3E`)
- Keep diagrams focused (max 15-20 icons per diagram)

**Complete guidelines:** See `references/DIAGRAM-BEST-PRACTICES.md`

## Validation & Export

### Validate Generated Diagrams
```bash
python scripts/validate-drawio.py output.drawio --verbose
```

### Check Icon Compatibility
```bash
python scripts/validate-aws-icons.py
```

### Export to PNG/PDF
```bash
./scripts/export-diagram.sh output.drawio png
```

### Open in DrawIO Desktop
```bash
./scripts/open-diagram.sh output.drawio
```

Requires DrawIO Desktop: `brew install drawio`

## File Structure

```
generating-aws-diagrams/
├── SKILL.md                    # Main skill instructions
├── README.md                   # This file
├── assets/
│   ├── aws-icons.json          # 264 AWS services
│   ├── aws-containers.json     # 13 container types
│   └── templates/              # XML templates
├── references/
│   ├── DIAGRAM-BEST-PRACTICES.md
│   ├── xml-examples.md
│   ├── xml-parser-guide.md
│   ├── coordinate-system.md
│   └── style-guide.md
└── scripts/
    ├── validate-drawio.py      # Generic validation
    ├── validate-aws-icons.py   # AWS-specific validation
    ├── fix-aws-icons.py        # Auto-fix shape names
    ├── analyze-existing.py     # Extract shapes/connections
    └── ...
```

## Version

- **Provider:** AWS
- **Stencil library:** mxgraph.aws4
- **Services:** 264
- **Validation:** 96.6% (255/264 exact matches)
- **Categories:** 24
