# Dev Browser -- Uninstall Instructions

Removes the dev-browser integration from your project. The global `dev-browser` binary is left installed.

---

## Step 1: Remove Skill

```bash
rm -rf .a5c/skills/dev-browser/
```

---

## Step 2: Remove Permission

Remove `"Bash(dev-browser *)"` from the `permissions.allow` array in `.claude/settings.json`. Preserve all other permissions.

---

## Step 3: Remove CLAUDE.md Section

Remove the `## Dev Browser` section (and everything under it until the next `##` heading or end of file) from `CLAUDE.md`.

---

## Step 4: Remove Plugin from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name dev-browser --project --json
```

---

## Post-Uninstall Notes

- The `dev-browser` npm package remains installed globally. To remove it: `npm uninstall -g dev-browser`
- No project data is affected -- dev-browser only ran sandboxed browser scripts.
