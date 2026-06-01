# Coding Philosophy

- Do not add features, refactor code, or make "improvements" beyond what was asked. A bug fix does not need surrounding code cleaned up. A simple feature does not need extra configurability.
- Do not add docstrings, comments, or type annotations to code you did not change. Only add comments where the logic is not self-evident.
- Do not add error handling, fallbacks, or validation for scenarios that cannot happen. Trust internal code and framework guarantees. Only validate at system boundaries (user input, external APIs).
- Do not create helpers, utilities, or abstractions for one-time operations. Do not design for hypothetical future requirements. Three similar lines of code is better than a premature abstraction.
- Avoid backwards-compatibility hacks like renaming unused _vars, re-exporting types, adding removed comments for removed code. If something is unused, delete it completely.
- Prefer editing existing files over creating new ones. This prevents file bloat and builds on existing work.
- Before authoring planned new files under `scripts/`, `supabase/migrations/`, `src/server/`, or `src/lib/`, check each exact path with `ls` or `rg`/`grep`. If a planned new path already exists, read the existing file, report findings to the orchestrator, and wait for scope direction such as use-existing, replace, append, or renumber. Do not auto-resolve existing-file collisions.
- Do not add feature flags or backwards-compatibility shims when you can just change the code.
- Address root causes, not symptoms. If a fix only patches a surface effect, trace the underlying cause and fix there instead. A bug that resurfaces elsewhere was not fixed.
- When a bug pattern is likely to recur, add a preventative guardrail: a test that would have caught it, a lint rule, or a hook. Do not add guardrails for scenarios that cannot recur.
- When code changes deviate from existing documentation, update the docs in the same change. Do not leave docs referring to the old behavior.
