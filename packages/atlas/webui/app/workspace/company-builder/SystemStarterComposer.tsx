"use client";

import { useState } from "react";
import type { CompanyLayerKey } from "@/lib/server/company-builder";

type SystemStarterComposerProps = {
  blueprintId: string;
  action: (formData: FormData) => void | Promise<void>;
  layerDefs: ReadonlyArray<{
    key: CompanyLayerKey;
    label: string;
    kind?: "stack-layer" | "composition-facet";
  }>;
};

type StarterPattern = {
  id: string;
  label: string;
  systemKind: string;
  outcome: string;
  description: string;
  lifecycleStage: string;
  focus: CompanyLayerKey[];
};

const STARTER_PATTERNS: StarterPattern[] = [
  {
    id: "customer-ops",
    label: "Customer operations team",
    systemKind: "customer-ops",
    outcome: "Resolve inbound customer work with an agentic support pod.",
    description: "A customer-facing agentic system that triages requests, retrieves context, coordinates tools, and escalates to humans when needed.",
    lifecycleStage: "pilot",
    focus: ["layer:5-agent-runtime", "layer:10-interaction", "facet:roles-and-teams"],
  },
  {
    id: "software-delivery",
    label: "Software delivery squad",
    systemKind: "software-delivery",
    outcome: "Plan, code, review, test, and ship product changes.",
    description: "A delivery system composed from coding agents, repository tools, CI checks, release processes, and engineering roles.",
    lifecycleStage: "draft",
    focus: ["layer:4-agent-core", "layer:8-execution", "facet:evaluation-and-governance"],
  },
  {
    id: "knowledge-ops",
    label: "Knowledge operations desk",
    systemKind: "knowledge-ops",
    outcome: "Keep company knowledge searchable, current, and actionable.",
    description: "A knowledge system that ingests sources, maintains memory and datasets, and answers operational questions with provenance.",
    lifecycleStage: "draft",
    focus: ["layer:7-workspace", "facet:environment-and-data", "layer:11-presentation"],
  },
  {
    id: "research-eval",
    label: "Research and evaluation lab",
    systemKind: "research-eval",
    outcome: "Evaluate models, prompts, skills, and agent teams before rollout.",
    description: "A governance-oriented system for experiments, benchmarks, regression checks, and rollout decisions.",
    lifecycleStage: "draft",
    focus: ["layer:1-model", "layer:2-provider", "facet:evaluation-and-governance"],
  },
];

function layerLabel(layerDefs: SystemStarterComposerProps["layerDefs"], key: CompanyLayerKey) {
  return layerDefs.find((layer) => layer.key === key)?.label ?? key;
}

export function SystemStarterComposer({ blueprintId, action, layerDefs }: SystemStarterComposerProps) {
  const [selected, setSelected] = useState<StarterPattern>(STARTER_PATTERNS[0]);
  const [displayName, setDisplayName] = useState(selected.label);
  const [systemKind, setSystemKind] = useState(selected.systemKind);
  const [outcome, setOutcome] = useState(selected.outcome);
  const [description, setDescription] = useState(selected.description);
  const [lifecycleStage, setLifecycleStage] = useState(selected.lifecycleStage);

  function chooseStarter(pattern: StarterPattern) {
    setSelected(pattern);
    setDisplayName(pattern.label);
    setSystemKind(pattern.systemKind);
    setOutcome(pattern.outcome);
    setDescription(pattern.description);
    setLifecycleStage(pattern.lifecycleStage);
  }

  const focusLayers = new Set(selected.focus);

  return (
    <form action={action} className="atlas-docs-stack">
      <input type="hidden" name="blueprintId" value={blueprintId} />

      <div className="atlas-docs-stack">
        <p className="atlas-docs-note">Choose a starter pattern</p>
        <div className="atlas-docs-grid atlas-docs-grid--2">
          {STARTER_PATTERNS.map((pattern) => (
            <button
              key={pattern.id}
              type="button"
              className="atlas-header__button"
              aria-pressed={selected.id === pattern.id}
              onClick={() => chooseStarter(pattern)}
              style={{ justifyContent: "flex-start", textAlign: "left" }}
            >
              {pattern.label}
            </button>
          ))}
        </div>
      </div>

      <div className="atlas-docs-stack">
        <p className="atlas-docs-note">Layer roadmap</p>
        <p className="atlas-docs-note">
          Start with a system shell, then fill each stack layer with Atlas entities. Highlighted layers are suggested first for this pattern.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {layerDefs.map((layer) => (
            <span
              key={layer.key}
              style={{
                border: focusLayers.has(layer.key) ? "1px solid var(--atlas-accent, #a86f1d)" : "1px solid var(--atlas-line, rgba(0,0,0,0.15))",
                borderRadius: 999,
                padding: "0.2rem 0.55rem",
                fontSize: "0.8rem",
                background: focusLayers.has(layer.key) ? "rgba(198, 142, 42, 0.14)" : "transparent",
                color: "inherit",
              }}
            >
              {layer.label}
            </span>
          ))}
        </div>
      </div>

      <label className="atlas-docs-note">
        System name
        <input
          name="displayName"
          className="atlas-searchbar__input"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
      </label>
      <label className="atlas-docs-note">
        System kind
        <input
          name="systemKind"
          className="atlas-searchbar__input"
          value={systemKind}
          onChange={(event) => setSystemKind(event.target.value)}
        />
      </label>
      <label className="atlas-docs-note">
        Business outcome
        <input
          name="outcome"
          className="atlas-searchbar__input"
          value={outcome}
          onChange={(event) => setOutcome(event.target.value)}
        />
      </label>
      <label className="atlas-docs-note">
        System brief
        <textarea
          name="description"
          className="atlas-searchbar__input"
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>
      <label className="atlas-docs-note">
        Lifecycle stage
        <select
          name="lifecycleStage"
          className="atlas-searchbar__input"
          value={lifecycleStage}
          onChange={(event) => setLifecycleStage(event.target.value)}
        >
          <option value="draft">draft</option>
          <option value="pilot">pilot</option>
          <option value="production">production</option>
          <option value="legacy">legacy</option>
        </select>
      </label>
      <p className="atlas-docs-note">
        Suggested first layers: {selected.focus.map((key) => layerLabel(layerDefs, key)).join(", ")}.
      </p>
      <button type="submit" className="atlas-header__button">
        Create system shell
      </button>
    </form>
  );
}
