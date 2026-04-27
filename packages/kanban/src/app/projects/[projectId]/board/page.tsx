import { BacklogOverview } from "@/components/dashboard/backlog-overview";
import { PageShell } from "@/components/shared/page-shell";

export default async function ProjectBoardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <PageShell className="gap-0">
      <BacklogOverview
        projectId={projectId}
        routeBasePath={`/projects/${projectId}`}
        forcedPresentation="board"
      />
    </PageShell>
  );
}
