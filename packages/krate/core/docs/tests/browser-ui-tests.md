# Browser and UI tests

## Browser framework

Use Playwright for browser E2E once added. Browser tests should focus on route behavior, accessibility, and critical workflows rather than brittle visual snapshots.

## Route smoke coverage

Required route smoke tests:

- `/orgs`;
- `/orgs/[org]`;
- `/orgs/[org]/repositories`;
- `/orgs/[org]/repositories/[repo]/code`;
- `/issues`, `/pull-requests`, `/runs`, `/hooks`, `/settings` under repo routes;
- `/orgs/[org]/deployments`;
- `/orgs/[org]/runs`;
- future `/orgs/[org]/agents/*` and `/orgs/[org]/agents/memory/*`.

Every route smoke asserts:

- org switcher visible;
- breadcrumbs include org;
- main heading exists;
- no server error;
- advanced YAML/resource panels are reachable where expected;
- unauthorized or missing resources show safe empty states.

## Critical UI journeys

| Journey | Assertions |
| --- | --- |
| Org switch | route changes org, data changes, no cross-org leakage. |
| Repository navigation | tabs preserve org/repo and active page. |
| Create/apply resource | YAML/plan preview, server validation, status update. |
| Run debugging | run list, event stream, details, rerun affordance. |
| Agent dispatch | composer, memory preview, permission review, created run link. |
| Memory import review | generated diff, redaction status, validation status, approve/reject. |

## Accessibility checks

Run automated checks on primary routes for:

- headings and landmarks;
- form labels;
- button/link names;
- keyboard navigation;
- focus management in dialogs/panels;
- color contrast for status indicators;
- reduced-motion behavior where relevant.

## Visual regression

Use visual checks sparingly for stable layout contracts:

- app shell/sidebar/topbar;
- repository code layout;
- run detail layout;
- memory import review panel;
- empty/loading/error states.

Prefer semantic assertions for changing data-heavy pages.
