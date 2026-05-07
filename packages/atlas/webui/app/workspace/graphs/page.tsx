import { redirect } from "next/navigation";
import { AtlasDocsScaffold } from "@/components/AtlasDocsScaffold";
import { auth } from "@/auth";
import { listUserGraphUploads } from "@/lib/server/user-graphs";
import { uploadUserGraphAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function WorkspaceGraphsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const uploads = await listUserGraphUploads(session.user.id);

  return (
    <AtlasDocsScaffold
      runningLeft={<><span className="folio">vii</span><span>Workspace</span></>}
      runningTitle={<>Agentic AI Atlas · <em>user graphs</em></>}
      runningRight={<><span>{uploads.length} uploads</span><span>a5c.ai</span></>}
      tocSearchLabel="Search private graphs"
      tocBookLabel="Atlas · user graphs"
      tocTitle="Uploads"
      chapters={[{ num: "VII.", title: "User graphs", pages: "pp. 1 - 1", current: true, items: [{ label: "Uploads", current: true }] }]}
      chapterMark={{ num: "VII.", subtitle: "Private overlays", context: "User graphs", readingTime: "Authenticated" }}
      articleTitle={<>User graph <em>uploads</em></>}
      lead="Private YAML uploads are parsed into overlay indexes and merged with the public atlas for authenticated exploration."
      meta={<><span>Uploads · {uploads.length}</span><span>POST /api/private/graphs</span></>}
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
                    {upload.recordCount} records · {upload.edgeCount} edges · {upload.sourceFilename}
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
