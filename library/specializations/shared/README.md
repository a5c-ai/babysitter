# Shared (Cross-Domain Assets)

## Overview

`shared/` is the home for cross-domain library assets — skills, and eventually agents and processes, that are useful across many specializations rather than belonging to any single domain. Per the library placement policy, only assets with genuine cross-domain applicability live here.

## Current Contents

| Asset | Type | Description |
|-------|------|-------------|
| [skills/kip-librarian](skills/kip-librarian/) | Skill | Canonical kip knowledge-store patterns for any process or agent — recall prior facts before work, assert decisions/gate outcomes as structured facts after work, resolve entities with an explicit model, and invoke the kip CLI Windows-safely |

## Placement Rules

- **Full generic development methodologies** → `library/methodologies/`
- **Domain-specific assets** → `library/specializations/<domain>/`
- **Cross-domain assets** (useful across many domains) → `library/specializations/shared/`

When in doubt, prefer the most specific home: an asset only moves to `shared/` when it is demonstrably useful across many domains.
