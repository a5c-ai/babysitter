# LLM Wiki -- Uninstall Instructions

Remove the LLM Wiki plugin, skills, and agent instruction references. **Wiki content is preserved by default** -- you choose whether to delete it.

---

## Step 1: Confirm Scope

Determine what was installed by checking the registry and filesystem:

```bash
# Check project scope
ls .a5c/wiki/ 2>/dev/null && echo "Project wiki found at .a5c/wiki/"
ls .a5c/skills/wiki-ingest/ .a5c/skills/wiki-query/ .a5c/skills/wiki-lint/ 2>/dev/null

# Check global scope
ls ~/.a5c/wiki/ 2>/dev/null && echo "Global wiki found at ~/.a5c/wiki/"
ls ~/.a5c/skills/wiki-ingest/ ~/.a5c/skills/wiki-query/ ~/.a5c/skills/wiki-lint/ 2>/dev/null
```

---

## Step 2: Ask About Wiki Content

Ask the user:

> **Do you want to delete the wiki content?**
> - **Keep** (default) -- remove skills and integration, but leave the wiki directory intact for manual reference
> - **Archive** -- move the wiki directory to a backup location before removing
> - **Delete** -- remove everything including all wiki pages and raw sources

---

## Step 3: Remove Skills

Remove wiki skills from the appropriate scope:

**Project scope:**
```bash
rm -rf .a5c/skills/wiki-ingest/
rm -rf .a5c/skills/wiki-query/
rm -rf .a5c/skills/wiki-lint/
```

**Global scope:**
```bash
rm -rf ~/.a5c/skills/wiki-ingest/
rm -rf ~/.a5c/skills/wiki-query/
rm -rf ~/.a5c/skills/wiki-lint/
```

---

## Step 4: Remove Agent Instructions

Edit the instruction file (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, or `~/.claude/CLAUDE.md`) and remove the `## LLM Wiki` section that was added during install.

Preserve all other content in the file.

---

## Step 5: Remove Search Integration

If qmd was configured:

```bash
qmd collection remove wiki 2>/dev/null || true
```

---

## Step 6: Handle Wiki Content

Based on user's choice from Step 2:

**Keep (default):** Do nothing -- wiki remains at its current location.

**Archive:**
```bash
# Project scope
mv .a5c/wiki/ ".a5c/wiki-archived-$(date +%Y%m%d)/" 2>/dev/null || true

# Global scope
mv ~/.a5c/wiki/ "~/.a5c/wiki-archived-$(date +%Y%m%d)/" 2>/dev/null || true
```

**Delete:**
```bash
# Project scope
rm -rf .a5c/wiki/

# Global scope
rm -rf ~/.a5c/wiki/
```

---

## Step 7: Clean Up Gitignore

If a `.gitignore` entry was added for the wiki, remove it:

```
# Remove this line if present:
.a5c/wiki/
```

---

## Step 8: Unregister Plugin

```bash
babysitter plugin:remove-from-registry --plugin-name llm-wiki --project --json 2>/dev/null || true
babysitter plugin:remove-from-registry --plugin-name llm-wiki --global --json 2>/dev/null || true
```

---

## Step 9: Verify

```bash
# Skills should be gone
ls .a5c/skills/wiki-ingest/ 2>/dev/null && echo "WARN: ingest skill still exists" || echo "OK: ingest skill removed"
ls .a5c/skills/wiki-query/ 2>/dev/null && echo "WARN: query skill still exists" || echo "OK: query skill removed"

# Agent instructions should be clean
grep -q "LLM Wiki" CLAUDE.md 2>/dev/null && echo "WARN: CLAUDE.md still references wiki" || echo "OK: CLAUDE.md clean"

# Registry should be clean
babysitter plugin:list-installed --project --json 2>/dev/null | grep -q "llm-wiki" && echo "WARN: still in project registry" || echo "OK: project registry clean"
babysitter plugin:list-installed --global --json 2>/dev/null | grep -q "llm-wiki" && echo "WARN: still in global registry" || echo "OK: global registry clean"
```
