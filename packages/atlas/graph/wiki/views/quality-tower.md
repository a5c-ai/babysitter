---
id: page:views-quality-tower
nodeKind: Page
title: "Quality Evidence Tower"
slug: "views/quality-tower"
articlePath: "wiki/views/quality-tower.md"
documents:
  - "page:qa"
reusableView:
  type: service-tower
  options:
    id: quality-evidence-tower
    title: "Quality Evidence"
    subtitle: "A reusable tower for claims, evidence, CI surfaces, workflows, and tracked gaps."
    eyebrow: "Quality projection"
    ctaLabel: "Open quality graph"
    floors:
      - id: evidence-floor
        label: "EVIDENCE"
        subtitle: "Claims and their supporting evidence sources."
        rooms:
          - id: claims
            label: "Claims"
            color: "#D4A84B"
            query:
              kind: "Claim"
              limit: 8
          - id: testable-claims
            label: "Testable claims"
            color: "#C98A3E"
            query:
              kind: "TestableClaim"
              limit: 8
          - id: evidence-sources
            label: "Evidence sources"
            color: "#3F8A77"
            query:
              kind: "EvidenceSource"
              limit: 8
          - id: claim-runs
            label: "Claim runs"
            color: "#8C5C7E"
            query:
              kind: "ClaimTestRun"
              limit: 8
      - id: delivery-floor
        label: "DELIVERY"
        subtitle: "CI, workflows, releases, and operational checks."
        rooms:
          - id: ci-surfaces
            label: "CI surfaces"
            color: "#C03A2B"
            query:
              kind: "CiSurface"
              limit: 8
          - id: workflows
            label: "Workflows"
            color: "#C98A3E"
            query:
              kind: "Workflow"
              limit: 8
          - id: acceptance
            label: "Acceptance"
            color: "#D4A84B"
            query:
              kind: "AcceptanceCriterion"
              limit: 8
          - id: activities
            label: "Activity"
            color: "#3F8A77"
            query:
              kind: "ActivityEntry"
              limit: 8
      - id: gaps-floor
        label: "GAPS"
        subtitle: "Deferred nodes, process pages, and governance controls that keep debt visible."
        rooms:
          - id: deferred
            label: "Deferred nodes"
            color: "#8C5C7E"
            query:
              kind: "DeferredNode"
              limit: 8
          - id: process-pages
            label: "Process pages"
            color: "#D4A84B"
            query:
              kind: "Page"
              search: "process gap governance"
              limit: 8
          - id: trust-levels
            label: "Trust levels"
            color: "#3F8A77"
            query:
              kind: "TrustLevel"
              limit: 8
          - id: source-refs
            label: "Source refs"
            color: "#C98A3E"
            query:
              kind: "SourceRef"
              limit: 8
---
# Quality Evidence Tower

This reusable view groups quality, evidence, and delivery records into a tower that can be scanned room by room.

Use it when you want a projectable quality map rather than a single raw list of claims or workflows.
