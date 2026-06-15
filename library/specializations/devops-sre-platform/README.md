# DevOps, SRE, and Platform Engineering Specialization

**Comprehensive guide to DevOps practices, Site Reliability Engineering principles, and Platform Engineering methodologies for building, operating, and scaling reliable software systems.**

## Overview

This specialization encompasses three interconnected disciplines that focus on the intersection of software development, operations, and reliability:

- **DevOps**: Cultural and technical practices that unify development and operations to deliver software faster and more reliably
- **Site Reliability Engineering (SRE)**: Engineering discipline focused on building and operating large-scale, reliable production systems
- **Platform Engineering**: Building internal developer platforms to improve developer experience and productivity

## Roles and Responsibilities

### DevOps Engineer

**Primary Focus**: Automation, CI/CD, and bridging development and operations

#### Core Responsibilities
- **CI/CD Pipeline Management**: Design, implement, and maintain continuous integration and deployment pipelines
- **Infrastructure Automation**: Automate infrastructure provisioning and configuration using IaC tools (Terraform, Ansible)
- **Tool Selection and Integration**: Evaluate and integrate DevOps tools across the software delivery lifecycle
- **Monitoring and Alerting**: Implement monitoring solutions for applications and infrastructure
- **Collaboration**: Work with development and operations teams to improve processes
- **Security Integration**: Implement security practices in the development pipeline (DevSecOps)
- **Documentation**: Create and maintain runbooks, playbooks, and technical documentation

#### Key Skills
- **Programming/Scripting**: Python, Bash, Go, PowerShell
- **CI/CD Tools**: Jenkins, GitLab CI, GitHub Actions, CircleCI
- **IaC Tools**: Terraform, Ansible, CloudFormation, Pulumi
- **Containerization**: Docker, container registries
- **Cloud Platforms**: AWS, Azure, GCP
- **Version Control**: Git, GitOps practices
- **Monitoring**: Prometheus, Grafana, ELK Stack
- **Configuration Management**: Ansible, Chef, Puppet

#### Typical Workflows
1. **Feature Deployment**: Code commit → CI build → automated tests → staging deployment → production deployment
2. **Infrastructure Change**: IaC code change → code review → plan/preview → apply to infrastructure
3. **Pipeline Optimization**: Identify bottlenecks → implement parallelization → reduce build times → validate improvements
4. **Incident Response**: Alert received → log analysis → deployment rollback or hotfix → post-incident review

### Site Reliability Engineer (SRE)

**Primary Focus**: Reliability, scalability, and performance of production systems

#### Core Responsibilities
- **Service Reliability**: Ensure services meet defined SLOs and SLAs
- **Error Budget Management**: Balance feature velocity with reliability using error budgets
- **Incident Response**: On-call rotations, incident management, and post-incident reviews
- **Capacity Planning**: Forecast demand and plan infrastructure scaling
- **Performance Optimization**: Identify and resolve performance bottlenecks
- **Toil Reduction**: Automate manual, repetitive operational tasks
- **Observability**: Implement comprehensive monitoring, logging, and tracing
- **Disaster Recovery**: Design and test backup and recovery procedures

#### Key Skills
- **System Design**: Distributed systems, high availability, fault tolerance
- **Programming**: Strong coding skills (Python, Go, Java) for automation and tooling
- **Observability**: Prometheus, Grafana, OpenTelemetry, Jaeger, Datadog
- **Incident Management**: Root cause analysis, blameless postmortems
- **Performance Engineering**: Profiling, optimization, load testing
- **Capacity Planning**: Forecasting, resource allocation
- **SLO/SLI Definition**: Metrics selection, target setting
- **On-Call Practices**: Alert management, escalation procedures

#### SRE Principles
1. **Embrace Risk**: 100% reliability is not the goal; balance reliability with feature velocity
2. **Service Level Objectives**: Define measurable reliability targets
3. **Error Budgets**: Quantify acceptable unreliability
4. **Toil Reduction**: Automate operational work (target: <50% of time on toil)
5. **Monitoring**: Metrics-driven decision making
6. **Capacity Planning**: Proactive resource management
7. **Change Management**: Automated, gradual rollouts
8. **Blameless Culture**: Learn from failures without blame

#### Typical Workflows
1. **SLO Definition**: Identify user-critical metrics → set target percentiles → calculate error budget → monitor continuously
2. **Incident Response**: Alert triggered → assess severity → mitigate impact → restore service → conduct postmortem
3. **Capacity Planning**: Analyze trends → forecast demand → provision resources → validate headroom
4. **Toil Automation**: Identify repetitive task → build automation → test thoroughly → deploy and monitor → measure time saved

### Platform Engineer

**Primary Focus**: Building internal developer platforms and improving developer experience

#### Core Responsibilities
- **Internal Developer Platform (IDP)**: Build self-service platforms for developers
- **Developer Experience**: Streamline development workflows and reduce friction
- **Service Catalog**: Create and maintain reusable service templates
- **Platform Services**: Provide shared services (CI/CD, observability, secrets management)
- **Documentation and Enablement**: Create comprehensive platform documentation and training
- **Platform as a Product**: Treat platform as a product with developers as customers
- **Standards and Best Practices**: Define and enforce platform standards
- **Cost Optimization**: Monitor and optimize platform costs

#### Key Skills
- **Platform Tools**: Kubernetes, Backstage, Crossplane, ArgoCD
- **API Design**: RESTful APIs, GraphQL for platform services
- **Developer Portals**: Backstage, custom portal development
- **Service Templates**: Helm charts, Kustomize, cookiecutter
- **Programming**: Go, Python, TypeScript for platform tooling
- **Product Thinking**: User research, feedback loops, metrics
- **Documentation**: Technical writing, tutorials, examples
- **Cloud Native**: Kubernetes, service mesh, GitOps

#### Platform Engineering Principles
1. **Self-Service**: Enable developers to provision resources independently
2. **Golden Paths**: Provide opinionated, well-supported paths for common tasks
3. **Product Mindset**: Platform is a product, developers are customers
4. **Developer Experience**: Focus on ease of use and productivity
5. **Standardization**: Consistent interfaces and patterns
6. **Automation**: Reduce manual toil through automation
7. **Observability**: Built-in monitoring and debugging capabilities

#### Typical Workflows
1. **New Service Onboarding**: Developer selects template → fills in parameters → platform provisions infrastructure → CI/CD configured → service deployed
2. **Platform Feature Development**: Gather developer feedback → prioritize features → build and test → document → release → measure adoption
3. **Golden Path Creation**: Identify common pattern → design template → implement automation → create documentation → evangelize to teams
4. **Developer Support**: Developer encounters issue → provide guidance → identify platform improvement → add to backlog

## Goals and Objectives

### DevOps Goals
- **Faster Time to Market**: Reduce deployment frequency from weeks to hours or minutes
- **Increased Deployment Frequency**: Enable multiple deployments per day
- **Lower Failure Rate**: Reduce change failure rate through automation and testing
- **Faster Recovery**: Reduce mean time to recovery (MTTR) from hours to minutes
- **Improved Collaboration**: Break down silos between development and operations
- **Continuous Improvement**: Foster culture of experimentation and learning

### SRE Goals
- **High Reliability**: Achieve and maintain service level objectives (e.g., 99.9% availability)
- **Balanced Innovation**: Use error budgets to balance reliability and feature velocity
- **Scalability**: Design systems that scale efficiently with demand
- **Incident Reduction**: Reduce incident frequency and severity over time
- **Operational Efficiency**: Minimize toil, maximize automation
- **Data-Driven Decisions**: Use metrics to guide reliability investments

### Platform Engineering Goals
- **Developer Productivity**: Reduce time from idea to production
- **Self-Service**: Enable developers to provision resources without tickets
- **Standardization**: Provide consistent, well-supported patterns
- **Cost Efficiency**: Optimize infrastructure costs through shared platforms
- **Cognitive Load Reduction**: Abstract complexity from developers
- **Innovation Enablement**: Free developers to focus on business logic

## Use Cases

### CI/CD Pipeline Implementation
**Scenario**: Company needs to automate software delivery from code commit to production

**DevOps Engineer Activities**:
1. Select and configure CI/CD tool (e.g., GitHub Actions, Jenkins)
2. Create pipeline stages: build, test, security scan, deploy
3. Implement automated testing (unit, integration, e2e)
4. Configure deployment to multiple environments (dev, staging, prod)
5. Set up artifact repositories and container registries
6. Implement approval gates and notifications

**Outcomes**: Reduced deployment time, fewer manual errors, faster feedback loops

### Service Reliability Improvement
**Scenario**: E-commerce site experiencing frequent outages during peak traffic

**SRE Activities**:
1. Define SLIs: request success rate, latency (p50, p95, p99)
2. Set SLOs: 99.9% availability, p95 latency < 200ms
3. Implement comprehensive observability (Prometheus, Grafana)
4. Conduct load testing to identify bottlenecks
5. Implement autoscaling and circuit breakers
6. Create incident response runbooks
7. Conduct chaos engineering experiments

**Outcomes**: Improved uptime, better user experience, quantified reliability targets

### Infrastructure as Code Migration
**Scenario**: Manual infrastructure provisioning causing inconsistencies and delays

**DevOps Engineer Activities**:
1. Choose IaC tool (Terraform) and organize code structure
2. Document existing infrastructure (inventory)
3. Import existing resources into Terraform state
4. Create reusable modules for common patterns
5. Implement environment separation (dev, staging, prod)
6. Set up state management and locking (S3 + DynamoDB)
7. Create CI/CD pipeline for infrastructure changes
8. Train team on IaC workflows

**Outcomes**: Reproducible infrastructure, faster provisioning, version-controlled changes

### Kubernetes Migration
**Scenario**: Migrate monolithic application to microservices on Kubernetes

**DevOps/Platform Engineer Activities**:
1. Set up Kubernetes cluster (EKS, GKE, or AKS)
2. Design microservices architecture
3. Create Helm charts for each service
4. Implement service mesh for traffic management (Istio/Linkerd)
5. Configure ingress and load balancing
6. Set up monitoring and logging (Prometheus, Loki, Jaeger)
7. Implement GitOps workflow (ArgoCD)
8. Create migration plan and execute phased rollout

**Outcomes**: Improved scalability, independent deployments, better resource utilization

### Internal Developer Platform
**Scenario**: Developers spend excessive time on infrastructure and tooling

**Platform Engineer Activities**:
1. Conduct developer surveys to identify pain points
2. Design platform architecture (Backstage, Kubernetes, ArgoCD)
3. Create service catalog with templates (API service, web app, worker)
4. Implement self-service workflows (provision, deploy, monitor)
5. Build developer portal with documentation and tutorials
6. Integrate observability and cost tracking
7. Provide support and gather feedback
8. Iterate based on usage metrics and feedback

**Outcomes**: Faster onboarding, reduced cognitive load, increased developer satisfaction

### Incident Response Framework
**Scenario**: Unstructured incident response leading to prolonged outages

**SRE Activities**:
1. Define incident severity levels (SEV-1 through SEV-4)
2. Establish incident roles (Commander, Tech Lead, Comms Lead)
3. Create incident response runbooks
4. Set up incident communication channels (Slack, war room)
5. Implement on-call rotation with PagerDuty
6. Create postmortem template and process
7. Conduct incident response training and simulations
8. Track action items and measure MTTR improvements

**Outcomes**: Faster resolution, reduced downtime, organizational learning

### Observability Implementation
**Scenario**: Limited visibility into application performance and issues

**DevOps/SRE Activities**:
1. Deploy Prometheus for metrics collection
2. Set up Grafana for visualization
3. Implement structured logging with Loki or ELK
4. Add distributed tracing with Jaeger or Tempo
5. Create dashboards for services and infrastructure
6. Implement alerting rules based on SLOs
7. Integrate with PagerDuty for incident management
8. Document observability practices

**Outcomes**: Proactive issue detection, faster debugging, data-driven decisions

### Deployment Strategy Enhancement
**Scenario**: Deployments causing downtime and user-facing issues

**DevOps/SRE Activities**:
1. Implement blue-green deployment infrastructure
2. Set up canary deployment with traffic splitting
3. Integrate feature flags for gradual rollouts
4. Configure automated rollback on error rate increase
5. Implement smoke tests post-deployment
6. Create deployment dashboards with key metrics
7. Document deployment procedures

**Outcomes**: Zero-downtime deployments, early issue detection, safe rollouts

## Common Workflows

### 1. GitOps Deployment Workflow
```
┌─────────────────────────────────────────────────────────────┐
│ Developer commits code change                               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ CI Pipeline: Build, Test, Security Scan                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Build Container Image, Push to Registry                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Update Kubernetes Manifest in Git (new image tag)          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ ArgoCD Detects Change, Syncs to Cluster                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Progressive Rollout (Canary/Blue-Green)                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Monitor Metrics, Automated Rollback if Needed               │
└─────────────────────────────────────────────────────────────┘
```

### 2. Incident Response Workflow
```
┌─────────────────────────────────────────────────────────────┐
│ Alert Triggered (Monitoring System)                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Page On-Call Engineer (PagerDuty)                          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Assess Severity, Declare Incident (if SEV-1 or SEV-2)      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Assign Roles: Commander, Tech Lead, Comms, Scribe          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Investigate: Logs, Metrics, Traces, Recent Changes         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Mitigate: Rollback, Scaling, Traffic Rerouting             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Verify Service Restoration, Monitor Closely                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Conduct Blameless Postmortem Within 48 Hours               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Implement Action Items, Track to Completion                │
└─────────────────────────────────────────────────────────────┘
```

### 3. SLO Management Workflow
```
┌─────────────────────────────────────────────────────────────┐
│ Identify User-Critical Service Metrics (SLIs)              │
│ - Availability (success rate)                               │
│ - Latency (p50, p95, p99)                                   │
│ - Throughput (requests/second)                              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Set Target Values (SLOs)                                    │
│ - 99.9% availability (43.2 min downtime/month)              │
│ - p95 latency < 200ms                                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Calculate Error Budget (100% - SLO)                         │
│ - 0.1% error budget = 43.2 minutes/month                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Implement Monitoring and Alerting                           │
│ - Prometheus metrics collection                             │
│ - Grafana SLO dashboards                                    │
│ - Alerts on SLO violations                                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Track Error Budget Consumption                              │
│ - Budget available: Ship features                           │
│ - Budget exhausted: Focus on reliability                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Quarterly SLO Review and Adjustment                         │
└─────────────────────────────────────────────────────────────┘
```

### 4. Infrastructure as Code Workflow
```
┌─────────────────────────────────────────────────────────────┐
│ Developer Modifies Terraform Code                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Commit to Feature Branch, Open Pull Request                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ CI: terraform fmt, validate, tflint                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ terraform plan (Post Plan Output as PR Comment)            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Code Review by Team Member                                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Merge to Main Branch                                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ CD: terraform apply (with approval gate for production)    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Verify Infrastructure Changes, Monitor for Issues           │
└─────────────────────────────────────────────────────────────┘
```

## Best Practices

### DevOps Best Practices

#### CI/CD
- **Pipeline as Code**: Store pipeline definitions in version control
- **Fast Feedback**: Keep build times under 10 minutes
- **Fail Fast**: Run fastest tests first, stop on first failure
- **Artifact Management**: Version and store build artifacts immutably
- **Environment Parity**: Keep dev, staging, and production environments consistent
- **Deployment Automation**: Zero-touch deployments to production

#### Infrastructure as Code
- **Version Control**: All infrastructure code in Git
- **Modularization**: DRY principle, reusable modules
- **State Management**: Remote state with locking (S3 + DynamoDB for Terraform)
- **Code Review**: Pull requests for all infrastructure changes
- **Testing**: Unit tests, integration tests, policy validation
- **Documentation**: Self-documenting code with clear variable descriptions

#### Security (DevSecOps)
- **Shift Left**: Security testing early in development
- **Automated Scanning**: SAST, DAST, dependency scanning in CI
- **Secrets Management**: Never commit secrets, use Vault or cloud-native solutions
- **Least Privilege**: IAM roles and policies with minimal necessary permissions
- **Container Security**: Image scanning, runtime security monitoring

### SRE Best Practices

#### SLO/SLI Management
- **User-Centric Metrics**: Measure what users care about
- **Start Simple**: Begin with availability and latency
- **Clear Targets**: Specific, measurable objectives (99.9%, not "highly available")
- **Regular Review**: Quarterly SLO review and adjustment
- **Document Everything**: Clear documentation of SLIs, SLOs, and measurement methods

#### Error Budgets
- **Use Error Budgets**: Balance reliability and feature velocity
- **Transparent Tracking**: Visible error budget dashboards
- **Policy-Based Decisions**: Define actions when budget is exhausted
- **Stakeholder Buy-In**: Ensure leadership understands error budget concept

#### Incident Management
- **Blameless Culture**: Focus on systems, not individuals
- **Clear Severity Levels**: Well-defined incident classification
- **Defined Roles**: Incident commander, tech lead, communications, scribe
- **Runbooks**: Documented procedures for common incidents
- **Post-Incident Reviews**: Conduct thorough postmortems with action items
- **Action Item Tracking**: Follow through on postmortem recommendations

#### Toil Reduction
- **Measure Toil**: Track time spent on manual, repetitive work
- **Target <50%**: SREs should spend less than 50% time on toil
- **Automate Ruthlessly**: Automate anything done more than twice
- **Prioritize Automation**: Balance automation work with feature development

#### On-Call
- **Balanced Rotations**: Distribute on-call load fairly
- **Alert Quality**: Actionable alerts only, reduce noise
- **Escalation Policies**: Clear escalation paths
- **On-Call Compensation**: Recognize on-call burden (time off, compensation)
- **Post-Incident Review**: Learn from incidents during on-call

### Platform Engineering Best Practices

#### Developer Experience
- **Self-Service**: Enable developers to provision resources independently
- **Golden Paths**: Provide opinionated, well-supported workflows
- **Clear Documentation**: Comprehensive guides, tutorials, and examples
- **Quick Onboarding**: New developers productive within hours, not days
- **Fast Feedback**: Immediate validation and error messages

#### Platform as a Product
- **Product Mindset**: Treat platform as a product, developers as customers
- **User Research**: Regular developer surveys and interviews
- **Metrics-Driven**: Track adoption, usage, satisfaction
- **Roadmap**: Public platform roadmap with priorities
- **Support**: Dedicated support channels (Slack, office hours)

#### Standards and Consistency
- **Standardized Templates**: Consistent project structures and configurations
- **Common Interfaces**: Uniform APIs and CLIs across platform services
- **Enforcement**: Automated policy enforcement (OPA, Kyverno)
- **Flexibility**: Allow escape hatches for advanced users

#### Observability Built-In
- **Default Instrumentation**: Services auto-instrumented for metrics, logs, traces
- **Unified Dashboards**: Consistent monitoring across all services
- **Cost Visibility**: Track and display infrastructure costs per service
- **Developer Access**: Developers can view their service metrics

### Cross-Cutting Best Practices

#### Collaboration
- **Cross-Functional Teams**: Developers, SREs, platform engineers work together
- **Shared Responsibility**: Reliability is everyone's job
- **Knowledge Sharing**: Regular tech talks, documentation, mentoring
- **Blameless Culture**: Learn from failures without assigning blame

#### Continuous Improvement
- **Measure Everything**: Metrics for deployment frequency, MTTR, change failure rate
- **Retrospectives**: Regular team retrospectives to identify improvements
- **Experimentation**: Encourage trying new tools and approaches
- **Learning Culture**: Time for learning, conferences, certifications

#### Documentation
- **Up-to-Date**: Keep documentation current with system changes
- **Runbooks**: Step-by-step procedures for common tasks
- **Architecture Diagrams**: Visual representations of systems
- **Decision Records**: Document architectural decisions and rationale
- **Accessible**: Centralized, searchable documentation (Confluence, Notion, Backstage)

## Key Metrics

### DevOps Metrics (DORA Metrics)
- **Deployment Frequency**: How often deployments to production occur
  - Elite: Multiple times per day
  - High: Once per day to once per week
  - Medium: Once per week to once per month
  - Low: Less than once per month
- **Lead Time for Changes**: Time from commit to production
  - Elite: Less than one hour
  - High: One day to one week
  - Medium: One week to one month
  - Low: More than one month
- **Change Failure Rate**: Percentage of deployments causing failures
  - Elite: 0-15%
  - High: 16-30%
  - Medium: 31-45%
  - Low: 46-100%
- **Time to Restore Service**: Time to recover from incidents
  - Elite: Less than one hour
  - High: One hour to one day
  - Medium: One day to one week
  - Low: More than one week

### SRE Metrics
- **Service Level Indicators (SLIs)**: Measurable metrics (availability, latency, throughput)
- **Service Level Objectives (SLOs)**: Target values for SLIs (99.9% availability)
- **Error Budget**: 100% - SLO (0.1% for 99.9% SLO)
- **Error Budget Burn Rate**: Rate at which error budget is consumed
- **Mean Time to Detect (MTTD)**: Time from issue occurrence to detection
- **Mean Time to Resolve (MTTR)**: Time from detection to resolution
- **Toil Time**: Percentage of time on manual, repetitive work (target <50%)

### Platform Engineering Metrics
- **Developer Satisfaction**: Survey scores (NPS, CSAT)
- **Time to First Deploy**: Time for new developer to deploy first service
- **Platform Adoption**: Percentage of teams using platform
- **Self-Service Success Rate**: Percentage of requests completed without manual intervention
- **Time to Provision**: Time to provision new environment or service
- **Platform Availability**: Uptime of platform services
- **Support Ticket Volume**: Number of platform support requests

## Tools and Technologies

### Core Tool Categories
- **CI/CD**: Jenkins, GitLab CI, GitHub Actions, CircleCI, Argo CD
- **IaC**: Terraform, Ansible, CloudFormation, Pulumi
- **Container Orchestration**: Kubernetes, Docker, Helm
- **Observability**: Prometheus, Grafana, ELK Stack, Jaeger, Datadog
- **GitOps**: Argo CD, Flux, Jenkins X
- **Service Mesh**: Istio, Linkerd, Consul
- **Secrets Management**: HashiCorp Vault, AWS Secrets Manager, Azure Key Vault
- **Incident Management**: PagerDuty, Opsgenie, Splunk On-Call
- **Platform Tools**: Backstage, Crossplane, Humanitec

## Description of the Specialization

DevOps, SRE, and Platform Engineering represent a modern approach to building and operating software systems at scale. These disciplines emerged to address the challenges of complex, distributed systems and the need for rapid, reliable software delivery.

**DevOps** originated as a cultural movement to break down silos between development and operations teams. It emphasizes automation, continuous delivery, and collaboration to enable faster, more reliable software releases.

**Site Reliability Engineering** was pioneered by Google to apply software engineering practices to operations. SRE provides a framework for balancing reliability with feature velocity through concepts like error budgets and service level objectives.

**Platform Engineering** emerged as organizations recognized the need for internal platforms to improve developer productivity. Platform engineers build self-service platforms that abstract infrastructure complexity and provide golden paths for common tasks.

Together, these disciplines enable organizations to:
- Deploy software rapidly and reliably
- Maintain high availability and performance
- Scale systems efficiently
- Improve developer productivity
- Reduce operational toil
- Foster cultures of continuous improvement

This specialization is critical for modern software organizations operating in cloud-native environments with high reliability requirements and rapid release cycles.

## Learning Path

### Foundational Knowledge
1. **Linux/Unix Administration**: Command line, shell scripting, system administration
2. **Networking**: TCP/IP, DNS, load balancing, firewalls
3. **Programming**: Python, Go, or similar for automation
4. **Version Control**: Git workflows, branching strategies
5. **Cloud Platforms**: AWS, Azure, or GCP fundamentals

### Intermediate Skills
1. **CI/CD**: Jenkins, GitHub Actions, or GitLab CI
2. **Containerization**: Docker, container registries
3. **Infrastructure as Code**: Terraform or Ansible
4. **Monitoring**: Prometheus and Grafana basics
5. **Kubernetes**: Core concepts, kubectl, deployments

### Advanced Topics
1. **Kubernetes Advanced**: Operators, custom resources, security
2. **Service Mesh**: Istio or Linkerd
3. **GitOps**: Argo CD or Flux
4. **Observability**: OpenTelemetry, distributed tracing
5. **SRE Practices**: SLO/SLI definition, error budgets, incident management
6. **Platform Engineering**: Backstage, internal developer platforms
7. **Chaos Engineering**: Failure injection, resilience testing

## Career Progression

### Entry Level: Junior DevOps Engineer
- Focus: CI/CD pipelines, basic automation, monitoring
- Experience: 0-2 years

### Mid Level: DevOps Engineer / SRE I
- Focus: Infrastructure as code, Kubernetes, incident response
- Experience: 2-5 years

### Senior Level: Senior DevOps Engineer / SRE II
- Focus: System design, capacity planning, toil reduction
- Experience: 5-8 years

### Lead Level: Staff SRE / Lead Platform Engineer
- Focus: Architecture, organizational processes, mentoring
- Experience: 8+ years

### Principal: Principal SRE / Principal Platform Engineer
- Focus: Technical strategy, cross-org initiatives, thought leadership
- Experience: 12+ years


---

**Created**: 2026-01-23
**Version**: 1.0.0
**Specialization**: DevOps, SRE, and Platform Engineering



# Cloud discovery + cost-reduction processes

Generic, multi-cloud babysitter processes for inventorying a cloud account/subscription/project and acting on cost waste with mandatory human-in-the-loop breakpoints.

## Files

| File | Purpose |
|---|---|
| `aws-systems-discovery.js` | AWS account discovery: bootstrap (CLI install + auth + account+region select), per-region inventory, EKS deep-dive, ALB/NLB → target attribution, Route 53 + CloudFront external exposure, mermaid diagrams. |
| `aws-systems-cost-reduction.js` | AWS cost reduction: Cost Explorer + Compute Optimizer + Trusted Advisor → tiered recommendations → per-action breakpoint with backup-before-destroy. |
| `azure-systems-discovery.js` | Azure subscription discovery: bootstrap, per-RG inventory, AKS deep-dive (kubectl direct + `az aks command invoke` fallback), AppGW listener-to-backend with AGIC convention parsing, DNS + wildcard surface analysis, mermaid diagrams. |
| `azure-systems-cost-reduction.js` | Azure cost reduction: Retail Prices API + Azure Advisor + Cost Management → tiered recommendations → per-action breakpoint with backup. |
| `gcp-systems-discovery.js` | GCP project/org discovery: bootstrap, Cloud Asset Inventory, GKE deep-dive (Standard + Autopilot), GCLB forwarding-rule → URL map → backend chain, Cloud DNS exposure, mermaid diagrams. |
| `gcp-systems-cost-reduction.js` | GCP cost reduction: Recommender API (multiple categories) + Billing BigQuery export → tiered recommendations → per-action breakpoint with backup. |

## Design rules

These are the rules that govern every process file in this directory.

### 1. All tasks are `kind: 'agent'`

There are NO `kind: 'shell'` tasks. Whenever a step needs to run a CLI command, an agent task is dispatched and the agent runs the command via its built-in Bash tool. This eliminates the inter-task filesystem contract that shell tasks would otherwise create.

### 2. No shared filesystem layout between tasks

Tasks pass data forward via **JSON return values**, not via known file paths. When an upstream task produces an artifact too large to inline (e.g. the full inventory of an AWS account), it writes the artifact under its own `tasks/<effectId>/artifacts/` scratch dir and returns the path **explicitly** in its `result.value`. The downstream task receives that path verbatim through its prompt args and `cat`s it at execution time.

The only path the user controls is `inputs.outputDir`, which is where the **final composed reports** land. Intermediate state never escapes the run's `tasks/` tree.

### 3. Bootstrap-first

Every discovery and cost-reduction process starts with a bootstrap phase:

1. **CLI probe + install** (`cliBootstrapTask`)
   - Detects whether the cloud CLI + companion tools are installed.
   - `installPolicy: 'ask'` (default): probes only, returns `pendingInstall: [...]`. Orchestrator raises an install-approval breakpoint, then re-invokes with `installPolicy: 'auto'`.
   - `installPolicy: 'auto'`: installs missing tools (preferring non-sudo `$HOME/.local/bin` paths).
   - `installPolicy: 'never'`: fails fast with a list of missing tools.

2. **Authentication** (cloud-specific auth task)
   - `use-existing` first; if no active session, prompts the user to pick a method.
   - Azure: `interactive`, `device-code`, `service-principal`, `managed-identity`.
   - AWS: `sso`, `assume-role`, `static-keys`, `container-or-instance-role`.
   - GCP: `interactive` (gcloud-login), `service-account-key`, `workload-identity`.
   - Sensitive credentials (service principal password, static keys, key file) are gathered through a dedicated breakpoint and never logged.

3. **Account / subscription / project + region selection**
   - Lists what the authenticated identity can see.
   - Breakpoint: pick `current default` / `all-in-tenant|org` / explicit list / cancel.
   - For AWS, **regions are confirmed explicitly** (regions billed independently — wrong region = blind spot).

### 4. Tiered actions + per-action breakpoints (cost-reduction processes)

Every cost-reduction recommendation is gated by its own breakpoint with the same 4 options:

- **Apply with backup** — runs the per-rec `backupCommand` first, then `suggestedAction`, then `verifyCommand`.
- **Apply WITHOUT backup** — skips the backup (only valid when `reversibility !== 'destructive-permanent'`).
- **Skip** — records the rec in the `skipped` list with reason.
- **Skip all in this tier** — adds the tier to a skip-set; subsequent recs in that tier short-circuit.

Risk tiers (universal across clouds):

| Tier | Examples | Reversibility |
|---|---|---|
| 1 | empty resource groups, dangling DNS, missing tags | reversible |
| 2 | rightsize, switch storage class, lower DB tier, switch to Spot/preemptible | reversible (some require restart) |
| 3 | Reserved Instances / Savings Plans / Committed Use Discounts | **irreversible commitment** |
| 4 | delete idle resources (volumes, IPs, snapshots, NAT, AppGW) | destructive — backup default-on |
| 5 | shrink/delete clusters, delete dev VPCs, drain workloads | destructive — backup default-on |

### 5. Backup-before-destroy

Every Tier 4+ recommendation must include a real `backupCommand` (a CLI invocation that captures the data). When the resource type has no meaningful backup (e.g. an empty AppGW where there is no data), the rec sets `backupNeeded: false` so the breakpoint UI hides the "with backup" option.

When a backup destination is required (Azure storage container, AWS S3 bucket, GCS bucket) and not provided in inputs, the backup task **refuses with `missing-backup-destination`** rather than silently dropping data.

### 6. Wildcard DNS — explicit treatment

Each discovery process flags `*.<zone>` records as **OPEN SURFACE** in the external-exposure report. The wording is consistent: "Any subdomain not listed above also reaches `<backend>` — anyone who can publish a kubectl Ingress / GCLB rule / ALB listener with that hostname can route traffic instantly without a DNS change."

### 7. Ingress-controller convention parsing

When an in-cluster controller provisions cloud-side LB resources, the discovery agent recognises the naming convention to attribute LB config back to the originating k8s ingress:

- **AGIC** (Azure App Gateway Ingress Controller): `pool-<ns>-<svc>-<port>-bp-<port>`
- **GCE Ingress** (GKE): URL map + backend service named `<ingress-name>-<hash>`
- **AWS Load Balancer Controller** (EKS): target group `k8s-<ns>-<ingressname>-<hash>` + tag `kubernetes.io/cluster/<name>`

### 8. Drift defense

Composer agents read source data via Bash `cat` at execution time rather than receiving inlined JSON bytes through the prompt. This keeps large source data out of the process-authoring compose pass where token proximity bias would otherwise rewrite acceptance criteria.

## Inputs cheat-sheet

### Discovery

```jsonc
// azure-systems-discovery.js
{
  // Scope
  "subscriptionIds": [],                      // omit to use current az account
  "scopeMode": "current",                     // 'current' | 'all-in-tenant' | 'list'
  "systemUnit": "resource-group",             // 'resource-group' | 'tag' | 'aks-namespace'
  "systemTagKey": "system",
  "includeAksDeepDive": true,
  "includeDnsRecords": true,
  "probeExternalEndpoints": false,
  "diagrams": "mermaid",
  "outputDir": "azure-discovery",
  "serviceCategories": null,                  // restrict scan; null = all
  // Bootstrap
  "installPolicy": "ask",                     // 'ask' | 'auto' | 'never'
  "preferredAzInstallMethod": null,
  "authMethod": "use-existing",               // 'use-existing'|'interactive'|'device-code'|'service-principal'|'managed-identity'
  "servicePrincipal": null,                   // {appId, tenantId, password|certificateFile}
  "tenantHint": null
}

// aws-systems-discovery.js
{
  "accountIds": [],
  "regions": ["us-east-1"],                   // CRITICAL — confirmed via breakpoint
  "scopeMode": "current",                     // 'current' | 'org' | 'list'
  "systemUnit": "vpc",                        // 'vpc' | 'tag' | 'cf-stack' | 'eks-namespace'
  "systemTagKey": "system",
  "includeEksDeepDive": true,
  "includeRoute53Records": true,
  "probeExternalEndpoints": false,
  "diagrams": "mermaid",
  "outputDir": "aws-discovery",
  "serviceCategories": null,
  "installPolicy": "ask",
  "authMethod": "use-existing",               // 'use-existing'|'sso'|'assume-role'|'static-keys'|'container-or-instance-role'
  "ssoProfile": null, "assumeRoleArn": null, "staticCredentials": null
}

// gcp-systems-discovery.js
{
  "projectIds": [],
  "organizationId": null,                     // org-wide scan via Cloud Asset Inventory
  "regions": ["us-central1"],
  "scopeMode": "current",                     // 'current' | 'project-list' | 'organization'
  "systemUnit": "project",                    // 'project' | 'label' | 'gke-namespace'
  "systemLabelKey": "system",
  "includeGkeDeepDive": true,
  "includeDnsRecords": true,
  "probeExternalEndpoints": false,
  "diagrams": "mermaid",
  "outputDir": "gcp-discovery",
  "serviceCategories": null,
  "installPolicy": "ask",
  "authMethod": "use-existing",               // 'use-existing'|'interactive'|'service-account-key'|'workload-identity'
  "serviceAccountKeyFile": null
}
```

### Cost reduction

```jsonc
// azure-systems-cost-reduction.js
{
  "subscriptionId": "string",
  "outputDir": "string",
  "discoveryManifest": null,                  // pass output of azure-systems-discovery; null = minimal local inventory
  "targetSavingsPercent": 25,
  "maxRiskTier": 4,                           // 1..5
  "defaultBackupBeforeDestroy": true,
  "backupContainerStorageAccount": null,      // SA name where backups land
  "currency": "USD",
  // Bootstrap (same as discovery)
  "installPolicy": "ask", "preferredAzInstallMethod": null,
  "authMethod": "use-existing", "servicePrincipal": null, "tenantHint": null
}

// aws-systems-cost-reduction.js
{
  "accountId": "string",
  "outputDir": "string",
  "regions": ["us-east-1"],
  "discoveryManifest": null,
  "targetSavingsPercent": 25,
  "maxRiskTier": 4,
  "defaultBackupBeforeDestroy": true,
  "backupS3Bucket": null,
  "currency": "USD",
  "installPolicy": "ask",
  "authMethod": "use-existing", "ssoProfile": null, "assumeRoleArn": null, "staticCredentials": null
}

// gcp-systems-cost-reduction.js
{
  "projectId": "string",
  "outputDir": "string",
  "discoveryManifest": null,
  "billingAccount": null,
  "billingExportDataset": null,               // <project>.<dataset> — strongly recommended
  "targetSavingsPercent": 25,
  "maxRiskTier": 4,
  "defaultBackupBeforeDestroy": true,
  "backupGcsBucket": null,
  "currency": "USD",
  "installPolicy": "ask",
  "authMethod": "use-existing", "serviceAccountKeyFile": null
}
```

## Pipeline pattern

`discovery → cost-reduction` is a 2-step pipeline. Run discovery first; pass the resulting `manifest` JSON object as `inputs.discoveryManifest` to the cost-reduction process. The cost-reduction process re-pulls billing data (which changes daily) but reuses the inventory.

The cost-reduction processes can also run **standalone** (`discoveryManifest: null`) — they fall back to a minimal local inventory using the same bootstrap + auth phase.

## Coverage at a glance

Each discovery process probes a broad set of managed services per cloud. The full list is in the `Service coverage` JSDoc block at the top of each file. Highlights:

- **Azure** — Compute (VMs, VMSS, Disks, Bastion), Containers (AKS, Container Apps, ACI, ACR), Web (ASP/Webapps/Functions/SWA, APIM, Logic Apps), Data (SQL, Postgres, MySQL, Cosmos, Redis, Storage, Synapse, Data Factory, Databricks, HDInsight), Messaging (Service Bus, Event Hub, Event Grid, IoT Hub, SignalR), AI/ML (Cognitive incl. OpenAI, Cognitive Search, ML workspaces), Networking (VNets, NSGs, PIPs, AppGW + WAF, LB, Front Door + AFD, CDN, Traffic Manager, Azure Firewall, VPN, ExpressRoute, Private Endpoints, Private DNS), Identity (Key Vaults), Observability (Log Analytics, App Insights, Grafana), Security (Sentinel, Defender, DDoS).

- **AWS** — Compute (EC2, EBS, ASGs, Outposts), Containers (EKS, ECS, Fargate, ECR), Serverless / Web (Lambda + Function URLs, API Gateway REST + v2, AppSync, Amplify, Step Functions, Cognito), Data (RDS + Aurora, DynamoDB, ElastiCache, Redshift, OpenSearch, Glue, Athena, EMR, Kinesis, MSK, MQ), Messaging (SQS, SNS, EventBridge, Kinesis, MSK), Storage (S3, EFS, FSx, Storage Gateway, Backup, DataSync), Networking (VPCs, subnets, NAT GWs, EIPs, VPC endpoints, Transit Gateway, Direct Connect, Network Firewall, ALB/NLB/CLB + target groups, CloudFront, Route53, Global Accelerator, WAF, Shield), Identity/Secrets (IAM, KMS, Secrets Manager, SSM Parameter Store), Observability (CloudWatch, X-Ray, CloudTrail, Config), AI/ML (SageMaker, Bedrock, Comprehend, Lex, Polly, Rekognition).

- **GCP** — Compute (Compute Engine, MIGs), Containers (GKE Standard + Autopilot, Cloud Run services + jobs, Cloud Functions Gen1+Gen2, Cloud Build, Artifact Registry, GCR), Data (Cloud SQL, Spanner, Bigtable, Memorystore Redis+Memcache, Firestore, BigQuery, Dataflow, Dataproc, Cloud Composer), AI/ML (Vertex AI, AI Platform), Storage (GCS, Filestore), Messaging (Pub/Sub, Cloud Tasks, Cloud Scheduler, Cloud Workflows, Eventarc), Networking (VPC + subnets + peerings + Shared VPC, GCLB HTTP(S)/TCP/UDP/internal, Cloud DNS, Cloud Armor, Cloud CDN, Cloud NAT, Cloud Interconnect, Cloud VPN, IAP), Identity (Cloud KMS, Secret Manager), Observability (Cloud Logging, Monitoring, Trace, Profiler), API/Edge (Apigee, Cloud Endpoints), Specialty (Healthcare API, Anthos).

## Origin

Extracted from a real Azure cleanup run on 2026-04-19 that took an account from $5,689/mo down to ~$1,150/mo (80% reduction) over multiple breakpoint-gated rounds. The patterns (per-action gates, backup-before-destroy, wildcard surface flagging, AGIC parsing, runtime-spec-read, agent-only no-FS-contract, bootstrap-first auth) all came from solving real ambiguities during that run — including the case where the cluster was found to be `Stopped` and "delete cluster completely" had to be expanded to wipe a webapp + 2 Cosmos DBs that were the cluster's data backings.
