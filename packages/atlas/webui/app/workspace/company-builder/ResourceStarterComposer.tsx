"use client";

import { useState } from "react";

type ResourceStarterComposerProps = {
  blueprintId: string;
  action: (formData: FormData) => void | Promise<void>;
};

type ResourceStarter = {
  id: string;
  label: string;
  displayName: string;
  resourceClass: string;
  provider: string;
  environment: string;
  externalId: string;
  notes: string;
};

const RESOURCE_STARTERS: ResourceStarter[] = [
  {
    id: "github-workspace",
    label: "GitHub workspace",
    displayName: "GitHub org",
    resourceClass: "workspace",
    provider: "GitHub",
    environment: "production",
    externalId: "acme/github",
    notes: "Repository, pull request, issue, and workflow surface used by delivery systems.",
  },
  {
    id: "cloud-account",
    label: "Cloud account",
    displayName: "Production cloud account",
    resourceClass: "cloud-account",
    provider: "Azure",
    environment: "production",
    externalId: "subscription-or-project-id",
    notes: "Deployment target for runtimes, sandboxes, storage, observability, and hosted services.",
  },
  {
    id: "knowledge-store",
    label: "Knowledge store",
    displayName: "Company knowledge base",
    resourceClass: "knowledge-base",
    provider: "internal",
    environment: "shared",
    externalId: "kb-main",
    notes: "Documents, policies, runbooks, and product context used by agentic systems.",
  },
  {
    id: "data-platform",
    label: "Data platform",
    displayName: "Analytics warehouse",
    resourceClass: "datastore",
    provider: "Snowflake",
    environment: "production",
    externalId: "warehouse-or-account-id",
    notes: "Structured operational data, reporting tables, and evaluation datasets.",
  },
];

export function ResourceStarterComposer({ blueprintId, action }: ResourceStarterComposerProps) {
  const [selected, setSelected] = useState<ResourceStarter>(RESOURCE_STARTERS[0]);
  const [displayName, setDisplayName] = useState(selected.displayName);
  const [resourceClass, setResourceClass] = useState(selected.resourceClass);
  const [provider, setProvider] = useState(selected.provider);
  const [environment, setEnvironment] = useState(selected.environment);
  const [externalId, setExternalId] = useState(selected.externalId);
  const [notes, setNotes] = useState(selected.notes);

  function chooseStarter(starter: ResourceStarter) {
    setSelected(starter);
    setDisplayName(starter.displayName);
    setResourceClass(starter.resourceClass);
    setProvider(starter.provider);
    setEnvironment(starter.environment);
    setExternalId(starter.externalId);
    setNotes(starter.notes);
  }

  return (
    <form action={action} className="atlas-docs-stack">
      <input type="hidden" name="blueprintId" value={blueprintId} />

      <div className="atlas-docs-stack">
        <p className="atlas-docs-note">Choose a resource starter</p>
        <div className="atlas-docs-grid atlas-docs-grid--2">
          {RESOURCE_STARTERS.map((starter) => (
            <button
              key={starter.id}
              type="button"
              className="atlas-header__button"
              aria-pressed={selected.id === starter.id}
              onClick={() => chooseStarter(starter)}
              style={{ justifyContent: "flex-start", textAlign: "left" }}
            >
              {starter.label}
            </button>
          ))}
        </div>
      </div>

      <section className="atlas-docs-panel atlas-docs-stack">
        <h4>Reusable integration target</h4>
        <p className="atlas-docs-note">
          Add workspaces, cloud accounts, datastores, knowledge bases, and platform services once, then bind systems to them and wire integrations.
        </p>
      </section>

      <label className="atlas-docs-note">
        Resource name
        <input
          name="displayName"
          className="atlas-searchbar__input"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
      </label>
      <label className="atlas-docs-note">
        Resource class
        <input
          name="resourceClass"
          className="atlas-searchbar__input"
          value={resourceClass}
          onChange={(event) => setResourceClass(event.target.value)}
        />
      </label>
      <label className="atlas-docs-note">
        Provider
        <input
          name="provider"
          className="atlas-searchbar__input"
          value={provider}
          onChange={(event) => setProvider(event.target.value)}
        />
      </label>
      <label className="atlas-docs-note">
        Environment
        <input
          name="environment"
          className="atlas-searchbar__input"
          value={environment}
          onChange={(event) => setEnvironment(event.target.value)}
        />
      </label>
      <input name="atlasRecordId" type="hidden" value="" />
      <label className="atlas-docs-note">
        External account or project id
        <input
          name="externalId"
          className="atlas-searchbar__input"
          value={externalId}
          onChange={(event) => setExternalId(event.target.value)}
        />
      </label>
      <label className="atlas-docs-note">
        Resource notes
        <textarea
          name="notes"
          className="atlas-searchbar__input"
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </label>
      <button type="submit" className="atlas-header__button">
        Add resource target
      </button>
    </form>
  );
}
