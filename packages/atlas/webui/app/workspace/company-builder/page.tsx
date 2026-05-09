import Link from "next/link";
import { redirect } from "next/navigation";
import { AtlasDocsScaffold } from "@/components/AtlasDocsScaffold";
import { auth } from "@/auth";
import { isDatabaseConfigured } from "@/lib/server/db";
import {
  COMPANY_LAYER_DEFS,
  getCompanyBlueprint,
  getCompanyLayerPalette,
  listCompanyBlueprints,
} from "@/lib/server/company-builder";
import {
  addCompanyAssetAction,
  addCompanyIntegrationAction,
  addCompanySelectionAction,
  addCompanySystemAction,
  attachAssetToSystemAction,
  createCompanyBlueprintAction,
  deleteCompanyAssetAction,
  deleteCompanyBlueprintAction,
  deleteCompanyIntegrationAction,
  deleteCompanySelectionAction,
  deleteCompanySystemAction,
  exportCompanyBlueprintAction,
  removeAssetFromSystemAction,
  saveCompanyBlueprintMetadataAction,
} from "./actions";

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

export default async function CompanyBuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ blueprint?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const databaseConfigured = isDatabaseConfigured();
  const sp = await searchParams;
  const blueprints = await listCompanyBlueprints(session.user.id);
  const selectedId = typeof sp.blueprint === "string" ? sp.blueprint : blueprints[0]?.id;
  const blueprint = selectedId ? await getCompanyBlueprint(session.user.id, selectedId) : null;
  const palette = await getCompanyLayerPalette(session.user.id);
  const assetMap = new Map(blueprint?.draft.assets.map((asset) => [asset.id, asset]) ?? []);
  const systemMap = new Map(blueprint?.draft.systems.map((system) => [system.id, system]) ?? []);

  return (
    <AtlasDocsScaffold
      runningLeft={<><span className="folio">viii</span><span>Builder</span></>}
      runningTitle={<>Agentic AI Atlas · <em>company builder</em></>}
      runningRight={<><span>{blueprints.length} blueprints</span><span>a5c.ai</span></>}
      tocSearchLabel="Search builder"
      tocBookLabel="Atlas · company builder"
      tocTitle="Blueprints"
      chapters={[
        {
          num: "VIII.",
          title: "Company builder",
          pages: "pp. 1 - 1",
          current: true,
          items: [
            { label: blueprint?.name ?? "Create blueprint", current: true },
            ...blueprints.slice(0, 6).map((entry) => ({
              label: entry.name,
              href: `/workspace/company-builder?blueprint=${encodeURIComponent(entry.id)}`,
            })),
          ],
        },
      ]}
      chapterMark={{ num: "VIII.", subtitle: "Company graph authoring", context: blueprint?.slug ?? "draft", readingTime: "Authenticated" }}
      articleTitle={<>Company <em>builder</em></>}
      lead="Compose private systems from Atlas layers, company-owned assets, and integrations, then export the result as a YAML graph."
      meta={
        databaseConfigured
          ? <><span>GitHub login</span><span>PostgreSQL-backed</span><span>YAML export</span></>
          : <><span>Local mock mode</span><span>File-backed storage</span><span>YAML export</span></>
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
          title: "Blueprints",
          items: blueprints.length
            ? blueprints.map((entry) => (
                <Link key={entry.id} href={`/workspace/company-builder?blueprint=${encodeURIComponent(entry.id)}`}>
                  {entry.name}
                </Link>
              ))
            : [<p key="none" className="atlas-docs-note">No company blueprints yet.</p>],
        },
      ]}
    >
      <div className="atlas-docs-body">
        {!databaseConfigured ? (
          <section className="atlas-docs-panel atlas-docs-full">
            <p className="atlas-docs-note">
              Local mock mode is active. Company builder blueprints are stored in a local development file until `DATABASE_URL` is configured.
            </p>
            <p className="atlas-docs-note">
              Configure PostgreSQL and run `npm run db:init -w @a5c-ai/atlas-webui` when you want shared private storage instead of the local fallback.
            </p>
          </section>
        ) : null}

        <section className="atlas-docs-panel atlas-docs-full">
          <h3>Create blueprint</h3>
          <form action={createCompanyBlueprintAction} className="atlas-docs-stack">
            <TextInput name="name" placeholder="Acme Agentic Stack" />
            <textarea name="description" className="atlas-searchbar__input" rows={3} placeholder="What the company blueprint represents" />
            <button type="submit" className="atlas-header__button">Create blueprint</button>
          </form>
        </section>

        {!blueprint ? (
          <section className="atlas-docs-panel atlas-docs-full">
            <p className="atlas-docs-note">Select or create a blueprint to start composing systems, assets, and integrations.</p>
          </section>
        ) : (
          <>
            <section className="atlas-docs-grid atlas-docs-grid--2 atlas-docs-full">
              <div className="atlas-docs-panel">
                <h3>Blueprint metadata</h3>
                <form action={saveCompanyBlueprintMetadataAction} className="atlas-docs-stack">
                  <input type="hidden" name="blueprintId" value={blueprint.id} />
                  <TextInput name="displayName" placeholder="Company name" defaultValue={blueprint.draft.company.displayName} />
                  <textarea
                    name="description"
                    className="atlas-searchbar__input"
                    rows={4}
                    defaultValue={blueprint.draft.company.description}
                    placeholder="Describe the company stack"
                  />
                  <select name="status" className="atlas-searchbar__input" defaultValue={blueprint.draft.company.status}>
                    <option value="draft">draft</option>
                    <option value="active">active</option>
                    <option value="archived">archived</option>
                  </select>
                  <button type="submit" className="atlas-header__button">Save metadata</button>
                </form>
              </div>

              <div className="atlas-docs-panel">
                <h3>YAML export</h3>
                <form action={exportCompanyBlueprintAction} className="atlas-docs-stack">
                  <input type="hidden" name="blueprintId" value={blueprint.id} />
                  <button type="submit" className="atlas-header__button">Generate YAML export</button>
                </form>
                <form action={deleteCompanyBlueprintAction} className="atlas-docs-stack">
                  <input type="hidden" name="blueprintId" value={blueprint.id} />
                  <button type="submit" className="atlas-header__button">Delete blueprint</button>
                </form>
                {blueprint.lastExportYaml ? (
                  <pre className="atlas-docs-pre" style={{ maxHeight: 420, overflow: "auto" }}>
                    <code>{blueprint.lastExportYaml}</code>
                  </pre>
                ) : (
                  <p className="atlas-docs-note">No export generated yet.</p>
                )}
              </div>
            </section>

            <section className="atlas-docs-grid atlas-docs-grid--2 atlas-docs-full">
              <div className="atlas-docs-panel">
                <h3>Add system</h3>
                <form action={addCompanySystemAction} className="atlas-docs-stack">
                  <input type="hidden" name="blueprintId" value={blueprint.id} />
                  <TextInput name="displayName" placeholder="Customer support agents" />
                  <TextInput name="systemKind" placeholder="customer-ops" />
                  <textarea name="description" className="atlas-searchbar__input" rows={3} placeholder="What the system does" />
                  <button type="submit" className="atlas-header__button">Add system</button>
                </form>
              </div>

              <div className="atlas-docs-panel">
                <h3>Add asset</h3>
                <form action={addCompanyAssetAction} className="atlas-docs-stack">
                  <input type="hidden" name="blueprintId" value={blueprint.id} />
                  <TextInput name="displayName" placeholder="GitHub org" />
                  <TextInput name="assetKind" placeholder="vcs-host" />
                  <TextInput name="environment" placeholder="production" />
                  <TextInput name="provider" placeholder="GitHub" />
                  <textarea name="notes" className="atlas-searchbar__input" rows={3} placeholder="Optional asset notes" />
                  <button type="submit" className="atlas-header__button">Add asset</button>
                </form>
              </div>
            </section>

            <section className="atlas-docs-grid atlas-docs-grid--2 atlas-docs-full">
              <div className="atlas-docs-panel">
                <h3>Add integration</h3>
                <form action={addCompanyIntegrationAction} className="atlas-docs-stack">
                  <input type="hidden" name="blueprintId" value={blueprint.id} />
                  <select name="fromSystemId" className="atlas-searchbar__input" defaultValue="">
                    <option value="" disabled>Select source system</option>
                    {blueprint.draft.systems.map((system) => (
                      <option key={system.id} value={system.id}>{system.displayName}</option>
                    ))}
                  </select>
                  <select name="toType" className="atlas-searchbar__input" defaultValue="asset">
                    <option value="asset">asset</option>
                    <option value="system">system</option>
                  </select>
                  <TextInput name="toId" placeholder="Target system or asset id" />
                  <TextInput name="integrationKind" placeholder="sends-events-to" />
                  <TextInput name="triggerKind" placeholder="webhook" />
                  <textarea name="notes" className="atlas-searchbar__input" rows={3} placeholder="How the integration works" />
                  <button type="submit" className="atlas-header__button">Add integration</button>
                </form>
              </div>

              <div className="atlas-docs-panel">
                <h3>Builder coverage</h3>
                <p className="atlas-docs-note">
                  Systems capture the agentic stack. Assets capture the company environment. Integrations tie both together and export as a graph.
                </p>
                <div className="atlas-docs-link-list">
                  {COMPANY_LAYER_DEFS.map((layer) => (
                    <a key={layer.key} href={`#layer-${layer.key}`}>{layer.label}</a>
                  ))}
                </div>
              </div>
            </section>

            <section className="atlas-docs-full atlas-docs-stack">
              <div>
                <h3>Systems</h3>
                <p className="atlas-docs-note">{blueprint.draft.systems.length} systems in this blueprint.</p>
              </div>
              <div className="atlas-docs-grid atlas-docs-grid--2">
                {blueprint.draft.systems.map((system) => (
                  <article key={system.id} className="atlas-docs-panel atlas-docs-stack">
                    <div>
                      <h4>{system.displayName}</h4>
                      <p className="atlas-docs-note">{system.systemKind} · {system.id}</p>
                      {system.description ? <p>{system.description}</p> : null}
                    </div>
                    <form action={deleteCompanySystemAction} className="atlas-docs-stack">
                      <input type="hidden" name="blueprintId" value={blueprint.id} />
                      <input type="hidden" name="systemId" value={system.id} />
                      <button type="submit" className="atlas-header__button">Delete system</button>
                    </form>

                    <form action={addCompanySelectionAction} className="atlas-docs-stack">
                      <input type="hidden" name="blueprintId" value={blueprint.id} />
                      <input type="hidden" name="systemId" value={system.id} />
                      <select name="layerKey" className="atlas-searchbar__input" defaultValue="agents">
                        {COMPANY_LAYER_DEFS.map((layer) => (
                          <option key={layer.key} value={layer.key}>{layer.label}</option>
                        ))}
                      </select>
                      <input name="atlasRecordId" className="atlas-searchbar__input" list="atlas-builder-records" placeholder="agent:codex or tool:..." />
                      <TextInput name="selectionRole" placeholder="primary coding agent" />
                      <TextInput name="coversLayers" placeholder="agents,tools" />
                      <textarea name="notes" className="atlas-searchbar__input" rows={2} placeholder="Why this entity belongs in the system" />
                      <button type="submit" className="atlas-header__button">Add layer selection</button>
                    </form>

                    {blueprint.draft.assets.length > 0 ? (
                      <form action={attachAssetToSystemAction} className="atlas-docs-stack">
                        <input type="hidden" name="blueprintId" value={blueprint.id} />
                        <input type="hidden" name="systemId" value={system.id} />
                        <select name="assetId" className="atlas-searchbar__input" defaultValue="">
                          <option value="" disabled>Attach asset</option>
                          {blueprint.draft.assets.map((asset) => (
                            <option key={asset.id} value={asset.id}>{asset.displayName}</option>
                          ))}
                        </select>
                        <button type="submit" className="atlas-header__button">Attach asset</button>
                      </form>
                    ) : null}

                    <div>
                      <h5>Selections</h5>
                      {system.selections.length === 0 ? (
                        <p className="atlas-docs-note">No Atlas entities selected yet.</p>
                      ) : (
                        <div className="atlas-docs-link-list">
                          {system.selections.map((selection) => (
                            <div key={selection.id}>
                              <Link href={`/n/${encodeURIComponent(selection.atlasRecordId)}`}>
                                {selection.selectionRole || selection.layerKey}: {selection.atlasRecordId}
                              </Link>
                              <p className="atlas-docs-note">
                                {selection.layerKey}
                                {selection.coversLayers.length ? ` · covers ${selection.coversLayers.join(", ")}` : ""}
                                {selection.notes ? ` · ${selection.notes}` : ""}
                              </p>
                              <form action={deleteCompanySelectionAction} className="mt-2">
                                <input type="hidden" name="blueprintId" value={blueprint.id} />
                                <input type="hidden" name="systemId" value={system.id} />
                                <input type="hidden" name="selectionId" value={selection.id} />
                                <button type="submit" className="atlas-header__button">Delete selection</button>
                              </form>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <h5>Attached assets</h5>
                      {system.assetIds.length === 0 ? (
                        <p className="atlas-docs-note">No company assets attached.</p>
                      ) : (
                        <div className="atlas-docs-link-list">
                          {system.assetIds.map((assetId) => (
                            <div key={assetId}>
                              <p className="atlas-docs-note">{assetMap.get(assetId)?.displayName ?? assetId}</p>
                              <form action={removeAssetFromSystemAction} className="mt-2">
                                <input type="hidden" name="blueprintId" value={blueprint.id} />
                                <input type="hidden" name="systemId" value={system.id} />
                                <input type="hidden" name="assetId" value={assetId} />
                                <button type="submit" className="atlas-header__button">Detach asset</button>
                              </form>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="atlas-docs-grid atlas-docs-grid--2 atlas-docs-full">
              <div className="atlas-docs-panel">
                <h3>Assets</h3>
                {blueprint.draft.assets.length === 0 ? (
                  <p className="atlas-docs-note">No company assets yet.</p>
                ) : (
                  <div className="atlas-docs-link-list">
                    {blueprint.draft.assets.map((asset) => (
                      <div key={asset.id}>
                        <p>{asset.displayName}</p>
                        <p className="atlas-docs-note">{asset.assetKind} · {asset.provider || "provider n/a"} · {asset.environment || "env n/a"}</p>
                        <form action={deleteCompanyAssetAction} className="mt-2">
                          <input type="hidden" name="blueprintId" value={blueprint.id} />
                          <input type="hidden" name="assetId" value={asset.id} />
                          <button type="submit" className="atlas-header__button">Delete asset</button>
                        </form>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="atlas-docs-panel">
                <h3>Integrations</h3>
                {blueprint.draft.integrations.length === 0 ? (
                  <p className="atlas-docs-note">No integrations yet.</p>
                ) : (
                  <div className="atlas-docs-link-list">
                    {blueprint.draft.integrations.map((integration) => (
                      <div key={integration.id}>
                        <p>
                          {(systemMap.get(integration.fromSystemId)?.displayName ?? integration.fromSystemId)}
                          {" -> "}
                          {integration.toType === "asset"
                            ? (assetMap.get(integration.toId)?.displayName ?? integration.toId)
                            : (systemMap.get(integration.toId)?.displayName ?? integration.toId)}
                        </p>
                        <p className="atlas-docs-note">
                          {integration.integrationKind}
                          {integration.triggerKind ? ` · trigger ${integration.triggerKind}` : ""}
                          {integration.notes ? ` · ${integration.notes}` : ""}
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
          </>
        )}

        <datalist id="atlas-builder-records">
          {palette.flatMap((layer) => layer.options).map((option) => (
            <option key={option.id} value={option.id}>{option.label} · {option.kind}</option>
          ))}
        </datalist>

        <section className="atlas-docs-full atlas-docs-stack">
          <div>
            <h3>Layer palette</h3>
            <p className="atlas-docs-note">Use these Atlas records as starting points when composing systems. Type any atlas record id into the selection form to go beyond the suggestions.</p>
          </div>
          <div className="atlas-docs-grid atlas-docs-grid--2">
            {palette.map((layer) => (
              <article key={layer.key} id={`layer-${layer.key}`} className="atlas-docs-panel atlas-docs-stack">
                <div>
                  <h4>{layer.label}</h4>
                  <p className="atlas-docs-note">{layer.options.length} suggested entities from the merged atlas view.</p>
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
      </div>
    </AtlasDocsScaffold>
  );
}
