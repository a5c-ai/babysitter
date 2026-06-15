"use client";

import { useEffect, useMemo, useState } from "react";
import type { CompanyLayerKey, CompanyLayerPalette } from "@/lib/server/company-builder";

type LayerBindingComposerProps = {
  blueprintId: string;
  systemId: string;
  action: (formData: FormData) => void | Promise<void>;
  layerDefs: ReadonlyArray<{
    key: CompanyLayerKey;
    label: string;
    kind: "stack-layer" | "composition-facet";
  }>;
  palette: CompanyLayerPalette[];
};

export function LayerBindingComposer({
  blueprintId,
  systemId,
  action,
  layerDefs,
  palette,
}: LayerBindingComposerProps) {
  const defaultLayer = layerDefs[0]?.key ?? "layer:1-model";
  const [primaryLayerId, setPrimaryLayerId] = useState<CompanyLayerKey>(defaultLayer);
  const [search, setSearch] = useState("");
  const [selectedAtlasRecordId, setSelectedAtlasRecordId] = useState("");
  const [extraCoverage, setExtraCoverage] = useState<CompanyLayerKey[]>([]);

  const paletteMap = useMemo(
    () => new Map(palette.map((entry) => [entry.key, entry.options])),
    [palette],
  );

  const selectedOptions = paletteMap.get(primaryLayerId) ?? [];
  const filteredOptions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return selectedOptions.slice(0, 12);
    }
    return selectedOptions
      .filter((option) =>
        [option.label, option.kind, option.description]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(term)),
      )
      .slice(0, 16);
  }, [search, selectedOptions]);

  useEffect(() => {
    if (!filteredOptions.length) {
      setSelectedAtlasRecordId("");
      return;
    }
    if (!filteredOptions.some((option) => option.id === selectedAtlasRecordId)) {
      setSelectedAtlasRecordId(filteredOptions[0]?.id ?? "");
    }
  }, [filteredOptions, selectedAtlasRecordId]);

  useEffect(() => {
    setExtraCoverage((current) => current.filter((item) => item !== primaryLayerId));
  }, [primaryLayerId]);

  return (
    <form action={action} className="atlas-docs-stack">
      <input type="hidden" name="blueprintId" value={blueprintId} />
      <input type="hidden" name="systemId" value={systemId} />
      <input type="hidden" name="atlasRecordId" value={selectedAtlasRecordId} />
      <input type="hidden" name="coverageLayerIds" value={primaryLayerId} />

      <label className="atlas-docs-note">
        Primary layer
        <select
          name="primaryLayerId"
          className="atlas-searchbar__input"
          value={primaryLayerId}
          onChange={(event) => setPrimaryLayerId(event.target.value as CompanyLayerKey)}
        >
          {layerDefs.map((layer) => (
            <option key={layer.key} value={layer.key}>
              {layer.label}
            </option>
          ))}
        </select>
      </label>

      <label className="atlas-docs-note">
        Search Atlas entities
        <input
          className="atlas-searchbar__input"
          placeholder="Search by label, kind, or description"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>

      <div className="atlas-docs-stack">
        <p className="atlas-docs-note">
          Choose one candidate for {layerDefs.find((layer) => layer.key === primaryLayerId)?.label ?? primaryLayerId}.
        </p>
        {filteredOptions.length === 0 ? (
          <p className="atlas-docs-note">No Atlas entities matched this filter.</p>
        ) : (
          <div className="atlas-docs-link-list">
            {filteredOptions.map((option) => (
              <label
                key={option.id}
                style={{
                  display: "block",
                  border: "1px solid var(--atlas-line, rgba(0,0,0,0.15))",
                  borderRadius: 12,
                  padding: "0.75rem",
                }}
              >
                <input
                  type="radio"
                  name="atlasRecordChoice"
                  value={option.id}
                  checked={selectedAtlasRecordId === option.id}
                  onChange={() => setSelectedAtlasRecordId(option.id)}
                  style={{ marginRight: 8 }}
                />
                <strong>{option.label}</strong> <span className="atlas-docs-note">{option.kind}</span>
                {option.description ? <p className="atlas-docs-note">{option.description}</p> : null}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="atlas-docs-stack">
        <p className="atlas-docs-note">Extra coverage</p>
        <p className="atlas-docs-note">
          The primary layer is always included. Add any extra layers or facets that this same entity also covers.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {layerDefs
            .filter((layer) => layer.key !== primaryLayerId)
            .map((layer) => {
              const checked = extraCoverage.includes(layer.key);
              return (
                <label key={layer.key} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="checkbox"
                    name="coverageLayerIds"
                    value={layer.key}
                    checked={checked}
                    onChange={(event) => {
                      setExtraCoverage((current) =>
                        event.target.checked
                          ? [...current, layer.key]
                          : current.filter((item) => item !== layer.key),
                      );
                    }}
                  />
                  <span>{layer.label}</span>
                </label>
              );
            })}
        </div>
      </div>

      <input
        name="selectionRole"
        className="atlas-searchbar__input"
        placeholder="primary runtime, main toolset, lead role..."
      />
      <textarea
        name="rationale"
        className="atlas-searchbar__input"
        rows={2}
        placeholder="Why this entity belongs in the system"
      />
      <button type="submit" className="atlas-header__button" disabled={!selectedAtlasRecordId}>
        Add layer binding
      </button>
    </form>
  );
}
