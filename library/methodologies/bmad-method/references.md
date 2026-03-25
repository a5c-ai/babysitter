# References

## Source Attribution

The BMAD Method babysitter process definitions are adapted from the BMAD Method open-source project.

- **Repository:** https://github.com/bmad-code-org/BMAD-METHOD
- **Organization:** BMad Code Org
- **Documentation:** https://docs.bmad-method.org
- **License:** See source repository for license terms

## BMAD Method Components Referenced

### Agent Personas (from `src/bmm/agents/`)
- `analyst.agent.yaml` - Mary (Strategic Business Analyst)
- `architect.agent.yaml` - Winston (System Architect)
- `pm.agent.yaml` - John (Product Manager)
- `dev.agent.yaml` - Amelia (Senior Software Engineer)
- `sm.agent.yaml` - Bob (Technical Scrum Master)
- `qa.agent.yaml` - Quinn (QA Engineer)
- `ux-designer.agent.yaml` - Sally (UX Designer)
- `tech-writer/tech-writer.agent.yaml` - Paige (Tech Writer)
- `quick-flow-solo-dev.agent.yaml` - Barry (Solo Dev)
- `bmad-master.agent.yaml` (from `src/core/agents/`) - BMad Master Orchestrator

### Workflows Referenced (from `src/bmm/workflows/`)

#### Phase 1: Analysis
- `1-analysis/create-product-brief/` - Product brief creation workflow
- `1-analysis/research/` - Market, domain, and technical research

#### Phase 2: Planning
- `2-plan-workflows/create-prd/` - PRD creation with validation steps
- `2-plan-workflows/create-ux-design/` - UX design workflow

#### Phase 3: Solutioning
- `3-solutioning/create-architecture/` - Architecture design workflow
- `3-solutioning/create-epics-and-stories/` - Epic and story creation
- `3-solutioning/check-implementation-readiness/` - Readiness validation

#### Phase 4: Implementation
- `4-implementation/sprint-planning/` - Sprint planning workflow
- `4-implementation/dev-story/` - Story development with TDD
- `4-implementation/code-review/` - Multi-dimensional code review
- `4-implementation/correct-course/` - Mid-sprint course correction
- `4-implementation/retrospective/` - Sprint retrospective
- `4-implementation/sprint-status/` - Cross-sprint status reporting
- `4-implementation/create-story/` - Story creation workflow

#### Quick Flow
- `bmad-quick-flow/quick-spec/` - Quick specification
- `bmad-quick-flow/quick-dev/` - Quick development

#### Documentation
- `document-project/` - Full project documentation (full-scan, deep-dive)
- `generate-project-context/` - Project context generation

#### QA
- `qa-generate-e2e-tests/` - E2E test generation

### Core Tasks Referenced (from `src/core/tasks/`)
- `workflow.xml` - Workflow execution engine
- `review-adversarial-general.xml` - Adversarial review
- `review-edge-case-hunter.xml` - Edge case analysis
- `editorial-review-prose.xml` - Prose quality review
- `editorial-review-structure.xml` - Structure validation

### Templates Referenced
- `product-brief.template.md` - Product brief template
- `prd-template.md` - PRD template
- `ux-design-template.md` - UX design template
- `architecture-decision-template.md` - ADR template
- `epics-template.md` - Epics template
- `tech-spec-template.md` - Technical specification template
- `project-context-template.md` - Project context template

## Adaptation Notes

This babysitter adaptation translates BMAD Method concepts into the babysitter SDK process definition format:
- Agent personas become `kind: 'agent'` tasks with persona-specific prompts
- BMAD workflows become process functions with `ctx.task()` calls
- BMAD validation steps become `ctx.breakpoint()` approval gates
- Party Mode multi-agent collaboration uses `ctx.parallel.map()`
- BMAD templates inform `outputSchema` definitions
- BMAD checklists inform task `instructions` arrays
