# Process Library

The Babysitter Process Library is a comprehensive collection of **2,000+ pre-built process definitions** (and growing) that you can use immediately or customize for your specific needs. This extensive library covers software development, business operations, scientific research, and dozens of specialized domains.

---

## In Plain English

> **Think of the Process Library like a cookbook with 2,000+ recipes.**
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

The Process Library is organized into four main areas. Click any link to view the source code:

| Area | Description | Link |
|------|-------------|------|
| **methodologies/** | Development methodologies (TDD, Agile, Devin, etc.) | [Browse →](../../../plugins/babysitter/skills/babysit/process/methodologies/) |
| **gsd/** | Get Shit Done workflows | [Browse →](../../../plugins/babysitter/skills/babysit/process/gsd/) |
| **specializations/** | Domain-specific processes (30+ categories) | [Browse →](../../../plugins/babysitter/skills/babysit/process/specializations/) |
| **tdd-quality-convergence** | Featured TDD workflow | [View →](../../../plugins/babysitter/skills/babysit/process/tdd-quality-convergence.js) |

### Specializations Sub-Structure

| Category | Description | Link |
|----------|-------------|------|
| **Development Processes** | Web, mobile, DevOps, AI, security, etc. | [Browse →](../../../plugins/babysitter/skills/babysit/process/specializations/) |
| **domains/business/** | Finance, HR, Marketing, Sales, etc. | [Browse →](../../../plugins/babysitter/skills/babysit/process/specializations/domains/business/) |
| **domains/science/** | Physics, Chemistry, Engineering, etc. | [Browse →](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/) |
| **meta/** | Process creation and validation | [Browse →](../../../plugins/babysitter/skills/babysit/process/specializations/meta/) |

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

## Categories Overview

### Development Processes (680+ processes)

| Category | Processes | Description | Browse |
|----------|-----------|-------------|--------|
| **web-development** | 66 | Full-stack web development, frameworks, deployment | [→](../../../plugins/babysitter/skills/babysit/process/specializations/web-development/) |
| **algorithms-optimization** | 50 | Algorithm implementation, performance tuning | [→](../../../plugins/babysitter/skills/babysit/process/specializations/algorithms-optimization/) |
| **ai-agents-conversational** | 44 | LLM applications, RAG, multi-agent systems | [→](../../../plugins/babysitter/skills/babysit/process/specializations/ai-agents-conversational/) |
| **cryptography-blockchain** | 38 | Smart contracts, DeFi, cryptographic protocols | [→](../../../plugins/babysitter/skills/babysit/process/specializations/cryptography-blockchain/) |
| **security-research** | 37 | Penetration testing, vulnerability research | [→](../../../plugins/babysitter/skills/babysit/process/specializations/security-research/) |
| **robotics-simulation** | 35 | ROS2, simulation, autonomous systems | [→](../../../plugins/babysitter/skills/babysit/process/specializations/robotics-simulation/) |
| **performance-optimization** | 35 | Profiling, optimization, benchmarking | [→](../../../plugins/babysitter/skills/babysit/process/specializations/performance-optimization/) |
| **network-programming** | 35 | Protocols, distributed systems, networking | [→](../../../plugins/babysitter/skills/babysit/process/specializations/network-programming/) |
| **game-development** | 35 | Game engines, mechanics, production | [→](../../../plugins/babysitter/skills/babysit/process/specializations/game-development/) |
| **cli-mcp-development** | 35 | CLI tools, MCP servers, developer tooling | [→](../../../plugins/babysitter/skills/babysit/process/specializations/cli-mcp-development/) |
| **mobile-development** | 31 | iOS, Android, React Native, Flutter | [→](../../../plugins/babysitter/skills/babysit/process/specializations/mobile-development/) |
| **embedded-systems** | 31 | Firmware, drivers, real-time systems | [→](../../../plugins/babysitter/skills/babysit/process/specializations/embedded-systems/) |
| **sdk-platform-development** | 30 | SDKs, APIs, platform engineering | [→](../../../plugins/babysitter/skills/babysit/process/specializations/sdk-platform-development/) |
| **programming-languages** | 30 | Compilers, interpreters, language design | [→](../../../plugins/babysitter/skills/babysit/process/specializations/programming-languages/) |
| **gpu-programming** | 30 | CUDA, compute shaders, parallel processing | [→](../../../plugins/babysitter/skills/babysit/process/specializations/gpu-programming/) |
| **fpga-programming** | 30 | HDL, synthesis, hardware design | [→](../../../plugins/babysitter/skills/babysit/process/specializations/fpga-programming/) |
| **code-migration-modernization** | 30 | Legacy modernization, framework upgrades | [→](../../../plugins/babysitter/skills/babysit/process/specializations/code-migration-modernization/) |
| **security-compliance** | 29 | Security standards, compliance automation | [→](../../../plugins/babysitter/skills/babysit/process/specializations/security-compliance/) |
| **desktop-development** | 28 | Electron, native apps, cross-platform | [→](../../../plugins/babysitter/skills/babysit/process/specializations/desktop-development/) |
| **ux-ui-design** | 26 | Design systems, accessibility, prototyping | [→](../../../plugins/babysitter/skills/babysit/process/specializations/ux-ui-design/) |
| **technical-documentation** | 26 | API docs, guides, documentation systems | [→](../../../plugins/babysitter/skills/babysit/process/specializations/technical-documentation/) |
| **software-architecture** | 25 | System design, patterns, architecture reviews | [→](../../../plugins/babysitter/skills/babysit/process/specializations/software-architecture/) |
| **qa-testing-automation** | 25 | Test automation, quality assurance | [→](../../../plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/) |
| **devops-sre-platform** | 25 | CI/CD, infrastructure, observability | [→](../../../plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/) |
| **data-science-ml** | 23 | ML pipelines, model training, MLOps | [→](../../../plugins/babysitter/skills/babysit/process/specializations/data-science-ml/) |
| **data-engineering-analytics** | 23 | Data pipelines, analytics, ETL | [→](../../../plugins/babysitter/skills/babysit/process/specializations/data-engineering-analytics/) |
| **product-management** | 22 | Roadmaps, specifications, product strategy | [→](../../../plugins/babysitter/skills/babysit/process/specializations/product-management/) |
| **meta** | 10 | Process creation, validation, tooling | [→](../../../plugins/babysitter/skills/babysit/process/specializations/meta/) |

### Business Domains (430+ processes)
[Browse all business domains →](../../../plugins/babysitter/skills/babysit/process/specializations/domains/business/)

| Category | Processes | Description | Browse |
|----------|-----------|-------------|--------|
| **decision-intelligence** | 33 | Decision frameworks, analysis models | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/business/decision-intelligence/) |
| **legal** | 28 | Contract analysis, compliance, legal ops | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/business/legal/) |
| **operations** | 26 | Business process optimization | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/business/operations/) |
| **business-strategy** | 26 | Strategic planning, competitive analysis | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/business/business-strategy/) |
| **venture-capital** | 25 | Due diligence, portfolio management | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/business/venture-capital/) |
| **supply-chain** | 25 | Logistics, inventory, procurement | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/business/supply-chain/) |
| **sales** | 25 | Sales processes, CRM workflows | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/business/sales/) |
| **public-relations** | 25 | Communications, media relations | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/business/public-relations/) |
| **marketing** | 25 | Campaigns, analytics, content strategy | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/business/marketing/) |
| **logistics** | 25 | Distribution, routing, fulfillment | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/business/logistics/) |
| **knowledge-management** | 25 | Documentation, wikis, knowledge bases | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/business/knowledge-management/) |
| **human-resources** | 25 | Recruiting, onboarding, HR processes | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/business/human-resources/) |
| **finance-accounting** | 25 | Financial analysis, reporting, auditing | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/business/finance-accounting/) |
| **entrepreneurship** | 25 | Startup workflows, business planning | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/business/entrepreneurship/) |
| **digital-marketing** | 25 | SEO, PPC, social media, analytics | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/business/digital-marketing/) |
| **customer-experience** | 25 | CX design, feedback loops, journey mapping | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/business/customer-experience/) |
| **project-management** | 5 | Project planning, tracking, delivery | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/business/project-management/) |

### Science and Engineering (550+ processes)
[Browse all science domains →](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/)

| Category | Processes | Description | Browse |
|----------|-----------|-------------|--------|
| **scientific-discovery** | 168 | Research methodologies, reasoning patterns | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/scientific-discovery/) |
| **quantum-computing** | 27 | Quantum algorithms, circuit design | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/quantum-computing/) |
| **mechanical-engineering** | 26 | CAD, simulation, manufacturing | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/mechanical-engineering/) |
| **computer-science** | 25 | Theory, algorithms, formal methods | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/computer-science/) |
| **civil-engineering** | 25 | Structural analysis, infrastructure | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/civil-engineering/) |
| **chemical-engineering** | 25 | Process design, reaction engineering | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/chemical-engineering/) |
| **biomedical-engineering** | 25 | Medical devices, biomechanics | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/biomedical-engineering/) |
| **automotive-engineering** | 25 | Vehicle systems, ADAS, EV | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/automotive-engineering/) |
| **aerospace-engineering** | 25 | Flight systems, propulsion, avionics | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/aerospace-engineering/) |
| **physics** | 24 | Simulation, modeling, analysis | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/physics/) |
| **nanotechnology** | 24 | Nanofabrication, characterization | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/nanotechnology/) |
| **mathematics** | 24 | Proofs, modeling, computation | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/mathematics/) |
| **materials-science** | 24 | Material characterization, discovery | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/materials-science/) |
| **industrial-engineering** | 24 | Process optimization, operations research | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/industrial-engineering/) |
| **environmental-engineering** | 24 | Environmental modeling, sustainability | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/environmental-engineering/) |
| **electrical-engineering** | 24 | Circuit design, signal processing | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/electrical-engineering/) |
| **bioinformatics** | 12 | Genomics, proteomics, computational biology | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/bioinformatics/) |

### Social Sciences and Humanities (150+ processes)
[Browse social sciences domains →](../../../plugins/babysitter/skills/babysit/process/specializations/domains/social-sciences-humanities/)

Processes for research methodologies, analysis frameworks, and academic workflows in social sciences, humanities, and interdisciplinary fields.

## Example Processes by Category

### Web Development
[Browse all web-development processes →](../../../plugins/babysitter/skills/babysit/process/specializations/web-development/)

| Process | Description | Source |
|---------|-------------|--------|
| nextjs-fullstack-app | Complete Next.js application | [View](../../../plugins/babysitter/skills/babysit/process/specializations/web-development/nextjs-fullstack-app.js) |
| graphql-api-apollo | GraphQL API with Apollo | [View](../../../plugins/babysitter/skills/babysit/process/specializations/web-development/graphql-api-apollo.js) |
| jwt-authentication | JWT auth implementation | [View](../../../plugins/babysitter/skills/babysit/process/specializations/web-development/jwt-authentication.js) |
| e2e-testing-playwright | Playwright E2E testing | [View](../../../plugins/babysitter/skills/babysit/process/specializations/web-development/e2e-testing-playwright.js) |
| micro-frontend-module-federation | Micro-frontend architecture | [View](../../../plugins/babysitter/skills/babysit/process/specializations/web-development/micro-frontend-module-federation.js) |
| accessibility-audit-remediation | WCAG compliance | [View](../../../plugins/babysitter/skills/babysit/process/specializations/web-development/accessibility-audit-remediation.js) |
| docker-containerization | Docker deployment | [View](../../../plugins/babysitter/skills/babysit/process/specializations/web-development/docker-containerization.js) |

### AI Agents and Conversational
[Browse all ai-agents-conversational processes →](../../../plugins/babysitter/skills/babysit/process/specializations/ai-agents-conversational/)

| Process | Description | Source |
|---------|-------------|--------|
| multi-agent-system | Multi-agent orchestration | [View](../../../plugins/babysitter/skills/babysit/process/specializations/ai-agents-conversational/multi-agent-system.js) |
| advanced-rag-patterns | Advanced RAG implementation | [View](../../../plugins/babysitter/skills/babysit/process/specializations/ai-agents-conversational/advanced-rag-patterns.js) |
| langgraph-workflow-design | LangGraph workflows | [View](../../../plugins/babysitter/skills/babysit/process/specializations/ai-agents-conversational/langgraph-workflow-design.js) |
| conversational-memory-system | Long-term memory for agents | [View](../../../plugins/babysitter/skills/babysit/process/specializations/ai-agents-conversational/conversational-memory-system.js) |
| function-calling-agent | Tool-using agents | [View](../../../plugins/babysitter/skills/babysit/process/specializations/ai-agents-conversational/function-calling-agent.js) |
| agent-evaluation-framework | Agent testing and eval | [View](../../../plugins/babysitter/skills/babysit/process/specializations/ai-agents-conversational/agent-evaluation-framework.js) |
| llm-observability-monitoring | LLM monitoring setup | [View](../../../plugins/babysitter/skills/babysit/process/specializations/ai-agents-conversational/llm-observability-monitoring.js) |

### Security Research
[Browse all security-research processes →](../../../plugins/babysitter/skills/babysit/process/specializations/security-research/)

| Process | Description | Source |
|---------|-------------|--------|
| binary-reverse-engineering | Binary analysis | [View](../../../plugins/babysitter/skills/babysit/process/specializations/security-research/binary-reverse-engineering.js) |
| exploit-development | Exploit writing workflow | [View](../../../plugins/babysitter/skills/babysit/process/specializations/security-research/exploit-development.js) |
| fuzzing-campaign | Fuzzing setup and execution | [View](../../../plugins/babysitter/skills/babysit/process/specializations/security-research/fuzzing-campaign.js) |
| malware-analysis | Malware analysis workflow | [View](../../../plugins/babysitter/skills/babysit/process/specializations/security-research/malware-analysis.js) |
| network-penetration-testing | Network pentesting | [View](../../../plugins/babysitter/skills/babysit/process/specializations/security-research/network-penetration-testing.js) |
| capture-the-flag-challenges | CTF solving workflow | [View](../../../plugins/babysitter/skills/babysit/process/specializations/security-research/capture-the-flag-challenges.js) |
| bug-bounty-workflow | Bug bounty methodology | [View](../../../plugins/babysitter/skills/babysit/process/specializations/security-research/bug-bounty-workflow.js) |

### DevOps and SRE
[Browse all devops-sre-platform processes →](../../../plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/)

| Process | Description | Source |
|---------|-------------|--------|
| kubernetes-setup | Kubernetes cluster setup | [View](../../../plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/kubernetes-setup.js) |
| cicd-pipeline-setup | CI/CD pipeline creation | [View](../../../plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/cicd-pipeline-setup.js) |
| monitoring-setup | Observability stack | [View](../../../plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/monitoring-setup.js) |
| incident-response | Incident management | [View](../../../plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/incident-response.js) |
| disaster-recovery-plan | DR planning and testing | [View](../../../plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/disaster-recovery-plan.js) |
| slo-sli-tracking | SLO/SLI implementation | [View](../../../plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/slo-sli-tracking.js) |
| secrets-management | Secrets management setup | [View](../../../plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/secrets-management.js) |

### Scientific Discovery
[Browse all scientific-discovery processes →](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/scientific-discovery/)

| Process | Description | Source |
|---------|-------------|--------|
| hypothesis-formulation-testing | Scientific method | [View](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/scientific-discovery/hypothesis-formulation-testing.js) |
| causal-inference | Causal analysis | [View](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/scientific-discovery/causal-inference.js) |
| bayesian-probabilistic-reasoning | Bayesian reasoning | [View](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/scientific-discovery/bayesian-probabilistic-reasoning.js) |
| experiment-design-reasoning | Experiment planning | [View](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/scientific-discovery/experiment-design-reasoning.js) |
| literature-review-synthesis | Literature review | [View](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/scientific-discovery/literature-review-synthesis.js) |
| reproducible-research-pipeline | Reproducibility | [View](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/scientific-discovery/reproducible-research-pipeline.js) |
| systems-thinking | Systems analysis | [View](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/scientific-discovery/systems-thinking.js) |

## Using a Pre-Built Process

**Recommended: Just use `/babysitter:call <request>`** - it selects the right process automatically:

```
/babysitter:call build a Next.js app with authentication, PostgreSQL database, and Vercel deployment
```

Babysitter will find the `nextjs-fullstack-app` process and configure it based on your request.

### Handle Breakpoints

The process will pause at breakpoints for human review. When a breakpoint triggers:

1. Open **http://localhost:3184** in your browser
2. Review the context files and question
3. Click **Approve** to continue or **Reject** to halt

See [Breakpoints](./breakpoints.md) for detailed instructions on setting up the breakpoints service.

## Methodologies Reference

The library includes 38+ development methodologies that can be applied to any project.
[Browse all methodologies →](../../../plugins/babysitter/skills/babysit/process/methodologies/)

### Core Methodologies

| Methodology | Description | Best For | Source |
|-------------|-------------|----------|--------|
| **devin** | Plan -> Code -> Debug -> Deploy with autonomous iteration | Full feature implementation | [View](../../../plugins/babysitter/skills/babysit/process/methodologies/devin.js) |
| **ralph** | Simple iterative loop until task completion | Persistent tasks with unclear scope | [View](../../../plugins/babysitter/skills/babysit/process/methodologies/ralph.js) |
| **plan-and-execute** | Detailed planning phase followed by execution | Complex, well-defined features | [View](../../../plugins/babysitter/skills/babysit/process/methodologies/plan-and-execute.js) |
| **tdd-quality-convergence** | TDD with iterative quality scoring | High-quality, tested code | [View](../../../plugins/babysitter/skills/babysit/process/tdd-quality-convergence.js) |
| **spec-driven-development** | Executable specifications drive implementation | Enterprise, governance-heavy projects | [View](../../../plugins/babysitter/skills/babysit/process/methodologies/spec-driven-development.js) |

### Agile and Iterative

| Methodology | Description | Best For | Source |
|-------------|-------------|----------|--------|
| **agile** | Sprint-based iterative development | Team-based projects | [View](../../../plugins/babysitter/skills/babysit/process/methodologies/agile.js) |
| **scrum** | Full Scrum implementation with ceremonies | Scrum teams | [View](../../../plugins/babysitter/skills/babysit/process/methodologies/scrum/) |
| **kanban** | Continuous flow with WIP limits | Continuous delivery | [View](../../../plugins/babysitter/skills/babysit/process/methodologies/kanban/) |
| **extreme-programming** | XP practices (pair programming, TDD) | High-quality code | [View](../../../plugins/babysitter/skills/babysit/process/methodologies/extreme-programming/) |
| **feature-driven-development** | Feature-centric development | Large codebases | [View](../../../plugins/babysitter/skills/babysit/process/methodologies/feature-driven-development/) |

### Architecture and Design

| Methodology | Description | Best For | Source |
|-------------|-------------|----------|--------|
| **top-down** | Architecture-first development | New systems, clear requirements | [View](../../../plugins/babysitter/skills/babysit/process/methodologies/top-down.js) |
| **bottom-up** | Component-first development | Exploratory, uncertain requirements | [View](../../../plugins/babysitter/skills/babysit/process/methodologies/bottom-up.js) |
| **domain-driven-design** | DDD strategic and tactical patterns | Complex business domains | [View](../../../plugins/babysitter/skills/babysit/process/methodologies/domain-driven-design/) |
| **event-storming** | Collaborative domain discovery | Domain modeling | [View](../../../plugins/babysitter/skills/babysit/process/methodologies/event-storming/) |
| **evolutionary** | Incremental architecture evolution | Legacy modernization | [View](../../../plugins/babysitter/skills/babysit/process/methodologies/evolutionary.js) |

### Specialized Approaches

| Methodology | Description | Best For | Source |
|-------------|-------------|----------|--------|
| **graph-of-thoughts** | Multi-path reasoning exploration | Complex problem solving | [View](../../../plugins/babysitter/skills/babysit/process/methodologies/graph-of-thoughts.js) |
| **adversarial-spec-debates** | Red team/blue team specification | Critical systems | [View](../../../plugins/babysitter/skills/babysit/process/methodologies/adversarial-spec-debates.js) |
| **consensus-and-voting-mechanisms** | Multi-agent consensus building | Distributed decisions | [View](../../../plugins/babysitter/skills/babysit/process/methodologies/consensus-and-voting-mechanisms.js) |
| **state-machine-orchestration** | State-based workflow management | Complex state transitions | [View](../../../plugins/babysitter/skills/babysit/process/methodologies/state-machine-orchestration.js) |
| **build-realtime-remediation** | Real-time error detection and fixing | CI/CD pipelines | [View](../../../plugins/babysitter/skills/babysit/process/methodologies/build-realtime-remediation.js) |

### GSD (Get Shit Done) Workflows
[Browse GSD workflows →](../../../plugins/babysitter/skills/babysit/process/gsd/)

| Workflow | Purpose | Source |
|----------|---------|--------|
| **new-project** | Project initialization with vision capture | [View](../../../plugins/babysitter/skills/babysit/process/gsd/new-project.js) |
| **discuss-phase** | Capture implementation preferences | [View](../../../plugins/babysitter/skills/babysit/process/gsd/discuss-phase.js) |
| **plan-phase** | Generate verified task plans | [View](../../../plugins/babysitter/skills/babysit/process/gsd/plan-phase.js) |
| **execute-phase** | Parallel task execution with commits | [View](../../../plugins/babysitter/skills/babysit/process/gsd/execute-phase.js) |
| **verify-work** | User acceptance testing | [View](../../../plugins/babysitter/skills/babysit/process/gsd/verify-work.js) |
| **audit-milestone** | Milestone completion verification | [View](../../../plugins/babysitter/skills/babysit/process/gsd/audit-milestone.js) |
| **map-codebase** | Brownfield project analysis | [View](../../../plugins/babysitter/skills/babysit/process/gsd/map-codebase.js) |
| **iterative-convergence** | Quality-gated development loop | [View](../../../plugins/babysitter/skills/babysit/process/gsd/iterative-convergence.js) |

## Customizing Processes

### Extending an Existing Process

```javascript
import { process as baseProcess } from './nextjs-fullstack-app.js';

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
import { process as planPhase } from './gsd/plan-phase.js';
import { process as executePhase } from './gsd/execute-phase.js';
import { process as tddConvergence } from './tdd-quality-convergence.js';

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

## Quick Reference: All Categories

| Category | Count | Focus Area | Browse |
|----------|-------|------------|--------|
| scientific-discovery | 168 | Research reasoning patterns | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/scientific-discovery/) |
| web-development | 66 | Full-stack web development | [→](../../../plugins/babysitter/skills/babysit/process/specializations/web-development/) |
| algorithms-optimization | 50 | Algorithm implementation | [→](../../../plugins/babysitter/skills/babysit/process/specializations/algorithms-optimization/) |
| ai-agents-conversational | 44 | LLM and agent development | [→](../../../plugins/babysitter/skills/babysit/process/specializations/ai-agents-conversational/) |
| cryptography-blockchain | 38 | Blockchain and crypto | [→](../../../plugins/babysitter/skills/babysit/process/specializations/cryptography-blockchain/) |
| security-research | 37 | Security research and testing | [→](../../../plugins/babysitter/skills/babysit/process/specializations/security-research/) |
| robotics-simulation | 35 | Robotics and simulation | [→](../../../plugins/babysitter/skills/babysit/process/specializations/robotics-simulation/) |
| performance-optimization | 35 | Performance tuning | [→](../../../plugins/babysitter/skills/babysit/process/specializations/performance-optimization/) |
| network-programming | 35 | Network and protocols | [→](../../../plugins/babysitter/skills/babysit/process/specializations/network-programming/) |
| game-development | 35 | Game development | [→](../../../plugins/babysitter/skills/babysit/process/specializations/game-development/) |
| cli-mcp-development | 35 | CLI and MCP tools | [→](../../../plugins/babysitter/skills/babysit/process/specializations/cli-mcp-development/) |
| decision-intelligence | 33 | Decision frameworks | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/business/decision-intelligence/) |
| mobile-development | 31 | Mobile app development | [→](../../../plugins/babysitter/skills/babysit/process/specializations/mobile-development/) |
| embedded-systems | 31 | Embedded and firmware | [→](../../../plugins/babysitter/skills/babysit/process/specializations/embedded-systems/) |
| sdk-platform-development | 30 | SDK development | [→](../../../plugins/babysitter/skills/babysit/process/specializations/sdk-platform-development/) |
| programming-languages | 30 | Language implementation | [→](../../../plugins/babysitter/skills/babysit/process/specializations/programming-languages/) |
| gpu-programming | 30 | GPU and parallel computing | [→](../../../plugins/babysitter/skills/babysit/process/specializations/gpu-programming/) |
| fpga-programming | 30 | FPGA design | [→](../../../plugins/babysitter/skills/babysit/process/specializations/fpga-programming/) |
| code-migration-modernization | 30 | Code modernization | [→](../../../plugins/babysitter/skills/babysit/process/specializations/code-migration-modernization/) |
| security-compliance | 29 | Security compliance | [→](../../../plugins/babysitter/skills/babysit/process/specializations/security-compliance/) |
| legal | 28 | Legal operations | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/business/legal/) |
| desktop-development | 28 | Desktop applications | [→](../../../plugins/babysitter/skills/babysit/process/specializations/desktop-development/) |
| quantum-computing | 27 | Quantum computing | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/quantum-computing/) |
| mechanical-engineering | 26 | Mechanical engineering | [→](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/mechanical-engineering/) |
| ux-ui-design | 26 | UX/UI design | [→](../../../plugins/babysitter/skills/babysit/process/specializations/ux-ui-design/) |
| technical-documentation | 26 | Documentation | [→](../../../plugins/babysitter/skills/babysit/process/specializations/technical-documentation/) |
| software-architecture | 25 | Architecture design | [→](../../../plugins/babysitter/skills/babysit/process/specializations/software-architecture/) |
| qa-testing-automation | 25 | Test automation | [→](../../../plugins/babysitter/skills/babysit/process/specializations/qa-testing-automation/) |
| devops-sre-platform | 25 | DevOps and SRE | [→](../../../plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/) |
| data-science-ml | 23 | Machine learning | [→](../../../plugins/babysitter/skills/babysit/process/specializations/data-science-ml/) |
| data-engineering-analytics | 23 | Data engineering | [→](../../../plugins/babysitter/skills/babysit/process/specializations/data-engineering-analytics/) |
| product-management | 22 | Product management | [→](../../../plugins/babysitter/skills/babysit/process/specializations/product-management/) |
| meta | 10 | Process tooling | [→](../../../plugins/babysitter/skills/babysit/process/specializations/meta/) |

## Best Practices

### Choosing the Right Process

1. **Match your domain**: Start with the specialization that matches your work
2. **Check the methodology**: Consider which methodology fits your project style
3. **Review inputs carefully**: Understand what configuration options are available
4. **Read the examples**: Look at example inputs in the `examples/` directories

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
