import { describe, it, expect } from 'vitest';
import { buildPipeline, resolvePipelineInputs, serializePipeline, deserializePipeline } from '../chaining';

describe('process chaining', () => {
  it('builds a pipeline from steps', () => {
    const pipeline = buildPipeline([
      { processId: 'lint' },
      { processId: 'test' },
      { processId: 'deploy' },
    ]);
    expect(pipeline.steps).toHaveLength(3);
    expect(pipeline.id).toContain('pipeline-');
  });

  it('rejects circular references', () => {
    expect(() => buildPipeline([
      { processId: 'a' },
      { processId: 'b' },
      { processId: 'a' },
    ])).toThrow('Circular reference');
  });

  it('resolves static inputs', () => {
    const result = resolvePipelineInputs(
      { processId: 'test', inputs: { env: 'staging' } },
      new Map(),
    );
    expect(result.env).toBe('staging');
  });

  it('resolves inputs from previous step outputs', () => {
    const outputs = new Map([['lint', { report: 'clean' }]]);
    const result = resolvePipelineInputs(
      { processId: 'test', inputs: { lintResult: { fromStep: 'lint', outputKey: 'report' } } },
      outputs,
    );
    expect(result.lintResult).toBe('clean');
  });

  it('serializes and deserializes', () => {
    const pipeline = buildPipeline([{ processId: 'a' }]);
    const json = serializePipeline(pipeline);
    const restored = deserializePipeline(json);
    expect(restored.steps).toEqual(pipeline.steps);
  });
});
