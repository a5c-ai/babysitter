export interface ProcessChainStep {
  processId: string;
  inputs?: Record<string, string | { fromStep: string; outputKey: string }>;
  condition?: string;
}

export interface ProcessPipeline {
  id: string;
  description?: string;
  steps: ProcessChainStep[];
}

export function buildPipeline(steps: ProcessChainStep[]): ProcessPipeline {
  const seen = new Set<string>();
  for (const step of steps) {
    if (seen.has(step.processId)) {
      throw new Error(`Circular reference: process "${step.processId}" appears more than once in the pipeline`);
    }
    seen.add(step.processId);
  }
  return { id: `pipeline-${Date.now()}`, steps };
}

export function resolvePipelineInputs(
  step: ProcessChainStep,
  previousOutputs: Map<string, Record<string, unknown>>,
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  if (!step.inputs) return resolved;

  for (const [key, value] of Object.entries(step.inputs)) {
    if (typeof value === 'string') {
      resolved[key] = value;
    } else {
      const stepOutputs = previousOutputs.get(value.fromStep);
      resolved[key] = stepOutputs?.[value.outputKey];
    }
  }
  return resolved;
}

export function serializePipeline(pipeline: ProcessPipeline): string {
  return JSON.stringify(pipeline, null, 2);
}

export function deserializePipeline(json: string): ProcessPipeline {
  return JSON.parse(json) as ProcessPipeline;
}
