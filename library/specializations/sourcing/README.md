# sourcing/ (folded)

This single-process specialization was folded into the `research` specialization per
the process-library placement policy. `news-intelligence-pipeline.js` is an
end-to-end scanning/monitoring pipeline (discover -> dedupe -> filter signal ->
per-portfolio impact assessment -> synthesize -> route alerts -> track follow-through)
— a natural sibling of the research scanner point-tasks (novelties-scanner,
vendor-researcher, evangelist).

## Disposition

- `news-intelligence-pipeline.js` — RELOCATED to
  `specializations/research/news-intelligence-pipeline.js`.
  A header-only `@deprecated` pointer remains here and re-exports the process, so
  existing string-path references keep resolving. The one canonical code reference
  (`packages/babysitter-sdk/src/prompts/capabilityProcessMap.ts`) has been updated to
  the new path.

Do not add new processes here. Add scanning/intelligence pipelines under
`specializations/research/`.
