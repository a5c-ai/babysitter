import { WorkspaceProvisioningPage } from "@/components/workspaces/workspace-provisioning-page";

export default async function IssueWorkspaceCreatePage({
  params,
}: {
  params: Promise<{ projectId: string; issueId: string }>;
}) {
  const { projectId, issueId } = await params;

  return <WorkspaceProvisioningPage mode="issue" projectId={projectId} issueId={issueId} />;
}
