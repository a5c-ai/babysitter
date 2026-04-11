# LLM Wiki -- Configure Instructions

Adjust the wiki's schema, skills, search integration, and agent behavior.

---

## Option 1: Modify Schema (Add/Remove Page Kinds)

Edit `[WIKI_ROOT]/schema.md` to add new page kinds or modify existing ones.

When adding a new kind:
1. Add the kind definition with required/optional fields
2. Update the linking rules if the new kind has special relationships
3. Run `/wiki-lint` to check if existing pages need updating

When removing a kind:
1. Check which pages use that kind: `grep -rl "kind: [kind-name]" [WIKI_ROOT]/wiki/`
2. Migrate those pages to a different kind or delete them
3. Remove the kind from `schema.md`
4. Run `/wiki-lint` to verify

---

## Option 2: Change Ingest Mode

Edit the `wiki-ingest` skill at `[skills_dir]/wiki-ingest/SKILL.md`:

- **To switch to interactive**: ensure step 4 includes the clarification question
- **To switch to automatic**: remove or comment out the interactive clarification step
- **To switch to both**: add a conditional: "If the source is ambiguous or complex, ask the user; otherwise process silently"

---

## Option 3: Toggle Proactive Referencing

Edit the instruction file (`CLAUDE.md` / `AGENTS.md` / `~/.claude/CLAUDE.md`):

**To enable:**
Add to the LLM Wiki section:
```
When answering questions about [domain], check the wiki first. Use /wiki-query to search for relevant pages before relying on general knowledge.
```

**To disable:**
Remove the proactive referencing line, keeping only the wiki location reference.

---

## Option 4: Add/Remove qmd Search Integration

**To add (if not configured during install):**

1. Install qmd if not present: `/babysitter:plugins install qmd`
2. Add wiki collection:
   ```bash
   qmd collection add wiki --path "[WIKI_ROOT]/wiki/" --watch
   ```
3. Update the `wiki-query` skill to include the qmd search step

**To remove:**

1. Remove the collection:
   ```bash
   qmd collection remove wiki
   ```
2. Edit the `wiki-query` skill to remove qmd references

---

## Option 5: Add/Remove the Lint Skill

**To add:**
Create `[skills_dir]/wiki-lint/SKILL.md` following the template in install.md Step 6.3.

**To remove:**
```bash
rm -rf [skills_dir]/wiki-lint/
```

---

## Option 6: Change Wiki Location

Moving a wiki between project and global scope:

1. Copy the wiki directory to the new location:
   ```bash
   # Project to global
   cp -r .a5c/wiki/ ~/.a5c/wiki/
   
   # Global to project
   cp -r ~/.a5c/wiki/ .a5c/wiki/
   ```

2. Update all skill files to reference the new path
3. Update agent instruction files to reference the new path
4. If qmd is configured, update the collection path:
   ```bash
   qmd collection remove wiki
   qmd collection add wiki --path "[NEW_WIKI_ROOT]/wiki/" --watch
   ```
5. Remove the old wiki directory after verifying the new one works

---

## Option 7: Add Custom Metadata Fields

1. Edit `[WIKI_ROOT]/schema.md` to add the new field to the relevant page kinds
2. Optionally update existing pages to include the new field
3. Update the `wiki-ingest` skill if the new field should be populated automatically during ingest

---

## Option 8: Seed from Existing Documentation

To bulk-import existing documentation into the wiki:

1. Identify documentation files to import
2. For each file, run `/wiki-ingest` or manually create wiki pages following the schema
3. The index and log will be updated automatically by the ingest skill

---

## Option 9: Change Scope Registration

If the plugin was registered at project scope but should be global (or vice versa):

```bash
# Remove from current scope
babysitter plugin:remove-from-registry --plugin-name llm-wiki --[current-scope] --json

# Register at new scope
babysitter plugin:update-registry --plugin-name llm-wiki --plugin-version 1.0.0 --marketplace-name babysitter --[new-scope] --json
```
