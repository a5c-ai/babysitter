import { WorkspaceProvisioningPage } from "@/components/workspaces/workspace-provisioning-page";

export default async function ProjectWorkspaceCreatePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return <WorkspaceProvisioningPage mode="project" projectId={projectId} />;
}
