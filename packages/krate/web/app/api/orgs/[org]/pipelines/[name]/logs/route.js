import { createKrateApiController, orgNamespaceName } from '@a5c-ai/krate-sdk';
import { errorResponse } from '../../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { org, name } = await params;
  const controller = createKrateApiController({ namespace: orgNamespaceName(org) });
  try {
    const pipelineResult = await controller.getResourceForOrg(org, 'Pipeline', name);
    const pipeline = pipelineResult?.resource || pipelineResult;
    if (!pipeline) return errorResponse(`Pipeline ${name} not found`, 404);

    const jobsResult = await controller.listResourceForOrg(org, 'Job');
    const jobs = (jobsResult?.items || []).filter((job) => {
      const labels = job.metadata?.labels || {};
      return job.spec?.pipeline === name || labels.pipeline === name;
    });
    const log = formatPipelineLogs(pipeline, jobs);

    if (new URL(request.url).searchParams.get('format') === 'json') {
      return Response.json({ pipeline, jobs, log }, { headers: { 'Cache-Control': 'no-store' } });
    }

    return new Response(log, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = /not found|cross-org denial/i.test(message) ? 404 : 500;
    return errorResponse(message, status);
  }
}

export function formatPipelineLogs(pipeline, jobs = []) {
  const name = pipeline?.metadata?.name || 'unknown-pipeline';
  const phase = pipeline?.status?.phase || 'Unknown';
  const ref = pipeline?.spec?.ref || pipeline?.metadata?.labels?.ref || 'unknown-ref';
  const repository = pipeline?.spec?.repository || pipeline?.metadata?.labels?.repository || 'unknown-repository';
  const startedAt = pipeline?.status?.startedAt || pipeline?.metadata?.creationTimestamp || 'not recorded';
  const finishedAt = pipeline?.status?.finishedAt || null;
  const lines = [
    `Krate pipeline log: ${name}`,
    `Repository: ${repository}`,
    `Ref: ${ref}`,
    `Phase: ${phase}`,
    `Started: ${startedAt}`,
  ];

  if (finishedAt) lines.push(`Finished: ${finishedAt}`);
  lines.push('', 'Jobs:');

  if (!jobs.length) {
    lines.push('  No job records are linked to this pipeline yet.');
  } else {
    for (const job of jobs) {
      const jobName = job.metadata?.name || 'unnamed-job';
      const step = job.spec?.step || job.metadata?.labels?.step || 'step';
      const jobPhase = job.status?.phase || 'Pending';
      const jobStarted = job.status?.startedAt || job.metadata?.creationTimestamp || 'not recorded';
      const jobFinished = job.status?.finishedAt || null;
      lines.push(`  [${jobPhase}] ${jobName} (${step})`);
      lines.push(`    started: ${jobStarted}`);
      if (jobFinished) lines.push(`    finished: ${jobFinished}`);
      if (job.status?.message) lines.push(`    message: ${job.status.message}`);
      if (job.status?.logsUrl) lines.push(`    external logs: ${job.status.logsUrl}`);
    }
  }

  return `${lines.join('\n')}\n`;
}