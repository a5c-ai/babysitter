import type { AtlasRecord } from "@a5c-ai/atlas";
import type { AtlasGraphLike } from "@/lib/server/atlas-local";
import type {
  ServiceTowerDomain,
  ServiceTowerFloor,
  ServiceTowerRecord,
  ServiceTowerRoom,
  ServiceTowerService,
  ServiceTowerViewData,
} from "./types";

/* ── Original a5c service catalog skeleton ─────────────────────── */

type DeptSeed = {
  id: string;
  label: string;
  color: string;
  services: ServiceSeed[];
  graphQueries: string[];
};

type ServiceSeed = {
  code: string;
  name: string;
  scope: string;
  summary: string;
  kpis: string[];
  refs: string[];
  tier: string;
};

type FloorSeed = {
  id: string;
  domain: string;
  label: string;
  blurb: string;
  depts: DeptSeed[];
};

const DOMAIN_COLORS: Record<string, string> = {
  strategy: "#D4A84B",
  build: "#C98A3E",
  revenue: "#C03A2B",
  enablement: "#8C5C7E",
  trust: "#3F8A77",
};

const DEPT_COLORS: Record<string, string> = {
  executive: "#D4A84B",
  finance: "#C98A3E",
  product: "#D4A84B",
  engineering: "#C03A2B",
  "data-ai": "#3F8A77",
  design: "#8C5C7E",
  marketing: "#C98A3E",
  sales: "#C03A2B",
  "revenue-ops": "#D4A84B",
  "customer-success": "#3F8A77",
  support: "#C03A2B",
  people: "#8C5C7E",
  it: "#3F8A77",
  operations: "#D4A84B",
  legal: "#8C5C7E",
  security: "#3F8A77",
};

const DEPT_GRAPH_QUERIES: Record<string, string[]> = {
  executive: ["domain:corporate-strategy", "domain:executive-search", "workflow:quarterly-planning"],
  finance: ["domain:finance", "domain:quantitative-finance", "skill-area:fp-and-a"],
  product: ["domain:product-management", "skill-area:user-research", "workflow:discovery-double-diamond"],
  engineering: ["domain:software-engineering", "domain:data-engineering", "skill-area:distributed-systems"],
  "data-ai": ["domain:data-engineering", "domain:artificial-intelligence", "skill-area:ml-ops"],
  design: ["domain:graphic-design", "domain:game-design", "domain:design-system"],
  marketing: ["domain:marketing", "domain:demand-generation", "skill-area:content-strategy"],
  sales: ["domain:sales", "skill-area:sales-operations", "skill-area:negotiation"],
  "revenue-ops": ["domain:revenue-operations", "skill-area:revenue-operations"],
  "customer-success": ["domain:customer-experience", "domain:customer-relations"],
  support: ["domain:customer-support", "workflow:ticket-triage"],
  people: ["domain:human-resources", "role:people-analytics-specialist"],
  it: ["domain:identity-and-access", "domain:endpoint-management"],
  operations: ["domain:operations", "domain:business-operations", "skill-area:vendor-management-ops"],
  legal: ["domain:legal", "domain:legaltech"],
  security: ["domain:cybersecurity", "domain:compliance", "skill-area:threat-modeling"],
};

function S(code: string, name: string, scope: string, summary: string, kpis: string[], refs: string[], tier = "Engagement"): ServiceSeed {
  return { code, name, scope, summary, kpis, refs, tier };
}

const SERVICES: Record<string, ServiceSeed[]> = {
  executive: [
    S("EX-01", "Office-of-CEO Operating System", "90 days", "Rebuild the executive cadence: weekly business review, quarterly OKRs, monthly board pack, capital council.", ["Decision velocity ↑ 2.4×", "Exec meetings −38%", "Board NPS 9+"], ["program:executive-os", "workflow:quarterly-planning"], "Strategic"),
    S("EX-02", "Strategic Memorandum", "4 weeks", "One signed-off document: where we are, where we are going, what we will and will not fund.", ["Strategic alignment 87%", "Funded bets cut to top 5", "Drafts → final ≤ 3 rounds"], ["artifact:strategic-memo", "domain:corporate-strategy"]),
    S("EX-03", "Quarterly Business Review Engine", "1 quarter", "Standardize the QBR: pre-reads, scorecards, narrative section, action register, follow-through audit.", ["On-time QBRs 100%", "Action close-rate 92%", "Follow-up SLA 14d"], ["workflow:qbr", "workflow:action-register"]),
    S("EX-04", "Board Narrative & Materials", "Per cycle", "Investor-grade narrative, financial deck, KPI appendix, risk register, exec letter — turned weekly.", ["Materials lead-time 5d", "Narrative consistency 95%", "Q&A prep coverage 100%"], ["workflow:board-review", "artifact:board-letter"]),
  ],
  finance: [
    S("FN-01", "Close-Cycle Acceleration", "1 quarter", "Reconciliation, controls, rolling forecast, board-grade reporting. Halve days-to-close.", ["Days-to-close 12 → 5", "Reconciliation breaks −80%", "Audit findings 0"], ["workflow:monthly-close", "skill-area:fp-and-a"], "Operational"),
    S("FN-02", "Forecast Engineering", "8 weeks", "Bottoms-up driver model, confidence bands, runway scenarios. Plumbed to source-of-truth.", ["Forecast Δ ≤ 4%", "Driver coverage 100%", "Scenarios in 1h not 1wk"], ["workflow:forecast-roll-up", "metric:burn-multiple"]),
    S("FN-03", "Spend Discipline Program", "6 weeks", "Approval chain, vendor consolidation, contract repricing, annual run-rate audit.", ["Run-rate cut 11%", "Approval cycle 8d → 2d", "Vendor count −24%"], ["workflow:budget-cycle", "workflow:contract-renewal"], "Operational"),
    S("FN-04", "Audit-Ready Controls", "1 quarter", "SOX-grade controls inventory, evidence pipeline, walkthroughs, remediation plan.", ["Control coverage 96%", "Evidence pulled in 24h", "Material weaknesses 0"], ["domain:internal-controls", "workflow:audit-evidence"]),
  ],
  product: [
    S("PR-01", "Discovery Double-Diamond", "6 weeks", "Generative + evaluative research, opportunity tree, prioritized bets, instrumentation plan.", ["Opportunity → bet ratio 4:1", "Evidence on file 100%", "Time-to-first-signal 11d"], ["workflow:discovery-double-diamond", "skill-area:user-research"]),
    S("PR-02", "Roadmap Stewardship", "Ongoing", "Monthly cadence: roadmap health, RICE recalibration, experiment readouts, outcome OKRs.", ["Roadmap drift ≤ 8%", "Experiments per Q ↑ 60%", "Hit-rate on bets 38%"], ["workflow:quarterly-roadmap", "responsibility:roadmap-stewardship"], "Retainer"),
    S("PR-03", "Outcome OKR Conversion", "4 weeks", "Convert output roadmaps to outcome OKRs. Wire to telemetry, review weekly.", ["Outcome OKRs 100%", "Telemetry coverage 92%", "OKR Δ visible weekly"], ["responsibility:outcome-okrs", "workflow:product-review"]),
    S("PR-04", "PRD & Spec Library", "3 weeks", "Modern PRD template, spec rituals, decision-log convention. Adopted across product teams.", ["PRD adoption 100%", "Decision-log latency 1d", "Spec turnaround −55%"], ["artifact:prd-template", "workflow:spec-review"]),
  ],
  engineering: [
    S("EN-01", "Reliability & On-Call", "12 weeks", "SLOs, error budgets, on-call rotations, tabletop incidents. Graduated to your own SREs.", ["MTTR 4h → 38m", "SLO coverage 100% top services", "Sev-1 ↓ 62%"], ["workflow:incident-response", "metric:mttr"], "Operational"),
    S("EN-02", "Platform Foundations", "1 quarter", "Build pipelines, deploy gates, observability stack, change-fail tracking.", ["Deploy frequency ↑ 3.1×", "Change fail-rate < 8%", "Lead-time for changes 1.7d"], ["workflow:release-train", "skill-area:distributed-systems"]),
    S("EN-03", "Code-Review Health", "5 weeks", "Review SLAs, ownership map, codebase guardrails. Reviews stop being the bottleneck.", ["PR median review time 4h", "Review depth ↑ 2×", "Review backlog 0"], ["workflow:code-review", "responsibility:code-ownership"]),
    S("EN-04", "Tech-Debt Charter", "6 weeks", "Inventory, scoring, ring-fenced capacity, debt sprints, before/after telemetry.", ["Debt service ratio 18%", "Hot-path complexity −31%", "Velocity recovered"], ["skill-area:refactoring", "workflow:tech-debt-sprint"]),
  ],
  "data-ai": [
    S("DA-01", "Warehouse & Lineage", "10 weeks", "Source-of-truth warehouse, dbt models, freshness SLAs, column-level lineage, self-serve.", ["Freshness SLA hit 99.4%", "Self-serve queries ↑ 6×", "Pipeline incidents −74%"], ["domain:data-platform", "workflow:data-pipeline-incident"]),
    S("DA-02", "Model Lifecycle", "12 weeks", "Eval harnesses, drift alerts, promotion gates. From offline to production with audit trail.", ["Promotion cycle 6w → 1w", "Drift caught pre-prod 100%", "Eval coverage 91%"], ["workflow:model-promotion", "skill-area:ml-ops"]),
    S("DA-03", "Metric Layer Standardization", "6 weeks", "Single dictionary of business metrics, owned, versioned, embedded in BI.", ["Metric drift 0", "Definition disputes 0", "BI adoption ↑ 2.4×"], ["responsibility:metric-ownership", "artifact:metric-dictionary"]),
    S("DA-04", "LLM Eval Harness", "8 weeks", "Datasets, graders, regression suites, weekly readout. Ship LLM features without flying blind.", ["Eval cases 1.4k", "Regression catch-rate 96%", "Release confidence ↑"], ["workflow:llm-eval-cycle", "skill-area:prompt-engineering"]),
  ],
  design: [
    S("DS-01", "Design System Foundation", "8 weeks", "Tokens, primitives, component inventory, governance, contribution model. Adopted across teams.", ["Token coverage 100%", "Component reuse 78%", "Design debt −44%"], ["responsibility:design-system", "domain:design-system"]),
    S("DS-02", "Critique & Research Rituals", "1 quarter", "Weekly critique, monthly research readout, template kit. Embedded into product cadence.", ["Critique attendance 92%", "Research → ship cycle 5w", "Decisions documented 100%"], ["workflow:design-review", "workflow:research-readout"], "Retainer"),
    S("DS-03", "Brand-to-Product Bridge", "6 weeks", "Reconcile brand and product expression: type, color, motion, voice. One coherent surface.", ["Brand audit gaps closed 96%", "Cross-team consistency 4.6/5", "Asset duplication −68%"], ["domain:brand-system", "artifact:brand-bridge"]),
    S("DS-04", "Design Ops Foundations", "6 weeks", "Files, templates, handoff, hiring loop, levels. Ops infrastructure for the design org.", ["Hiring time-to-yes 18d", "Onboarding to first ship 14d", "Process drag −37%"], ["skill-area:design-ops", "workflow:design-handoff"]),
  ],
  marketing: [
    S("MK-01", "Demand Engine Reset", "1 quarter", "Channel mix, attribution, lifecycle nurture, content calendar. CAC under control.", ["CAC −22%", "MQL → SQL 31%", "Pipeline coverage 3.4×"], ["domain:demand-generation", "workflow:campaign-launch"]),
    S("MK-02", "Tier-1 Launch", "6 weeks", "PMM positioning, narrative, assets, launch ops, post-mortem. For launches that have to land.", ["On-time launch 100%", "Press pickups 14", "Day-1 signups ↑ 5.2×"], ["workflow:launch-tier-1", "skill-area:content-strategy"], "Project"),
    S("MK-03", "Lifecycle & Nurture", "5 weeks", "Lifecycle program: trigger maps, nurture tracks, suppression rules. CRM that earns its keep.", ["Email CTR ↑ 41%", "Nurture-to-pipeline 18%", "Unsub rate ≤ 0.4%"], ["workflow:lifecycle-nurture", "responsibility:crm-ownership"]),
    S("MK-04", "Content Operating System", "6 weeks", "Editorial calendar, brief template, review SLAs, repurpose playbook. Content stops being one-off.", ["Pieces shipped/Q ↑ 3.1×", "Review cycle 8d → 2d", "Repurpose ratio 4.5:1"], ["workflow:content-cycle", "artifact:editorial-calendar"]),
  ],
  sales: [
    S("SA-01", "Pipeline Hygiene", "8 weeks", "Stages, exit criteria, forecast methodology, deal desk, close plans. Forecast Δ under 5%.", ["Forecast Δ 3.8%", "Stage skip rate < 4%", "Slipped deals −45%"], ["workflow:pipeline-review", "workflow:close-plan"], "Operational"),
    S("SA-02", "Enterprise Motion", "1 quarter", "AE/SE/SDR rituals, MEDDPICC adoption, expansion plays, deal review cadence.", ["Win-rate ↑ 9pts", "ACV ↑ 22%", "Cycle time −18%"], ["skill-area:negotiation", "workflow:handoff-to-cs"]),
    S("SA-03", "SDR/BDR Playbook", "5 weeks", "ICP, sequences, qualification rubric, ramp curves. SDR economics that work.", ["Meetings/SDR/wk 11", "SQL acceptance 64%", "Ramp 90 → 45 days"], ["workflow:outbound-cycle", "skill-area:cold-outbound"]),
    S("SA-04", "Deal-Desk Activation", "4 weeks", "Pricing approvals, discount guardrails, paper turnaround, exception log. Deals don't stall on commercial.", ["Approval cycle 6d → 1d", "Discount drift −24%", "Renewal price stickiness 95%"], ["workflow:deal-desk", "responsibility:pricing-governance"], "Operational"),
  ],
  "revenue-ops": [
    S("RO-01", "Forecast Roll-Up", "6 weeks", "Single source-of-truth pipeline, AI-assisted commit, weekly cadence. CRO trusts the number.", ["Forecast Δ ≤ 4%", "Roll-up time 5d → 1d", "Coverage clarity 100%"], ["workflow:forecast-roll-up", "metric:forecast-delta"]),
    S("RO-02", "Territory & Quota Design", "4 weeks", "Coverage analysis, fair territories, quota sets, ramp curves, comp interlocks.", ["Quota attainment ↑ 11pts", "Coverage gap < 8%", "Comp disputes 0"], ["workflow:territory-planning", "skill-area:territory-design"], "Project"),
    S("RO-03", "GTM Tech Stack Audit", "5 weeks", "Inventory, integrations, decommission plan, cost-out roadmap, data hygiene SLAs.", ["Stack cost −19%", "Integration breaks −81%", "Source-of-truth clear"], ["domain:gtm-systems", "workflow:stack-audit"]),
    S("RO-04", "Funnel Instrumentation", "5 weeks", "UTM standards, attribution model, conversion telemetry, dashboard suite.", ["Attribution coverage 96%", "Funnel insight latency 1d", "Dashboards in use 14"], ["workflow:funnel-tracking", "artifact:attribution-model"]),
  ],
  "customer-success": [
    S("CS-01", "Onboarding to Time-to-Value", "8 weeks", "Re-architect first-30-day journey: milestones, signals, intervention. TTV cut by half.", ["TTV 38d → 17d", "30-day activation 86%", "Onboarding NPS 64"], ["workflow:onboarding", "metric:time-to-value"]),
    S("CS-02", "Renewal & Expansion Motion", "1 quarter", "Health scoring, QBR template, churn-saver playbook. NRR floor lifted.", ["NRR ↑ 12pts", "Logo churn −31%", "Expansion wins ↑ 1.9×"], ["workflow:qbr", "workflow:churn-saver"], "Retainer"),
    S("CS-03", "Customer Health Engine", "6 weeks", "Health model, signal pipeline, automated interventions, executive flag-list.", ["Health-score precision 0.83", "At-risk caught 14d earlier", "Interventions automated 70%"], ["workflow:health-score", "skill-area:customer-analytics"]),
    S("CS-04", "Voice-of-Customer Program", "5 weeks", "Closed-loop feedback: capture, route, action, report. The org actually hears the customer.", ["VoC routed in 24h", "Feature wins from VoC 9/Q", "Customer-Net-Trust ↑ 14pts"], ["workflow:voc-cycle", "responsibility:vox-stewardship"]),
  ],
  support: [
    S("SU-01", "SLA & Triage Engine", "6 weeks", "Ticket model, severity ladder, escalation contracts, MTTR dashboards. CSAT 4.7+.", ["MTTR 9h → 1.6h", "CSAT 4.7", "SLA hit-rate 98%"], ["responsibility:sla-management", "workflow:ticket-triage"], "Operational"),
    S("SU-02", "Knowledge-Base Surgery", "4 weeks", "Audit, restructure, write 60 articles, deflect 30% of tickets in 30 days.", ["Deflection ↑ 31%", "Search success 78%", "KB freshness < 30d"], ["workflow:macro-update", "domain:customer-support"], "Project"),
    S("SU-03", "Tier-2/3 Engineering Bridge", "6 weeks", "Escalation contracts, on-call from eng, post-incident loop. Customer-impacting bugs close fast.", ["Eng-routed close-time 22h", "Repeat-bug rate −58%", "Escalation backlog 0"], ["workflow:escalation-bridge", "workflow:incident-response"]),
    S("SU-04", "Self-Serve Support Ops", "5 weeks", "In-product help, contextual hints, status page, community routing. Tickets-per-customer down.", ["Tickets/customer −37%", "In-product help adoption 64%", "Status-page MTTU 6m"], ["workflow:in-product-help", "responsibility:status-comms"]),
  ],
  people: [
    S("PE-01", "Hiring Loop Calibration", "6 weeks", "Scorecards, interviewer training, structured rubrics, debriefs. Time-to-hire down, quality up.", ["Time-to-hire 38d → 22d", "Offer accept 78%", "Year-1 attrition < 8%"], ["workflow:hiring-loop", "skill-area:interviewer-calibration"]),
    S("PE-02", "Performance & Comp Cycles", "1 quarter", "Leveling matrix, comp bands, cycle ops, manager calibration sessions. Defensible and humane.", ["Calibration sessions 100%", "Pay-equity gaps closed", "Cycle complaints −82%"], ["workflow:perf-review", "workflow:comp-cycle"], "Project"),
    S("PE-03", "Onboarding Playbook", "5 weeks", "First-30/60/90 plan, buddy program, manager checklist, signal at week-2. New hires ramp fast.", ["Time-to-first-ship 14d", "New-hire NPS 62", "30-day attrition 0"], ["workflow:onboarding", "artifact:30-60-90-plan"]),
    S("PE-04", "Manager Operating System", "6 weeks", "1:1 cadence, feedback rituals, growth plans, performance flags. Managers manage.", ["Manager NPS ↑ 26pts", "1:1 adherence 96%", "Coaching loops on file 100%"], ["workflow:1-1-cadence", "responsibility:manager-coaching"], "Retainer"),
  ],
  it: [
    S("IT-01", "Identity & Access Program", "8 weeks", "IdP, lifecycle automation, SCIM provisioning, MFA, audit-ready evidence.", ["Provisioning 4d → 1h", "MFA coverage 100%", "Orphan accounts 0"], ["domain:identity-and-access", "workflow:onboarding-provisioning"]),
    S("IT-02", "SaaS Inventory Cleanup", "4 weeks", "Discover shadow IT, consolidate, rationalize licenses, tighten controls. Real $ recovered.", ["SaaS spend −18%", "Shadow apps disclosed 47", "License utilization 92%"], ["skill-area:idp-administration", "workflow:saas-rationalization"], "Project"),
    S("IT-03", "Endpoint Hygiene", "6 weeks", "MDM rollout, patching SLA, encryption, EDR coverage, audit pull-list.", ["Endpoint compliance 99%", "Patch SLA hit 96%", "EDR coverage 100%"], ["domain:endpoint-management", "workflow:patch-cycle"]),
    S("IT-04", "Helpdesk Acceleration", "5 weeks", "Ticket model, automation, SLAs, knowledge base. The help that helps.", ["First-touch resolution 71%", "MTTR (IT) 26m", "CSAT 4.8"], ["workflow:helpdesk-triage", "responsibility:sla-management"]),
  ],
  operations: [
    S("OP-01", "Vendor Management Office", "1 quarter", "Vendor master, contract lifecycle, renewals dashboard, sourcing playbook.", ["Renewal surprises 0", "Vendor consolidation −24%", "Sourcing cycle 21d → 9d"], ["workflow:vendor-onboarding", "workflow:contract-renewal"], "Operational"),
    S("OP-02", "Cross-Team Programs", "Per program", "Embedded program lead: chartering, RAID, exec readouts, end-of-program audit.", ["On-time-on-scope 92%", "Risks closed pre-impact 81%", "Audit findings 0"], ["domain:business-operations", "workflow:program-charter"]),
    S("OP-03", "Process Engineering Sprints", "5 weeks", "Pick a broken process, instrument it, redesign, ship, measure. Cycle every 5 weeks.", ["Cycle-time −41% avg", "Handoff defects −67%", "Sprints shipped/Q 4"], ["skill-area:process-design", "workflow:process-sprint"]),
    S("OP-04", "Workplace & Ritual Design", "4 weeks", "Office layout, standing meetings, town hall, async rituals. The company has a heartbeat.", ["Town-hall attendance 86%", "Async-update adoption 92%", "Meeting-load −19%"], ["workflow:weekly-cadence", "responsibility:workplace-design"]),
  ],
  legal: [
    S("LE-01", "Contract Acceleration", "8 weeks", "MSA/DPA library, redline playbook, fallback positions, SLA on turnaround. Sales unblocked.", ["Turnaround 9d → 36h", "Fallback adoption 87%", "Legal-blocked deals −74%"], ["workflow:contract-review", "responsibility:contract-review"], "Operational"),
    S("LE-02", "Privacy & Compliance Program", "1 quarter", "DPIAs, RoPA, audit evidence packs, regulator-ready reporting. SOC2-friendly.", ["DPIA coverage 100%", "RoPA freshness 30d", "Audit findings 0"], ["workflow:dpia-cycle", "workflow:audit-evidence"]),
    S("LE-03", "IP & Trademark Hygiene", "5 weeks", "IP register, employee assignments, trademark watch, open-source policy.", ["Assignments on file 100%", "Trademark conflicts 0", "OSS policy adoption 100%"], ["domain:intellectual-property", "workflow:oss-clearance"]),
    S("LE-04", "Regulator-Ready Posture", "1 quarter", "Subpoena handling, breach notification, regulator-comm template, mock inspection.", ["Mock-inspection score 92", "Notification time ≤ 72h", "Regulator letters returned 1d"], ["workflow:regulator-comm", "workflow:breach-notification"]),
  ],
  security: [
    S("SE-01", "Detection & Response Buildout", "10 weeks", "SOC playbooks, alert pipeline, tabletop, MTTR (Sec) under one hour.", ["MTTR 4h → 47m", "Sev-1 incidents −63%", "Tabletop maturity 4/5"], ["workflow:incident-response", "workflow:tabletop"]),
    S("SE-02", "AppSec & Threat Modeling", "8 weeks", "Threat models for top systems, secure SDLC checks, vuln SLAs, exec dashboard.", ["Models on file: top 12 systems", "Critical-vuln MTTR 8d", "Secure-SDLC adoption 100%"], ["skill-area:threat-modeling", "workflow:vuln-mgmt"]),
    S("SE-03", "Vulnerability Management", "6 weeks", "Asset inventory, scan cadence, remediation SLAs, exception register.", ["Crit/High SLA hit 96%", "Asset coverage 99%", "Exceptions registered 100%"], ["workflow:vuln-mgmt", "responsibility:risk-register"]),
    S("SE-04", "Compliance Operationalization", "1 quarter", "SOC2/ISO27001 evidence pipeline, control owners, continuous monitoring.", ["Audit-ready 24/7", "Evidence pulled in 4h", "Findings on first audit ≤ 3"], ["workflow:audit-evidence", "domain:compliance"]),
  ],
};

const FLOOR_SEEDS: Array<{ id: string; domain: string; label: string; blurb: string; depts: string[] }> = [
  { id: "trust", domain: "trust", label: "TRUST", blurb: "Contracts and controls — the ground floor under everything.", depts: ["legal", "security"] },
  { id: "enablement", domain: "enablement", label: "ENABLEMENT", blurb: "The gears: support, talent, identity, vendors.", depts: ["support", "people", "it", "operations"] },
  { id: "revenue", domain: "revenue", label: "REVENUE", blurb: "Demand, deals, retention, and the systems that keep them honest.", depts: ["marketing", "sales", "revenue-ops", "customer-success"] },
  { id: "build", domain: "build", label: "BUILD", blurb: "Where the product is shaped, written, measured.", depts: ["product", "engineering", "data-ai", "design"] },
  { id: "strategy", domain: "strategy", label: "STRATEGY", blurb: "Direction, capital, the corporate north-star.", depts: ["executive", "finance"] },
];

const DEPT_LABELS: Record<string, string> = {
  executive: "Executive",
  finance: "Finance",
  product: "Product",
  engineering: "Engineering",
  "data-ai": "Data & AI",
  design: "Design",
  marketing: "Marketing",
  sales: "Sales",
  "revenue-ops": "Revenue Ops",
  "customer-success": "Customer Success",
  support: "Support",
  people: "People",
  it: "IT",
  operations: "Operations",
  legal: "Legal",
  security: "Security",
};

/* ── Graph enrichment helpers ──────────────────────────────────── */

function tryGetRecord(graph: AtlasGraphLike, id: string): AtlasRecord | undefined {
  try { return graph.getRecord(id); } catch { return undefined; }
}

function displayName(record: AtlasRecord | undefined): string {
  if (!record) return "";
  for (const key of ["displayName", "title", "label"]) {
    const v = record[key];
    if (typeof v === "string" && v.trim()) return v;
  }
  return record.id.split(":").pop()?.replace(/-/g, " ") ?? record.id;
}

function recordSummary(record: AtlasRecord | undefined): string {
  if (!record) return "";
  for (const key of ["summary", "description", "scope"]) {
    const v = record[key];
    if (typeof v === "string" && v.trim()) return v.replace(/\s+/g, " ").slice(0, 200);
  }
  return `${record._kind} record.`;
}

function toTowerRecord(graph: AtlasGraphLike, id: string): ServiceTowerRecord {
  const record = tryGetRecord(graph, id);
  return {
    id,
    label: record ? displayName(record) : id.split(":").pop()?.replace(/-/g, " ") ?? id,
    kind: record?._kind ?? "Ref",
    href: `/n/${encodeURIComponent(id)}`,
    summary: record ? recordSummary(record) : `Referenced record: ${id}`,
  };
}

function enrichGraphRecords(graph: AtlasGraphLike, deptId: string): ServiceTowerRecord[] {
  const queryIds = DEPT_GRAPH_QUERIES[deptId] ?? [];
  const records: ServiceTowerRecord[] = [];
  const seen = new Set<string>();

  for (const id of queryIds) {
    const record = tryGetRecord(graph, id);
    if (record && !seen.has(id)) {
      seen.add(id);
      records.push(toTowerRecord(graph, id));
    }
  }

  const deptLabel = (DEPT_LABELS[deptId] ?? deptId).toLowerCase();
  const domainHits = graph.getAllRecords()
    .filter((r) => r._kind === "Domain" && r.id.toLowerCase().includes(deptLabel.split(" ")[0]))
    .slice(0, 4);
  for (const r of domainHits) {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      records.push(toTowerRecord(graph, r.id));
    }
  }

  return records.slice(0, 10);
}

/* ── Build functions: a5c hardcoded path ───────────────────────── */

function buildA5cService(graph: AtlasGraphLike, seed: ServiceSeed): ServiceTowerService {
  return {
    code: seed.code,
    name: seed.name,
    summary: seed.summary,
    kpis: seed.kpis,
    refs: seed.refs.map((id) => toTowerRecord(graph, id)),
  };
}

function buildA5cRoom(graph: AtlasGraphLike, deptId: string): ServiceTowerRoom {
  const label = DEPT_LABELS[deptId] ?? deptId;
  const color = DEPT_COLORS[deptId] ?? "#C98A3E";
  const services = (SERVICES[deptId] ?? []).map((s) => buildA5cService(graph, s));
  const graphRecords = enrichGraphRecords(graph, deptId);

  return {
    id: deptId,
    label,
    eyebrow: `${label} department`,
    kind: "Department",
    color,
    summary: services[0]?.summary ?? `${label} department services.`,
    metricLabel: "services",
    metricValue: services.length,
    records: graphRecords,
    services,
  };
}

function buildA5cFloor(graph: AtlasGraphLike, seed: typeof FLOOR_SEEDS[number]): ServiceTowerFloor {
  return {
    id: seed.id,
    label: seed.label,
    subtitle: seed.blurb,
    rooms: seed.depts.slice(0, 4).map((deptId) => buildA5cRoom(graph, deptId)),
  };
}

function buildA5cTower(graph: AtlasGraphLike): ServiceTowerViewData {
  const floors = FLOOR_SEEDS.map((seed) => buildA5cFloor(graph, seed));
  const totalServices = floors.reduce((a, f) => a + f.rooms.reduce((b, r) => b + r.services.length, 0), 0);
  const totalRecords = floors.reduce((a, f) => a + f.rooms.reduce((b, r) => b + r.records.length, 0), 0);

  return {
    id: "a5c-service-tower",
    title: "a5c",
    subtitle: "A reusable isometric building view over major Atlas graph surfaces.",
    eyebrow: "A5C reusable view",
    ctaLabel: "Open full graph",
    floors,
    domains: Object.entries(DOMAIN_COLORS).map(([id, color]) => ({
      id,
      label: id.charAt(0).toUpperCase() + id.slice(1),
      color,
    })),
    stats: [
      { label: "Floors", value: floors.length },
      { label: "Departments", value: floors.reduce((a, f) => a + f.rooms.length, 0) },
      { label: "Service lines", value: totalServices },
      { label: "Graph records", value: totalRecords },
    ],
  };
}

/* ── Build functions: graph-query path (for custom towers) ─────── */

type QueryConfig = { kind?: unknown; cluster?: unknown; ids?: unknown; search?: unknown; limit?: unknown };
type RoomConfig = { id?: unknown; label?: unknown; eyebrow?: unknown; kind?: unknown; color?: unknown; summary?: unknown; metricLabel?: unknown; query?: unknown };
type FloorConfig = { id?: unknown; label?: unknown; subtitle?: unknown; rooms?: unknown };
type TowerOptions = { id?: unknown; title?: unknown; subtitle?: unknown; eyebrow?: unknown; ctaLabel?: unknown; floors?: unknown; domains?: unknown };

const DEFAULT_COLORS = ["#D4A84B", "#C98A3E", "#C03A2B", "#3F8A77", "#8C5C7E", "#5D74B8"];

function str(v: unknown, fb: string): string { return typeof v === "string" && v.trim() ? v : fb; }
function num(v: unknown, fb: number): number { return typeof v === "number" && Number.isFinite(v) ? v : fb; }
function obj(v: unknown): Record<string, unknown> | null { return v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : null; }
function arr(v: unknown): unknown[] { return Array.isArray(v) ? v : []; }

function queryRecords(graph: AtlasGraphLike, queryValue: unknown, fallbackLimit = 8): AtlasRecord[] {
  const q = obj(queryValue) as QueryConfig | null;
  if (!q) return [];

  const ids = arr(q.ids).filter((id): id is string => typeof id === "string");
  if (ids.length) return ids.map((id) => tryGetRecord(graph, id)).filter((r): r is AtlasRecord => Boolean(r));

  const limit = Math.max(1, Math.min(24, num(q.limit, fallbackLimit)));
  const kind = typeof q.kind === "string" ? q.kind : undefined;
  const cluster = typeof q.cluster === "string" ? q.cluster : undefined;
  const search = typeof q.search === "string" ? q.search : "";

  if (search.trim()) {
    return graph.searchRecords(search, { kind, cluster, limit }).map((h) => h.record);
  }

  return graph.getAllRecords()
    .filter((r) => (!kind || r._kind === kind) && (!cluster || r._cluster === cluster))
    .sort((a, b) => displayName(a).localeCompare(displayName(b)))
    .slice(0, limit);
}

function graphRoomServices(graph: AtlasGraphLike, records: AtlasRecord[], roomLabel: string): ServiceTowerService[] {
  return records.slice(0, 4).map((record, i) => {
    const out = graph.getOutgoing(record.id).slice(0, 3);
    const inc = graph.getIncoming(record.id).slice(0, 3);
    return {
      code: `${roomLabel.replace(/[^A-Z0-9]/gi, "").slice(0, 2).toUpperCase() || "AT"}-${String(i + 1).padStart(2, "0")}`,
      name: displayName(record),
      summary: recordSummary(record),
      kpis: [`${out.length} outgoing`, `${inc.length} incoming`, `${record._kind}`],
      refs: out.concat(inc).slice(0, 4).map((e) => {
        const adj = e.from === record.id ? e.to : e.from;
        return toTowerRecord(graph, adj);
      }),
    };
  });
}

function buildGraphRoom(graph: AtlasGraphLike, roomValue: unknown, roomIndex: number): ServiceTowerRoom {
  const room = obj(roomValue) as RoomConfig | null ?? {};
  const records = queryRecords(graph, room.query, 8);
  const label = str(room.label, `Room ${roomIndex + 1}`);
  const kind = str(room.kind, records[0]?._kind ?? "Atlas records");
  const color = str(room.color, DEFAULT_COLORS[roomIndex % DEFAULT_COLORS.length]);
  return {
    id: str(room.id, `room-${roomIndex + 1}`),
    label,
    eyebrow: str(room.eyebrow, kind),
    kind,
    color,
    summary: str(room.summary, records[0] ? recordSummary(records[0]) : `Graph-backed room for ${label}.`),
    metricLabel: str(room.metricLabel, "Records"),
    metricValue: records.length,
    records: records.slice(0, 10).map((r) => toTowerRecord(graph, r.id)),
    services: graphRoomServices(graph, records, label),
  };
}

function buildGraphFloor(graph: AtlasGraphLike, floorValue: unknown, floorIndex: number): ServiceTowerFloor {
  const floor = obj(floorValue) as FloorConfig | null ?? {};
  const rooms = arr(floor.rooms);
  const label = str(floor.label, `Floor ${floorIndex + 1}`);
  return {
    id: str(floor.id, `floor-${floorIndex + 1}`),
    label,
    subtitle: str(floor.subtitle, "Graph-backed records grouped as rooms."),
    rooms: rooms.slice(0, 4).map((r, i) => buildGraphRoom(graph, r, i)),
  };
}

function buildGraphTower(graph: AtlasGraphLike, options: TowerOptions): ServiceTowerViewData {
  const floorConfigs = arr(options.floors);
  const floors = floorConfigs.slice(0, 6).map((f, i) => buildGraphFloor(graph, f, i));
  const rooms = floors.flatMap((f) => f.rooms);
  const uniqueRecords = new Set(rooms.flatMap((r) => r.records.map((rec) => rec.id)));

  const domains = arr(options.domains)
    .map((item, i) => { const d = obj(item); return d ? { id: str(d.id, `d-${i}`), label: str(d.label, `Domain ${i + 1}`), color: str(d.color, DEFAULT_COLORS[i % DEFAULT_COLORS.length]) } : null; })
    .filter((d): d is ServiceTowerDomain => Boolean(d));
  const fallbackDomains = domains.length ? domains : (() => {
    const seen = new Map<string, ServiceTowerDomain>();
    for (const r of rooms) if (!seen.has(r.kind)) seen.set(r.kind, { id: r.kind, label: r.kind, color: r.color });
    return Array.from(seen.values()).slice(0, 6);
  })();

  return {
    id: str(options.id, "atlas-tower"),
    title: str(options.title, "Atlas Tower"),
    subtitle: str(options.subtitle, "Walk the graph as a stacked service building."),
    eyebrow: str(options.eyebrow, "Reusable graph view"),
    ctaLabel: str(options.ctaLabel, "Open graph explorer"),
    floors,
    domains: fallbackDomains,
    stats: [
      { label: "Floors", value: floors.length },
      { label: "Rooms", value: rooms.length },
      { label: "Records", value: uniqueRecords.size },
      { label: "Service lines", value: rooms.reduce((a, r) => a + r.services.length, 0) },
    ],
  };
}

/* ── Entry point ───────────────────────────────────────────────── */

export function buildServiceTowerView(graph: AtlasGraphLike, rawOptions: unknown): ServiceTowerViewData {
  const options = obj(rawOptions) as TowerOptions | null;
  if (options && arr(options.floors).length > 0) {
    return buildGraphTower(graph, options);
  }
  return buildA5cTower(graph);
}
