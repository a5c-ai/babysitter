# Process Library

<!-- process-library:lead:start -->
The Babysitter Process Library is the SDK-managed library under [`library/`](../../../library/README.md). The current generated snapshot counts **2,239 JavaScript process files**, including **149 methodology files**, **2,038 specialization files**, and **31 shared process files**, plus support assets such as **2,021 skills** and **1,342 agents** discovered in the live tree.
<!-- process-library:lead:end -->

---

## In Plain English

<!-- process-library:plain-english:start -->
> **Think of the Process Library like a cookbook with 2,239 recipes in the live repository tree.**
<!-- process-library:plain-english:end -->
>
> Just like how a cookbook has recipes for Italian, Mexican, Japanese, and French cuisine - the Process Library has "recipes" for building web apps, mobile apps, APIs, security audits, and much more.
>
> **You don't need to read the whole cookbook.** Just tell Babysitter what you want to make:
> - "Build me a REST API" → Babysitter picks the right recipe automatically
> - "Use the TDD methodology" → You pick a specific recipe
>
> Each recipe includes:
> - **Ingredients** (inputs you provide)
> - **Steps** (phases of work)
> - **Quality checks** (tests to ensure it's done right)
> - **Approval points** (places where you review before continuing)

---

## Quick Start: Using the Library

**Most users never need to browse the library directly.** Just describe what you want:

```
/babysitter:call build a user authentication system with login, registration, and password reset
```

Babysitter automatically finds and combines the right processes. Want a specific methodology?

```
/babysitter:call with TDD methodology, create a REST API for managing tasks
```

That's it! See the sections below for details on what's available.

---

## What is the Process Library?

The Process Library provides ready-to-use orchestration workflows for virtually any task you might encounter. Each process is:

- **Battle-tested**: Designed with best practices and quality gates built-in
- **Composable**: Can be combined with other processes to create complex workflows
- **Customizable**: Extend or modify any process to match your requirements
- **Self-documenting**: Includes clear inputs, outputs, and execution flow

Instead of writing orchestration logic from scratch, you can leverage these pre-built processes and focus on what matters: your actual work.

## How Babysitter Uses the Process Library

When you describe a task to Babysitter, the agent **automatically selects the most relevant processes** from the library and adapts them to your specific needs. This happens in several ways:

### Automatic Process Selection

Simply describe what you want to accomplish in natural language:

```
Use babysitter to build a Next.js app with authentication and PostgreSQL
```

Babysitter will:
1. Identify relevant processes (e.g., `nextjs-fullstack-app`, `jwt-authentication`, `database-setup`)
2. Combine and adapt them to your requirements
3. Execute the orchestrated workflow with quality gates

### Explicit Process Selection

You can also request a specific process by name:

```
Use babysitter with the tdd-quality-convergence process to implement user authentication
```

Or:

```
Use babysitter with the devin methodology to build a REST API
```

### Mix and Match

For complex tasks, Babysitter intelligently combines multiple processes:

```
Use babysitter to create a microservices architecture with:
- GraphQL gateway
- Kubernetes deployment
- Monitoring and alerting
```

This might pull from `graphql-api-apollo`, `kubernetes-setup`, `monitoring-setup`, and `cicd-pipeline-setup` processes, adapting each to work together coherently.

### Customizing for Your Use Case

You can also modify existing processes or provide additional context:

```
Use babysitter with the security-audit process but focus specifically on
OWASP Top 10 vulnerabilities and include PCI-DSS compliance checks
```

The agent will take the base process and adapt it to your specific requirements.

## Library Structure

The built-in library lives under [`library/`](../../../library/README.md). Harness plugins do **not** ship the whole process tree under `skills/babysit/`; instead, they expose the `babysit` skill and rely on the SDK-managed active process-library binding. Project-local copies under `.a5c/` are an override layer that can be created by plugins or by you.

### How The Layers Relate

1. **Built-in library**: [`library/`](../../../library/README.md) is the canonical source tree for built-in processes, methodologies, shared components, references, and examples.
2. **Plugin package**: the harness plugin ships skills, hooks, and packaging files such as [`plugins/babysitter-unified/skills/babysit/SKILL.md`](../../../plugins/babysitter-unified/skills/babysit/SKILL.md), then asks the SDK which process-library binding is active.
3. **Project-local `.a5c/` copies**: files like `.a5c/processes/`, `.a5c/skills/`, and `.a5c/agents/` inside a workspace override the shared library when present.

### Active Lookup Order

Babysitter process discovery should prefer:

1. Project-local `.a5c/processes/`
2. The SDK-managed active process-library binding resolved by `babysitter process-library:active --json`
3. Other installed skill/plugin roots only as compatibility fallback

### Main Library Areas

Click any link to view the current source location:

| Area | Description | Link |
|------|-------------|------|
| **library/methodologies/** | Methodology families such as Agile, Devin, GSD, Kanban, Spec-Kit, and more | [Browse →](../../../library/methodologies/) |
| **library/methodologies/gsd/** | Get Shit Done workflows | [Browse →](../../../library/methodologies/gsd/README.md) |
| **library/specializations/** | Domain-specific processes across the specialization tree | [Browse →](../../../library/specializations/) |
| **library/processes/shared/** | Shared reusable process components | [Browse →](../../../library/processes/shared/README.md) |
| **library/tdd-quality-convergence.js** | Featured TDD workflow at the library root | `library/tdd-quality-convergence.js` |

### Specializations Sub-Structure

| Category | Description | Link |
|----------|-------------|------|
| **Development and technical specializations** | Web, mobile, DevOps, AI, security, collaboration, authoring, and more | [Browse →](../../../library/specializations/) |
| **domains/business/** | Finance, HR, marketing, sales, legal, logistics, and related business domains | [Browse →](../../../library/specializations/domains/business/) |
| **domains/science/** | Physics, chemistry, engineering, mathematics, scientific discovery, and related domains | [Browse →](../../../library/specializations/domains/science/) |
| **domains/social-sciences-humanities/** | Education, healthcare, philosophy, arts, and social-science research workflows | [Browse →](../../../library/specializations/domains/social-sciences-humanities/) |
| **meta/** | Process creation, validation, and library tooling | [Browse →](../../../library/specializations/meta/) |

## Browsing and Discovering Processes

### Asking Claude

The easiest way to discover processes is to ask Claude:

```
What processes are available for web development?
```

```
Show me security-related processes in the babysitter library
```

Claude can browse the process library and recommend the best match for your needs.

### Process Naming Convention

Process files follow a consistent naming pattern:

- `feature-name.js` - The process definition
- `README.md` - Category documentation
- `examples/` - Example inputs and usage
- `agents/` - Specialized agents for the category

### Finding the Right Process

1. **Start with the category** that matches your domain
2. **Review the README.md** in that category for an overview
3. **Check the JSDoc** at the top of each `.js` file for inputs/outputs
4. **Look at examples/** for sample usage patterns

## Generated Catalog Snapshot

The catalog data in this section is refreshed from the live `library/` tree. The explanatory prose on this page remains hand-written.

<!-- process-library:catalog:start -->
Snapshot refreshed from the live `library/` tree on 2026-05-07.

- [Current snapshot counts](#current-snapshot-counts)
- [Methodology families](#methodology-families)
- [Shared process groups](#shared-process-groups)
- [Development and technical specializations](#development-and-technical-specializations)
- [Business domains](#business-domains)
- [Science domains](#science-domains)
- [Social sciences and humanities domains](#social-sciences-and-humanities-domains)
- [Largest specialization categories](#largest-specialization-categories)

## Current Snapshot Counts

| Area | Current Count | Source |
|------|---------------|--------|
| **All library `.js` process files** | 2,239 | [`library/`](../../../library/) |
| **Methodology directories** | 38 | [`library/methodologies/`](../../../library/methodologies/) |
| **Methodology `.js` process files** | 149 | [`library/methodologies/`](../../../library/methodologies/) |
| **Shared `.js` process files** | 31 | [`library/processes/shared/`](../../../library/processes/shared/) |
| **Specialization `.js` process files** | 2,038 | [`library/specializations/`](../../../library/specializations/) |
| **Top-level specialization directories** | 39 | [`library/specializations/`](../../../library/specializations/) |
| **Development and technical specialization processes** | 837 | [`library/specializations/`](../../../library/specializations/) |
| **Business-domain specialization processes** | 490 | [`library/specializations/domains/business/`](../../../library/specializations/domains/business/) |
| **Science-domain specialization processes** | 551 | [`library/specializations/domains/science/`](../../../library/specializations/domains/science/) |
| **Social-sciences-and-humanities specialization processes** | 160 | [`library/specializations/domains/social-sciences-humanities/`](../../../library/specializations/domains/social-sciences-humanities/) |
| **Skill definition files** | 2,021 | [`library/`](../../../library/) |
| **Agent definition files** | 1,342 | [`library/`](../../../library/) |
| **README files under library** | 1,816 | [`library/`](../../../library/) |

## Methodology Families

| Methodology | Processes | Browse |
|----------|-----------|--------|
| `superpowers` | 15 | [Browse →](../../../library/methodologies/superpowers/) |
| `gsd` | 14 | [Browse →](../../../library/methodologies/gsd/) |
| `bmad-method` | 6 | [Browse →](../../../library/methodologies/bmad-method/) |
| `ccpm` | 6 | [Browse →](../../../library/methodologies/ccpm/) |
| `maestro` | 6 | [Browse →](../../../library/methodologies/maestro/) |
| `metaswarm` | 6 | [Browse →](../../../library/methodologies/metaswarm/) |
| `rpikit` | 6 | [Browse →](../../../library/methodologies/rpikit/) |
| `cc10x` | 5 | [Browse →](../../../library/methodologies/cc10x/) |
| `claudekit` | 5 | [Browse →](../../../library/methodologies/claudekit/) |
| `cog-second-brain` | 5 | [Browse →](../../../library/methodologies/cog-second-brain/) |
| `everything-claude-code` | 5 | [Browse →](../../../library/methodologies/everything-claude-code/) |
| `gastown` | 5 | [Browse →](../../../library/methodologies/gastown/) |
| `pilot-shell` | 5 | [Browse →](../../../library/methodologies/pilot-shell/) |
| `ruflo` | 5 | [Browse →](../../../library/methodologies/ruflo/) |
| `automaker` | 4 | [Browse →](../../../library/methodologies/automaker/) |
| `planning-with-files` | 4 | [Browse →](../../../library/methodologies/planning-with-files/) |
| `spec-kit` | 4 | [Browse →](../../../library/methodologies/spec-kit/) |
| `atdd-tdd` | 1 | [Browse →](../../../library/methodologies/atdd-tdd/) |
| `bdd-specification-by-example` | 1 | [Browse →](../../../library/methodologies/bdd-specification-by-example/) |
| `cleanroom` | 1 | [Browse →](../../../library/methodologies/cleanroom/) |
| `domain-driven-design` | 1 | [Browse →](../../../library/methodologies/domain-driven-design/) |
| `double-diamond` | 1 | [Browse →](../../../library/methodologies/double-diamond/) |
| `event-storming` | 1 | [Browse →](../../../library/methodologies/event-storming/) |
| `example-mapping` | 1 | [Browse →](../../../library/methodologies/example-mapping/) |
| `extreme-programming` | 1 | [Browse →](../../../library/methodologies/extreme-programming/) |
| `feature-driven-development` | 1 | [Browse →](../../../library/methodologies/feature-driven-development/) |
| `hypothesis-driven-development` | 1 | [Browse →](../../../library/methodologies/hypothesis-driven-development/) |
| `impact-mapping` | 1 | [Browse →](../../../library/methodologies/impact-mapping/) |
| `jobs-to-be-done` | 1 | [Browse →](../../../library/methodologies/jobs-to-be-done/) |
| `kanban` | 1 | [Browse →](../../../library/methodologies/kanban/) |
| `ontology-driven-development` | 1 | [Browse →](../../../library/methodologies/ontology-driven-development/) |
| `process-hardening` | 1 | [Browse →](../../../library/methodologies/process-hardening/) |
| `rup` | 1 | [Browse →](../../../library/methodologies/rup/) |
| `scrum` | 1 | [Browse →](../../../library/methodologies/scrum/) |
| `shape-up` | 1 | [Browse →](../../../library/methodologies/shape-up/) |
| `spiral-model` | 1 | [Browse →](../../../library/methodologies/spiral-model/) |
| `v-model` | 1 | [Browse →](../../../library/methodologies/v-model/) |
| `waterfall` | 1 | [Browse →](../../../library/methodologies/waterfall/) |

## Shared Process Groups

| Group | Processes | Browse |
|----------|-----------|--------|
| `ci` | 5 | [Browse →](../../../library/processes/shared/ci/) |
| `communication` | 3 | [Browse →](../../../library/processes/shared/communication/) |
| `local-dev` | 2 | [Browse →](../../../library/processes/shared/local-dev/) |
| `analysis` | 1 | [Browse →](../../../library/processes/shared/analysis/) |
| `release` | 1 | [Browse →](../../../library/processes/shared/release/) |
| `reporting` | 1 | [Browse →](../../../library/processes/shared/reporting/) |

## Development and Technical Specializations

| Category | Processes | Browse |
|----------|-----------|--------|
| `web-development` | 61 | [Browse →](../../../library/specializations/web-development/) |
| `algorithms-optimization` | 45 | [Browse →](../../../library/specializations/algorithms-optimization/) |
| `ai-agents-conversational` | 43 | [Browse →](../../../library/specializations/ai-agents-conversational/) |
| `cryptography-blockchain` | 33 | [Browse →](../../../library/specializations/cryptography-blockchain/) |
| `security-research` | 32 | [Browse →](../../../library/specializations/security-research/) |
| `meta` | 31 | [Browse →](../../../library/specializations/meta/) |
| `cli-mcp-development` | 30 | [Browse →](../../../library/specializations/cli-mcp-development/) |
| `game-development` | 30 | [Browse →](../../../library/specializations/game-development/) |
| `network-programming` | 30 | [Browse →](../../../library/specializations/network-programming/) |
| `performance-optimization` | 30 | [Browse →](../../../library/specializations/performance-optimization/) |
| `robotics-simulation` | 30 | [Browse →](../../../library/specializations/robotics-simulation/) |
| `devops-sre-platform` | 29 | [Browse →](../../../library/specializations/devops-sre-platform/) |
| `embedded-systems` | 26 | [Browse →](../../../library/specializations/embedded-systems/) |
| `mobile-development` | 26 | [Browse →](../../../library/specializations/mobile-development/) |
| `security-compliance` | 26 | [Browse →](../../../library/specializations/security-compliance/) |
| `code-migration-modernization` | 25 | [Browse →](../../../library/specializations/code-migration-modernization/) |
| `fpga-programming` | 25 | [Browse →](../../../library/specializations/fpga-programming/) |
| `gpu-programming` | 25 | [Browse →](../../../library/specializations/gpu-programming/) |
| `programming-languages` | 25 | [Browse →](../../../library/specializations/programming-languages/) |
| `sdk-platform-development` | 25 | [Browse →](../../../library/specializations/sdk-platform-development/) |
| `desktop-development` | 24 | [Browse →](../../../library/specializations/desktop-development/) |
| `ux-ui-design` | 24 | [Browse →](../../../library/specializations/ux-ui-design/) |
| `technical-documentation` | 21 | [Browse →](../../../library/specializations/technical-documentation/) |
| `qa-testing-automation` | 20 | [Browse →](../../../library/specializations/qa-testing-automation/) |
| `software-architecture` | 20 | [Browse →](../../../library/specializations/software-architecture/) |
| `product-management` | 19 | [Browse →](../../../library/specializations/product-management/) |
| `collaboration` | 18 | [Browse →](../../../library/specializations/collaboration/) |
| `data-engineering-analytics` | 18 | [Browse →](../../../library/specializations/data-engineering-analytics/) |
| `data-science-ml` | 18 | [Browse →](../../../library/specializations/data-science-ml/) |
| `media` | 7 | [Browse →](../../../library/specializations/media/) |
| `observability` | 5 | [Browse →](../../../library/specializations/observability/) |
| `research` | 5 | [Browse →](../../../library/specializations/research/) |
| `communication` | 4 | [Browse →](../../../library/specializations/communication/) |
| `common-utilities` | 3 | [Browse →](../../../library/specializations/common-utilities/) |
| `authoring` | 2 | [Browse →](../../../library/specializations/authoring/) |
| `business` | 1 | [Browse →](../../../library/specializations/business/) |
| `sourcing` | 1 | [Browse →](../../../library/specializations/sourcing/) |

## Business Domains

| Category | Processes | Browse |
|----------|-----------|--------|
| `knowledge-management` | 36 | [Browse →](../../../library/specializations/domains/business/knowledge-management/) |
| `decision-intelligence` | 33 | [Browse →](../../../library/specializations/domains/business/decision-intelligence/) |
| `legal` | 28 | [Browse →](../../../library/specializations/domains/business/legal/) |
| `business-strategy` | 26 | [Browse →](../../../library/specializations/domains/business/business-strategy/) |
| `operations` | 26 | [Browse →](../../../library/specializations/domains/business/operations/) |
| `business-analysis` | 25 | [Browse →](../../../library/specializations/domains/business/business-analysis/) |
| `entrepreneurship` | 25 | [Browse →](../../../library/specializations/domains/business/entrepreneurship/) |
| `finance-accounting` | 25 | [Browse →](../../../library/specializations/domains/business/finance-accounting/) |
| `logistics` | 25 | [Browse →](../../../library/specializations/domains/business/logistics/) |
| `marketing` | 25 | [Browse →](../../../library/specializations/domains/business/marketing/) |
| `project-management` | 25 | [Browse →](../../../library/specializations/domains/business/project-management/) |
| `public-relations` | 25 | [Browse →](../../../library/specializations/domains/business/public-relations/) |
| `sales` | 25 | [Browse →](../../../library/specializations/domains/business/sales/) |
| `supply-chain` | 25 | [Browse →](../../../library/specializations/domains/business/supply-chain/) |
| `venture-capital` | 25 | [Browse →](../../../library/specializations/domains/business/venture-capital/) |
| `human-resources` | 24 | [Browse →](../../../library/specializations/domains/business/human-resources/) |
| `digital-marketing` | 23 | [Browse →](../../../library/specializations/domains/business/digital-marketing/) |
| `business-strategy-advanced` | 22 | [Browse →](../../../library/specializations/domains/business/business-strategy-advanced/) |
| `customer-experience` | 20 | [Browse →](../../../library/specializations/domains/business/customer-experience/) |
| `travel` | 2 | [Browse →](../../../library/specializations/domains/business/travel/) |

## Science Domains

| Category | Processes | Browse |
|----------|-----------|--------|
| `scientific-discovery` | 168 | [Browse →](../../../library/specializations/domains/science/scientific-discovery/) |
| `quantum-computing` | 27 | [Browse →](../../../library/specializations/domains/science/quantum-computing/) |
| `mechanical-engineering` | 26 | [Browse →](../../../library/specializations/domains/science/mechanical-engineering/) |
| `aerospace-engineering` | 25 | [Browse →](../../../library/specializations/domains/science/aerospace-engineering/) |
| `automotive-engineering` | 25 | [Browse →](../../../library/specializations/domains/science/automotive-engineering/) |
| `biomedical-engineering` | 25 | [Browse →](../../../library/specializations/domains/science/biomedical-engineering/) |
| `chemical-engineering` | 25 | [Browse →](../../../library/specializations/domains/science/chemical-engineering/) |
| `civil-engineering` | 25 | [Browse →](../../../library/specializations/domains/science/civil-engineering/) |
| `computer-science` | 25 | [Browse →](../../../library/specializations/domains/science/computer-science/) |
| `environmental-engineering` | 24 | [Browse →](../../../library/specializations/domains/science/environmental-engineering/) |
| `materials-science` | 24 | [Browse →](../../../library/specializations/domains/science/materials-science/) |
| `mathematics` | 24 | [Browse →](../../../library/specializations/domains/science/mathematics/) |
| `physics` | 24 | [Browse →](../../../library/specializations/domains/science/physics/) |
| `industrial-engineering` | 23 | [Browse →](../../../library/specializations/domains/science/industrial-engineering/) |
| `electrical-engineering` | 21 | [Browse →](../../../library/specializations/domains/science/electrical-engineering/) |
| `bioinformatics` | 20 | [Browse →](../../../library/specializations/domains/science/bioinformatics/) |
| `nanotechnology` | 20 | [Browse →](../../../library/specializations/domains/science/nanotechnology/) |

## Social Sciences and Humanities Domains

| Category | Processes | Browse |
|----------|-----------|--------|
| `arts-culture` | 35 | [Browse →](../../../library/specializations/domains/social-sciences-humanities/arts-culture/) |
| `philosophy` | 26 | [Browse →](../../../library/specializations/domains/social-sciences-humanities/philosophy/) |
| `education` | 25 | [Browse →](../../../library/specializations/domains/social-sciences-humanities/education/) |
| `humanities` | 25 | [Browse →](../../../library/specializations/domains/social-sciences-humanities/humanities/) |
| `social-sciences` | 25 | [Browse →](../../../library/specializations/domains/social-sciences-humanities/social-sciences/) |
| `healthcare` | 24 | [Browse →](../../../library/specializations/domains/social-sciences-humanities/healthcare/) |

## Largest Specialization Categories

| Category | Processes | Browse |
|----------|-----------|--------|
| `scientific-discovery` | 168 | [Browse →](../../../library/specializations/domains/science/scientific-discovery/) |
| `web-development` | 61 | [Browse →](../../../library/specializations/web-development/) |
| `algorithms-optimization` | 45 | [Browse →](../../../library/specializations/algorithms-optimization/) |
| `ai-agents-conversational` | 43 | [Browse →](../../../library/specializations/ai-agents-conversational/) |
| `knowledge-management` | 36 | [Browse →](../../../library/specializations/domains/business/knowledge-management/) |
| `arts-culture` | 35 | [Browse →](../../../library/specializations/domains/social-sciences-humanities/arts-culture/) |
| `cryptography-blockchain` | 33 | [Browse →](../../../library/specializations/cryptography-blockchain/) |
| `decision-intelligence` | 33 | [Browse →](../../../library/specializations/domains/business/decision-intelligence/) |
| `security-research` | 32 | [Browse →](../../../library/specializations/security-research/) |
| `meta` | 31 | [Browse →](../../../library/specializations/meta/) |
| `cli-mcp-development` | 30 | [Browse →](../../../library/specializations/cli-mcp-development/) |
| `game-development` | 30 | [Browse →](../../../library/specializations/game-development/) |
<!-- process-library:catalog:end -->

## Example Processes by Category

### Web Development
[Browse all web-development processes →](../../../library/specializations/web-development/)

| Process | Description | Source |
|---------|-------------|--------|
| nextjs-fullstack-app | Complete Next.js application | `library/specializations/web-development/nextjs-fullstack-app.js` |
| graphql-api-apollo | GraphQL API with Apollo | `library/specializations/web-development/graphql-api-apollo.js` |
| jwt-authentication | JWT auth implementation | `library/specializations/web-development/jwt-authentication.js` |
| e2e-testing-playwright | Playwright E2E testing | `library/specializations/web-development/e2e-testing-playwright.js` |
| micro-frontend-module-federation | Micro-frontend architecture | `library/specializations/web-development/micro-frontend-module-federation.js` |
| accessibility-audit-remediation | WCAG compliance | `library/specializations/web-development/accessibility-audit-remediation.js` |
| docker-containerization | Docker deployment | `library/specializations/web-development/docker-containerization.js` |

### AI Agents and Conversational
[Browse all ai-agents-conversational processes →](../../../library/specializations/ai-agents-conversational/)

| Process | Description | Source |
|---------|-------------|--------|
| multi-agent-system | Multi-agent orchestration | `library/specializations/ai-agents-conversational/multi-agent-system.js` |
| advanced-rag-patterns | Advanced RAG implementation | `library/specializations/ai-agents-conversational/advanced-rag-patterns.js` |
| langgraph-workflow-design | LangGraph workflows | `library/specializations/ai-agents-conversational/langgraph-workflow-design.js` |
| conversational-memory-system | Long-term memory for agents | `library/specializations/ai-agents-conversational/conversational-memory-system.js` |
| function-calling-agent | Tool-using agents | `library/specializations/ai-agents-conversational/function-calling-agent.js` |
| agent-evaluation-framework | Agent testing and eval | `library/specializations/ai-agents-conversational/agent-evaluation-framework.js` |
| llm-observability-monitoring | LLM monitoring setup | `library/specializations/ai-agents-conversational/llm-observability-monitoring.js` |

### Security Research
[Browse all security-research processes →](../../../library/specializations/security-research/)

| Process | Description | Source |
|---------|-------------|--------|
| binary-reverse-engineering | Binary analysis | `library/specializations/security-research/binary-reverse-engineering.js` |
| exploit-development | Exploit writing workflow | `library/specializations/security-research/exploit-development.js` |
| fuzzing-campaign | Fuzzing setup and execution | `library/specializations/security-research/fuzzing-campaign.js` |
| malware-analysis | Malware analysis workflow | `library/specializations/security-research/malware-analysis.js` |
| network-penetration-testing | Network pentesting | `library/specializations/security-research/network-penetration-testing.js` |
| capture-the-flag-challenges | CTF solving workflow | `library/specializations/security-research/capture-the-flag-challenges.js` |
| bug-bounty-workflow | Bug bounty methodology | `library/specializations/security-research/bug-bounty-workflow.js` |

### DevOps and SRE
[Browse all devops-sre-platform processes →](../../../library/specializations/devops-sre-platform/)

| Process | Description | Source |
|---------|-------------|--------|
| kubernetes-setup | Kubernetes cluster setup | `library/specializations/devops-sre-platform/kubernetes-setup.js` |
| cicd-pipeline-setup | CI/CD pipeline creation | `library/specializations/devops-sre-platform/cicd-pipeline-setup.js` |
| monitoring-setup | Observability stack | `library/specializations/devops-sre-platform/monitoring-setup.js` |
| incident-response | Incident management | `library/specializations/devops-sre-platform/incident-response.js` |
| disaster-recovery-plan | DR planning and testing | `library/specializations/devops-sre-platform/disaster-recovery-plan.js` |
| slo-sli-tracking | SLO/SLI implementation | `library/specializations/devops-sre-platform/slo-sli-tracking.js` |
| secrets-management | Secrets management setup | `library/specializations/devops-sre-platform/secrets-management.js` |

### Scientific Discovery
[Browse all scientific-discovery processes →](../../../library/specializations/domains/science/scientific-discovery/)

| Process | Description | Source |
|---------|-------------|--------|
| hypothesis-formulation-testing | Scientific method | `library/specializations/domains/science/scientific-discovery/hypothesis-formulation-testing.js` |
| causal-inference | Causal analysis | `library/specializations/domains/science/scientific-discovery/causal-inference.js` |
| bayesian-probabilistic-reasoning | Bayesian reasoning | `library/specializations/domains/science/scientific-discovery/bayesian-probabilistic-reasoning.js` |
| experimental-design-reasoning | Experiment planning | `library/specializations/domains/science/scientific-discovery/experimental-design-reasoning.js` |
| literature-review-synthesis | Literature review | `library/specializations/domains/science/scientific-discovery/literature-review-synthesis.js` |
| reproducible-research-pipeline | Reproducibility | `library/specializations/domains/science/scientific-discovery/reproducible-research-pipeline.js` |
| systems-thinking | Systems analysis | `library/specializations/domains/science/scientific-discovery/systems-thinking.js` |

## Using a Pre-Built Process

**Recommended: Just use `/babysitter:call <request>`** - it selects the right process automatically:

```
/babysitter:call build a Next.js app with authentication, PostgreSQL database, and Vercel deployment
```

Babysitter will find the `nextjs-fullstack-app` process and configure it based on your request.

## Customizing Processes

### Extending an Existing Process

```javascript
import { process as baseProcess } from '../../../library/specializations/web-development/nextjs-fullstack-app.js';

export async function process(inputs, ctx) {
  // Add pre-processing
  const enhancedInputs = {
    ...inputs,
    additionalChecks: true,
    customConfig: myConfig
  };

  // Run base process
  const result = await baseProcess(enhancedInputs, ctx);

  // Add post-processing
  await ctx.task(myCustomValidation, result);

  return {
    ...result,
    customData: myCustomData
  };
}
```

### Composing Multiple Processes

```javascript
import { process as planPhase } from '../../../library/methodologies/gsd/plan-phase.js';
import { process as executePhase } from '../../../library/methodologies/gsd/execute-phase.js';
import { process as tddConvergence } from '../../../library/tdd-quality-convergence.js';

export async function process(inputs, ctx) {
  // Planning with GSD
  const plan = await planPhase(inputs, ctx);

  // Execute with TDD quality gates
  const implementation = await tddConvergence({
    ...inputs,
    plan: plan.tasks,
    targetQuality: 90
  }, ctx);

  // Verify with GSD
  const verification = await executePhase({
    ...inputs,
    tasks: implementation.artifacts
  }, ctx);

  return { plan, implementation, verification };
}
```

### Modifying Process Parameters

Most processes accept configuration through inputs:

```json
{
  "feature": "User authentication",
  "targetQuality": 95,
  "maxIterations": 10,
  "requirements": [
    "Support OAuth2",
    "Include MFA"
  ],
  "constraints": [
    "Must use existing user table",
    "No breaking API changes"
  ]
}
```

## Best Practices

### Choosing the Right Process

1. **Match your domain**: Start with the specialization that matches your work
2. **Check the methodology**: Consider which methodology fits your project style
3. **Review inputs carefully**: Understand what configuration options are available
4. **Read the examples**: Look at example inputs in the `examples/` directories under `library/`

### Customization Tips

1. **Start simple**: Use processes as-is before customizing
2. **Layer changes**: Extend rather than modify base processes
3. **Preserve breakpoints**: Keep human approval gates in critical paths
4. **Test incrementally**: Validate customizations with small inputs first

### Quality Considerations

1. **Use quality convergence**: Processes with quality scoring help ensure high standards
2. **Enable breakpoints**: Human review catches issues early
3. **Compose methodologies**: Combine TDD with your domain process for better results
4. **Track iterations**: Monitor how many iterations processes require

## See Also

- [Process Definitions](./process-definitions.md) - How to create your own processes
- [Quality Convergence](./quality-convergence.md) - Quality gates and scoring
- [Breakpoints](./breakpoints.md) - Human-in-the-loop approval
- [Parallel Execution](./parallel-execution.md) - Running tasks concurrently
