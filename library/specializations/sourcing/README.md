# sourcing/ (folded)

This single-process specialization was folded into the `research` specialization per
the process-library placement policy. `news-intelligence-pipeline.js` is an
end-to-end scanning/monitoring pipeline (discover -> dedupe -> filter signal ->
per-portfolio impact assessment -> synthesize -> route alerts -> track follow-through)
— a natural sibling of the research scanner point-tasks (novelties-scanner,
vendor-researcher, evangelist).

## Disposition

- `news-intelligence-pipeline.js` — this directory now contains ONLY a header-only
  `@deprecated` alias. The process body lives at
  `library/specializations/research/news-intelligence-pipeline.js`; the file here is a
  single `export * from` re-export with no `defineTask` bodies. The old file was not
  removed and the alias is retained deliberately — it is not scheduled for deletion, so
  existing string-path references keep resolving. The one canonical code reference
  (`packages/babysitter-sdk/src/prompts/capabilityProcessMap.ts`) has been updated to
  the new path. Folded in batch-4 (commit `bf012dbb7`); alias retention confirmed
  2026-08-03.

Do not add new processes here. Add scanning/intelligence pipelines under
`specializations/research/`.
