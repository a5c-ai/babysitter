# Basic Security — Uninstall Instructions

This document describes how to completely remove the basic-security plugin and all its installed artifacts from the project.

---

## Step 1: Remove Security Processes

Delete all security process files that were copied during installation:

```bash
rm -rf .a5c/processes/security/
```

This removes all `.js` process files under the `security/` subdirectory. Other processes outside this directory are not affected.

---

## Step 2: Remove Security Skills

Delete all security skill directories that were copied during installation:

```bash
rm -rf .a5c/skills/security/
```

This removes all skill directories (and their `SKILL.md` files) under the `security/` subdirectory. Other skills outside this directory are not affected.

---

## Step 3: Remove Security Agents

Delete all security agent directories that were copied during installation:

```bash
rm -rf .a5c/agents/security/
```

This removes all agent directories (and their `AGENT.md` files) under the `security/` subdirectory. Other agents outside this directory are not affected.

---

## Step 4: Remove Security Commands

Delete the security commands file:

```bash
rm -f .a5c/commands/security-commands.md
```

This removes all slash commands that were registered by the plugin. Other command files in `.a5c/commands/` are not affected.

---

## Step 5: Remove from Plugin Registry

Deregister the plugin from the project-level plugin registry:

```bash
babysitter plugin:remove-from-registry --plugin-name basic-security --project --json
```

Verify the removal succeeded by checking the JSON output. The plugin should no longer appear in the registry.

---

## Post-Uninstall Verification

After uninstalling, confirm that all artifacts have been removed:

```bash
ls .a5c/processes/security/ 2>/dev/null && echo "WARNING: security processes still exist" || echo "OK: security processes removed"
ls .a5c/skills/security/ 2>/dev/null && echo "WARNING: security skills still exist" || echo "OK: security skills removed"
ls .a5c/agents/security/ 2>/dev/null && echo "WARNING: security agents still exist" || echo "OK: security agents removed"
ls .a5c/commands/security-commands.md 2>/dev/null && echo "WARNING: security commands still exist" || echo "OK: security commands removed"
```

All checks should report "OK". If any warnings appear, manually remove the remaining files.

---

## Notes

- Uninstalling does **not** delete any run history or scan results that were generated while the plugin was active. Those remain in `.a5c/runs/` and can be cleaned up separately if desired.
- Uninstalling does **not** affect the source library at `plugins/babysitter/skills/babysit/process/specializations/security-compliance/`. The plugin can be reinstalled at any time.
- If you only want to remove specific categories rather than everything, see the **configure.md** instructions for selectively removing individual processes, skills, and agents.
