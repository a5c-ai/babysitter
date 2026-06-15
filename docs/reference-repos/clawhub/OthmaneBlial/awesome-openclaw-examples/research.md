# clawhub/OthmaneBlial/awesome-openclaw-examples

- **Archetype**: Workflow catalog / cookbook
- **Stars**: 100 (GitHub)
- **Last pushed**: 2026-04-05
- **License**: MIT
- **Discovered**: 2026-04-12
- **Source**: clawhub-skills (GitHub search)
- **Skills found**: 0 (catalog of 100 runnable workflow examples composing ClawHub skills)

## Summary

A curated catalog of 100 tested, real-world agent workflow examples built by composing ClawHub skills. Each example includes a README with skill stack, setup instructions, smoke test criteria, KPIs, security notes, and rollback procedures. Examples span DevOps, sales, marketing, HR, legal, finance, and operations domains.

Notable workflow categories:
- **DevOps**: CI Flake Doctor, Dependency Drift Watchtower, Flaky Test Quarantine, Release Train Risk Board, Codeowners Coverage Sentinel
- **Sales/CS**: Renewal Risk Explainer, Pipeline Hygiene Monitor, Lost Deal Pattern Miner, P0 Account Escalation Pack
- **Content/Marketing**: Content Idea Miner, SEO Drift Watcher, Thought-Leadership Quote Miner, Webinar Repurposing Desk
- **HR**: Candidate Debrief Compiler, Hiring Pipeline Stall Radar, Onboarding Checklist Concierge
- **Operations**: Daily Operating Memo, Founder Daily Control Room, Task Debt Rollover Digest

Each workflow follows a consistent structure: skill stack, purpose, setup (env vars + prereqs), smoke test, KPIs, security notes, rollback.

## Assessment

**MEDIUM-HIGH VALUE** -- This repo is not a codebase to learn architecture from, but a rich source of domain-specific workflow patterns that could be directly extracted into babysitter processes. The 100 examples effectively serve as a requirements catalog for "what people actually want agents to do."

Key patterns:
1. **Skill composition**: Each workflow composes 2-5 skills (github + summarize + slack, etc.) into a coherent automation
2. **Cron-driven execution**: Most workflows are designed for recurring automated execution with cron expressions
3. **Observable KPIs**: Each workflow defines measurable success criteria
4. **Graduated rollout**: Setup includes smoke test before full deployment

## Extraction Priority

**P1 -- Extract in next batch**

### Processes

1. **CI Flake Doctor** (specializations/domains/devops/): Scan CI failures, cluster by test signature, identify flakes, create remediation tasks. Directly maps to a babysitter process with github task + summarize task + todoist/linear task.

2. **Daily Operating Memo** (specializations/domains/operations/): Aggregate signals from email, GitHub, task manager, and weather into a single daily briefing. Multi-source synthesis pattern.

3. **Renewal Risk Explainer** (specializations/domains/business/customer-success/): Monitor account health signals and generate risk assessments with recommended actions.

4. **Competitive Monitor** (specializations/domains/business/competitive-intelligence/): Recurring web search + synthesis + task creation for competitive intelligence.

5. **Incident Postmortem Drafter** (specializations/domains/devops/): Template-driven postmortem generation from GitHub issues/PRs/CI data.

### Plugin Ideas

1. **Workflow Catalog Plugin**: A babysitter marketplace plugin that provides a browseable catalog of pre-built workflow templates (inspired by this repo's structure) that users can instantiate as babysitter processes with one command.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| CI Flake Doctor | NEW | Scan CI failures, cluster by test signature, identify flakes, create remediation tasks | - | specializations/devops-sre-platform/ci-flake-doctor.js |
| Daily Operating Memo | NEW | Multi-source synthesis pattern for daily briefings (email, GitHub, task manager, weather) | - | specializations/shared/daily-operating-memo.js |
| Renewal Risk Explainer | NEW | Account health monitoring and risk assessment with recommended actions | - | specializations/business/renewal-risk-explainer.js |
| Competitive Intelligence Monitor | NEW | Recurring web search, synthesis, and task creation for competitive monitoring | - | specializations/business/competitive-intelligence-monitor.js |
| Incident Postmortem Drafter | NEW | Template-driven postmortem generation from GitHub issues/PRs/CI data | - | specializations/devops-sre-platform/incident-postmortem-drafter.js |
| Workflow Composition Patterns | NEW | Skill composition methodology (2-5 skills per workflow with coherent automation) | - | specializations/shared/workflow-composition-patterns.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Workflow Catalog Browser | NEW | Browseable catalog of pre-built workflow templates with one-command instantiation | - | plugins/a5c/marketplace/blueprints/workflow-catalog-browser/ |
