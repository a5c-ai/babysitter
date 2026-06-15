# Component Organization

Logical groupings for the flat component directory. Files are not nested into
subdirectories to keep Next.js import paths short, but they belong to the
conceptual groups below.

## inference/ (8 files)

Model serving, runtimes, routes, and virtual model management.

- `curated-model-catalog.jsx`
- `inference-helpers.jsx`
- `inference-playground.jsx`
- `inference-runtime-list.jsx`
- `inference-service-list.jsx`
- `inference-service-manager.jsx`
- `model-route-manager.jsx`
- `virtual-model-manager.jsx`

## agents/ (13 files)

Agent stacks, sessions, runs, deployments, and assistant UI.

- `agent-settings-form.jsx`
- `assistant-chat.jsx`
- `assistant-generate.jsx`
- `assistant-tabs.jsx`
- `deployment-pipeline.jsx`
- `runner-pool-manager.jsx`
- `session-cost.jsx`
- `session-shell.jsx`
- `session-tabs.jsx`
- `stack-actions.jsx`
- `stack-builder.jsx`
- `stack-builder-graph.jsx`
- `stack-edit-form.jsx`

## external/ (4 files)

External provider integration, sync, and conflict resolution.

- `external-conflict-resolver.jsx`
- `external-provider-list.jsx`
- `external-provider-wizard.jsx`
- `external-sync-dashboard.jsx`

## kanban/ (5 files)

Kanban board, columns, cards, and filters.

- `kanban-card.jsx`
- `kanban-column.jsx`
- `kanban-enhanced.jsx`
- `kanban-filters.jsx`
- `kanban-interactive.jsx`

## memory/ (3 files)

Memory search, ontology editing, and import review.

- `memory-import-review.jsx`
- `memory-ontology-editor.jsx`
- `memory-search-form.jsx`

## settings/ (7 files)

Organization and workspace settings, RBAC, secrets, and adapters.

- `app-settings.jsx`
- `secret-manager.jsx`
- `settings-adapters.jsx`
- `settings-gateway.jsx`
- `settings-providers.jsx`
- `settings-rbac.jsx`
- `user-profile.jsx`

## workspace/ (4 files)

Workspace views, associations, codespaces, and run history.

- `workspace-associations.jsx`
- `workspace-codespace.jsx`
- `workspace-panel.jsx`
- `workspace-run-history.jsx`

## shared/ (14 files)

Reusable primitives, layout helpers, and cross-cutting utilities.

- `activity-feed.jsx`
- `code-editor.jsx`
- `command-palette.jsx`
- `confirm-dialog.jsx`
- `global-search.jsx`
- `keyboard-shortcuts.jsx`
- `kradle-loading.jsx`
- `live-updates.jsx`
- `mobile-nav-toggle.jsx`
- `notification-bell.jsx`
- `pagination.jsx`
- `theme-runtime.jsx`
- `tool-inspector.jsx`
- `health-monitor.jsx`

## pages/ (16 files)

Page-level components, resource CRUD, issues, repos, and webhooks.

- `api-explorer.jsx`
- `approval-actions.jsx`
- `approval-mode-toggle.jsx`
- `artifact-registry.jsx`
- `dispatch-button.jsx`
- `issue-editor.jsx`
- `issue-list.jsx`
- `pull-request-list.jsx`
- `repo-code-browser.jsx`
- `repo-runs.jsx`
- `resource-actions.jsx`
- `resource-crud-actions.jsx`
- `rule-actions.jsx`
- `run-actions.jsx`
- `trigger-rule-form.jsx`
- `webhook-manager.jsx`

## Dependencies

Which groups depend on which:

- **pages/** depends on **shared/** (confirm-dialog, pagination, live-updates)
- **agents/** depends on **shared/** (code-editor, live-updates) and **settings/** (agent-settings-form delegates to settings-gateway, settings-adapters, settings-providers, settings-rbac)
- **inference/** is self-contained (inference-helpers provides shared styles/utils within the group)
- **external/** is self-contained
- **kanban/** is self-contained (kanban-enhanced and kanban-interactive compose kanban-card, kanban-column, kanban-filters)
- **memory/** is self-contained
- **workspace/** depends on **pages/** (resource-crud-actions for ResourceActions)
- **shared/** has no intra-group dependencies except kradle-loading (used by theme-runtime init)
