# gsd-tools

Central utility skill for GSD operations. Provides config parsing, slug generation, timestamps, path operations, and planning directory initialization.

## Quick Start

This skill is automatically invoked at the start of every GSD process. It provides foundational primitives that all other skills and agents depend on.

### Load Configuration

```bash
# Read existing config
cat .planning/config.json

# Config is auto-created with defaults if missing
```

### Generate a Slug

```
Input:  "Add OAuth2 authentication"
Output: "add-oauth2-authentication"
```

### Resolve Paths

```
Phase directory: .planning/phase-72/
Quick task:      .planning/quick/001-fix-login/
Debug session:   .planning/debug/payment-race-condition.md
```

### Detect Project State

Returns one of: `NO_PROJECT`, `INITIALIZED`, `MID_PHASE`, `PHASE_COMPLETE`, `MILESTONE_READY`, `BLOCKED`.

## Examples

### Initialize a New Planning Directory

```bash
mkdir -p .planning
# gsd-tools creates config.json with defaults
# gsd-tools creates STATE.md skeleton
```

### Parse Phase Numbers

```
"72"   -> major: 72, minor: null
"72.1" -> major: 72, minor: 1
```

### Quick Task Numbering

Scans `.planning/quick/` for existing directories, finds highest number, returns next sequential number (zero-padded to 3 digits).

## Troubleshooting

### Config not loading
- Check `.planning/config.json` exists and is valid JSON
- Run `gsd health` to diagnose planning directory issues
- Delete `config.json` to reset to defaults

### Slug collisions
- Slugs are deduplicated with `-2`, `-3` suffixes
- If 10+ collisions occur, a timestamp suffix is used instead
- Check target directory for unexpected files

### Planning directory issues
- Ensure `.planning/` is not gitignored (it should be tracked)
- Check write permissions on the directory
- Run `gsd health` for full diagnostic report

### Phase number parsing errors
- Integer phases: `72`, `73`, `74`
- Decimal phases (inserted): `72.1`, `72.2`
- Negative numbers and zero are not valid phase numbers
