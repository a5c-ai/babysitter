# DevOps, SRE, and Platform Engineering - References

Comprehensive reference materials for DevOps practices, Site Reliability Engineering principles, and Platform Engineering methodologies.

## CI/CD Pipelines

### Core Concepts
- **Continuous Integration (CI)**: Automated building and testing of code changes
- **Continuous Delivery (CD)**: Automated deployment to staging/production environments
- **Continuous Deployment**: Fully automated release pipeline without manual approval
- **Pipeline as Code**: Version-controlled pipeline definitions (Jenkinsfile, GitHub Actions YAML, GitLab CI)

### Tools and Platforms
- **Jenkins**: Open-source automation server - https://www.jenkins.io/
- **GitHub Actions**: Native CI/CD for GitHub repositories - https://github.com/features/actions
- **GitLab CI/CD**: Integrated CI/CD in GitLab - https://docs.gitlab.com/ee/ci/
- **CircleCI**: Cloud-native CI/CD platform - https://circleci.com/
- **Travis CI**: CI service for GitHub projects - https://travis-ci.org/
- **Azure DevOps Pipelines**: Microsoft's CI/CD solution - https://azure.microsoft.com/en-us/products/devops/pipelines/
- **AWS CodePipeline**: AWS native CI/CD service - https://aws.amazon.com/codepipeline/
- **Argo CD**: GitOps continuous delivery for Kubernetes - https://argo-cd.readthedocs.io/
- **Tekton**: Cloud-native CI/CD framework - https://tekton.dev/

### Best Practices
- **Fast feedback loops**: Keep pipeline execution time under 10 minutes
- **Fail fast**: Run fastest tests first, stop on first failure
- **Artifact versioning**: Semantic versioning, immutable artifacts
- **Security scanning**: SAST, DAST, dependency scanning in pipeline
- **Deployment gates**: Automated quality gates and approval workflows
- **Rollback strategies**: Automated rollback on failure detection

### References
- **Book**: "Continuous Delivery" by Jez Humble and David Farley - https://continuousdelivery.com/
- **Book**: "The DevOps Handbook" by Gene Kim et al. - https://itrevolution.com/product/the-devops-handbook/
- **Article**: "State of DevOps Report 2023" - https://www.devops-research.com/research.html
- **Guide**: "GitLab CI/CD Guide" - https://about.gitlab.com/topics/ci-cd/

## Infrastructure as Code (IaC)

### Terraform
- **Overview**: Declarative infrastructure provisioning across multiple cloud providers
- **Official Documentation**: https://www.terraform.io/docs
- **HashiCorp Learn**: https://learn.hashicorp.com/terraform
- **Best Practices**:
  - Use remote state with state locking
  - Separate environments (dev, staging, prod)
  - Module composition for reusability
  - Use workspaces or separate state files per environment
  - Version pinning for providers and modules
- **Key Concepts**:
  - **Providers**: AWS, Azure, GCP, Kubernetes, etc.
  - **Resources**: Infrastructure components (VMs, networks, storage)
  - **Modules**: Reusable infrastructure templates
  - **State**: Current infrastructure state tracking
  - **Plan/Apply cycle**: Preview and execute changes
- **References**:
  - "Terraform: Up & Running" by Yevgeniy Brikman - https://www.terraformupandrunning.com/
  - "Terraform Best Practices" - https://www.terraform-best-practices.com/

### Ansible
- **Overview**: Agentless configuration management and automation
- **Official Documentation**: https://docs.ansible.com/
- **Ansible Galaxy**: Community roles and collections - https://galaxy.ansible.com/
- **Best Practices**:
  - Idempotent playbooks (safe to run multiple times)
  - Use roles for organization
  - Separate inventory per environment
  - Vault for secrets management
  - Testing with Molecule
- **Key Concepts**:
  - **Playbooks**: YAML-based automation scripts
  - **Roles**: Reusable automation units
  - **Inventory**: Target host definitions
  - **Modules**: Task execution units
  - **Handlers**: Triggered actions (e.g., service restart)
- **Use Cases**:
  - Configuration management
  - Application deployment
  - Orchestration
  - Provisioning
- **References**:
  - "Ansible for DevOps" by Jeff Geerling - https://www.ansiblefordevops.com/
  - Ansible documentation - https://docs.ansible.com/ansible/latest/index.html

### Other IaC Tools
- **Pulumi**: Infrastructure as Code using programming languages (Python, TypeScript, Go) - https://www.pulumi.com/
- **CloudFormation**: AWS native IaC - https://aws.amazon.com/cloudformation/
- **ARM Templates**: Azure native IaC - https://docs.microsoft.com/en-us/azure/azure-resource-manager/templates/
- **Google Cloud Deployment Manager**: GCP native IaC - https://cloud.google.com/deployment-manager
- **Crossplane**: Kubernetes-based infrastructure management - https://www.crossplane.io/

### IaC Best Practices
- **Version control**: All IaC in Git
- **Code review**: Pull requests for infrastructure changes
- **Testing**: Unit tests, integration tests, policy validation
- **Documentation**: Self-documenting code with comments
- **Modularization**: DRY principle, reusable modules
- **Security**: Secrets management, least privilege access
- **References**:
  - "Infrastructure as Code" by Kief Morris - https://infrastructure-as-code.com/

## Container Orchestration (Kubernetes)

### Core Kubernetes Concepts
- **Pods**: Smallest deployable units
- **Deployments**: Declarative pod management
- **Services**: Network abstraction for pods
- **Ingress**: HTTP/HTTPS routing
- **ConfigMaps/Secrets**: Configuration and sensitive data
- **StatefulSets**: Stateful application management
- **DaemonSets**: Node-level pod deployment
- **Jobs/CronJobs**: Batch processing and scheduled tasks

### Kubernetes Resources
- **Official Documentation**: https://kubernetes.io/docs/
- **Kubernetes Patterns**: https://k8spatterns.io/
- **CNCF Landscape**: https://landscape.cncf.io/
- **Kubernetes the Hard Way**: https://github.com/kelseyhightower/kubernetes-the-hard-way
- **Book**: "Kubernetes in Action" by Marko Luksa
- **Book**: "Kubernetes: Up and Running" by Kelsey Hightower et al.

### Kubernetes Distributions and Managed Services
- **EKS**: Amazon Elastic Kubernetes Service - https://aws.amazon.com/eks/
- **GKE**: Google Kubernetes Engine - https://cloud.google.com/kubernetes-engine
- **AKS**: Azure Kubernetes Service - https://azure.microsoft.com/en-us/products/kubernetes-service
- **OpenShift**: Red Hat enterprise Kubernetes - https://www.redhat.com/en/technologies/cloud-computing/openshift
- **Rancher**: Multi-cluster Kubernetes management - https://rancher.com/
- **k3s**: Lightweight Kubernetes - https://k3s.io/
- **MicroK8s**: Canonical's lightweight Kubernetes - https://microk8s.io/

### Kubernetes Tooling
- **kubectl**: Command-line tool - https://kubernetes.io/docs/reference/kubectl/
- **Helm**: Package manager for Kubernetes - https://helm.sh/
- **Kustomize**: Template-free Kubernetes configuration - https://kustomize.io/
- **Skaffold**: Development workflow automation - https://skaffold.dev/
- **Telepresence**: Local development with remote Kubernetes - https://www.telepresence.io/
- **Kubectx/Kubens**: Context and namespace switching - https://github.com/ahmetb/kubectx
- **K9s**: Terminal UI for Kubernetes - https://k9scli.io/

### Service Mesh
- **Istio**: Service mesh for microservices - https://istio.io/
- **Linkerd**: Lightweight service mesh - https://linkerd.io/
- **Consul**: HashiCorp service mesh - https://www.consul.io/
- **Key Features**: Traffic management, security, observability, policy enforcement

### Container Runtimes
- **containerd**: Industry-standard container runtime - https://containerd.io/
- **CRI-O**: Lightweight container runtime for Kubernetes - https://cri-o.io/
- **Docker**: Container platform - https://www.docker.com/

### Best Practices
- **Resource limits**: CPU and memory requests/limits
- **Health checks**: Liveness and readiness probes
- **Rolling updates**: Zero-downtime deployments
- **Horizontal Pod Autoscaling (HPA)**: Automatic scaling based on metrics
- **Network policies**: Pod-to-pod communication control
- **RBAC**: Role-based access control
- **Pod Security Standards**: Security policies for pod specifications
- **References**:
  - "Production Kubernetes" by Josh Rosso et al.
  - Kubernetes production best practices - https://learnk8s.io/production-best-practices

## Observability

### The Three Pillars of Observability
1. **Metrics**: Quantitative measurements (CPU, memory, request rate)
2. **Logs**: Textual event records
3. **Traces**: Request flow through distributed systems

### Prometheus
- **Overview**: Open-source monitoring and alerting toolkit
- **Official Documentation**: https://prometheus.io/docs/
- **Key Concepts**:
  - **Time-series database**: Metrics storage
  - **PromQL**: Query language for metrics
  - **Pull model**: Scrapes metrics from targets
  - **Exporters**: Expose metrics from systems (node_exporter, blackbox_exporter)
  - **Alertmanager**: Alert routing and grouping
- **Best Practices**:
  - Use labels for dimensionality
  - Set appropriate scrape intervals
  - Implement recording rules for complex queries
  - Use federation for multi-cluster setups
- **References**:
  - "Prometheus: Up & Running" by Brian Brazil - https://www.oreilly.com/library/view/prometheus-up/9781492034131/
  - Prometheus best practices - https://prometheus.io/docs/practices/

### Grafana
- **Overview**: Visualization and analytics platform
- **Official Documentation**: https://grafana.com/docs/
- **Key Features**:
  - **Dashboards**: Customizable visualization panels
  - **Data sources**: Prometheus, Loki, Elasticsearch, InfluxDB, etc.
  - **Alerting**: Alert rules and notification channels
  - **Plugins**: Extensible visualization and data source plugins
- **Dashboard Best Practices**:
  - Use template variables for flexibility
  - Organize by service or team
  - Include SLO/SLI dashboards
  - Document dashboard purpose and usage
- **References**:
  - Grafana tutorials - https://grafana.com/tutorials/
  - Community dashboards - https://grafana.com/grafana/dashboards/

### Logging
- **ELK Stack**: Elasticsearch, Logstash, Kibana - https://www.elastic.co/elastic-stack
- **Loki**: Log aggregation by Grafana Labs - https://grafana.com/oss/loki/
- **Fluentd**: Unified logging layer - https://www.fluentd.org/
- **Fluent Bit**: Lightweight log processor - https://fluentbit.io/
- **CloudWatch Logs**: AWS native logging - https://aws.amazon.com/cloudwatch/
- **Splunk**: Enterprise logging platform - https://www.splunk.com/
- **Best Practices**:
  - Structured logging (JSON format)
  - Consistent log levels (DEBUG, INFO, WARN, ERROR)
  - Include context (request ID, user ID, trace ID)
  - Log rotation and retention policies
  - Centralized logging for distributed systems

### Distributed Tracing
- **OpenTelemetry**: Unified observability framework - https://opentelemetry.io/
- **Jaeger**: Distributed tracing platform - https://www.jaegertracing.io/
- **Zipkin**: Distributed tracing system - https://zipkin.io/
- **Tempo**: Distributed tracing by Grafana Labs - https://grafana.com/oss/tempo/
- **AWS X-Ray**: AWS distributed tracing - https://aws.amazon.com/xray/
- **Key Concepts**:
  - **Spans**: Individual operation in a trace
  - **Traces**: End-to-end request flow
  - **Context propagation**: Passing trace context across services
  - **Sampling**: Selective trace collection

### Application Performance Monitoring (APM)
- **New Relic**: Full-stack observability - https://newrelic.com/
- **Datadog**: Monitoring and analytics - https://www.datadoghq.com/
- **Dynatrace**: Application monitoring - https://www.dynatrace.com/
- **AppDynamics**: APM platform - https://www.appdynamics.com/
- **Elastic APM**: Elasticsearch-based APM - https://www.elastic.co/apm

### Observability Best Practices
- **Instrument everything**: Applications, infrastructure, business metrics
- **Use common standards**: OpenTelemetry, Prometheus metrics format
- **Correlation**: Link metrics, logs, and traces
- **Alerting on symptoms**: Alert on user-facing issues, not internal metrics
- **Dashboard design**: Clear, actionable visualizations
- **References**:
  - "Observability Engineering" by Charity Majors et al. - https://www.oreilly.com/library/view/observability-engineering/9781492076438/
  - Google SRE book on monitoring - https://sre.google/sre-book/monitoring-distributed-systems/

## SRE Principles

### Core SRE Concepts
- **Error Budgets**: Acceptable level of unreliability
- **Service Level Objectives (SLOs)**: Target reliability levels
- **Service Level Indicators (SLIs)**: Measurable reliability metrics
- **Service Level Agreements (SLAs)**: Contractual reliability guarantees
- **Toil**: Manual, repetitive, automatable work (should be <50% of SRE time)
- **Blameless Postmortems**: Learning from incidents without blame

### SLOs, SLIs, and SLAs

#### Service Level Indicators (SLIs)
- **Definition**: Quantitative measure of service level
- **Examples**:
  - Request latency (95th percentile < 200ms)
  - Availability (99.9% of requests succeed)
  - Throughput (handle 10,000 requests/second)
  - Correctness (99.99% of data processed correctly)
- **Best Practices**:
  - User-centric metrics
  - Measurable and actionable
  - Aligned with user expectations

#### Service Level Objectives (SLOs)
- **Definition**: Target value or range for SLIs
- **Examples**:
  - 99.9% availability (43.2 minutes downtime/month)
  - 95% of requests < 200ms latency
  - 99.99% of API calls return correct results
- **Setting SLOs**:
  - Start with current performance
  - Balance reliability vs. development velocity
  - Review and adjust quarterly
  - Document clearly and communicate widely

#### Service Level Agreements (SLAs)
- **Definition**: Contractual commitment with consequences for breach
- **Example**: "99.9% uptime or customer receives service credits"
- **Relationship**: SLA < SLO < actual performance (safety buffer)

#### Error Budgets
- **Definition**: Acceptable amount of downtime (100% - SLO)
- **Example**: 99.9% SLO = 0.1% error budget = 43.2 minutes/month
- **Usage**:
  - Budget available: Ship new features
  - Budget exhausted: Focus on reliability
  - Balances innovation with stability
- **References**:
  - "Implementing Service Level Objectives" by Alex Hidalgo - https://www.oreilly.com/library/view/implementing-service-level/9781492076803/

### Google SRE Books
- **Site Reliability Engineering** (The SRE Book) - https://sre.google/sre-book/table-of-contents/
- **The Site Reliability Workbook** - https://sre.google/workbook/table-of-contents/
- **Building Secure and Reliable Systems** - https://sre.google/books/building-secure-reliable-systems/

### SRE Practices
- **Capacity planning**: Forecasting and resource allocation
- **Change management**: Controlled rollouts, progressive delivery
- **Demand forecasting**: Predicting load and scaling needs
- **Provisioning**: Automated infrastructure scaling
- **Efficiency and performance**: Optimization and cost management

### On-Call and Incident Management
- **On-call rotations**: Shared responsibility, manageable workload
- **Alerting best practices**: Actionable, low noise, proper escalation
- **Incident response playbooks**: Runbooks for common scenarios
- **Post-incident reviews**: Blameless retrospectives
- **Tools**:
  - PagerDuty - https://www.pagerduty.com/
  - Opsgenie - https://www.atlassian.com/software/opsgenie
  - VictorOps (Splunk On-Call) - https://www.splunk.com/en_us/products/on-call.html

### References
- **Book**: "Site Reliability Engineering" by Google - https://sre.google/books/
- **Book**: "Seeking SRE" - https://www.oreilly.com/library/view/seeking-sre/9781491978856/
- **Article**: "SRE vs DevOps" - https://sre.google/resources/practices-and-processes/sre-vs-devops/

## Chaos Engineering

### Core Principles
- **Build hypothesis**: Define steady state and expected behavior
- **Vary real-world events**: Inject failures that could happen in production
- **Run experiments in production**: Test in realistic conditions
- **Automate experiments**: Continuous chaos testing
- **Minimize blast radius**: Contain experiment impact

### Chaos Engineering Tools
- **Chaos Monkey**: Netflix's failure injection - https://netflix.github.io/chaosmonkey/
- **Chaos Toolkit**: Open-source chaos engineering - https://chaostoolkit.org/
- **Gremlin**: Chaos engineering platform - https://www.gremlin.com/
- **Litmus**: Kubernetes-native chaos engineering - https://litmuschaos.io/
- **Chaos Mesh**: Cloud-native chaos engineering - https://chaos-mesh.org/
- **AWS Fault Injection Simulator**: Managed chaos engineering - https://aws.amazon.com/fis/

### Failure Scenarios
- **Instance failures**: Kill pods/VMs/containers
- **Network failures**: Latency, packet loss, partition
- **Resource exhaustion**: CPU, memory, disk pressure
- **Dependency failures**: Downstream service unavailability
- **Time-based failures**: Clock skew, timeouts

### Best Practices
- **Start small**: Begin with non-critical systems
- **Have rollback**: Quick experiment termination
- **Monitor closely**: Observe system behavior during experiments
- **Document findings**: Share learnings organization-wide
- **Progressive complexity**: Increase experiment scope gradually

### References
- **Book**: "Chaos Engineering" by Casey Rosenthal and Nora Jones - https://www.oreilly.com/library/view/chaos-engineering/9781491988459/
- **Principles of Chaos Engineering**: https://principlesofchaos.org/
- **Netflix Tech Blog**: https://netflixtechblog.com/tagged/chaos-engineering

## Deployment Strategies

### Blue-Green Deployment
- **Concept**: Two identical production environments (Blue: current, Green: new)
- **Process**:
  1. Deploy new version to Green environment
  2. Test Green thoroughly
  3. Switch traffic from Blue to Green
  4. Keep Blue as instant rollback option
- **Benefits**: Zero downtime, instant rollback, full testing before switch
- **Drawbacks**: Double infrastructure cost, database migration complexity
- **Tools**: Load balancer configuration, DNS switching, service mesh routing

### Canary Deployment
- **Concept**: Gradual rollout to subset of users
- **Process**:
  1. Deploy new version to small percentage of servers (e.g., 5%)
  2. Monitor metrics and errors
  3. Gradually increase traffic (10%, 25%, 50%, 100%)
  4. Rollback if issues detected
- **Benefits**: Early issue detection, limited blast radius, data-driven rollout
- **Canary metrics**: Error rate, latency, user complaints, business metrics
- **Tools**:
  - Flagger (Kubernetes) - https://flagger.app/
  - Argo Rollouts - https://argoproj.github.io/rollouts/
  - Spinnaker - https://spinnaker.io/

### Rolling Deployment
- **Concept**: Incremental replacement of old instances
- **Process**: Replace instances one-by-one or in batches
- **Benefits**: No additional infrastructure, gradual rollout
- **Drawbacks**: Slower rollout, multiple versions running simultaneously

### Feature Flags (Feature Toggles)
- **Concept**: Control feature visibility without deployment
- **Use cases**: A/B testing, gradual rollouts, kill switches
- **Tools**:
  - LaunchDarkly - https://launchdarkly.com/
  - Unleash - https://www.getunleash.io/
  - Flagsmith - https://flagsmith.com/
  - Split.io - https://www.split.io/

### Progressive Delivery
- **Concept**: Combination of deployment strategies with metrics and automation
- **Components**: Canary deployment + metrics + automated promotion/rollback
- **Tools**: Flagger, Argo Rollouts, Spinnaker

### References
- **Article**: "Deployment Strategies" by Martin Fowler - https://martinfowler.com/bliki/BlueGreenDeployment.html
- **Book**: "Continuous Delivery" - https://continuousdelivery.com/

## GitOps

### Core Principles
1. **Declarative**: Desired system state in Git
2. **Versioned and immutable**: Git history as source of truth
3. **Pulled automatically**: Automated deployment from Git
4. **Continuously reconciled**: Actual state matches desired state

### GitOps Tools
- **Argo CD**: Declarative GitOps for Kubernetes - https://argo-cd.readthedocs.io/
- **Flux**: GitOps operator for Kubernetes - https://fluxcd.io/
- **Jenkins X**: GitOps for CI/CD - https://jenkins-x.io/
- **Fleet**: GitOps for multi-cluster Kubernetes - https://fleet.rancher.io/

### GitOps Workflow
1. Developer commits code change to Git
2. CI builds container image and updates manifest in Git
3. GitOps operator detects change
4. Operator pulls new state and applies to cluster
5. Cluster state continuously reconciled with Git

### Repository Structure
- **Application repository**: Source code
- **Configuration repository**: Kubernetes manifests, Helm charts, Kustomize overlays
- **Separation of concerns**: Different access controls

### Benefits
- **Single source of truth**: Git is the authoritative source
- **Audit trail**: Full history of changes
- **Rollback**: Git revert for instant rollback
- **Disaster recovery**: Cluster can be rebuilt from Git
- **Collaboration**: Pull requests for infrastructure changes

### Best Practices
- **Separate repos**: Application code vs. configuration
- **Environment branches**: main (production), staging, development
- **Automated sync**: Continuous reconciliation
- **Drift detection**: Alert when actual state differs from Git
- **Secret management**: External secret stores (Vault, Sealed Secrets)

### References
- **OpenGitOps Principles**: https://opengitops.dev/
- **Article**: "What is GitOps?" by Weaveworks - https://www.weave.works/technologies/gitops/
- **Guide**: "GitOps Guide to the Galaxy" - https://www.weave.works/blog/gitops-guide-to-the-galaxy

## Incident Response

### Incident Management Framework
1. **Detection**: Monitoring, alerting, user reports
2. **Triage**: Assess severity and impact
3. **Response**: Mitigate and resolve
4. **Recovery**: Restore normal operations
5. **Post-incident review**: Learn and improve

### Severity Levels
- **SEV-1 (Critical)**: Complete service outage, major revenue impact
- **SEV-2 (High)**: Partial outage, significant user impact
- **SEV-3 (Medium)**: Degraded performance, limited impact
- **SEV-4 (Low)**: Minor issues, minimal impact

### Incident Roles
- **Incident Commander**: Coordinates response
- **Communications Lead**: Internal and external communications
- **Technical Lead**: Drives technical resolution
- **Scribe**: Documents timeline and actions

### Incident Response Tools
- **PagerDuty**: Incident management platform - https://www.pagerduty.com/
- **Opsgenie**: Alert and on-call management - https://www.atlassian.com/software/opsgenie
- **Statuspage**: Status communication - https://www.atlassian.com/software/statuspage
- **Slack/Microsoft Teams**: Incident communication channels

### Post-Incident Reviews (Postmortems)
- **Blameless culture**: Focus on systems, not individuals
- **Timeline**: Detailed sequence of events
- **Root cause analysis**: Five whys, fishbone diagrams
- **Action items**: Preventive measures and improvements
- **Follow-up**: Track and implement action items

### References
- **Book**: "Incident Management for Operations" by Rob Schnepp et al. - https://www.oreilly.com/library/view/incident-management-for/9781491917619/
- **Google SRE**: "Managing Incidents" - https://sre.google/sre-book/managing-incidents/
- **PagerDuty Incident Response Guide**: https://response.pagerduty.com/

## Security and Compliance

### DevSecOps
- **Shift left**: Security earlier in development
- **Automated security testing**: SAST, DAST, dependency scanning
- **Container security**: Image scanning, runtime security
- **Secrets management**: Vault, AWS Secrets Manager, Azure Key Vault

### Tools
- **Snyk**: Developer security platform - https://snyk.io/
- **Aqua Security**: Container security - https://www.aquasec.com/
- **Falco**: Runtime security for Kubernetes - https://falco.org/
- **HashiCorp Vault**: Secrets management - https://www.vaultproject.io/

## Cloud Providers

### Multi-Cloud Resources
- **AWS**: https://aws.amazon.com/documentation/
- **Azure**: https://docs.microsoft.com/en-us/azure/
- **Google Cloud**: https://cloud.google.com/docs
- **DigitalOcean**: https://docs.digitalocean.com/

## Platform Engineering

### Internal Developer Platforms (IDPs)
- **Concept**: Self-service platforms for developers
- **Components**:
  - Service catalog
  - CI/CD templates
  - Infrastructure templates
  - Observability integration
  - Developer portals
- **Tools**:
  - Backstage (Spotify) - https://backstage.io/
  - Humanitec - https://humanitec.com/
  - Port - https://www.getport.io/

### Platform as a Product
- **Philosophy**: Treat internal platform as a product
- **Focus**: Developer experience, self-service, documentation
- **Metrics**: Developer satisfaction, time to deploy, adoption rate

### References
- **Book**: "Team Topologies" by Matthew Skelton and Manuel Pais - https://teamtopologies.com/
- **Article**: "What is Platform Engineering?" - https://platformengineering.org/

## Additional Resources

### Community and Forums
- **DevOps Subreddit**: https://www.reddit.com/r/devops/
- **SRE Subreddit**: https://www.reddit.com/r/SRE/
- **CNCF Community**: https://www.cncf.io/community/
- **DevOps.com**: https://devops.com/

### Conferences
- **KubeCon + CloudNativeCon**: https://www.cncf.io/kubecon-cloudnativecon-events/
- **DevOps Enterprise Summit**: https://events.itrevolution.com/
- **SREcon**: https://www.usenix.org/conferences/byname/925

### Certifications
- **CKA**: Certified Kubernetes Administrator - https://www.cncf.io/certification/cka/
- **CKAD**: Certified Kubernetes Application Developer - https://www.cncf.io/certification/ckad/
- **AWS Certified DevOps Engineer**: https://aws.amazon.com/certification/certified-devops-engineer-professional/
- **Azure DevOps Engineer Expert**: https://docs.microsoft.com/en-us/learn/certifications/devops-engineer/
- **Terraform Associate**: https://www.hashicorp.com/certification/terraform-associate

---

**Last Updated**: 2026-01-23
**Version**: 1.0.0
