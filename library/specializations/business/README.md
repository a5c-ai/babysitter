# business/ (folded)

This single-process specialization was folded into the matching business domain
subdomain per the process-library placement policy: domain-specific processes live
under `specializations/domains/<domain>`, cross-domain processes under
`specializations/shared`. A stand-alone `business/` directory holding one revenue
process was vestigial.

## Disposition

- `revenue.js` — this directory now contains ONLY a header-only `@deprecated` alias.
  The process body lives at
  `library/specializations/domains/business/business-strategy/revenue.js`; the file
  here is a single `export * from` re-export with no `defineTask` bodies. The old file
  was not removed and the alias is retained deliberately — it is not scheduled for
  deletion, so existing imports of `specializations/business/revenue.js` keep working.
  Import from the new path. Folded in batch-4 (commit `bf012dbb7`); alias retention
  confirmed 2026-08-03.

Do not add new processes here. Add business-strategy processes under
`specializations/domains/business/business-strategy/`.
