# UI/UX Remaining Issues

Lower-severity items that don't break functionality but affect polish.

## Console.warn in Production Code (14 instances)

These log to browser dev console only — users don't see them.

### Appropriate (background/optional operations)

| File | Line | Context | Why It's Fine |
|------|------|---------|---------------|
| stack-builder-graph-nodes.jsx | 35, 57, 249, 267 | Atlas layer/tool browse/search failures | Background data loading for graph builder, not user-initiated |
| stack-builder-graph-panels.jsx | 27, 129 | Repo/model loading failures | Background data for panel population |
| curated-model-catalog.jsx | 24 | Unified catalog fetch | Already sets `setCatalog(null)` which shows empty state |
| curated-model-catalog.jsx | 124 | Deploy action failure | Should probably be user-facing — deploy is user-initiated |
| model-route-manager.jsx | 109, 120 | Config/provider data loading | Background data for form dropdowns |
| settings-rbac.jsx | 40 | RBAC role binding cleanup | Fire-and-forget alongside primary delete |
| command-palette.jsx | 13, 23 | localStorage read/write | Recovery from corrupted storage |
| assistant-chat-messages.jsx | 22 | Clipboard copy failure | Optional convenience |
| costs/page.jsx | 28 | Cost events loading | Server component, console.warn appropriate |

### Should Be User-Facing

| File | Line | Context | Fix |
|------|------|---------|-----|
| curated-model-catalog.jsx | 124 | Model deploy failure | Add error state to CuratedModelCatalog |

## Index-Based Keys in .map() (30+ instances)

React anti-pattern using array index as `key` prop. Harmless for static lists (markdown rendering) but can cause bugs if lists are reordered/filtered.

**Affected files (static content — low risk):**
- assistant-generate.jsx (markdown line rendering)
- assistant-chat-messages.jsx (message content blocks)
- inference-playground-panel.jsx (markdown rendering)
- repo-code-helpers.jsx (file tree items)

**Affected files (dynamic lists — medium risk):**
- session-cost.jsx (turn cost items)
- external-conflict-resolver.jsx (conflict field list)
- virtual-model-manager.jsx (route/rule entries)
- inference-service-list.jsx (service list)
- secret-manager.jsx (secret entries)

**Fix:** Use `item.metadata?.name || item.id || \`item-${index}\`` as key for dynamic lists.

## Hardcoded Colors (735 instances)

Components use raw hex values (#2563eb, #6b7280, etc.) alongside CSS variables (var(--accent), var(--text-muted)). The two systems use different color values:
- CSS `--accent` = `#3b82f6` (blue-500)
- Hardcoded accent = `#2563eb` (blue-600)

This creates subtle color inconsistencies between themed and non-themed components. Full migration would require visual testing to avoid regressions.

## Missing Keyboard Navigation

- Approval mode toggle uses `role="radiogroup"` but missing arrow key navigation (users expect arrow keys in radio groups, currently must tab between options)
- No other keyboard accessibility issues found — all clickable divs have proper tabIndex and onKeyDown
