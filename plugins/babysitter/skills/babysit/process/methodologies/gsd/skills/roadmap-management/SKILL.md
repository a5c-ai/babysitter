---
name: roadmap-management
description: Roadmap parsing, analysis, and mutation operations for ROADMAP.md. Handles phase and milestone lifecycle including add, insert (decimal), remove, complete, and requirements coverage analysis.
allowed-tools: Read Write Edit Glob Grep
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: gsd-core
  backlog-id: SK-GSD-006
---

# roadmap-management

You are **roadmap-management** - the skill for all ROADMAP.md operations within the GSD methodology. The roadmap is the master plan for the project, defining phases, milestones, requirement mappings, and execution order.

## Overview

ROADMAP.md is the structured plan for phased project delivery. It defines:
- Milestones (versioned deliverables, e.g., v1.0, v2.0)
- Phases within each milestone (numbered execution units)
- Requirements mapped to phases (100% coverage guarantee)
- Phase dependencies and ordering
- Phase status tracking (planned/in-progress/completed/verified)

This skill combines the original `lib/roadmap.cjs` and `lib/phase.cjs` modules. It handles all roadmap mutations: adding phases, inserting decimal phases for urgent work, removing phases with renumbering, and marking phases complete.

## Capabilities

### 1. Parse Roadmap

Parse ROADMAP.md into structured data:

```markdown
# Roadmap

## Milestone v1.0: MVP Launch

### Phase 70: Project Setup
- **Status**: completed
- **Requirements**: R1 (project scaffolding), R2 (dev environment)
- **Deliverables**: Package.json, tsconfig, eslint config, CI pipeline

### Phase 71: Database Layer
- **Status**: completed
- **Requirements**: R3 (data model), R4 (migrations)
- **Deliverables**: Schema definitions, migration scripts, seed data

### Phase 72: Authentication
- **Status**: in-progress
- **Requirements**: R5 (user auth), R6 (OAuth2)
- **Deliverables**: Login flow, token management, middleware

### Phase 73: API Endpoints
- **Status**: planned
- **Requirements**: R7 (REST API), R8 (validation)
- **Deliverables**: CRUD endpoints, input validation, error handling

## Milestone v2.0: Enhanced Features
...
```

Parsed result:
```json
{
  "milestones": [
    {
      "version": "v1.0",
      "title": "MVP Launch",
      "phases": [
        { "number": 70, "title": "Project Setup", "status": "completed", "requirements": ["R1", "R2"] },
        { "number": 71, "title": "Database Layer", "status": "completed", "requirements": ["R3", "R4"] },
        { "number": 72, "title": "Authentication", "status": "in-progress", "requirements": ["R5", "R6"] },
        { "number": 73, "title": "API Endpoints", "status": "planned", "requirements": ["R7", "R8"] }
      ]
    }
  ]
}
```

### 2. Add Integer Phase

Append a new phase to the end of the current milestone:

```
add_phase(
  milestone: "v1.0",
  title: "Admin Dashboard",
  requirements: ["R12", "R13"],
  deliverables: "Admin UI, user management, analytics"
)
-> Phase 74: Admin Dashboard (appended after Phase 73)
```

### 3. Insert Decimal Phase

Insert a phase between existing phases for urgent work:

```
insert_phase(
  after: 72,
  title: "Fix Auth Token Refresh",
  requirements: ["R5.1"],
  deliverables: "Token refresh logic, session persistence"
)
-> Phase 72.1: Fix Auth Token Refresh (inserted between 72 and 73)
```

Decimal phases:
- `72.1` is between 72 and 73
- `72.2` is between 72.1 and 73
- Multiple decimals can exist between any two integer phases

### 4. Remove Phase and Renumber

Remove a future phase and renumber subsequent phases:

```
remove_phase(73)
-> Phase 73 removed
-> Phase 74 renumbered to Phase 73
-> All references updated
```

Only future (planned) phases can be removed. Completed and in-progress phases cannot be removed.

### 5. Mark Phase Complete

Update phase status in the roadmap:

```
complete_phase(72)
-> Phase 72 status: completed
-> If all phases in milestone completed -> milestone ready for audit
```

Status transitions:
- `planned` -> `in-progress` (when planning begins)
- `in-progress` -> `completed` (when execution finishes)
- `completed` -> `verified` (when verification passes)

### 6. Requirements Coverage Analysis

Verify 100% requirement coverage across phases:

```
coverage_analysis()
-> Total requirements: 13
-> Mapped to phases: 13
-> Unmapped: 0
-> Coverage: 100%

-> R1: Phase 70 (completed)
-> R2: Phase 70 (completed)
-> R5: Phase 72 (in-progress)
-> R5.1: Phase 72.1 (planned)
...
```

### 7. Phase Dependency Resolution

Determine execution order based on dependencies:

```
dependency_graph()
-> Phase 70: no dependencies (can start immediately)
-> Phase 71: depends on Phase 70
-> Phase 72: depends on Phase 71
-> Phase 72.1: depends on Phase 72
-> Phase 73: depends on Phase 71 (not 72, can parallelize)
```

### 8. Milestone Scope Determination

Determine which phases belong to a milestone:

```
milestone_scope("v1.0")
-> Phases: [70, 71, 72, 72.1, 73]
-> Total: 5 phases
-> Completed: 2
-> In Progress: 1
-> Planned: 2
-> Progress: 40%
```

### 9. Phase Status Queries

Query phases by status:

```
phases_by_status("completed") -> [70, 71]
phases_by_status("in-progress") -> [72]
phases_by_status("planned") -> [72.1, 73]
next_phase() -> 72.1 (first planned phase after current)
```

## Tool Use Instructions

### Parsing Roadmap
1. Use `Read` to load `.planning/ROADMAP.md`
2. Parse markdown headings to identify milestones (## level) and phases (### level)
3. Extract status, requirements, and deliverables from bullet points under each phase
4. Return structured milestone/phase hierarchy

### Adding a Phase
1. Parse current roadmap to find last phase number in target milestone
2. Generate new phase number (last + 1)
3. Format phase section following existing pattern
4. Use `Edit` to insert before the next milestone heading or end of file

### Inserting a Decimal Phase
1. Parse roadmap to find the target phase and next phase
2. Calculate decimal number (e.g., 72.1 if inserting after 72)
3. Format phase section
4. Use `Edit` to insert between the two phases

### Requirements Coverage
1. Parse ROADMAP.md for all phase requirement mappings
2. Use `Read` to load `.planning/REQUIREMENTS.md` for full requirement list
3. Compare mapped requirements against full list
4. Report coverage percentage and any gaps

## Process Integration

- `new-project.js` - Create initial ROADMAP.md with milestone and phase structure
- `progress.js` - Read roadmap for progress display and next-action routing
- `complete-milestone.js` - Determine milestone scope, verify all phases complete
- `audit-milestone.js` - Read phase scope for audit, requirements coverage check
- `plan-phase.js` - Read phase requirements and deliverables for planning context
- `add-phase` command - Add integer phase via this skill
- `insert-phase` command - Insert decimal phase via this skill
- `remove-phase` command - Remove phase via this skill

## Output Format

```json
{
  "operation": "parse|add|insert|remove|complete|coverage|dependencies|scope|query",
  "status": "success|error",
  "roadmap": {
    "milestoneCount": 2,
    "totalPhases": 8,
    "currentMilestone": "v1.0"
  },
  "phase": {
    "number": 72,
    "title": "Authentication",
    "status": "completed",
    "requirements": ["R5", "R6"]
  },
  "coverage": {
    "total": 13,
    "mapped": 13,
    "percentage": 100,
    "gaps": []
  }
}
```

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `roadmapFile` | `.planning/ROADMAP.md` | Path to ROADMAP.md |
| `requirementsFile` | `.planning/REQUIREMENTS.md` | Path for coverage analysis |
| `startingPhaseNumber` | `70` | First phase number for new projects |
| `allowDecimalPhases` | `true` | Enable decimal phase insertion |
| `autoStatusTransition` | `true` | Auto-update phase status on events |

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `ROADMAP.md not found` | Planning directory not initialized | Run new-project first |
| `Phase not found` | Referenced phase does not exist | Check phase number, list available phases |
| `Cannot remove active phase` | Trying to remove in-progress/completed phase | Only planned phases can be removed |
| `Duplicate phase number` | Phase number already exists | Use next available number or decimal |
| `Coverage gap detected` | Requirements not mapped to any phase | Add phase or update existing phase to cover requirement |
| `Circular dependency` | Phase depends on itself or cycle exists | Review dependency graph, break cycle |

## Constraints

- ROADMAP.md must remain human-readable markdown at all times
- Phase numbers must be positive (integer or decimal with one decimal place)
- Requirements coverage must be 100% before milestone can be audited
- Phase removal triggers automatic renumbering of subsequent phases
- Status transitions are one-directional (cannot go from completed back to planned)
- Decimal phases are temporary (should be consolidated into integer phases at milestone completion)
- All roadmap mutations must be committed via git-integration skill
