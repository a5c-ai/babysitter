# Architecture Upgrades (1-8)

This document tracks implementation of the Codex integration upgrades requested for `babysitter-codex`.

## 1) Runtime vs Content split

- Runtime package scaffold: `packages/runtime/package.json`
- Content package scaffold: `packages/content/package.json`

## 2) Lock + version pinning

- `babysitter.lock.json` defines runtime/content versions and integrity manifest path.

## 3) Team install

- Command: `babysitter:team-install`
- Script: `scripts/team-install.js`
- Output artifacts:
  - `.a5c/team/install.json`
  - `.a5c/team/profile.json`

## 4) Layered rules

- Resolver: `.codex/rules-resolver.js`
- Layer order:
  1. `config/rules/upstream-base.json`
  2. `config/rules/team/default.json`
  3. `.a5c/config/rules.local.json`
  4. `~/.a5c/rules.user.json`

## 5) Lazy process index

- Indexer: `.codex/process-index.js`
- Cached index path: `.a5c/index/process-library-index.json`
- Discovery integration: `.codex/discovery.js`

## 6) Secure content channel

- Generate manifest: `npm run manifest:generate`
- Verify manifest: `npm run manifest:verify`
- Files tracked in `config/content-manifest.json` with SHA256
- Optional signature: HMAC-SHA256 via `BABYSITTER_MANIFEST_SIGNING_KEY`

## 7) Mapping contract checks

- Contract checker: `scripts/check-mapping-contract.js`
- CI gates:
  - `npm run check:mapping`
  - `npm run manifest:verify`
  - `npm run team:install`

## 8) Plugin metadata regression fix

- Restored per-command descriptions in `.codex/plugin.json`
- Added `babysitter:team-install`
- Current command count: 15
