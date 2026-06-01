# Project Deployment — Install Instructions

Set up deployment infrastructure, CI/CD pipelines, and cloud provisioning for your project using babysitter's devops-sre-platform process library. Supports any cloud provider, stack, and deployment strategy — from full Terraform+K8s+Helm to simple Vercel/Cloudflare+Supabase.

## Step 1: Interview the User

Conduct a thorough interview to understand the deployment requirements. Ask in stages:

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Read `package.json`, `requirements.txt`, `go.mod`, `Cargo.toml`, or equivalent to understand the stack
2. Check for existing deployment config: `Dockerfile`, `docker-compose.yml`, `.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`, `vercel.json`, `wrangler.toml`, `terraform/`, `k8s/`, `helm/`
3. Check for existing CI/CD: `.github/workflows/`, `.circleci/`, `.gitlab-ci.yml`
4. Summarize findings to the user before proceeding

### Stage 2: Deployment Approach

Ask the user which deployment approach fits their project:

1. **Enterprise Cloud (Terraform + Kubernetes + Helm)** — Full IaC with container orchestration. Best for production workloads needing auto-scaling, HA, and multi-environment support. Emphasizes one of AWS/GCP/Azure.
2. **Managed Platform (Vercel/Cloudflare Pages + Supabase/Neon)** — Zero-ops deployment for web apps and APIs. Best for startups, side projects, and frontend-heavy apps.
3. **Container-based (Docker + managed container service)** — Docker containers on ECS, Cloud Run, Azure Container Apps, or Fly.io. Middle ground between full K8s and managed platforms.
4. **Serverless (Lambda/Cloud Functions/Azure Functions)** — Event-driven, pay-per-use. Best for APIs, webhooks, and background jobs.
5. **Custom/Hybrid** — Mix of approaches. User will specify.

### Stage 3: Cloud Provider (if Enterprise or Container approach)

1. **AWS** (recommended for enterprise) — EKS, ECR, RDS, S3, CloudFront, Route53, CodePipeline
2. **Google Cloud Platform** — GKE, Artifact Registry, Cloud SQL, Cloud CDN, Cloud DNS
3. **Microsoft Azure** — AKS, ACR, Azure SQL, Azure CDN, Azure DNS, Azure DevOps
4. **Multi-cloud** — Terraform-managed across providers

### Stage 4: CI/CD Platform

1. **GitHub Actions** (recommended) — Native GitHub integration, free for public repos
2. **GitLab CI/CD** — Built into GitLab, powerful pipelines
3. **Jenkins** — Self-hosted, highly customizable
4. **CircleCI** — Cloud-native, fast builds
5. **AWS CodePipeline / Azure DevOps** — Cloud-native CI/CD
6. **None yet** — Set up from scratch

### Stage 5: Environment Strategy

Ask the user:
- How many environments? (default: `dev`, `staging`, `production`)
- Branch-to-environment mapping? (default: `main` → production, `staging` → staging, feature branches → dev)
- Do you need preview/ephemeral environments for PRs? (default: yes for managed platforms, no for K8s)
- DNS and domain configuration needed? (default: yes)
- SSL/TLS certificate management? (default: auto via Let's Encrypt or cloud provider)

### Stage 6: Additional Options

- Secrets management strategy? (environment variables, HashiCorp Vault, AWS Secrets Manager, cloud-native)
- Monitoring and observability? (Prometheus+Grafana, Datadog, CloudWatch, cloud-native)
- Auto-scaling configuration? (HPA for K8s, or platform-managed)
- Database deployment? (managed service, self-hosted, or already exists)
- CDN and edge caching? (CloudFront, Cloudflare, Fastly)

## Step 2: Copy Relevant Processes from Library

Based on the interview answers, copy the appropriate process files from the babysitter library to the project.

### Source directory:
```
plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/
```

### For Enterprise Cloud (Terraform + K8s + Helm):

```bash
mkdir -p .a5c/processes/deployment

# Core infrastructure
cp plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/iac-implementation.js .a5c/processes/deployment/
cp plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/iac-testing.js .a5c/processes/deployment/
cp plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/kubernetes-setup.js .a5c/processes/deployment/
cp plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/container-image-management.js .a5c/processes/deployment/

# CI/CD
cp plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/cicd-pipeline-setup.js .a5c/processes/deployment/
cp plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/pipeline-optimization.js .a5c/processes/deployment/

# Production readiness
cp plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/cloud-ha-architecture-plan.js .a5c/processes/deployment/
cp plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/auto-scaling.js .a5c/processes/deployment/
cp plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/secrets-management.js .a5c/processes/deployment/
cp plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/monitoring-setup.js .a5c/processes/deployment/
```

Also copy the relevant skills:
```bash
mkdir -p .a5c/skills/deployment

# Copy cloud-specific skill
# For AWS:
cp -r plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/skills/aws-cloud .a5c/skills/deployment/
# For GCP:
cp -r plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/skills/gcp-cloud .a5c/skills/deployment/
# For Azure:
cp -r plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/skills/azure-cloud .a5c/skills/deployment/

# Copy shared skills
cp -r plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/skills/terraform-iac .a5c/skills/deployment/
cp -r plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/skills/kubernetes-ops .a5c/skills/deployment/
cp -r plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/skills/helm-charts .a5c/skills/deployment/
cp -r plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/skills/cicd-pipelines .a5c/skills/deployment/
cp -r plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/skills/secrets-management .a5c/skills/deployment/
cp -r plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/skills/gitops .a5c/skills/deployment/
```

### For Managed Platform (Vercel/Cloudflare + Supabase):

```bash
mkdir -p .a5c/processes/deployment

# CI/CD pipeline (simplified)
cp plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/cicd-pipeline-setup.js .a5c/processes/deployment/

# Monitoring (lightweight)
cp plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/monitoring-setup.js .a5c/processes/deployment/
```

No IaC or K8s processes needed — the platform handles infrastructure. The install instructions should guide the user to:
1. Create `vercel.json` or `wrangler.toml` for the platform
2. Configure environment variables in the platform dashboard
3. Set up Supabase/Neon for database
4. Configure the CI/CD pipeline for preview deployments and production promotion

### For Container-based:

```bash
mkdir -p .a5c/processes/deployment

cp plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/container-image-management.js .a5c/processes/deployment/
cp plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/cicd-pipeline-setup.js .a5c/processes/deployment/
cp plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/monitoring-setup.js .a5c/processes/deployment/
cp plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/auto-scaling.js .a5c/processes/deployment/

cp -r plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/skills/container-images .a5c/skills/deployment/
cp -r plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/skills/cicd-pipelines .a5c/skills/deployment/
```

### For Serverless:

```bash
mkdir -p .a5c/processes/deployment

cp plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/cicd-pipeline-setup.js .a5c/processes/deployment/
cp plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/monitoring-setup.js .a5c/processes/deployment/
cp plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/secrets-management.js .a5c/processes/deployment/
```

### From code-migration-modernization (if migrating to cloud):

```bash
# If the project is being migrated from on-prem or between clouds
cp plugins/babysitter/skills/babysit/process/specializations/code-migration-modernization/cloud-migration.js .a5c/processes/deployment/
cp plugins/babysitter/skills/babysit/process/specializations/code-migration-modernization/containerization.js .a5c/processes/deployment/
```

## Step 3: Copy Agents

Copy relevant agents based on the deployment approach:

```bash
mkdir -p .a5c/agents/deployment

# For any approach — general devops agents
# Check what agents exist at the source path:
ls plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/agents/

# Copy relevant ones, e.g.:
cp -r plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/agents/* .a5c/agents/deployment/
```

## Step 4: Generate Deployment Configuration Files

Based on the interview, generate the appropriate configuration files. This step is approach-dependent:

### Enterprise Cloud (Terraform + K8s + Helm):

1. **Terraform files** — `terraform/main.tf`, `terraform/variables.tf`, `terraform/outputs.tf`, `terraform/environments/dev.tfvars`, `terraform/environments/staging.tfvars`, `terraform/environments/production.tfvars`
2. **Kubernetes manifests** or **Helm chart** — `k8s/` or `helm/<chart-name>/`
3. **Dockerfile** (if not present) — multi-stage build optimized for production
4. **CI/CD pipeline** — `.github/workflows/deploy.yml` or equivalent

### Managed Platform:

1. **Platform config** — `vercel.json`, `wrangler.toml`, or equivalent
2. **Database config** — Supabase/Neon connection setup
3. **CI/CD pipeline** — `.github/workflows/deploy.yml` with preview and production stages

### Container-based:

1. **Dockerfile** — multi-stage, optimized
2. **docker-compose.yml** — for local dev parity
3. **CI/CD pipeline** — build, push, deploy stages

### Serverless:

1. **Serverless config** — `serverless.yml`, SAM template, or equivalent
2. **CI/CD pipeline** — deploy to functions

## Step 5: Run Initial Deployment Process

After copying the relevant processes and generating config files, run the appropriate babysitter process to validate and refine the deployment setup:

```bash
# For enterprise cloud — run the HA architecture planning process
babysitter run:create \
  --process-id project-deployment-setup \
  --entry .a5c/processes/deployment/cloud-ha-architecture-plan.js#process \
  --prompt "Set up deployment infrastructure for this project" \
  --json

# For any approach — run the CI/CD pipeline setup process
babysitter run:create \
  --process-id cicd-pipeline-setup \
  --entry .a5c/processes/deployment/cicd-pipeline-setup.js#process \
  --prompt "Set up CI/CD pipeline for this project" \
  --json
```

This validates the generated configuration against the process library's quality gates and best practices.

## Step 6: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name project-deployment --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 7: Verify Setup

1. Review generated configuration files
2. Validate Terraform plan (if applicable): `terraform plan -var-file=environments/dev.tfvars`
3. Validate Kubernetes manifests (if applicable): `kubectl apply --dry-run=client -f k8s/`
4. Validate CI/CD pipeline syntax
5. Run a test deployment to dev environment (if infrastructure exists)
6. Confirm monitoring and alerting are configured

## Reference

- Process library: `plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/`
- Skills: `plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/skills/`
- Cloud migration: `plugins/babysitter/skills/babysit/process/specializations/code-migration-modernization/`
- Example inputs: `plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/examples/`
