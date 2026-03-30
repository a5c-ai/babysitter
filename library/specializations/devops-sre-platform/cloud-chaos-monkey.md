# Cloud Chaos Monkey — Babysitter Process Template

A generic, cloud-agnostic chaos monkey process that drives an AI agent through a
structured 12-phase resilience testing pipeline: from service discovery through
shadow environment provisioning, chaos scenario execution across 4 fault domains,
resilience scoring across 5 dimensions (0-100), and interactive HTML report
generation.

The process is **cloud-agnostic** (supports GCP, AWS, Azure, and custom
providers), **safety-first** (shadow environments only — never touches
production), **quality-scored** (resilience score 0-100 across 5 dimensions),
and **safe** (breakpoints pause for human approval at key decision points).

---

## Pipeline Overview

```
  +-------------------------------------------------------------------+
  |                                                                   |
  |  Phase 1           Phase 2                Phase 3                 |
  |  DISCOVERY -------> COMPONENT ----------> SHADOW ENV              |
  |  Scan infra         SELECTION              PLANNING               |
  |  Map services        |                    Resource list            |
  |  Detect deps         v                    Wiring plan              |
  |                   [breakpoint:                                     |
  |                    user picks                                      |
  |                    components]                                     |
  |                                                                   |
  |  Phase 4           Phase 5                Phase 6                 |
  |  COST             SHADOW ENV             SCENARIO                 |
  |  ESTIMATION -----> PROVISIONING --------> GENERATION              |
  |  Line-item          |                    4 fault domains           |
  |  breakdown          v                    Per-component             |
  |     |            [breakpoint:                                      |
  |     v             approve cost]                                    |
  |  [breakpoint:                                                      |
  |   approve cost]                                                    |
  |                                                                   |
  |  Phase 7           Phase 8                Phase 9                 |
  |  SCENARIO --------> BASELINE ----------> CHAOS                    |
  |  SELECTION          MEASUREMENT           EXECUTION               |
  |     |              Health probes          Run scenarios             |
  |     v              Latency baseline       Measure impact            |
  |  [breakpoint:                             Auto-abort safety         |
  |   approve                                                          |
  |   scenarios]                                                       |
  |                                                                   |
  |  Phase 10          Phase 11               Phase 12                |
  |  ANALYSIS --------> REPORT -------------> TEARDOWN                |
  |  Score 0-100        Interactive HTML       Destroy shadow           |
  |  5 dimensions       Apple-style design     resources                |
  |  Recommendations    Charts & cards                                 |
  |                                                                   |
  +-------------------------------------------------------------------+
```

---

## Input Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `provider` | enum | Yes | -- | Cloud provider: `gcp`, `aws`, `azure`, or `custom`. |
| `projectIdentifier` | string | Yes | -- | Cloud project or account identifier (GCP project ID, AWS account ID, Azure subscription ID). |
| `region` | string | Yes | -- | Primary deployment region (e.g., `us-central1`, `us-east-1`, `westeurope`). |
| `chaosPrefix` | string | No | `"chaos"` | Prefix for shadow resource names. Shadow services are named `{prefix}-{originalName}`. |
| `faultDomains` | string[] | No | all 4 | Fault domains to test: `service-crashes`, `network-latency`, `data-layer`, `external-apis`. |
| `executionMode` | enum | No | `"hybrid"` | How scenarios execute: `hybrid`, `automated`, or `manual`. |
| `safetyControls` | object | No | see below | Safety guardrails: `autoAbort`, `maxErrorRatePercent`, `rollbackTimeoutSeconds`. |
| `healthCheckConfig` | object | No | see below | Health check probes: `sampleCount`, `timeoutSeconds`. |
| `reportOutputPath` | string | No | `"docs/chaos-report.html"` | File path for the generated HTML report. |
| `reportTheme` | enum | No | `"dark"` | Report color theme: `dark` or `light`. |

See `cloud-chaos-monkey-inputs.schema.json` for the full JSON Schema (draft-07).

### Safety Controls Defaults

```json
{
  "autoAbort": true,
  "maxErrorRatePercent": 50,
  "rollbackTimeoutSeconds": 120
}
```

### Health Check Defaults

```json
{
  "sampleCount": 5,
  "timeoutSeconds": 10
}
```

---

## Output Fields

| Field | Type | Description |
|---|---|---|
| `success` | boolean | Whether the process completed successfully. |
| `phasesExecuted` | string[] | Names of phases that ran. |
| `discovery` | object or null | Phase 1 service discovery result. |
| `selectedComponents` | object or null | Phase 2 user-selected components for testing. |
| `shadowPlan` | object or null | Phase 3 shadow environment plan. |
| `costEstimate` | object or null | Phase 4 cost estimation result. |
| `shadowEnv` | object or null | Phase 5 provisioned shadow environment details. |
| `scenarios` | object or null | Phase 6 generated chaos scenarios. |
| `selectedScenarios` | object or null | Phase 7 user-approved scenarios. |
| `baseline` | object or null | Phase 8 baseline health measurements. |
| `chaosResults` | array | Phase 9 chaos execution results per scenario. |
| `analysis` | object or null | Phase 10 resilience analysis and scoring. |
| `report` | object or null | Phase 11 HTML report generation result. |
| `teardown` | object or null | Phase 12 shadow environment teardown result. |
| `resilienceScore` | number | Overall resilience score (0-100). |
| `metadata` | object | `{ processId, provider, timestamp }` — process identification. |

---

## Phase Descriptions

### Phase 1: Service Discovery

A cloud infrastructure analyst agent scans the project using provider-specific
CLI commands to discover all running services, their configurations, regions,
dependencies, and inter-service connections. Produces a complete service
inventory with dependency graph.

### Phase 2: Component Selection

A breakpoint pauses for human review of discovered services. The user selects
which components to include in chaos testing, allowing focused testing of
critical paths without disrupting the full infrastructure.

### Phase 3: Shadow Environment Planning

A shadow environment architect agent designs a complete shadow environment plan:
which services need to be cloned, how they wire together, naming conventions
(`{chaosPrefix}-{name}`), and isolation guarantees. Shadow services connect to
each other, never to production.

### Phase 4: Cost Estimation

A cloud cost analyst agent estimates the cost of running the shadow environment
for the duration of chaos testing. Produces a line-item breakdown per service
and total estimated cost. A breakpoint pauses for human approval before
provisioning.

### Phase 5: Shadow Environment Provisioning

A cloud infrastructure engineer agent provisions the shadow environment using
provider-specific CLI commands. Creates all cloned services, configures
networking, and verifies the shadow environment is healthy and isolated.

### Phase 6: Scenario Generation

A chaos engineering specialist agent generates chaos scenarios across the
selected fault domains:

- **Service Crashes**: Process kills, OOM simulation, restart loops
- **Network Latency**: Artificial delays, packet loss, DNS failures
- **Data Layer**: Connection pool exhaustion, slow queries, replication lag
- **External APIs**: Timeout simulation, rate limiting, malformed responses

Each scenario includes expected behavior, blast radius, and rollback procedure.

### Phase 7: Scenario Selection

A breakpoint pauses for human review and approval of generated scenarios. Users
can exclude scenarios they consider too risky or irrelevant.

### Phase 8: Baseline Measurement

A reliability engineer agent measures baseline health metrics for all services
in the shadow environment: response times, error rates, throughput, and resource
utilization. These baselines are used to measure chaos impact.

### Phase 9: Chaos Execution

A chaos execution specialist agent runs approved scenarios one at a time against
the shadow environment, measuring impact after each. Safety controls auto-abort
if error rates exceed the configured threshold. Each scenario produces:
- Pre-execution health snapshot
- Execution steps and observations
- Post-execution health snapshot
- Recovery time measurement

### Phase 10: Resilience Analysis

A senior SRE agent analyzes all chaos results and scores resilience across 5
dimensions (0-100):

| Dimension | Points | What is scored |
|---|---|---|
| Recovery Speed | 25 | Time to recover from failures |
| Error Handling | 25 | Graceful degradation and error responses |
| Data Integrity | 20 | Data consistency during and after chaos |
| Observability | 15 | Logging, alerting, and detection capability |
| Blast Radius Containment | 15 | Failure isolation effectiveness |

Produces prioritized recommendations for improving resilience.

### Phase 11: Report Generation

A report generation agent produces an interactive HTML report with Apple-style
design: Inter + DM Mono fonts, frosted glass navigation, animated score ring,
scenario cards with severity badges, and responsive layout. The report includes
all phases, findings, recommendations, and the architecture diagram.

### Phase 12: Teardown

A cloud infrastructure engineer agent destroys all shadow environment resources
to avoid ongoing costs. Verifies complete cleanup and reports any resources that
could not be removed.

---

## Safety Mechanisms

1. **Shadow environments only.** All chaos testing happens in isolated shadow
   clones. Production services are never modified or disrupted.

2. **Breakpoint after discovery.** Human reviews discovered services and selects
   which components to test.

3. **Breakpoint after cost estimation.** Human approves the estimated cost
   before any resources are provisioned.

4. **Breakpoint after scenario generation.** Human reviews and approves each
   chaos scenario before execution.

5. **Auto-abort safety controls.** If error rates exceed the configured
   threshold during chaos execution, the process automatically aborts and
   initiates rollback.

6. **Guaranteed teardown.** Shadow environment teardown runs even if chaos
   execution fails, preventing orphaned resources and unexpected costs.

---

## Provider Support

The process uses a `PROVIDER_HINTS` map to generate provider-aware agent prompts
without hardcoding any provider-specific logic:

| Provider | CLI | Container Service | Serverless | Database | Logging |
|---|---|---|---|---|---|
| GCP | `gcloud` | Cloud Run | Cloud Functions | Firestore / Cloud SQL | Cloud Logging |
| AWS | `aws` | ECS / Fargate | Lambda | DynamoDB / RDS | CloudWatch Logs |
| Azure | `az` | Container Apps / ACI | Azure Functions | CosmosDB / SQL Database | Azure Monitor |
| Custom | provider-specific | container-service | serverless-function | database | logging-service |

---

## Usage Examples

### Full chaos test — GCP project

```bash
babysitter run:create \
  --process-id cloud-chaos-monkey \
  --entry cloud-chaos-monkey.js \
  --inputs examples/cloud-chaos-monkey/gcp-full-run.json
```

### Full chaos test — AWS account

```bash
babysitter run:create \
  --process-id cloud-chaos-monkey \
  --entry cloud-chaos-monkey.js \
  --inputs examples/cloud-chaos-monkey/aws-full-run.json
```

### Minimal run — discovery only

```bash
babysitter run:create \
  --process-id cloud-chaos-monkey \
  --entry cloud-chaos-monkey.js \
  --inputs examples/cloud-chaos-monkey/discovery-only.json
```

---

## Example Input Files

Four ready-to-use example input files are provided in the
`examples/cloud-chaos-monkey/` directory:

| File | Provider | Scenario |
|---|---|---|
| `gcp-full-run.json` | GCP | Finance SaaS with Firebase Hosting, Cloud Run, Firestore — full 12-phase chaos test |
| `aws-full-run.json` | AWS | E-commerce platform with API Gateway, Lambda, DynamoDB, RDS — full 12-phase chaos test |
| `azure-full-run.json` | Azure | B2B API platform with Container Apps, Azure Functions, CosmosDB — full 12-phase chaos test |
| `minimal-defaults.json` | GCP | Minimal input with only required fields, all defaults applied |

---

## Fault Domains

| Domain | Description | Example Scenarios |
|---|---|---|
| `service-crashes` | Process-level failures | Container kill, OOM, restart storm, graceful shutdown |
| `network-latency` | Network degradation | Artificial latency injection, packet loss, DNS failure |
| `data-layer` | Database/storage faults | Connection pool exhaustion, slow queries, replication lag |
| `external-apis` | Third-party failures | Timeout simulation, rate limiting, malformed responses |

---

## Resilience Scoring

The process scores resilience across 5 dimensions, each weighted by importance:

| Dimension | Weight | Criteria |
|---|---|---|
| Recovery Speed | 25% | Time to detect failure, time to recover, automated vs manual recovery |
| Error Handling | 25% | Graceful degradation, meaningful error messages, circuit breakers |
| Data Integrity | 20% | No data loss during chaos, consistency after recovery, backup effectiveness |
| Observability | 15% | Alerts fired, logs captured, metrics available, dashboards useful |
| Blast Radius Containment | 15% | Failure isolation, no cascade, independent service recovery |

**Total: 100 points.**

---

## Report Design

The generated HTML report follows an Apple-style design system:

- **Fonts**: Inter (sans-serif) + DM Mono (monospace)
- **Colors**: Clean whites and grays with semantic status colors (red/yellow/green/blue)
- **Layout**: Frosted glass sticky navigation, card-based sections, responsive grid
- **Visualizations**: Animated SVG score ring, severity badges, finding cards
- **Interactivity**: Smooth-scroll navigation, IntersectionObserver fade-in animations

Both `dark` and `light` themes are supported via the `reportTheme` input.

---

## Contributing

To add a new example input file:

1. Create a JSON file in `examples/cloud-chaos-monkey/`.
2. Validate it against `cloud-chaos-monkey-inputs.schema.json`.
3. Include realistic service configurations and region settings.

To modify the process itself:

1. Edit `cloud-chaos-monkey.js`.
2. Update the input schema if you add or change input fields.
3. Update this documentation to reflect any phase or parameter changes.
4. Verify syntax with `node -c cloud-chaos-monkey.js`.
