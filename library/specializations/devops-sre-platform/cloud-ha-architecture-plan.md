# Cloud HA Architecture Plan — Babysitter Process Template

A generic, cloud-agnostic babysitter process that drives an AI agent through a
structured 8-phase high-availability architecture planning pipeline: from
infrastructure audit through HA design, cost estimation, migration planning,
IaC generation, architecture diagram creation, document compilation, and
quality review.

The process is **cloud-agnostic** (supports GCP, AWS, and Azure),
**diagram-aware** (generates professional DrawIO diagrams via provider-specific
skills), **quality-reviewed** (scored 0-100 across 5 dimensions), and
**safe** (breakpoints pause for human approval at key decision points).

---

## Pipeline Overview

```
                         COMPOSITION PATTERNS
     full-pipeline -----> all 8 phases
     audit-only ---------> phase 1 only
     design-and-plan ----> phases 1-5  (audit through IaC)
     diagrams-only ------> phase 6 only

  +-------------------------------------------------------------------+
  |                                                                   |
  |  Phase 1          Phase 2                Phase 3                  |
  |  AUDIT ---------> HA DESIGN ----------> COST ESTIMATION           |
  |  Gap analysis     2a. Compute HA        Line-item breakdown       |
  |  Risk matrix      2b. Data HA           Budget comparison         |
  |  Remediations     2c. Network HA        Priority cuts             |
  |     |                  |                                          |
  |     v                  v                                          |
  |  [review            [review                                       |
  |   breakpoint]        breakpoint]                                  |
  |                                                                   |
  |  Phase 4            Phase 5              Phase 6                  |
  |  MIGRATION -------> IaC SCRIPTS -------> DIAGRAMS                 |
  |  PLAN               deploy-ha.sh         DrawIO (via skill)       |
  |  Phased steps       monitoring.sh        or ASCII (fallback)      |
  |  Rollback plan      backup.sh            Current + Target state   |
  |  Risk mitigation    CI/CD updates                                 |
  |                                                                   |
  |  Phase 7            Phase 8                                       |
  |  ARCHITECTURE ----> QUALITY                                       |
  |  DOCUMENT           REVIEW                                        |
  |  12-section MD      Score 0-100                                   |
  |  Full plan          5 dimensions                                  |
  |                        |                                          |
  |                        v                                          |
  |                     [approval                                     |
  |                      breakpoint]                                  |
  |                                                                   |
  +-------------------------------------------------------------------+
```

---

## Input Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `projectIdentifier` | string | Yes | -- | Cloud project or account identifier (GCP project ID, AWS account ID, etc.). |
| `cloudProvider` | enum | Yes | -- | Cloud provider: `gcp`, `aws`, or `azure`. |
| `targetRegion` | string | Yes | -- | Target region for HA consolidation (e.g., `me-west1`, `us-east-1`). |
| `slaTarget` | string | No | `"99.9%"` | Target SLA percentage. |
| `budgetCeiling` | number | No | `100` | Maximum monthly budget in USD for all HA improvements. |
| `currentArchitecture` | object | Yes | -- | Current infrastructure: `services` (array of service objects) and `description` (free-text context). |
| `diagramConfig` | object | No | `{ enabled: true, ... }` | Diagram generation settings: `enabled`, `outputDir`, `generateCurrentState`, `generateTargetState`. |
| `compositionPattern` | enum | No | `"full-pipeline"` | Which phases to run. One of: `full-pipeline`, `audit-only`, `design-and-plan`, `diagrams-only`. |

See `cloud-ha-architecture-plan-inputs.schema.json` for the full JSON Schema (draft-07).

---

## Output Fields

| Field | Type | Description |
|---|---|---|
| `success` | boolean | Whether the process completed successfully. |
| `compositionPattern` | string | The composition pattern that was used. |
| `phasesExecuted` | string[] | Names of phases that ran. |
| `audit` | object or null | Phase 1 infrastructure audit result. |
| `design` | object or null | Phase 2 HA design result (compute, data, network). |
| `costEstimate` | object or null | Phase 3 cost estimation result. |
| `migrationPlan` | object or null | Phase 4 migration plan result. |
| `iacScripts` | object or null | Phase 5 IaC script generation result. |
| `diagrams` | object or null | Phase 6 diagram generation result. |
| `architectureDoc` | object or null | Phase 7 architecture document result. |
| `qualityReview` | object or null | Phase 8 quality review result. |
| `qualityScore` | number | Quality score (0-100). `0` if quality review was not executed. |
| `metadata` | object | `{ processId, timestamp }` — process identification and completion time. |

---

## Composition Patterns

### `full-pipeline` (default)

Runs all 8 phases. Use this for a complete HA architecture plan from audit
to quality-reviewed document with diagrams.

**Phases:** 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8

### `audit-only`

Runs only the infrastructure audit. Use this to understand your current HA
gaps before committing to a full planning effort.

**Phases:** 1

### `design-and-plan`

Runs audit through IaC generation, skipping diagrams, document, and quality
review. Use this when you want the technical plan and scripts but will create
your own documentation.

**Phases:** 1 -> 2 -> 3 -> 4 -> 5

### `diagrams-only`

Runs only the diagram generation phase. Use this when your architecture is
already documented and you just need professional DrawIO diagrams for
stakeholder presentations. Requires the appropriate diagram skill to be
installed (`generating-gcp-diagrams` or `generating-aws-diagrams`).

**Phases:** 6

---

## Phase Descriptions

### Phase 1: Infrastructure Audit

A Solutions Architect agent audits the current infrastructure, identifies all
HA gaps, produces a risk matrix (severity x likelihood), and generates a
priority-ordered list of remediations. A breakpoint pauses for human review
before design begins.

### Phase 2: HA Architecture Design

Three sequential sub-tasks, each performed by a specialist agent:

- **2a — Compute HA**: Scaling policies, min instances, health checks,
  deployment strategy, region migration plan, CLI commands.
- **2b — Data HA**: Backup strategy, PITR assessment, regional vs multi-region
  decision, retention policies, CLI commands.
- **2c — Network & Observability HA**: Uptime checks, alert policies,
  dashboards, SLOs/SLIs, WAF assessment, CLI commands.

A breakpoint pauses for human review of all three design tracks.

### Phase 3: Cost Estimation

A FinOps analyst agent produces a line-item cost breakdown covering compute,
data, monitoring, and network tiers. Compares to the budget ceiling and
suggests priority cuts if over budget.

### Phase 4: Migration Plan

A migration specialist agent creates a phased, zero-downtime migration plan
with rollback strategies, time estimates, risk identification, and validation
steps for each phase.

### Phase 5: IaC Script Generation

An IaC specialist agent generates executable shell scripts: master deployment
script, monitoring setup, backup setup, and CI/CD workflow updates. All scripts
are idempotent and well-commented.

### Phase 6: Architecture Diagram Generation

Generates professional architecture diagrams:

- **With skill installed**: Uses `generating-gcp-diagrams` or
  `generating-aws-diagrams` to produce DrawIO XML files with proper cloud
  provider icons, containers, and connections.
- **Without skill**: Falls back to an agent that produces detailed ASCII
  architecture diagrams.

Generates both current-state and target-state diagrams (configurable).

### Phase 7: Architecture Document

A technical writer agent compiles all phase results into a single comprehensive
markdown document with 12 sections: executive summary, current/target
architecture, region strategy, compute/data/network HA design, cost analysis,
migration plan, risk assessment, IaC reference, and appendix.

### Phase 8: Quality Review

A senior cloud architect agent scores the plan 0-100 across 5 dimensions,
flags invalid commands, checks region service availability, and provides
improvement recommendations. A breakpoint presents the final score for
human approval.

---

## Quality Dimensions

| Dimension | Points | What is scored |
|---|---|---|
| Completeness | 25 | Does it cover all services? All tiers (compute, data, network)? |
| Correctness | 25 | Are CLI commands valid? Are services available in the target region? |
| Cost-Effectiveness | 20 | Within budget? No unnecessary costs? |
| Actionability | 15 | Can someone execute this plan? Steps clear and ordered? |
| Risk Coverage | 15 | Risks identified? Rollback strategies defined? |

**Total: 100 points.**

---

## Diagram Skill Integration

This process integrates with two diagram generation skills, **both bundled
in the `skills/` directory** of this contribution:

| Cloud Provider | Skill Name | Icon Set | Icon Count | Bundled |
|---|---|---|---|---|
| GCP | `generating-gcp-diagrams` | `mxgraph.gcp2.*` | 46 services | Yes |
| AWS | `generating-aws-diagrams` | `mxgraph.aws4.*` | 264 services | Yes |
| Azure | *(not yet available)* | — | — | No |

When the appropriate skill is installed, Phase 6 produces professional DrawIO
XML files with proper provider icons, containers (VPC, subnets, regions), and
connection arrows. Without a skill, it falls back to ASCII diagrams.

### Bundled Skills

Both skills are bundled in this specialization under `skills/`:
```
skills/
  generating-gcp-diagrams/    # GCP DrawIO diagram generation
    SKILL.md                  # Skill definition and workflows
    assets/                   # Icon definitions, container styles, XML templates
    references/               # Best practices, style guide, XML examples
    scripts/                  # Validation, export, and fix scripts
  generating-aws-diagrams/    # AWS DrawIO diagram generation
    SKILL.md                  # Skill definition and workflows
    assets/                   # Icon definitions, container styles, XML templates
    references/               # Best practices, style guide, XML examples
    scripts/                  # Validation, export, and fix scripts
```

### Installation

To use the diagram skills, copy them from this specialization to your
project's `.agent/skills/` directory:
```bash
# From the devops-sre-platform specialization directory:
cp -R skills/generating-gcp-diagrams /path/to/project/.agent/skills/
cp -R skills/generating-aws-diagrams /path/to/project/.agent/skills/
```

Each skill includes:
- **SKILL.md** — Skill definition with three workflows: analyze existing
  diagrams, convert images to DrawIO, create DrawIO from description
- **assets/** — Provider icon JSON (46 GCP / 264 AWS services), container
  styles, and DrawIO XML templates
- **references/** — Best practices, coordinate system guide, style guide,
  and copy-paste XML examples
- **scripts/** — Validation (`validate-drawio.py`), icon fixing
  (`fix-gcp-icons.py` / `fix-aws-icons.py`), export to PNG/PDF
  (`export-diagram.sh`), and open in DrawIO Desktop (`open-diagram.sh`)

---

## Safety Mechanisms

1. **Breakpoint after audit.** Human reviews gap count and audit summary before
   committing to the full design process.

2. **Breakpoint after design.** Human reviews all three HA design tracks
   (compute, data, network) before cost estimation and planning.

3. **Breakpoint after quality review.** Human sees the final quality score and
   decides whether to approve the deliverables.

4. **Composition patterns for partial runs.** Run `audit-only` to diagnose
   without committing to design. Run `diagrams-only` to generate visuals
   without modifying anything.

---

## Usage Examples

### Full pipeline — complete HA plan for a GCP project

```bash
babysitter run:create \
  --process-id cloud-ha-architecture-plan \
  --entry cloud-ha-architecture-plan.js \
  --inputs examples/cloud-ha-architecture-plan/gcp-full-pipeline.json
```

### Full pipeline — complete HA plan for an AWS account

```bash
babysitter run:create \
  --process-id cloud-ha-architecture-plan \
  --entry cloud-ha-architecture-plan.js \
  --inputs examples/cloud-ha-architecture-plan/aws-full-pipeline.json
```

### Audit only — understand HA gaps before investing

```bash
babysitter run:create \
  --process-id cloud-ha-architecture-plan \
  --entry cloud-ha-architecture-plan.js \
  --inputs examples/cloud-ha-architecture-plan/audit-only.json
```

### Diagrams only — generate DrawIO diagrams for an existing architecture

```bash
babysitter run:create \
  --process-id cloud-ha-architecture-plan \
  --entry cloud-ha-architecture-plan.js \
  --inputs examples/cloud-ha-architecture-plan/diagrams-only.json
```

---

## Example Input Files

Five ready-to-use example input files are provided in the
`examples/cloud-ha-architecture-plan/` directory, covering both cloud providers
and all composition patterns:

| File | Provider | Pattern | Scenario |
|---|---|---|---|
| `gcp-full-pipeline.json` | GCP | `full-pipeline` | Finance SaaS with Firebase Hosting, Cloud Run, Firestore — cross-region latency, no backups, no monitoring |
| `aws-full-pipeline.json` | AWS | `full-pipeline` | E-commerce platform with API Gateway, Lambda, RDS, DynamoDB, ElastiCache — single-AZ, no Multi-AZ RDS, no alarms |
| `design-and-plan.json` | GCP | `design-and-plan` | B2B API platform with Cloud Run, Cloud SQL, Memorystore Redis — need HA design and IaC scripts, will create own docs |
| `audit-only.json` | GCP | `audit-only` | Startup SaaS on Cloud Run + Firestore — minimal infra, gap assessment only |
| `diagrams-only.json` | AWS | `diagrams-only` | Data analytics platform with Step Functions, S3, Redshift — need DrawIO diagrams for stakeholder presentation |

---

## Sample Output

The `examples/cloud-ha-architecture-plan/sample-output/` directory contains a real-world output produced by
this process — a polished, interactive HTML architecture plan for a GCP
Finance SaaS application:

| File | Description |
|---|---|
| `sample-output/ha-architecture-plan.html` | Dark-themed interactive HA architecture plan with 17 HA gaps identified, compute/data/network design, cost analysis, migration plan, IaC scripts, and risk assessment. Open in any browser. |

This was generated from a `full-pipeline` run against a GCP project with
Firebase Hosting, Cloud Functions gen2, Cloud Run, and Firestore. It scored
82/100 on the quality review.

---

## Contributing

To add a new example input file:

1. Create a JSON file in the `examples/cloud-ha-architecture-plan/` directory.
2. Validate it against `cloud-ha-architecture-plan-inputs.schema.json`.
3. Include realistic service configurations with types and regions.
4. Provide a detailed `description` in `currentArchitecture` — the more
   context, the better the agent's analysis.

To modify the process itself:

1. Edit `cloud-ha-architecture-plan.js`.
2. Update the input schema if you add or change input fields.
3. Update this README to reflect any phase or parameter changes.
4. Test with at least one example input file to verify the pipeline runs
   end-to-end.
