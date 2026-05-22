import { redirect } from "next/navigation";
import { AtlasDocsScaffold } from "@/components/AtlasDocsScaffold";
import { auth, isDevelopmentMockLoginEnabled } from "@/auth";
import { isDatabaseConfigured } from "@/lib/server/db";
import { listUserGraphUploads } from "@/lib/server/user-graphs";
import { deleteUserGraphAction, rebuildUserGraphAction, uploadUserGraphAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function WorkspaceGraphsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(
      isDevelopmentMockLoginEnabled()
        ? "/api/auth/github?callbackUrl=%2Fworkspace%2Fgraphs"
        : "/",
    );
  }

  const databaseConfigured = isDatabaseConfigured();
  const uploads = await listUserGraphUploads(session.user.id);

  return (
    <AtlasDocsScaffold
      runningLeft={<><span className="folio">vii</span><span>Workspace</span></>}
      runningTitle={<>Agentic AI Atlas · <em>user graphs</em></>}
      runningRight={<><span>{databaseConfigured ? `${uploads.length} uploads` : "local development"}</span><span>a5c.ai</span></>}
      tocSearchLabel="Search private graphs"
      tocBookLabel="Atlas · user graphs"
      tocTitle="Uploads"
      chapters={[{ num: "VII.", title: "User graphs", pages: "pp. 1 - 1", current: true, items: [{ label: "Uploads", current: true }] }]}
      chapterMark={{ num: "VII.", subtitle: "Private overlays", context: "User graphs", readingTime: "Authenticated" }}
      articleTitle={<>User graph <em>uploads</em></>}
      lead={
        databaseConfigured
          ? "Private YAML uploads are parsed into overlay indexes and merged with the public atlas for authenticated exploration."
          : "Private YAML uploads use local SQLite only for ad-hoc local runs; deployed Atlas environments use CI-provisioned PostgreSQL."
      }
      meta={<><span>Uploads · {uploads.length}</span><span>{databaseConfigured ? "POST /api/private/graphs" : "SQLite-backed local dev"}</span></>}
      marginSections={[
        {
          title: "Workspace",
          items: [
            <a key="home" href="/workspace">Workspace overview</a>,
            <a key="builder" href="/workspace/company-builder">Company builder</a>,
          ],
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

        <section className="atlas-docs-panel atlas-docs-full">
          <form action={uploadUserGraphAction} encType="multipart/form-data" className="atlas-docs-stack">
            <label className="atlas-docs-note" htmlFor="graph-title">Title</label>
            <input id="graph-title" name="title" className="atlas-searchbar__input" placeholder="My private atlas overlay" />
            <label className="atlas-docs-note" htmlFor="graph-description">Description</label>
            <textarea id="graph-description" name="description" className="atlas-searchbar__input" rows={4} placeholder="What this overlay adds" />
            <label className="atlas-docs-note" htmlFor="graph-file">YAML file</label>
            <input id="graph-file" name="file" type="file" accept=".yaml,.yml,text/yaml,text/x-yaml" />
            <button type="submit" className="atlas-header__button">Upload graph</button>
          </form>
        </section>

        <section className="atlas-docs-panel atlas-docs-full">
          <h3>Current uploads</h3>
          {uploads.length === 0 ? (
            <p className="atlas-docs-note">No uploads yet.</p>
          ) : (
            <ul className="atlas-docs-ledger">
              {uploads.map((upload) => (
                <li key={upload.id} className="px-3 py-2">
                  <div className="font-medium">{upload.title}</div>
                  <div className="text-xs" style={{ color: "var(--fg-3)" }}>
                    {upload.recordCount} records · {upload.edgeCount} edges · {upload.sourceFilename} · {upload.status}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <form action={rebuildUserGraphAction}>
                      <input type="hidden" name="uploadId" value={upload.id} />
                      <button type="submit" className="atlas-header__button">Rebuild</button>
                    </form>
                    <form action={deleteUserGraphAction}>
                      <input type="hidden" name="uploadId" value={upload.id} />
                      <button type="submit" className="atlas-header__button">Delete</button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AtlasDocsScaffold>
  );
}
