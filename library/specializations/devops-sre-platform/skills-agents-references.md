# DevOps, SRE, and Platform Engineering - Skills and Agents References

This document provides links to community-created Claude skills, agents, plugins, and MCP (Model Context Protocol) servers that can be used to implement or enhance the skills and agents identified in the backlog for this specialization.

---

## Table of Contents

1. [Overview](#overview)
2. [Kubernetes & Container Orchestration](#kubernetes--container-orchestration)
3. [Infrastructure as Code (Terraform/IaC)](#infrastructure-as-code-terraformiac)
4. [Monitoring & Observability](#monitoring--observability)
5. [CI/CD Pipelines](#cicd-pipelines)
6. [Container & Image Management](#container--image-management)
7. [Secrets Management](#secrets-management)
8. [Service Mesh](#service-mesh)
9. [GitOps (ArgoCD/Flux)](#gitops-argocdflux)
10. [Cloud Providers - AWS](#cloud-providers---aws)
11. [Cloud Providers - GCP](#cloud-providers---gcp)
12. [Cloud Providers - Azure](#cloud-providers---azure)
13. [Incident Management](#incident-management)
14. [Log Analysis & Aggregation](#log-analysis--aggregation)
15. [SRE & Reliability Engineering](#sre--reliability-engineering)
16. [Helm Charts](#helm-charts)
17. [General DevOps Collections](#general-devops-collections)
18. [Summary](#summary)

---

## Overview

This reference document maps community resources to the skills and agents identified in the [skills-agents-backlog.md](./skills-agents-backlog.md). The resources include:

- **MCP Servers**: Model Context Protocol servers that enable Claude to interact with external tools
- **Claude Skills**: Packaged capabilities for Claude Code
- **Plugins**: Extensions for Claude Code functionality
- **Agents**: Specialized AI agents for specific domains

### Resource Status Legend
- Active - Actively maintained and recommended
- Official - Official vendor/maintainer supported
- Community - Community maintained
- Preview - In preview/beta status

---

## Kubernetes & Container Orchestration

**Backlog Reference**: SK-001 (kubernetes-ops), AG-001 (kubernetes-expert)

### MCP Servers

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **mcp-server-kubernetes** (Flux159) | MCP Server for Kubernetes management commands. Supports kubectl operations, pod logs, resource CRUD. Install via `claude mcp add kubernetes -- npx mcp-server-kubernetes` | [GitHub](https://github.com/Flux159/mcp-server-kubernetes) | Active |
| **kubernetes-mcp-server** (containers) | Go-based native implementation interacting directly with Kubernetes API. No kubectl dependency required. | [GitHub](https://github.com/containers/kubernetes-mcp-server) | Active |
| **Kubernetes Claude MCP Server** (Blank Cut) | Bridge between Kubernetes operations and Claude AI with GitOps integration. Non-destructive mode available. | [PulseMCP](https://www.pulsemcp.com/servers/blankcut-kubernetes-claude) | Active |
| **Kubiya Skill Runtime** | Universal skill runtime for Kubernetes with natural language tool discovery. Works via CLI or MCP protocol. | [GitHub](https://github.com/kubiyabot/skill) | Active |

### Claude Skills

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **kubernetes-deployment** | Create and manage K8s manifests, Helm charts, validate with kubectl dry-run | [Claude Plugins](https://claude-plugins.dev/skills/@Conte777/config_for_claude_code/kubernetes-deployment) | Community |
| **kubernetes** (jotka) | DevOps skills for Kubernetes operations | [Claude Plugins](https://claude-plugins.dev/skills/@jotka/claude-devops-skills/kubernetes) | Community |
| **kubernetes-ops** | K8s operations plugin with 4 deployment skills | [MCP Market](https://mcpmarket.com/tools/skills/kubernetes-ops) | Community |

---

## Infrastructure as Code (Terraform/IaC)

**Backlog Reference**: SK-002 (terraform-iac), AG-003 (infra-architect)

### MCP Servers

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **AWS IaC MCP Server** | Official AWS server for CloudFormation and CDK. Template validation, compliance checks, deployment troubleshooting. | [AWS Labs](https://awslabs.github.io/mcp/servers/aws-iac-mcp-server) | Official |
| **terraform-skill** (antonbabenko) | Comprehensive Terraform/OpenTofu guidance. Testing strategies, module patterns, CI/CD workflows, production-ready IaC. v1.5.0 | [GitHub](https://github.com/antonbabenko/terraform-skill) | Active |

### Key Capabilities
- Execute terraform plan/apply/destroy with analysis
- Validate HCL syntax and best practices
- GitHub Actions and GitLab CI workflow templates
- Cost estimation and security scanning integration
- Support for AWS, GCP, Azure providers
- Pulumi and CloudFormation awareness

---

## Monitoring & Observability

**Backlog Reference**: SK-003 (prometheus-grafana), SK-006 (log-analysis), AG-006 (observability-expert)

### MCP Servers

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **mcp-grafana** (Grafana Labs) | Official Grafana MCP server. Query Prometheus metadata, Loki logs, manage dashboards. Read-only mode available. | [GitHub](https://github.com/grafana/mcp-grafana) | Official |
| **loki-mcp** (Grafana) | Go-based MCP server for Grafana Loki integration. LogQL queries and log analysis. | [GitHub](https://github.com/grafana/loki-mcp) | Official |
| **loki-mcp-server** (mo-silent) | MCP server for intelligent log analysis, troubleshooting, and monitoring workflows with Loki. | [GitHub](https://github.com/mo-silent/loki-mcp-server) | Community |
| **claude-code-otel** | Comprehensive observability solution for monitoring Claude Code usage, performance, and costs using OpenTelemetry. | [GitHub](https://github.com/ColeMurray/claude-code-otel) | Community |

### Claude Skills

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **grafana-dashboard-engineer** | Grafana dashboards skill for observability AI | [MCP Market](https://mcpmarket.com/tools/skills/grafana-dashboard-engineer) | Community |

### Integration Notes
- Grafana MCP supports PromQL queries, metric metadata, alerting rules
- Loki MCP enables LogQL queries, log patterns, anomaly detection
- OpenTelemetry integration for full-stack observability

---

## CI/CD Pipelines

**Backlog Reference**: SK-004 (cicd-pipelines), AG-005 (cicd-specialist)

### Official Integrations

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **Claude Code GitHub Actions** | Official Anthropic GitHub Actions integration. PR reviews, test scaffolding, CI/CD automation. | [Documentation](https://code.claude.com/docs/en/gitlab-ci-cd) | Official |
| **claude-code-for-gitlab** | GitLab CI/CD integration with native support, self-hosted compatibility, webhook service. | [GitHub](https://github.com/RealMikeChong/claude-code-for-gitlab) | Community |
| **claude-code-action-gitlab** | GitLab CI/CD action implementation | [GitHub](https://github.com/bamps53/claude-code-action-gitlab) | Community |

### MCP Servers

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **Azure DevOps MCP** (Microsoft) | Official Azure DevOps MCP server. Works with VS 2022, Claude Code, Cursor. | [GitHub](https://github.com/microsoft/azure-devops-mcp) | Official |
| **azure-devops-mcp** (rxreyn3) | Query agent status, manage queues, troubleshoot build farm issues. | [GitHub](https://github.com/rxreyn3/azure-devops-mcp) | Community |
| **github-mcp-server** (GitHub) | Official GitHub MCP server for repository operations, PR management, issues. | [GitHub](https://github.com/github/github-mcp-server) | Official |

### Key Features
- Headless mode (`-p` flag) for CI/CD integration
- Matrix builds and parallelization
- Pipeline failure analysis
- Artifact caching strategies
- Multi-platform support (GitHub Actions, GitLab CI, Jenkins, Azure Pipelines)

---

## Container & Image Management

**Backlog Reference**: SK-007 (container-images)

### MCP Servers

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **docker-mcp** (QuantGeekDev) | Docker operations MCP server for container and compose stack management. | [GitHub](https://github.com/QuantGeekDev/docker-mcp) | Active |
| **claude-docker-mcp-server** (FrenshGeek) | Comprehensive Docker Desktop control through MCP. Full Docker management capabilities. | [GitHub](https://github.com/FrenshGeek/claude-docker-mcp-server) | Community |
| **claude-code-mcp-docker** (akr4) | Docker container for Claude Code MCP with network firewall security. | [GitHub](https://github.com/akr4/claude-code-mcp-docker) | Community |
| **Docker MCP Toolkit** | 200+ pre-built containerized MCP servers with one-click deployment in Docker Desktop. | [Docker Blog](https://www.docker.com/blog/add-mcp-servers-to-claude-code-with-mcp-toolkit/) | Official |

### Claude Code Docker Runners

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **run-claude-docker** | Self-contained Docker runner with workspace forwarding, SSH agent, AWS keys access. | [GitHub](https://github.com/icanhasjonas/run-claude-docker) | Community |
| **claude-docker** (VishalJ99) | Containerized Claude Code with --dangerously-skip-permissions mode, GPU access, MCP servers pre-configured. | [GitHub](https://github.com/VishalJ99/claude-docker) | Community |
| **viwo-cli** | Run Claude Code in Docker with git worktrees as volume mounts. | [GitHub](https://github.com/OverseedAI/viwo) | Community |
| **container-use** (Dagger) | Development environments for coding agents with isolation. | [GitHub](https://github.com/dagger/container-use) | Active |

---

## Secrets Management

**Backlog Reference**: SK-008 (secrets-management), AG-004 (secops-expert)

### MCP Servers

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **claude-vault-mcp** | HashiCorp Vault integration for Claude Code. Tokenizes secrets so AI never sees real values. WebAuthn human-in-the-loop validation. | [PyPI](https://libraries.io/pypi/claude-vault-mcp) | Community |

### Key Features
- Secret migration from .env files to Vault
- TOKEN system (AI sees `@token-abc123` instead of actual secrets)
- TouchID/WebAuthn approval for writes
- Full audit trail
- Support for HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, GCP Secret Manager

---

## Service Mesh

**Backlog Reference**: SK-009 (service-mesh)

### Resources

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **Kubernetes MCP Servers** | General K8s MCP servers can manage Istio/Linkerd resources as K8s custom resources | See [Kubernetes section](#kubernetes--container-orchestration) | Active |

### Notes
- No dedicated Istio or Linkerd MCP servers found
- Service mesh configuration typically handled through Kubernetes MCP servers
- VirtualService, DestinationRule, ServiceProfile managed as K8s resources
- Consider using kubernetes-mcp-server for mTLS and traffic policies

---

## GitOps (ArgoCD/Flux)

**Backlog Reference**: SK-010 (gitops)

### MCP Servers

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **mcp-for-argocd** (Akuity/Argoproj Labs) | Official Argo CD MCP server. Natural language interaction, stdio and HTTP transport, complete API integration. | [GitHub](https://github.com/akuity/argocd-mcp) | Official |
| **Flux MCP Server** | AI-assisted GitOps with Flux. Debug pipelines, root cause analysis, cluster comparison, dependency visualization. | [Medium Article](https://medium.com/@stefanprodan/ai-assisted-gitops-with-flux-mcp-server-cacb358c7c20) | Active |
| **Kubernetes-Claude MCP** (Blank Cut) | Integrates Claude with K8s, ArgoCD, and GitLab for GitOps workflow analysis. | [PulseMCP](https://www.pulsemcp.com/servers/blankcut-kubernetes-claude) | Community |

### Key Capabilities
- Argo CD Application manifest management
- Flux GitRepository and Kustomization
- Sync policies and drift detection
- Multi-cluster GitOps setup
- SOPS/Sealed Secrets integration

---

## Cloud Providers - AWS

**Backlog Reference**: SK-011 (aws-cloud)

### MCP Servers

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **AWS MCP Servers** (awslabs) | Official AWS MCP collection. CDK, CloudFormation, Cost Explorer, Pricing, Knowledge bases. | [GitHub](https://github.com/awslabs/mcp) | Official |
| **AWS IaC MCP Server** | CDK best practices, CloudFormation validation, cfn-lint, Guard rules compliance. | [AWS DevOps Blog](https://aws.amazon.com/blogs/devops/introducing-the-aws-infrastructure-as-code-mcp-server-ai-powered-cdk-and-cloudformation-assistance/) | Official |
| **AWS Cloud Control API MCP** | Natural language infrastructure management on AWS. | [AWS DevOps Blog](https://aws.amazon.com/blogs/devops/introducing-aws-cloud-control-api-mcp-server-natural-language-infrastructure-management-on-aws/) | Official |
| **aws-mcp-server** (alexei-led) | Lightweight AWS CLI execution through MCP in safe containerized environment. | [GitHub](https://github.com/alexei-led/aws-mcp-server) | Community |
| **aws-mcp** (RafalWilinski) | Talk with AWS using Claude. Better Amazon Q alternative. | [GitHub](https://github.com/RafalWilinski/aws-mcp) | Community |

### Claude Skills

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **aws-skills** (zxkane) | AWS development with CDK best practices, cost optimization, serverless patterns. | [GitHub](https://github.com/zxkane/aws-skills) | Community |
| **aws-agent-skills** | 18 AWS service skills (IAM, Lambda, DynamoDB, S3, EKS, CloudFormation, CloudWatch, etc.). Token-efficient, weekly updated. | [GitHub](https://github.com/itsmostafa/aws-agent-skills) | Active |

### Installation
```bash
# AWS MCP Servers
claude mcp add awslabs.cdk-mcp-server
claude mcp add awslabs.cfn-mcp-server

# AWS Agent Skills
/plugin install aws-agent-skills
```

---

## Cloud Providers - GCP

**Backlog Reference**: SK-012 (gcp-cloud)

### MCP Servers

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **gcloud-mcp** (googleapis) | Official Google Cloud MCP server. Natural language gcloud CLI interaction. | [GitHub](https://github.com/googleapis/gcloud-mcp) | Official/Preview |
| **gke-mcp** (GoogleCloudPlatform) | Official GKE MCP server. AI-optimized cluster creation, manifest generation, upgrade risk reports. | [GitHub](https://github.com/GoogleCloudPlatform/gke-mcp) | Official |
| **gcp-mcp** (eniayomi) | Natural language GCP resource management. Lists GKE clusters, manages projects. | [GitHub](https://github.com/eniayomi/gcp-mcp) | Community |
| **google-cloud-mcp** (krzko) | GCP MCP server with service account authentication support. | [GitHub](https://github.com/krzko/google-cloud-mcp) | Community |
| **GKE Remote MCP Server** | Google Cloud hosted MCP server for GKE. Enable via `gcloud beta services mcp enable`. | [Google Cloud Docs](https://docs.cloud.google.com/kubernetes-engine/docs/how-to/use-gke-mcp) | Official |

### Key Features
- gcloud CLI natural language interface
- GKE cluster management and AI workload optimization
- Cloud Build pipeline integration
- Logging Query Language (LQL) support
- Upgrade risk analysis

---

## Cloud Providers - Azure

**Backlog Reference**: SK-013 (azure-cloud)

### MCP Servers

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **aks-mcp** (Azure) | Official AKS MCP server. Bridge between AI tools and Azure Kubernetes Service. AppLens Detector, Resource Health monitoring. | [GitHub](https://github.com/Azure/aks-mcp) | Official |
| **azure-mcp** (kalivaraprasad-gonapa) | Azure services interaction through Claude Desktop. Natural language resource management. | [GitHub](https://github.com/kalivaraprasad-gonapa/azure-mcp) | Community |
| **azure-devops-mcp** (Microsoft) | Official Azure DevOps MCP. Works with VS 2022, Claude Code, Cursor. | [GitHub](https://github.com/microsoft/azure-devops-mcp) | Official |
| **mcp-server-azure-devops** (Tiberriver256) | Alternative Azure DevOps MCP implementation. | [GitHub](https://github.com/Tiberriver256/mcp-server-azure-devops) | Community |

### Installation
- VS Code: Azure Kubernetes Service Extension (includes AKS-MCP)
- Docker MCP Hub
- GitHub MCP Registry

---

## Incident Management

**Backlog Reference**: SK-014 (incident-platforms), AG-007 (incident-commander)

### MCP Servers

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **PagerDuty MCP Server** | Official PagerDuty MCP integration. Hosted at mcp.pagerduty.com/mcp or self-hosted. Incident data, service management, on-call schedules. | [PagerDuty Docs](https://support.pagerduty.com/main/docs/pagerduty-mcp-server-integration-guide) | Official |
| **OpsGenie MCP Server** | Search alerts, close/acknowledge alerts, create alerts with priority levels. Note: OpsGenie shutting down April 2027. | [MCPlane](https://mcplane.com/mcp_servers/mcp-opsgenie) | Community |

### Key Features
- Incident creation and updates
- On-call schedule management
- Alert search and management
- Escalation policy configuration
- Postmortem template generation

---

## Log Analysis & Aggregation

**Backlog Reference**: SK-006 (log-analysis)

### MCP Servers

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **mcp-server-elasticsearch** (Elastic) | Official Elasticsearch MCP server. Docker image at docker.elastic.co. ES 8.x and 9.x support. | [GitHub](https://github.com/elastic/mcp-server-elasticsearch) | Official |
| **elasticsearch-mcp-server** (cr7258) | Elasticsearch and OpenSearch interaction. Full DSL support, aggregations, CSV export. | [GitHub](https://github.com/cr7258/elasticsearch-mcp-server) | Community |
| **loki-mcp** (Grafana) | Official Grafana Loki MCP server. | [GitHub](https://github.com/grafana/loki-mcp) | Official |
| **loki-mcp-server** (mo-silent) | Intelligent log analysis with Loki integration. | [GitHub](https://github.com/mo-silent/loki-mcp-server) | Community |

### Key Features
- Full Elasticsearch DSL support with aggregations
- LogQL queries for Loki
- Log pattern detection and anomaly identification
- Data export to CSV
- Smart validation with Zod schemas

---

## SRE & Reliability Engineering

**Backlog Reference**: AG-002 (sre-expert), SK-003 (prometheus-grafana) for SLO tracking

### Claude Skills

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **SLA & SLI Tracker** | Define and track SLAs, SLIs, and SLOs. Structured framework for service health monitoring. | [MCP Market](https://mcpmarket.com/tools/skills/service-reliability-sla-tracker) | Community |
| **Service Reliability SLA Tracker** | Variant with additional reliability metrics tracking. | [MCP Market](https://mcpmarket.com/tools/skills/service-reliability-sla-tracker-1) | Community |

### Integration with Monitoring
- Use Grafana MCP for SLO dashboard creation
- Prometheus queries for SLI measurement
- Error budget calculation via metrics

---

## Helm Charts

**Backlog Reference**: SK-005 (helm-charts)

### Claude Skills

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **helm-chart-scaffolding** (wshobson/agents) | Comprehensive Helm chart creation, organization, and management guidance. | [Claude Plugins](https://claude-plugins.dev/skills/@wshobson/agents/helm-chart-scaffolding) | Community |
| **kubernetes-deployment** | Includes Helm chart management alongside K8s manifests. | [Claude Plugins](https://claude-plugins.dev/skills/@Conte777/config_for_claude_code/kubernetes-deployment) | Community |

### Notes
- Kubernetes MCP servers can execute `helm` commands
- Helm operations available via mcp-server-kubernetes (Flux159)

---

## General DevOps Collections

### Curated Lists

| Resource | Description | URL |
|----------|-------------|-----|
| **awesome-claude-code** | Curated list of skills, hooks, slash-commands, agent orchestrators for Claude Code. | [GitHub](https://github.com/hesreallyhim/awesome-claude-code) |
| **awesome-claude-skills** (ComposioHQ) | Community-curated Claude skills collection. | [GitHub](https://github.com/ComposioHQ/awesome-claude-skills) |
| **awesome-claude-skills** (VoltAgent) | Another collection of Claude Skills and resources. | [GitHub](https://github.com/VoltAgent/awesome-claude-skills) |
| **awesome-claude-code-plugins** (ccplugins) | Collection of Claude Code plugins including DevOps automators. | [GitHub](https://github.com/ccplugins/awesome-claude-code-plugins) |
| **claude-skills** (alirezarezvani) | Real-world Claude Code skills including subagents and commands. | [GitHub](https://github.com/alirezarezvani/claude-skills) |

### DevOps Plugins (ccplugins)

| Plugin | Description |
|--------|-------------|
| **deployment-engineer** | Deploy applications and manage releases across environments |
| **devops-automator** | Streamlines infrastructure automation and deployment workflows |
| **infrastructure-maintainer** | Infrastructure management, provisioning, and maintenance |
| **monitoring-observability-specialist** | System monitoring, logging, and observability setup |
| **backend-architect** | Scalable backend systems and infrastructure patterns |

### Multi-Agent Orchestration

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **agents** (wshobson) | Intelligent automation and multi-agent orchestration for Claude Code. 26.6k stars. | [GitHub](https://github.com/wshobson/agents) | Active |
| **claudekit-skills** (mrgoonie) | All powerful skills of ClaudeKit.cc | [GitHub](https://github.com/mrgoonie/claudekit-skills) | Community |

---

## Summary

### Statistics

| Category | Resources Found |
|----------|-----------------|
| Kubernetes & Containers | 7 |
| Infrastructure as Code | 2 |
| Monitoring & Observability | 5 |
| CI/CD Pipelines | 6 |
| Container/Image Management | 7 |
| Secrets Management | 1 |
| Service Mesh | 0 (use K8s MCP) |
| GitOps | 3 |
| AWS Cloud | 7 |
| GCP Cloud | 5 |
| Azure Cloud | 4 |
| Incident Management | 2 |
| Log Analysis | 4 |
| SRE/Reliability | 2 |
| Helm Charts | 2 |
| General Collections | 10 |
| **Total** | **67** |

### Backlog Coverage

| Skill/Agent ID | Coverage | Primary Resources |
|----------------|----------|-------------------|
| SK-001 kubernetes-ops | Excellent | mcp-server-kubernetes, kubernetes-mcp-server, Blank Cut |
| SK-002 terraform-iac | Good | terraform-skill, AWS IaC MCP |
| SK-003 prometheus-grafana | Excellent | mcp-grafana, loki-mcp |
| SK-004 cicd-pipelines | Excellent | GitHub Actions, GitLab CI, Azure DevOps MCP |
| SK-005 helm-charts | Good | helm-chart-scaffolding, kubernetes MCP |
| SK-006 log-analysis | Excellent | elasticsearch-mcp, loki-mcp |
| SK-007 container-images | Excellent | docker-mcp, Docker MCP Toolkit |
| SK-008 secrets-management | Limited | claude-vault-mcp |
| SK-009 service-mesh | Limited | (via Kubernetes MCP) |
| SK-010 gitops | Good | argocd-mcp, Flux MCP Server |
| SK-011 aws-cloud | Excellent | AWS Labs MCP, aws-agent-skills |
| SK-012 gcp-cloud | Excellent | gcloud-mcp, gke-mcp |
| SK-013 azure-cloud | Excellent | aks-mcp, azure-devops-mcp |
| SK-014 incident-platforms | Good | PagerDuty MCP, OpsGenie MCP |
| SK-015 cloud-cost-analysis | Limited | AWS Pricing MCP (partial) |
| AG-001 kubernetes-expert | Excellent | Multiple K8s MCP servers |
| AG-002 sre-expert | Good | SLA/SLI Tracker, Grafana MCP |
| AG-003 infra-architect | Good | terraform-skill, cloud MCPs |
| AG-004 secops-expert | Limited | claude-vault-mcp |
| AG-005 cicd-specialist | Excellent | Multiple CI/CD integrations |
| AG-006 observability-expert | Excellent | Grafana stack MCP servers |
| AG-007 incident-commander | Good | PagerDuty/OpsGenie MCP |
| AG-008 platform-engineer | Good | (composite of multiple tools) |
| AG-009 finops-expert | Limited | AWS Pricing MCP |
| AG-010 dr-specialist | Limited | (via cloud MCPs) |

### Recommendations

1. **High Priority Implementations**: Focus on SK-008 (secrets), SK-009 (service mesh), and SK-015 (cost analysis) as these have limited existing community resources.

2. **Leverage Official MCP Servers**: AWS Labs, Google Cloud, Azure, Grafana, and Elastic all provide official MCP servers that should be preferred over community alternatives.

3. **Composite Skills**: AG-008 (Platform Engineer) and AG-003 (Infra Architect) can be built by composing multiple existing MCP servers and skills.

4. **Security Considerations**: Always use dedicated API keys for CI/CD, store secrets properly, and prefer read-only modes when available.

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 5 - Skills and Agents References
**Next Step**: Phase 6 - Implement specialized skills and agents using identified references
