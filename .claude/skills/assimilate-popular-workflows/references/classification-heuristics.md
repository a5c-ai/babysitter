# Classification Heuristics

Detailed heuristics for classifying repositories into archetypes. Consult when the primary signals from Phase 2 are ambiguous.

## Decision Tree

```
Has plugin.json or .claude-plugin/?
├── Yes → Has 5+ skills in skills/? → mega-skill-pack
│         Has skills focused on one domain? → domain-skill-pack
│         Otherwise → claude-plugin
│
├── No plugin.json
│   ├── SKILL.md only references internal paths (.github/, scripts/, etc)?
│   │   └── Yes → internal-maintenance (SKIP)
│   │
│   ├── Skill is for Codex, Cursor, or another non-Claude harness?
│   │   Or focuses on CLI orchestration / harness invocation?
│   │   └── Yes → other-harness (SKIP)
│   │
│   ├── Repo is primarily a library/tool (has package.json main, bin, or lib)?
│   │   └── Yes → utility-with-skill
│   │
│   ├── Repo contains process/workflow documentation as primary content?
│   │   └── Yes → methodology-repo
│   │
│   └── Multiple SKILL.md files across different topics?
│       └── Yes → mega-skill-pack or domain-skill-pack (check topic diversity)
```

## Edge Cases

### Repo with both a tool and many skills

If the repo ships a primary application AND a large skills directory, classify based on what would be most valuable to extract:
- If the skills are reusable beyond the tool → `mega-skill-pack`
- If the skills are usage guides for the tool → `utility-with-skill`

### Monorepo with skills in one package

Some monorepos have skills only in one workspace package. Treat that package as the unit of classification, not the whole monorepo. Note the package path in the research.

### Fork of a known skill pack

If the repo is a fork with minimal divergence, note the upstream and skip unless the fork adds novel skills. Check `gh api repos/<owner>/<name> --jq '.fork, .parent.full_name'`.

### Repo with SKILL.md but no Claude Code connection

Some repos use `SKILL.md` as a generic documentation filename unrelated to Claude Code. Detect by checking:
- No YAML frontmatter with `name:` and `description:`
- No references to Claude, Claude Code, or AI agents
- Content is generic documentation

Classify as `not-a-skill` and skip.

## Archetype-Specific Research Depth

| Archetype | Skills to read | Depth |
|-----------|---------------|-------|
| mega-skill-pack | All (up to 20, sample beyond) | Full inventory + extractable value |
| methodology-repo | All (usually 1-3) | Full research + process codification |
| internal-maintenance | 0 (skip) | Classification note only |
| other-harness | 0 (skip) | Classification note only |
| claude-plugin | All skills | Inventory + plugin integration ideas |
| domain-skill-pack | All in-domain | Full inventory + domain process extraction |
| utility-with-skill | 1-2 (the usage skills) | Light inventory + usage pattern extraction |

## Transferability Assessment

When deciding if a skill's procedural content is transferable:

### High transferability
- Describes a multi-step workflow with clear phases
- Phases have defined inputs/outputs
- Workflow is not tied to a specific codebase
- Includes quality gates or review checkpoints
- Describes iteration/convergence patterns
- **Domain-specific skills with procedural content** -- a "kubernetes-specialist" encoding a k8s deployment audit, a "terraform-engineer" encoding an IaC review pipeline, a "react-expert" encoding a component architecture review. These map to `specializations/<domain>/` processes. Do NOT dismiss domain skills as "just expert personas" without reading them for procedural steps.

### Medium transferability
- Describes a useful pattern but tightly coupled to a specific tool
- Could be generalized with some effort
- Contains domain knowledge worth capturing as references
- Domain-specific skill with some procedural content mixed with static knowledge

### Low transferability (not-transferable)
- Pure prompt engineering (system prompt, no procedure) -- **but verify by reading the skill first; many "expert persona" skills contain hidden procedural content**
- Entirely repo-specific paths and configuration
- Duplicates functionality already in babysitter process library
- Trivially simple (no multi-step procedure to codify)
- **Skill-management processes** (skill-routing, skill-discovery, skill-validation, metadata compliance) -- these are babysitter-internal concerns. Their *plugin ideas* may still be valid.
- **Multi-model coordination** (multi-model review, heterogeneous AI team orchestration) -- babysitter's harness adapter system already handles this natively
- **SDK-covered primitives** (human-in-the-loop review cycles = breakpoints, harness CLI invocation = harness adapters, effect dispatch = runtime)
- **Memory systems** (tiered storage, decay, reflection, promotion) -- always plugins (Context & Memory category), never processes

## Implicit Procedural Knowledge Detection

SKILL.md files often contain procedural knowledge disguised as narrative instructions. Signs that a section should be codified as a JS process:

1. **Sequential phase structure**: "First do X, then Y, then Z" with dependencies between steps
2. **Conditional branching**: "If the result is A, do B; otherwise do C"
3. **Iteration patterns**: "Repeat until quality threshold is met"
4. **Parallel work**: "Run these checks simultaneously"
5. **Human gates**: "Review before proceeding" (maps to breakpoints)
6. **Artifact accumulation**: "Collect results from each phase into a final report"

These map directly to babysitter process primitives:
- Sequential phases → `await ctx.task()` chains
- Conditionals → JS if/else around `ctx.task()` calls
- Iteration → `while` loops with `ctx.task()` + quality scoring
- Parallel → `ctx.parallel.all()` or `ctx.parallel.map()`
- Human gates → `ctx.breakpoint()`
- Artifacts → accumulator array returned in final output

## Process Library Placement Decision Tree

```
Is this a complete, generic development methodology (like agile, scrum, TDD, waterfall)?
├── Yes → methodologies/<name>/
│
├── No
│   ├── Is this pattern reusable across multiple domains/specializations?
│   │   └── Yes → specializations/shared/
│   │       (e.g., audit-pipeline, expert-advisory, progressive-disclosure, research-pipeline)
│   │
│   └── Is this domain-specific?
│       └── Yes → specializations/<domain>/
│           (e.g., security-compliance/k8s-audit, devops-sre-platform/o11y-setup)
```

**Common mistake**: Placing domain-specific processes in methodologies/. A "k8s security audit" or "deep research pipeline" are NOT methodologies -- they are specialization processes. Only full workflow paradigms that prescribe how to develop software belong in methodologies/.

## Plugin Idea Validation

A valid babysitter plugin idea must answer:
1. What would `install.md` instruct the AI agent to do? (detect stack, interview user, install tools, copy processes, create configs)
2. What processes would it copy from the library?
3. What project-level artifacts would it create? (configs, hooks, commands, profiles)

Valid plugin categories: security & sandboxing, context & memory, knowledge management, developer experience & UX, tools integration, CI/CD integration, DevOps & infrastructure, quality assurance & testing, workflow automation, theming & environment.
