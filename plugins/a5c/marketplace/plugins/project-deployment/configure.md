# Project Deployment — Configuration

## 1. Switch Cloud Provider

To migrate between cloud providers, copy the relevant cloud-specific skill and processes:

```bash
# Example: switch from AWS to GCP
rm -rf .a5c/skills/deployment/aws-cloud
cp -r plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/skills/gcp-cloud .a5c/skills/deployment/

# Update Terraform provider blocks accordingly
```

Run the cloud migration process if needed:
```bash
cp plugins/babysitter/skills/babysit/process/specializations/code-migration-modernization/cloud-migration.js .a5c/processes/deployment/
```

## 2. Add/Remove Environments

Edit the Terraform variable files or platform configuration to add/remove environments:

- Add new `terraform/environments/<env>.tfvars` files
- Update CI/CD pipeline to include new environment stages
- Configure branch-to-environment mapping in the pipeline

## 3. Add Monitoring and Observability

Copy additional processes from the library:

```bash
cp plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/monitoring-setup.js .a5c/processes/deployment/
cp plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/log-aggregation.js .a5c/processes/deployment/
cp plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/slo-sli-tracking.js .a5c/processes/deployment/

cp -r plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/skills/prometheus-grafana .a5c/skills/deployment/
cp -r plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/skills/log-analysis .a5c/skills/deployment/
```

## 4. Add Disaster Recovery

```bash
cp plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/disaster-recovery-plan.js .a5c/processes/deployment/
cp plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/backup-restore-automation.js .a5c/processes/deployment/
```

## 5. Add Cost Optimization

```bash
cp plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/cost-optimization.js .a5c/processes/deployment/
cp -r plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/skills/cloud-cost-analysis .a5c/skills/deployment/
```

## 6. Add Service Mesh

```bash
cp plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/service-mesh.js .a5c/processes/deployment/
cp -r plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/skills/service-mesh .a5c/skills/deployment/
```

## 7. Add Incident Response

```bash
cp plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/incident-response.js .a5c/processes/deployment/
cp plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/oncall-setup.js .a5c/processes/deployment/
cp -r plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/skills/incident-platforms .a5c/skills/deployment/
```

## 8. Optimize CI/CD Pipeline

Run the pipeline optimization process:
```bash
cp plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/pipeline-optimization.js .a5c/processes/deployment/

babysitter run:create \
  --process-id pipeline-optimization \
  --entry .a5c/processes/deployment/pipeline-optimization.js#process \
  --prompt "Optimize the CI/CD pipeline for faster builds and deployments" \
  --json
```

## 9. Switch Deployment Approach

To switch from one approach to another (e.g., managed platform → K8s), re-run the install process with the new approach selection. Existing configuration will be preserved — the new processes and skills will be added alongside.

## Reference

All available processes and skills:
```bash
# List all devops processes
ls plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/*.js

# List all devops skills
ls plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/skills/

# List all devops agents
ls plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/agents/
```
