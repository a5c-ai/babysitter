import Link from "next/link";
import { redirect } from "next/navigation";
import { AtlasDocsScaffold } from "@/components/AtlasDocsScaffold";
import { auth } from "@/auth";
import { isDatabaseConfigured } from "@/lib/server/db";
import { listUserGraphUploads } from "@/lib/server/user-graphs";

export const dynamic = "force-dynamic";

export default async function WorkspacePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const databaseConfigured = isDatabaseConfigured();
  const uploads = databaseConfigured ? await listUserGraphUploads(session.user.id) : [];

  return (
    <AtlasDocsScaffold
      runningLeft={<><span className="folio">vii</span><span>Workspace</span></>}
      runningTitle={<>Agentic AI Atlas · <em>private workspace</em></>}
      runningRight={<><span>{session.user.email ?? session.user.name ?? "signed in"}</span><span>a5c.ai</span></>}
      tocSearchLabel="Search workspace"
      tocBookLabel="Atlas · workspace"
      tocTitle="Private tools"
      chapters={[
        {
          num: "VII.",
          title: "Workspace",
          pages: "pp. 1 - 1",
          current: true,
          items: [
            { label: "Overview", current: true },
            { label: "User graphs", href: "/workspace/graphs" },
            { label: "Company builder", href: "/workspace/company-builder" },
          ],
        },
      ]}
      chapterMark={{ num: "VII.", subtitle: "Private atlas", context: "Workspace", readingTime: "Authenticated" }}
      articleTitle={<>Private <em>workspace</em></>}
      lead={
        databaseConfigured
          ? "Upload private graph overlays, inspect your authenticated Atlas state, and author company blueprints."
          : "Local mock login is active. Public Atlas browsing still works, and company builder now uses local file-backed storage until PostgreSQL is configured."
      }
      meta={<><span>User graphs · {uploads.length}</span><span>GitHub login</span><span>{databaseConfigured ? "PostgreSQL-backed" : "Builder local fallback"}</span></>}
      marginSections={[
        {
          title: "Routes",
          items: databaseConfigured
            ? [
                <Link key="graphs" href="/workspace/graphs">Manage user graphs</Link>,
                <Link key="builder" href="/workspace/company-builder">Open company builder</Link>,
              ]
            : [
                <p key="graphs-disabled" className="atlas-docs-note">User graphs disabled until `DATABASE_URL` is configured.</p>,
                <Link key="builder" href="/workspace/company-builder">Open company builder</Link>,
              ],
        },
      ]}
    >
      <div className="atlas-docs-body">
        <section className="atlas-docs-panel atlas-docs-full">
          <h3>Authenticated session</h3>
          <p className="atlas-docs-note">Signed in as {session.user.email ?? session.user.name ?? session.user.id}.</p>
        </section>

        <section className="atlas-docs-panel atlas-docs-full">
          <h3>{databaseConfigured ? "User graph overlays" : "Local mock mode"}</h3>
          {!databaseConfigured ? (
            <div className="atlas-docs-stack">
              <p className="atlas-docs-note">
                Mock login is working. User graph uploads are still disabled because `DATABASE_URL` is not configured.
              </p>
              <p className="atlas-docs-note">
                Company builder remains available with local file-backed storage. Set `DATABASE_URL`, run `npm run db:init -w @a5c-ai/atlas-webui`, then restart the web UI to enable PostgreSQL-backed uploads and persistence.
              </p>
            </div>
          ) : uploads.length === 0 ? (
            <p className="atlas-docs-note">No private graph uploads yet.</p>
          ) : (
            <ul className="atlas-docs-ledger">
              {uploads.map((upload) => (
                <li key={upload.id} className="px-3 py-2">
                  <div className="font-medium">{upload.title}</div>
                  <div className="text-xs" style={{ color: "var(--fg-3)" }}>
                    {upload.recordCount} records · {upload.edgeCount} edges · {upload.status}
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
