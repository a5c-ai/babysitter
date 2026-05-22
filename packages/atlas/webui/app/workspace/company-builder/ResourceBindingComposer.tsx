"use client";

import { useState } from "react";
import type { CompanyBlueprint } from "@/lib/server/company-builder";

type CompanyResource = CompanyBlueprint["draft"]["resources"][number];

type ResourceBindingComposerProps = {
  blueprintId: string;
  systemId: string;
  action: (formData: FormData) => void | Promise<void>;
  resources: CompanyResource[];
};

type DependencyPattern = {
  id: string;
  label: string;
  bindingKind: string;
  environmentStage: string;
  criticality: string;
  notes: string;
};

const DEPENDENCY_PATTERNS: DependencyPattern[] = [
  {
    id: "workspace-tool-surface",
    label: "Workspace tool surface",
    bindingKind: "uses",
    environmentStage: "production",
    criticality: "critical",
    notes: "Primary workspace, tool, or repository surface that this system operates through.",
  },
  {
    id: "runtime-deployment-target",
    label: "Runtime deployment target",
    bindingKind: "deploys_to",
    environmentStage: "production",
    criticality: "critical",
    notes: "Infrastructure target where this system runs, scales, or exposes services.",
  },
  {
    id: "knowledge-dependency",
    label: "Knowledge dependency",
    bindingKind: "reads_from",
    environmentStage: "shared",
    criticality: "standard",
    notes: "Knowledge, memory, or dataset source used by this system during work.",
  },
  {
    id: "data-output",
    label: "Data output",
    bindingKind: "stores_in",
    environmentStage: "production",
    criticality: "standard",
    notes: "Datastore, warehouse, or platform where this system writes operational state or outputs.",
  },
];

export function ResourceBindingComposer({ blueprintId, systemId, action, resources }: ResourceBindingComposerProps) {
  const [selectedPattern, setSelectedPattern] = useState<DependencyPattern>(DEPENDENCY_PATTERNS[0]);
  const [resourceId, setResourceId] = useState(resources[0]?.id ?? "");
  const [bindingKind, setBindingKind] = useState(selectedPattern.bindingKind);
  const [environmentStage, setEnvironmentStage] = useState(selectedPattern.environmentStage);
  const [criticality, setCriticality] = useState(selectedPattern.criticality);
  const [notes, setNotes] = useState(selectedPattern.notes);

  const selectedResource = resources.find((resource) => resource.id === resourceId) ?? resources[0];

  function choosePattern(pattern: DependencyPattern) {
    setSelectedPattern(pattern);
    setBindingKind(pattern.bindingKind);
    setEnvironmentStage(pattern.environmentStage);
    setCriticality(pattern.criticality);
    setNotes(pattern.notes);
  }

  return (
    <form action={action} className="atlas-docs-stack">
      <input type="hidden" name="blueprintId" value={blueprintId} />
      <input type="hidden" name="systemId" value={systemId} />

      <div className="atlas-docs-stack">
        <p className="atlas-docs-note">Choose a dependency pattern</p>
        <div className="atlas-docs-grid atlas-docs-grid--2">
          {DEPENDENCY_PATTERNS.map((pattern) => (
            <button
              key={pattern.id}
              type="button"
              className="atlas-header__button"
              aria-pressed={selectedPattern.id === pattern.id}
              onClick={() => choosePattern(pattern)}
              style={{ justifyContent: "flex-start", textAlign: "left" }}
            >
              {pattern.label}
            </button>
          ))}
        </div>
      </div>

      <label className="atlas-docs-note">
        Resource target
        <select
          name="resourceId"
          className="atlas-searchbar__input"
          value={resourceId}
          onChange={(event) => setResourceId(event.target.value)}
        >
          {resources.map((resource) => (
            <option key={resource.id} value={resource.id}>
              {resource.displayName}
            </option>
          ))}
        </select>
      </label>

      {selectedResource ? (
        <section className="atlas-docs-panel atlas-docs-stack">
          <h6>Reusable system dependency</h6>
          <p className="atlas-docs-note">
            {selectedResource.resourceClass}
            {selectedResource.provider ? ` · ${selectedResource.provider}` : ""}
            {selectedResource.environment ? ` · ${selectedResource.environment}` : ""}
          </p>
          {selectedResource.notes ? <p className="atlas-docs-note">{selectedResource.notes}</p> : null}
        </section>
      ) : null}

      <label className="atlas-docs-note">
        Dependency edge
        <input
          name="bindingKind"
          className="atlas-searchbar__input"
          value={bindingKind}
          onChange={(event) => setBindingKind(event.target.value)}
        />
      </label>
      <label className="atlas-docs-note">
        Environment stage
        <input
          name="environmentStage"
          className="atlas-searchbar__input"
          value={environmentStage}
          onChange={(event) => setEnvironmentStage(event.target.value)}
        />
      </label>
      <label className="atlas-docs-note">
        Criticality
        <input
          name="criticality"
          className="atlas-searchbar__input"
          value={criticality}
          onChange={(event) => setCriticality(event.target.value)}
        />
      </label>
      <label className="atlas-docs-note">
        Dependency notes
        <textarea
          name="notes"
          className="atlas-searchbar__input"
          rows={2}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </label>
      <button type="submit" className="atlas-header__button" disabled={!resourceId}>
        Bind resource dependency
      </button>
    </form>
  );
}
