---
name: babysitter:team-install
description: Install or refresh a team-pinned babysitter runtime/content setup from lockfile.
argument-hint: "[--dry-run]"
---

# babysitter:team-install

Install the team-standard babysitter-codex setup defined by `babysitter.lock.json`.

## Steps

1. Validate lock file exists:
```bash
test -f babysitter.lock.json
```

2. Verify content integrity:
```bash
node scripts/verify-content-manifest.js
```

3. Run team installer:
```bash
node scripts/team-install.js
```

4. Confirm generated files:
- `.a5c/team/install.json`
- `.a5c/team/profile.json`

Use this before onboarding new repos or contributors so command/process/rules mappings are deterministic.
