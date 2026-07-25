# business/ (folded)

This single-process specialization was folded into the matching business domain
subdomain per the process-library placement policy: domain-specific processes live
under `specializations/domains/<domain>`, cross-domain processes under
`specializations/shared`. A stand-alone `business/` directory holding one revenue
process was vestigial.

## Disposition

- `revenue.js` — RELOCATED to
  `specializations/domains/business/business-strategy/revenue.js`.
  A header-only `@deprecated` pointer remains at `revenue.js` in this directory and
  re-exports the process, so existing imports of
  `specializations/business/revenue.js` keep working. Import from the new path.

Do not add new processes here. Add business-strategy processes under
`specializations/domains/business/business-strategy/`.
