# DevOps, SRE, and Platform Engineering - Skills and Agents Backlog

This document identifies specialized skills and agents (subagents) that could enhance the DevOps/SRE/Platform processes beyond general-purpose capabilities. These tools would provide domain-specific expertise, automation capabilities, and integration with specialized tooling.

---

## Table of Contents

1. [Overview](#overview)
2. [Skills Backlog](#skills-backlog)
3. [Agents Backlog](#agents-backlog)
4. [Process-to-Skill/Agent Mapping](#process-to-skillagent-mapping)
5. [Shared Candidates](#shared-candidates)
6. [Implementation Priority](#implementation-priority)

---

## Overview

### Current State
All 20 implemented processes in this specialization currently use the `general-purpose` agent for task execution. While functional, this approach lacks domain-specific optimizations that specialized skills and agents could provide.

### Goals
- Provide deep expertise in specific DevOps/SRE tools and platforms
- Enable automated validation and quality gates with real tool integration
- Reduce context-switching overhead for domain-specific tasks
- Improve accuracy and efficiency of infrastructure-related operations

---

## Skills Backlog

### SK-001: Kubernetes Operations Skill
**Slug**: `kubernetes-ops`
**Category**: Container Orchestration

**Description**: Deep integration with Kubernetes clusters for deployments, debugging, and operations.

**Capabilities**:
- Execute kubectl commands and interpret results
- Analyze pod logs, events, and resource states
- Generate and validate Kubernetes manifests (YAML)
- Debug pod failures, crashloops, and networking issues
- Interpret Kubernetes resource quotas and limits
- Analyze HPA metrics and scaling behavior

**Process Integration**:
- kubernetes-setup.js
- service-mesh.js
- auto-scaling.js
- container-image-management.js

**Dependencies**: kubectl CLI, kubeconfig access

---

### SK-002: Terraform/IaC Skill
**Slug**: `terraform-iac`
**Category**: Infrastructure as Code

**Description**: Specialized skill for Terraform operations and IaC best practices.

**Capabilities**:
- Execute terraform plan/apply/destroy with analysis
- Validate HCL syntax and best practices
- Analyze terraform state and drift detection
- Generate Terraform modules from requirements
- Review terraform output and interpret changes
- Support for AWS, GCP, Azure providers
- Pulumi and CloudFormation awareness

**Process Integration**:
- iac-implementation.js
- iac-testing.js
- disaster-recovery-plan.js

**Dependencies**: Terraform CLI, provider credentials

---

### SK-003: Prometheus/Grafana Monitoring Skill
**Slug**: `prometheus-grafana`
**Category**: Observability

**Description**: Expert skill for Prometheus metrics and Grafana dashboards.

**Capabilities**:
- Write and validate PromQL queries
- Generate Grafana dashboard JSON
- Create alerting rules and recording rules
- Analyze metric cardinality and performance
- Debug scrape configurations
- Interpret metric patterns and anomalies

**Process Integration**:
- monitoring-setup.js
- slo-sli-tracking.js
- error-budget-management.js

**Dependencies**: Prometheus API, Grafana API

---

### SK-004: CI/CD Pipeline Skill
**Slug**: `cicd-pipelines`
**Category**: CI/CD

**Description**: Multi-platform CI/CD pipeline expertise.

**Capabilities**:
- Generate GitHub Actions, GitLab CI, Jenkins pipelines
- Analyze pipeline failures and suggest fixes
- Optimize pipeline execution time
- Validate pipeline syntax and security
- Configure matrix builds and parallelization
- Set up artifact caching strategies

**Process Integration**:
- cicd-pipeline-setup.js
- pipeline-optimization.js
- security-scanning.js

**Dependencies**: CI/CD platform APIs

---

### SK-005: Helm Charts Skill
**Slug**: `helm-charts`
**Category**: Kubernetes Packaging

**Description**: Expert Helm chart development and management.

**Capabilities**:
- Generate Helm charts from Kubernetes manifests
- Validate chart structure and best practices
- Template debugging and testing
- Chart dependency management
- Values file validation and generation
- Helm release management and rollback

**Process Integration**:
- kubernetes-setup.js
- service-mesh.js
- idp-setup.js

**Dependencies**: Helm CLI

---

### SK-006: Log Analysis Skill
**Slug**: `log-analysis`
**Category**: Observability

**Description**: Structured log analysis and aggregation expertise.

**Capabilities**:
- Parse and analyze log formats (JSON, syslog, custom)
- Write Loki LogQL queries
- Generate Elasticsearch/OpenSearch queries
- Identify log patterns and anomalies
- Create log-based alerts
- Configure log shipping and parsing

**Process Integration**:
- log-aggregation.js
- monitoring-setup.js
- incident-response.js

**Dependencies**: Loki/ELK API access

---

### SK-007: Container Image Skill
**Slug**: `container-images`
**Category**: Container Management

**Description**: Docker and OCI container image expertise.

**Capabilities**:
- Analyze and optimize Dockerfiles
- Multi-stage build optimization
- Image vulnerability scanning interpretation
- Base image selection and security
- Layer caching strategies
- Image size optimization
- Registry operations (push, pull, tag)

**Process Integration**:
- container-image-management.js
- security-scanning.js
- cicd-pipeline-setup.js

**Dependencies**: Docker CLI, registry access

---

### SK-008: Secrets Management Skill
**Slug**: `secrets-management`
**Category**: Security

**Description**: Enterprise secrets management across platforms.

**Capabilities**:
- HashiCorp Vault operations and policies
- AWS Secrets Manager integration
- Azure Key Vault operations
- GCP Secret Manager integration
- Kubernetes secrets and sealed secrets
- Secret rotation automation
- Access policy configuration

**Process Integration**:
- secrets-management.js
- security-scanning.js
- kubernetes-setup.js

**Dependencies**: Vault CLI, cloud provider SDKs

---

### SK-009: Service Mesh Skill
**Slug**: `service-mesh`
**Category**: Networking

**Description**: Service mesh configuration and operations (Istio, Linkerd, Consul).

**Capabilities**:
- Istio VirtualService/DestinationRule generation
- Linkerd service profile configuration
- mTLS setup and debugging
- Traffic management policies
- Circuit breaker and retry configuration
- Service mesh observability integration

**Process Integration**:
- service-mesh.js
- kubernetes-setup.js

**Dependencies**: istioctl/linkerd CLI

---

### SK-010: GitOps Skill
**Slug**: `gitops`
**Category**: Deployment

**Description**: GitOps tooling expertise (Argo CD, Flux).

**Capabilities**:
- Argo CD Application manifests
- Flux GitRepository and Kustomization
- Sync policies and strategies
- Drift detection and reconciliation
- Multi-cluster GitOps setup
- Secret management with SOPS/Sealed Secrets

**Process Integration**:
- cicd-pipeline-setup.js
- kubernetes-setup.js
- idp-setup.js

**Dependencies**: argocd/flux CLI

---

### SK-011: Cloud Provider Skill (AWS)
**Slug**: `aws-cloud`
**Category**: Cloud Infrastructure

**Description**: AWS-specific infrastructure and services expertise.

**Capabilities**:
- AWS CLI operations and analysis
- CloudFormation/CDK generation
- EKS cluster management
- AWS networking (VPC, ALB, Route53)
- IAM policy generation and analysis
- Cost analysis and optimization
- AWS service integration patterns

**Process Integration**:
- iac-implementation.js
- kubernetes-setup.js
- cost-optimization.js
- disaster-recovery-plan.js

**Dependencies**: AWS CLI, credentials

---

### SK-012: Cloud Provider Skill (GCP)
**Slug**: `gcp-cloud`
**Category**: Cloud Infrastructure

**Description**: GCP-specific infrastructure and services expertise.

**Capabilities**:
- gcloud CLI operations
- GKE cluster management
- Cloud Build pipelines
- GCP networking and load balancing
- IAM and service accounts
- BigQuery for analytics
- Cloud Functions/Run deployment

**Process Integration**:
- iac-implementation.js
- kubernetes-setup.js
- cost-optimization.js

**Dependencies**: gcloud CLI, credentials

---

### SK-013: Cloud Provider Skill (Azure)
**Slug**: `azure-cloud`
**Category**: Cloud Infrastructure

**Description**: Azure-specific infrastructure and services expertise.

**Capabilities**:
- Azure CLI operations
- AKS cluster management
- Azure DevOps pipelines
- Azure networking (VNet, App Gateway)
- Azure AD and RBAC
- Azure Monitor integration
- ARM/Bicep template generation

**Process Integration**:
- iac-implementation.js
- kubernetes-setup.js
- cost-optimization.js

**Dependencies**: az CLI, credentials

---

### SK-014: PagerDuty/Opsgenie Skill
**Slug**: `incident-platforms`
**Category**: Incident Management

**Description**: Incident management platform integration.

**Capabilities**:
- PagerDuty service and escalation setup
- Opsgenie configuration
- On-call schedule management
- Incident creation and updates
- Alerting integration setup
- Postmortem template generation

**Process Integration**:
- incident-response.js
- oncall-setup.js
- monitoring-setup.js

**Dependencies**: PagerDuty/Opsgenie API

---

### SK-015: Cost Analysis Skill
**Slug**: `cloud-cost-analysis`
**Category**: FinOps

**Description**: Multi-cloud cost analysis and optimization.

**Capabilities**:
- AWS Cost Explorer analysis
- GCP Billing data interpretation
- Azure Cost Management queries
- Resource rightsizing recommendations
- Reserved instance analysis
- Spot/preemptible instance strategies
- Cost allocation and tagging

**Process Integration**:
- cost-optimization.js
- auto-scaling.js
- iac-implementation.js

**Dependencies**: Cloud billing APIs

---

---

## Agents Backlog

### AG-001: Kubernetes Expert Agent
**Slug**: `kubernetes-expert`
**Category**: Container Orchestration

**Description**: Specialized agent with deep Kubernetes knowledge for complex cluster operations.

**Expertise Areas**:
- Kubernetes architecture and internals
- Cluster troubleshooting and debugging
- Performance optimization
- Security best practices (Pod Security Standards, RBAC)
- Network policies and service discovery
- StatefulSet and persistent storage patterns

**Persona**:
- Role: Senior Kubernetes Platform Engineer
- Experience: 7+ years with container orchestration
- Certifications: CKA, CKAD, CKS equivalent knowledge

**Process Integration**:
- kubernetes-setup.js (all phases)
- service-mesh.js (installation, sidecar injection)
- auto-scaling.js (HPA configuration)

---

### AG-002: SRE Expert Agent
**Slug**: `sre-expert`
**Category**: Site Reliability

**Description**: Agent embodying SRE principles and practices from Google SRE book.

**Expertise Areas**:
- SLO/SLI definition and measurement
- Error budget management
- Incident management and postmortems
- Capacity planning
- Toil identification and reduction
- Reliability patterns and anti-patterns

**Persona**:
- Role: Senior Site Reliability Engineer
- Experience: 8+ years in SRE/operations
- Background: Google SRE methodology trained

**Process Integration**:
- slo-sli-tracking.js (all phases)
- error-budget-management.js (all phases)
- incident-response.js (framework design, review)
- oncall-setup.js (rotation design)

---

### AG-003: Infrastructure Architect Agent
**Slug**: `infra-architect`
**Category**: Architecture

**Description**: Senior architect for infrastructure design decisions.

**Expertise Areas**:
- Cloud architecture patterns (multi-region, DR)
- Infrastructure security design
- Cost-optimized architecture
- High availability and fault tolerance
- Infrastructure modernization strategies
- Multi-cloud and hybrid architectures

**Persona**:
- Role: Principal Infrastructure Architect
- Experience: 10+ years infrastructure design
- Background: Enterprise architecture experience

**Process Integration**:
- iac-implementation.js (architecture design)
- disaster-recovery-plan.js (DR architecture)
- idp-setup.js (platform architecture)
- cost-optimization.js (architecture review)

---

### AG-004: Security Operations Agent
**Slug**: `secops-expert`
**Category**: Security

**Description**: DevSecOps specialist for security-focused operations.

**Expertise Areas**:
- Container security and hardening
- Secret management best practices
- Vulnerability assessment
- Compliance requirements (SOC2, HIPAA, PCI)
- Security scanning interpretation
- Zero-trust architecture

**Persona**:
- Role: Senior DevSecOps Engineer
- Experience: 6+ years security engineering
- Background: Penetration testing, security auditing

**Process Integration**:
- security-scanning.js (all phases)
- secrets-management.js (policy design, audit)
- container-image-management.js (image security)
- kubernetes-setup.js (security configuration)

---

### AG-005: CI/CD Specialist Agent
**Slug**: `cicd-specialist`
**Category**: CI/CD

**Description**: Expert in continuous integration and delivery pipelines.

**Expertise Areas**:
- Pipeline design patterns
- Build optimization strategies
- Release management
- Deployment strategies (canary, blue-green)
- Test automation integration
- Artifact management

**Persona**:
- Role: Senior Build/Release Engineer
- Experience: 7+ years CI/CD systems
- Background: Multi-platform pipeline experience

**Process Integration**:
- cicd-pipeline-setup.js (all phases)
- pipeline-optimization.js (all phases)
- container-image-management.js (build pipelines)

---

### AG-006: Observability Expert Agent
**Slug**: `observability-expert`
**Category**: Observability

**Description**: Metrics, logs, and traces expert for full-stack observability.

**Expertise Areas**:
- Prometheus ecosystem (Prometheus, Alertmanager, Thanos)
- Grafana stack (Grafana, Loki, Tempo)
- OpenTelemetry instrumentation
- Distributed tracing analysis
- Alert design and tuning
- Observability-driven development

**Persona**:
- Role: Senior Observability Engineer
- Experience: 6+ years monitoring/observability
- Background: High-scale systems monitoring

**Process Integration**:
- monitoring-setup.js (all phases)
- log-aggregation.js (all phases)
- slo-sli-tracking.js (measurement, dashboards)

---

### AG-007: Incident Commander Agent
**Slug**: `incident-commander`
**Category**: Incident Management

**Description**: Specialized agent for incident response coordination.

**Expertise Areas**:
- Incident triage and severity assessment
- Communication during incidents
- Runbook execution
- Root cause analysis
- Postmortem facilitation
- Incident metrics (MTTR, MTTD)

**Persona**:
- Role: Incident Commander / On-call Lead
- Experience: 5+ years incident management
- Background: High-pressure operations environments

**Process Integration**:
- incident-response.js (response phases)
- oncall-setup.js (escalation design)
- disaster-recovery-plan.js (DR execution)

---

### AG-008: Platform Engineering Agent
**Slug**: `platform-engineer`
**Category**: Platform Engineering

**Description**: Internal developer platform design and implementation expert.

**Expertise Areas**:
- Developer experience (DX) optimization
- Self-service platform design
- Service catalog management (Backstage)
- Golden paths and templates
- Platform adoption metrics
- Team topologies and cognitive load

**Persona**:
- Role: Senior Platform Engineer
- Experience: 6+ years platform engineering
- Background: Developer tools and productivity

**Process Integration**:
- idp-setup.js (all phases)
- kubernetes-setup.js (developer access)
- cicd-pipeline-setup.js (developer workflows)

---

### AG-009: Cost Optimization Agent
**Slug**: `finops-expert`
**Category**: FinOps

**Description**: Cloud financial operations and cost optimization specialist.

**Expertise Areas**:
- Cloud cost analysis and forecasting
- Resource rightsizing
- Reserved/committed use discounts
- Spot instance strategies
- Cost allocation and showback
- Budget alerts and governance

**Persona**:
- Role: FinOps Engineer / Cloud Economist
- Experience: 5+ years cloud cost management
- Background: Finance + engineering hybrid

**Process Integration**:
- cost-optimization.js (all phases)
- auto-scaling.js (cost-aware scaling)
- iac-implementation.js (cost tagging)

---

### AG-010: Disaster Recovery Agent
**Slug**: `dr-specialist`
**Category**: Business Continuity

**Description**: Disaster recovery and business continuity specialist.

**Expertise Areas**:
- RTO/RPO design
- Backup and restore strategies
- Multi-region failover
- DR testing and validation
- Compliance requirements
- Chaos engineering for DR

**Persona**:
- Role: Disaster Recovery Architect
- Experience: 8+ years DR/BC planning
- Background: Enterprise BC/DR programs

**Process Integration**:
- disaster-recovery-plan.js (all phases)
- backup-restore-automation.js (all phases)
- iac-implementation.js (DR infrastructure)

---

---

## Process-to-Skill/Agent Mapping

| Process File | Primary Skills | Primary Agents |
|-------------|---------------|----------------|
| kubernetes-setup.js | SK-001, SK-005, SK-009 | AG-001, AG-004 |
| cicd-pipeline-setup.js | SK-004, SK-007, SK-010 | AG-005 |
| monitoring-setup.js | SK-003, SK-006, SK-014 | AG-006 |
| incident-response.js | SK-006, SK-014 | AG-007, AG-002 |
| iac-implementation.js | SK-002, SK-011/12/13 | AG-003 |
| iac-testing.js | SK-002 | AG-003, AG-004 |
| slo-sli-tracking.js | SK-003, SK-014 | AG-002, AG-006 |
| error-budget-management.js | SK-003 | AG-002 |
| service-mesh.js | SK-009, SK-001 | AG-001 |
| secrets-management.js | SK-008 | AG-004 |
| container-image-management.js | SK-007, SK-004 | AG-005, AG-004 |
| pipeline-optimization.js | SK-004 | AG-005 |
| log-aggregation.js | SK-006, SK-003 | AG-006 |
| auto-scaling.js | SK-001, SK-015 | AG-001, AG-009 |
| idp-setup.js | SK-005, SK-010 | AG-008 |
| oncall-setup.js | SK-014 | AG-007, AG-002 |
| disaster-recovery-plan.js | SK-002, SK-011/12/13 | AG-010, AG-003 |
| security-scanning.js | SK-007, SK-008 | AG-004 |
| backup-restore-automation.js | SK-002, SK-011/12/13 | AG-010 |
| cost-optimization.js | SK-015, SK-011/12/13 | AG-009 |

---

## Shared Candidates

These skills and agents are strong candidates for extraction to a shared library as they apply across multiple specializations.

### Shared Skills

| ID | Skill | Potential Shared Specializations |
|----|-------|----------------------------------|
| SK-002 | Terraform/IaC | Software Architecture, Security Engineering |
| SK-004 | CI/CD Pipeline | Software Development, QA Testing |
| SK-006 | Log Analysis | QA Testing, Security Engineering |
| SK-007 | Container Images | Software Development |
| SK-011 | AWS Cloud | Software Architecture, Data Engineering |
| SK-012 | GCP Cloud | Software Architecture, Data Engineering |
| SK-013 | Azure Cloud | Software Architecture, Data Engineering |
| SK-015 | Cost Analysis | All specializations with cloud resources |

### Shared Agents

| ID | Agent | Potential Shared Specializations |
|----|-------|----------------------------------|
| AG-003 | Infrastructure Architect | Software Architecture |
| AG-004 | Security Operations | Security Engineering, Software Development |
| AG-005 | CI/CD Specialist | Software Development, QA Testing |
| AG-009 | FinOps Expert | All specializations with cloud resources |

---

## Implementation Priority

### Phase 1: Critical Skills (High Impact)
1. **SK-001**: Kubernetes Operations - Core to 4+ processes
2. **SK-002**: Terraform/IaC - Foundation for all infrastructure
3. **SK-003**: Prometheus/Grafana - Essential for observability
4. **SK-004**: CI/CD Pipeline - Universal deployment need

### Phase 2: Critical Agents (High Impact)
1. **AG-001**: Kubernetes Expert - Highest process coverage
2. **AG-002**: SRE Expert - Core SRE methodology
3. **AG-006**: Observability Expert - Cross-cutting concern

### Phase 3: Security & Operations
1. **SK-008**: Secrets Management
2. **SK-014**: Incident Platforms
3. **AG-004**: Security Operations
4. **AG-007**: Incident Commander

### Phase 4: Specialized Tools
1. **SK-005**: Helm Charts
2. **SK-009**: Service Mesh
3. **SK-010**: GitOps
4. **AG-008**: Platform Engineering

### Phase 5: Cloud-Specific & FinOps
1. **SK-011/12/13**: Cloud Provider Skills
2. **SK-015**: Cost Analysis
3. **AG-009**: FinOps Expert
4. **AG-010**: DR Specialist

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Skills Identified | 15 |
| Agents Identified | 10 |
| Shared Skill Candidates | 8 |
| Shared Agent Candidates | 4 |
| Total Processes Covered | 20 |

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 4 - Skills and Agents Identified
**Next Step**: Phase 5 - Implement specialized skills and agents
