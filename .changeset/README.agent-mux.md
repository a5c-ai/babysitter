# Changesets

This directory is managed by [changesets](https://github.com/changesets/changesets).

## Adding a changeset

```bash
npx changeset
```

Pick the packages that changed, the bump type (major/minor/patch), and write a
one-line summary. The tool writes a markdown stub under `.changeset/`.

## Releasing

The `release.yml` workflow runs `changeset version` to bump package versions
and aggregate pending changesets into `CHANGELOG.md`, then runs
`changeset publish` after merge.

All five workspace packages version together (configured as `fixed` in
`config.json`) so the whole SDK ships a single coherent release.
