import Link from "next/link";
import { redirect } from "next/navigation";
import { AtlasDocsScaffold } from "@/components/AtlasDocsScaffold";
import { CopyableText } from "@/components/CopyableText";
import { auth, isDevelopmentMockLoginEnabled } from "@/auth";
import { isDatabaseConfigured } from "@/lib/server/db";
import {
  COMPANY_COMPOSITION_FACETS,
  COMPANY_LAYER_DEFS,
  COMPANY_STACK_LAYERS,
  getCompanyBlueprint,
  getCompanyLayerPalette,
  listCompanyBlueprints,
  type CompanyBlueprint,
  type CompanyLayerBindingDraft,
  type CompanyLayerKey,
} from "@/lib/server/company-builder";
import {
  addCompanyIntegrationAction,
  addCompanyLayerBindingAction,
  addCompanyResourceAction,
  addCompanyResourceBindingAction,
  addCompanySystemAction,
  createCompanyBlueprintAction,
  deleteCompanyBlueprintAction,
  deleteCompanyIntegrationAction,
  deleteCompanyLayerBindingAction,
  deleteCompanyResourceAction,
  deleteCompanyResourceBindingAction,
  deleteCompanySystemAction,
  exportCompanyBlueprintAction,
  saveCompanyBlueprintExportToPrivateGraphAction,
  saveCompanyBlueprintMetadataAction,
} from "./actions";
import { LayerBindingComposer } from "./LayerBindingComposer";
import { ResourceBindingComposer } from "./ResourceBindingComposer";
import { ResourceStarterComposer } from "./ResourceStarterComposer";
import { SystemStarterComposer } from "./SystemStarterComposer";

export const dynamic = "force-dynamic";

function TextInput({
  name,
  placeholder,
  defaultValue,
}: {
  name: string;
  placeholder: string;
  defaultValue?: string;
}) {
  return (
    <input
      name={name}
      className="atlas-searchbar__input"
      placeholder={placeholder}
      defaultValue={defaultValue}
    />
  );
}

function countCoveredLayers(system: CompanyBlueprint["draft"]["systems"][number]) {
  const coverage = new Set<CompanyLayerKey>();
  for (const binding of system.layerBindings) {
    for (const layerId of binding.coverageLayerIds) {
      coverage.add(layerId);
    }
  }
  return coverage;
}

function renderCoveragePills(system: CompanyBlueprint["draft"]["systems"][number]) {
  const covered = countCoveredLayers(system);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {COMPANY_STACK_LAYERS.map((layer) => {
        const filled = covered.has(layer.key);
        return (
          <span
            key={layer.key}
            style={{
              border: "1px solid var(--atlas-line, rgba(0,0,0,0.15))",
              borderRadius: 999,
              padding: "0.2rem 0.55rem",
              fontSize: "0.8rem",
              background: filled ? "rgba(29, 116, 80, 0.12)" : "transparent",
              color: "inherit",
            }}
          >
            {layer.label}: {filled ? "filled" : "open"}
          </span>
        );
      })}
      {COMPANY_COMPOSITION_FACETS.map((facet) => {
        const filled = covered.has(facet.key);
        return (
          <span
            key={facet.key}
            style={{
              border: "1px dashed var(--atlas-line, rgba(0,0,0,0.15))",
              borderRadius: 999,
              padding: "0.2rem 0.55rem",
              fontSize: "0.8rem",
              background: filled ? "rgba(198, 142, 42, 0.12)" : "transparent",
              color: "inherit",
            }}
          >
            {facet.label}: {filled ? "linked" : "optional"}
          </span>
        );
      })}
    </div>
  );
}

function bindingLabel(binding: CompanyLayerBindingDraft) {
  const primary = COMPANY_LAYER_DEFS.find((entry) => entry.key === binding.primaryLayerId);
  return primary?.label ?? binding.primaryLayerId;
}

function exportYamlFilename(blueprint: CompanyBlueprint) {
  const slug = (blueprint.slug || blueprint.name || blueprint.id)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "company-graph"}.yaml`;
}

export default async function CompanyBuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ blueprint?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(
      isDevelopmentMockLoginEnabled()
        ? "/api/auth/github?callbackUrl=%2Fworkspace%2Fcompany-builder"
        : "/",
    );
  }

  const databaseConfigured = isDatabaseConfigured();
  const sp = await searchParams;
  const blueprints = await listCompanyBlueprints(session.user.id);
  const selectedId = typeof sp.blueprint === "string" ? sp.blueprint : blueprints[0]?.id;
  const blueprint = selectedId ? await getCompanyBlueprint(session.user.id, selectedId) : null;
  const palette = await getCompanyLayerPalette(session.user.id);
  const resourceMap = new Map(blueprint?.draft.resources.map((resource) => [resource.id, resource]) ?? []);
  const systemMap = new Map(blueprint?.draft.systems.map((system) => [system.id, system]) ?? []);
  const totalCoverage = blueprint
    ? new Set(
        blueprint.draft.systems.flatMap((system) =>
          system.layerBindings.flatMap((binding) => binding.coverageLayerIds),
        ),
      ).size
    : 0;
  const totalLayerTargets = COMPANY_LAYER_DEFS.length;

  return (
    <AtlasDocsScaffold
      runningLeft={<><span className="folio">viii</span><span>Builder</span></>}
      runningTitle={<>Agentic AI Atlas · <em>company builder</em></>}
      runningRight={<><span>{blueprints.length} graphs</span><span>a5c.ai</span></>}
      tocSearchLabel="Search builder"
      tocBookLabel="Atlas · company builder"
      tocTitle="Company graphs"
      chapters={[
        {
          num: "VIII.",
          title: "Company builder",
          pages: "pp. 1 - 1",
          current: true,
          items: [
            { label: blueprint?.name ?? "Create graph", current: true },
            ...blueprints.slice(0, 8).map((entry) => ({
              label: entry.name,
              href: `/workspace/company-builder?blueprint=${encodeURIComponent(entry.id)}`,
            })),
          ],
        },
      ]}
      chapterMark={{
        num: "VIII.",
        subtitle: "Company graph composition",
        context: blueprint?.slug ?? "draft",
        readingTime: "Authenticated",
      }}
      articleTitle={<>Company <em>builder</em></>}
      lead="Compose a full company graph from Atlas systems, stack layers, environment resources, and typed connections. The page is organized around overview, systems, environment, and export instead of raw CRUD forms."
      meta={
        databaseConfigured
          ? <><span>GitHub login</span><span>PostgreSQL-backed</span><span>Graph YAML export</span></>
          : <><span>GitHub login</span><span>SQLite-backed local dev</span><span>Graph YAML export</span></>
      }
      marginSections={[
        {
          title: "Workspace",
          items: [
            <Link key="workspace" href="/workspace">Workspace overview</Link>,
            <Link key="graphs" href="/workspace/graphs">User graph uploads</Link>,
          ],
        },
        {
          title: "Company graphs",
          items: blueprints.length
            ? blueprints.map((entry) => (
                <Link key={entry.id} href={`/workspace/company-builder?blueprint=${encodeURIComponent(entry.id)}`}>
                  {entry.name}
                </Link>
              ))
            : [<p key="none" className="atlas-docs-note">No private company graphs yet.</p>],
        },
      ]}
    >
      <div className="atlas-docs-body">
        {!databaseConfigured ? (
          <section className="atlas-docs-panel atlas-docs-full">
            <p className="atlas-docs-note">
              This local process is using SQLite because `DATABASE_URL` is not configured.
            </p>
            <p className="atlas-docs-note">
              Development, staging, and production deploy jobs provision Atlas PostgreSQL, initialize the schema, and inject `DATABASE_URL` automatically. For one-off local runs, set `DATABASE_URL` and run `npm run db:init -w @a5c-ai/atlas-webui` before starting the web UI.
            </p>
          </section>
        ) : null}

        <section className="atlas-docs-grid atlas-docs-grid--2 atlas-docs-full">
          <div className="atlas-docs-panel">
            <h3>Create company graph</h3>
            <p className="atlas-docs-note">
              Start with a company profile, then add systems, environment resources, bindings, and integrations.
            </p>
            <form action={createCompanyBlueprintAction} className="atlas-docs-stack">
              <TextInput name="name" placeholder="Acme Agentic Atlas" />
              <textarea name="description" className="atlas-searchbar__input" rows={3} placeholder="What this company graph covers" />
              <button type="submit" className="atlas-header__button">Create graph</button>
            </form>
          </div>

          <div className="atlas-docs-panel">
            <h3>How this builder works now</h3>
            <div className="atlas-docs-link-list">
              <p>1. Add systems.</p>
              <p>2. Fill their stack layers with Atlas entities.</p>
              <p>3. Capture company resources such as workspaces, platforms, datastores, or cloud accounts.</p>
              <p>4. Bind resources to systems and wire typed integrations.</p>
              <p>5. Review and export the company graph as YAML.</p>
            </div>
          </div>
        </section>

        {!blueprint ? (
          <section className="atlas-docs-panel atlas-docs-full">
            <p className="atlas-docs-note">
              Select or create a company graph to begin composing systems, environment resources, and typed connections.
            </p>
          </section>
        ) : (
          <>
            <section className="atlas-docs-grid atlas-docs-grid--3 atlas-docs-full">
              <div className="atlas-docs-panel">
                <h3>Overview</h3>
                <div className="atlas-docs-link-list">
                  <p>{blueprint.draft.systems.length} systems</p>
                  <p>{blueprint.draft.resources.length} resources</p>
                  <p>{blueprint.draft.resourceBindings.length} system-resource bindings</p>
                  <p>{blueprint.draft.integrations.length} integrations</p>
                  <p>{totalCoverage}/{totalLayerTargets} layer targets linked somewhere</p>
                </div>
              </div>

              <div className="atlas-docs-panel">
                <h3>Company profile</h3>
                <form action={saveCompanyBlueprintMetadataAction} className="atlas-docs-stack">
                  <input type="hidden" name="blueprintId" value={blueprint.id} />
                  <TextInput name="displayName" placeholder="Company name" defaultValue={blueprint.draft.company.displayName} />
                  <textarea
                    name="description"
                    className="atlas-searchbar__input"
                    rows={4}
                    defaultValue={blueprint.draft.company.description}
                    placeholder="What this company graph represents"
                  />
                  <select name="status" className="atlas-searchbar__input" defaultValue={blueprint.draft.company.status}>
                    <option value="draft">draft</option>
                    <option value="active">active</option>
                    <option value="archived">archived</option>
                  </select>
                  <button type="submit" className="atlas-header__button">Save profile</button>
                </form>
              </div>

              <div className="atlas-docs-panel">
                <h3>Export</h3>
                <div className="atlas-docs-stack">
                  <form action={exportCompanyBlueprintAction}>
                    <input type="hidden" name="blueprintId" value={blueprint.id} />
                    <button type="submit" className="atlas-header__button">Generate YAML export</button>
                  </form>
                  <form action={saveCompanyBlueprintExportToPrivateGraphAction}>
                    <input type="hidden" name="blueprintId" value={blueprint.id} />
                    <input type="hidden" name="graphTitle" value={`${blueprint.name} export`} />
                    <input
                      type="hidden"
                      name="graphDescription"
                      value={`Generated from the company-builder graph ${blueprint.name}.`}
                    />
                    <input type="hidden" name="sourceFilename" value={exportYamlFilename(blueprint)} />
                    <button type="submit" className="atlas-header__button">Save to private graphs</button>
                  </form>
                </div>
                <form action={deleteCompanyBlueprintAction} className="atlas-docs-stack">
                  <input type="hidden" name="blueprintId" value={blueprint.id} />
                  <button type="submit" className="atlas-header__button">Delete graph</button>
                </form>
                {blueprint.lastExportYaml ? (
                  <CopyableText
                    text={blueprint.lastExportYaml}
                    mode="textarea"
                    rows={12}
                    copyLabel="Copy YAML"
                    downloadLabel="Download YAML"
                    filename={exportYamlFilename(blueprint)}
                    languageLabel="Generated YAML"
                    textareaLabel="Generated company graph YAML"
                  />
                ) : (
                  <p className="atlas-docs-note">No export generated yet.</p>
                )}
              </div>
            </section>

            <section className="atlas-docs-grid atlas-docs-grid--2 atlas-docs-full">
              <div className="atlas-docs-panel">
                <h3>Start a system</h3>
                <SystemStarterComposer
                  blueprintId={blueprint.id}
                  action={addCompanySystemAction}
                  layerDefs={COMPANY_LAYER_DEFS}
                />
              </div>

              <div className="atlas-docs-panel">
                <h3>Add resource target</h3>
                <ResourceStarterComposer blueprintId={blueprint.id} action={addCompanyResourceAction} />
              </div>
            </section>

            <section className="atlas-docs-full atlas-docs-stack">
              <div>
                <h3>Systems</h3>
                <p className="atlas-docs-note">
                  Compose each system against all stack layers, then bind it to the company environment.
                </p>
              </div>
              {blueprint.draft.systems.length === 0 ? (
                <section className="atlas-docs-panel atlas-docs-full">
                  <p className="atlas-docs-note">
                    No systems yet. Add the first system, then fill its layers from the Atlas graph.
                  </p>
                </section>
              ) : (
                <div className="atlas-docs-grid atlas-docs-grid--2">
                  {blueprint.draft.systems.map((system) => {
                    const systemBindings = blueprint.draft.resourceBindings.filter((binding) => binding.systemId === system.id);
                    return (
                      <article key={system.id} className="atlas-docs-panel atlas-docs-stack">
                        <div>
                          <h4>{system.displayName}</h4>
                          <p className="atlas-docs-note">
                            {system.systemKind} · {system.lifecycleStage || "draft"}
                          </p>
                          {system.description ? <p>{system.description}</p> : null}
                          {system.outcome ? <p className="atlas-docs-note">Outcome: {system.outcome}</p> : null}
                        </div>

                        <div>
                          <h5>Coverage</h5>
                          {renderCoveragePills(system)}
                        </div>

                        <form action={deleteCompanySystemAction} className="atlas-docs-stack">
                          <input type="hidden" name="blueprintId" value={blueprint.id} />
                          <input type="hidden" name="systemId" value={system.id} />
                          <button type="submit" className="atlas-header__button">Delete system</button>
                        </form>

                        <div>
                          <h5>Add layer binding</h5>
                          <LayerBindingComposer
                            blueprintId={blueprint.id}
                            systemId={system.id}
                            action={addCompanyLayerBindingAction}
                            layerDefs={COMPANY_LAYER_DEFS}
                            palette={palette}
                          />
                        </div>

                        <div>
                          <h5>Layer bindings</h5>
                          {system.layerBindings.length === 0 ? (
                            <p className="atlas-docs-note">No layer bindings yet.</p>
                          ) : (
                            <div className="atlas-docs-link-list">
                              {system.layerBindings.map((binding) => (
                                <div key={binding.id}>
                                  <Link href={`/n/${encodeURIComponent(binding.atlasRecordId)}`}>
                                    {bindingLabel(binding)}: {binding.atlasRecordId}
                                  </Link>
                                  <p className="atlas-docs-note">
                                    {binding.selectionRole || "primary binding"}
                                    {binding.coverageLayerIds.length > 1 ? ` · covers ${binding.coverageLayerIds.join(", ")}` : ""}
                                    {binding.rationale ? ` · ${binding.rationale}` : ""}
                                  </p>
                                  <form action={deleteCompanyLayerBindingAction} className="mt-2">
                                    <input type="hidden" name="blueprintId" value={blueprint.id} />
                                    <input type="hidden" name="systemId" value={system.id} />
                                    <input type="hidden" name="bindingId" value={binding.id} />
                                    <button type="submit" className="atlas-header__button">Delete binding</button>
                                  </form>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <h5>Bind company resources</h5>
                          {blueprint.draft.resources.length === 0 ? (
                            <p className="atlas-docs-note">Add environment resources first.</p>
                          ) : (
                            <ResourceBindingComposer
                              blueprintId={blueprint.id}
                              systemId={system.id}
                              action={addCompanyResourceBindingAction}
                              resources={blueprint.draft.resources}
                            />
                          )}
                          {systemBindings.length === 0 ? (
                            <p className="atlas-docs-note">No resource bindings yet.</p>
                          ) : (
                            <div className="atlas-docs-link-list">
                              {systemBindings.map((binding) => (
                                <div key={binding.id}>
                                  <p>
                                    {binding.bindingKind}: {resourceMap.get(binding.resourceId)?.displayName ?? binding.resourceId}
                                  </p>
                                  <p className="atlas-docs-note">
                                    {binding.environmentStage || "all environments"}
                                    {binding.criticality ? ` · ${binding.criticality}` : ""}
                                    {binding.notes ? ` · ${binding.notes}` : ""}
                                  </p>
                                  <form action={deleteCompanyResourceBindingAction} className="mt-2">
                                    <input type="hidden" name="blueprintId" value={blueprint.id} />
                                    <input type="hidden" name="bindingId" value={binding.id} />
                                    <button type="submit" className="atlas-header__button">Remove binding</button>
                                  </form>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="atlas-docs-grid atlas-docs-grid--2 atlas-docs-full">
              <div className="atlas-docs-panel">
                <h3>Environment</h3>
                {blueprint.draft.resources.length === 0 ? (
                  <p className="atlas-docs-note">No resources yet. Add workspaces, datastores, cloud accounts, platforms, or external systems.</p>
                ) : (
                  <div className="atlas-docs-link-list">
                    {blueprint.draft.resources.map((resource) => {
                      const usedBy = blueprint.draft.resourceBindings.filter((binding) => binding.resourceId === resource.id);
                      return (
                        <div key={resource.id}>
                          <p>{resource.displayName}</p>
                          <p className="atlas-docs-note">
                            {resource.resourceClass}
                            {resource.provider ? ` · ${resource.provider}` : ""}
                            {resource.environment ? ` · ${resource.environment}` : ""}
                            {resource.atlasRecordId ? ` · ${resource.atlasRecordId}` : ""}
                          </p>
                          {usedBy.length > 0 ? (
                            <p className="atlas-docs-note">
                              Used by {usedBy.map((binding) => systemMap.get(binding.systemId)?.displayName ?? binding.systemId).join(", ")}
                            </p>
                          ) : null}
                          <form action={deleteCompanyResourceAction} className="mt-2">
                            <input type="hidden" name="blueprintId" value={blueprint.id} />
                            <input type="hidden" name="resourceId" value={resource.id} />
                            <button type="submit" className="atlas-header__button">Delete resource</button>
                          </form>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="atlas-docs-panel">
                <h3>Connections</h3>
                <form action={addCompanyIntegrationAction} className="atlas-docs-stack">
                  <input type="hidden" name="blueprintId" value={blueprint.id} />
                  <select name="sourceType" className="atlas-searchbar__input" defaultValue="system">
                    <option value="system">system</option>
                    <option value="resource">resource</option>
                  </select>
                  <select name="sourceId" className="atlas-searchbar__input" defaultValue="">
                    <option value="" disabled>Select source</option>
                    {blueprint.draft.systems.map((system) => (
                      <option key={system.id} value={system.id}>{system.displayName}</option>
                    ))}
                    {blueprint.draft.resources.map((resource) => (
                      <option key={resource.id} value={resource.id}>{resource.displayName}</option>
                    ))}
                  </select>
                  <select name="targetType" className="atlas-searchbar__input" defaultValue="resource">
                    <option value="system">system</option>
                    <option value="resource">resource</option>
                  </select>
                  <select name="targetId" className="atlas-searchbar__input" defaultValue="">
                    <option value="" disabled>Select target</option>
                    {blueprint.draft.systems.map((system) => (
                      <option key={system.id} value={system.id}>{system.displayName}</option>
                    ))}
                    {blueprint.draft.resources.map((resource) => (
                      <option key={resource.id} value={resource.id}>{resource.displayName}</option>
                    ))}
                  </select>
                  <TextInput name="integrationKind" placeholder="syncs-with | emits-to | invokes" />
                  <TextInput name="triggerKind" placeholder="webhook | polling | manual | scheduled" />
                  <TextInput name="interfaceKind" placeholder="api | event-bus | mcp | queue" />
                  <TextInput name="direction" placeholder="outbound | inbound | bidirectional" />
                  <textarea name="notes" className="atlas-searchbar__input" rows={2} placeholder="How this flow works" />
                  <button type="submit" className="atlas-header__button">Add integration</button>
                </form>
                {blueprint.draft.integrations.length === 0 ? (
                  <p className="atlas-docs-note">No integrations yet.</p>
                ) : (
                  <div className="atlas-docs-link-list">
                    {blueprint.draft.integrations.map((integration) => (
                      <div key={integration.id}>
                        <p>
                          {(integration.sourceType === "system"
                            ? systemMap.get(integration.sourceId)?.displayName
                            : resourceMap.get(integration.sourceId)?.displayName) ?? integration.sourceId}
                          {" -> "}
                          {(integration.targetType === "system"
                            ? systemMap.get(integration.targetId)?.displayName
                            : resourceMap.get(integration.targetId)?.displayName) ?? integration.targetId}
                        </p>
                        <p className="atlas-docs-note">
                          {integration.integrationKind}
                          {integration.interfaceKind ? ` · ${integration.interfaceKind}` : ""}
                          {integration.triggerKind ? ` · ${integration.triggerKind}` : ""}
                          {integration.direction ? ` · ${integration.direction}` : ""}
                        </p>
                        <form action={deleteCompanyIntegrationAction} className="mt-2">
                          <input type="hidden" name="blueprintId" value={blueprint.id} />
                          <input type="hidden" name="integrationId" value={integration.id} />
                          <button type="submit" className="atlas-header__button">Delete integration</button>
                        </form>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="atlas-docs-full atlas-docs-stack">
              <div>
                <h3>Layer palette</h3>
                <p className="atlas-docs-note">
                  These Atlas records are grouped by layer or facet so system composition does not depend on memorizing ids.
                </p>
              </div>
              <div className="atlas-docs-grid atlas-docs-grid--2">
                {palette.map((layer) => (
                  <article key={layer.key} className="atlas-docs-panel atlas-docs-stack">
                    <div>
                      <h4>{layer.label}</h4>
                      <p className="atlas-docs-note">{layer.options.length} suggested entities.</p>
                    </div>
                    <div className="atlas-docs-link-list">
                      {layer.options.map((option) => (
                        <Link key={option.id} href={`/n/${encodeURIComponent(option.id)}`}>
                          {option.label} · {option.kind}
                        </Link>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}

        {!blueprint ? (
          <section className="atlas-docs-full atlas-docs-stack">
            <div>
              <h3>Layer palette</h3>
              <p className="atlas-docs-note">
                Browse the Atlas stack before creating a graph. Once a company graph exists, these records become the system composition library.
              </p>
            </div>
            <div className="atlas-docs-grid atlas-docs-grid--2">
              {palette.map((layer) => (
                <article key={layer.key} className="atlas-docs-panel atlas-docs-stack">
                  <div>
                    <h4>{layer.label}</h4>
                    <p className="atlas-docs-note">{layer.options.length} suggested entities.</p>
                  </div>
                  <div className="atlas-docs-link-list">
                    {layer.options.map((option) => (
                      <Link key={option.id} href={`/n/${encodeURIComponent(option.id)}`}>
                        {option.label} · {option.kind}
                      </Link>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <datalist id="atlas-builder-records">
          {palette.flatMap((layer) => layer.options).map((option) => (
            <option key={option.id} value={option.id}>{option.label} · {option.kind}</option>
          ))}
        </datalist>
      </div>
    </AtlasDocsScaffold>
  );
}
