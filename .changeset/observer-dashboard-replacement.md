---
"@a5c-ai/babysitter-observer-dashboard": patch
---

Replace the package content with the production-proven standalone observer dashboard: working breakpoint answering (approved:true + response, double-answer guard), payload-nested question rendering, activity-based liveness + scheduled states, reconciled counts, board (kanban) triage view, ghost-run discovery filter, full-run-id copy affordances. 92 test files / 1284 unit tests + 12 e2e specs included.

Review round 4 hardening: the breakpoint approval action now FAILS CLOSED — it rejects when tasks/&lt;effectId&gt;/task.json is missing/unreadable AND independently requires the journal's EFFECT_REQUESTED record to be breakpoint-kind before committing; self-contained typecheck gate (pretypecheck); dependency bootstrap fails hard on broken dependency builds; TooltipTrigger is nested-button-safe by construction; SDK pin relaxed to ^6.0.0; root lockfile bumps ws/hono/@grpc/grpc-js/protobufjs so the production high-severity audit is clean.
