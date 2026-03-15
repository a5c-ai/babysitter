import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Generate a ULID-like ID for testing purposes
 */
function generateTestUlid(seed: number): string {
  const base = '01TEST00000000000000';
  return base + seed.toString().padStart(6, '0');
}

/**
 * Create a large fixture with multiple runs for performance testing
 */
export function createLargeFixture(
  baseDir: string,
  runCount: number,
  eventsPerRun: number,
  tasksPerRun: number,
): string {
  const fixtureDir = fs.mkdtempSync(path.join(baseDir, 'perf-fixture-'));
  const runsDir = path.join(fixtureDir, '.a5c', 'runs');
  fs.mkdirSync(runsDir, { recursive: true });

  for (let runIdx = 0; runIdx < runCount; runIdx++) {
    const runId = `perf-run-${runIdx.toString().padStart(6, '0')}`;
    const runDir = path.join(runsDir, runId);
    const journalDir = path.join(runDir, 'journal');
    const tasksDir = path.join(runDir, 'tasks');

    fs.mkdirSync(journalDir, { recursive: true });
    fs.mkdirSync(tasksDir, { recursive: true });

    // Write run.json
    const runMeta = {
      runId,
      processId: `perf-process-${runIdx}`,
      entrypoint: 'test-process',
      layoutVersion: '2026.01',
      createdAt: new Date(Date.now() - 3600000 + runIdx * 1000).toISOString(),
      prompt: `Performance test run ${runIdx}`,
    };
    fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify(runMeta, null, 2));

    // Write inputs.json
    fs.writeFileSync(
      path.join(runDir, 'inputs.json'),
      JSON.stringify({ prompt: `Performance test run ${runIdx}` }, null, 2),
    );

    // Generate journal events
    let eventSeq = 1;
    const baseTime = new Date(Date.now() - 3600000 + runIdx * 1000);

    // RUN_CREATED event
    const runCreatedEvent = {
      type: 'RUN_CREATED',
      recordedAt: new Date(baseTime.getTime()).toISOString(),
      data: { runId, processId: runMeta.processId },
      checksum: `checksum-${eventSeq}`,
    };
    fs.writeFileSync(
      path.join(journalDir, `${eventSeq.toString().padStart(6, '0')}.${generateTestUlid(eventSeq)}.json`),
      JSON.stringify(runCreatedEvent, null, 2),
    );
    eventSeq++;

    // Generate EFFECT_REQUESTED and EFFECT_RESOLVED pairs for tasks
    const effectIds: string[] = [];
    for (let taskIdx = 0; taskIdx < tasksPerRun; taskIdx++) {
      const effectId = `effect-${runIdx}-${taskIdx}`;
      effectIds.push(effectId);

      // EFFECT_REQUESTED
      const requestedEvent = {
        type: 'EFFECT_REQUESTED',
        recordedAt: new Date(baseTime.getTime() + eventSeq * 1000).toISOString(),
        data: {
          effectId,
          kind: taskIdx % 3 === 0 ? 'breakpoint' : 'node',
          taskId: `task-${taskIdx}`,
          title: `Task ${taskIdx}`,
          label: `label-${taskIdx}`,
          invocationKey: `invkey-${effectId}`,
          stepId: `S${(eventSeq - 1).toString().padStart(6, '0')}`,
          question: taskIdx % 3 === 0 ? `Approve task ${taskIdx}?` : undefined,
        },
        checksum: `checksum-${eventSeq}`,
      };
      fs.writeFileSync(
        path.join(journalDir, `${eventSeq.toString().padStart(6, '0')}.${generateTestUlid(eventSeq)}.json`),
        JSON.stringify(requestedEvent, null, 2),
      );
      eventSeq++;

      // EFFECT_RESOLVED (most tasks succeed)
      if (taskIdx % 5 !== 0) {
        const resolvedEvent = {
          type: 'EFFECT_RESOLVED',
          recordedAt: new Date(baseTime.getTime() + eventSeq * 1000).toISOString(),
          data: {
            effectId,
            result: { output: `Result for task ${taskIdx}` },
            error: taskIdx % 7 === 0 ? `Error in task ${taskIdx}` : null,
          },
          checksum: `checksum-${eventSeq}`,
        };
        fs.writeFileSync(
          path.join(journalDir, `${eventSeq.toString().padStart(6, '0')}.${generateTestUlid(eventSeq)}.json`),
          JSON.stringify(resolvedEvent, null, 2),
        );
        eventSeq++;
      }

      // Create task directory with task.json and result.json
      const taskDir = path.join(tasksDir, effectId);
      fs.mkdirSync(taskDir, { recursive: true });

      const taskDef = {
        effectId,
        kind: taskIdx % 3 === 0 ? 'breakpoint' : 'node',
        taskId: `task-${taskIdx}`,
        title: `Task ${taskIdx}`,
        label: `label-${taskIdx}`,
        invocationKey: `invkey-${effectId}`,
        input: { command: `echo "task ${taskIdx}"` },
        question: taskIdx % 3 === 0 ? `Approve task ${taskIdx}?` : undefined,
      };
      fs.writeFileSync(path.join(taskDir, 'task.json'), JSON.stringify(taskDef, null, 2));

      if (taskIdx % 5 !== 0) {
        const result = {
          output: `Result for task ${taskIdx}`,
          error: taskIdx % 7 === 0 ? `Error in task ${taskIdx}` : null,
          resolvedAt: new Date(baseTime.getTime() + eventSeq * 1000).toISOString(),
        };
        fs.writeFileSync(path.join(taskDir, 'result.json'), JSON.stringify(result, null, 2));
        fs.writeFileSync(path.join(taskDir, 'stdout.txt'), `stdout for task ${taskIdx}\n`);
        fs.writeFileSync(path.join(taskDir, 'stderr.txt'), `stderr for task ${taskIdx}\n`);
      }
    }

    // Fill remaining events with misc journal activity
    const remainingEvents = eventsPerRun - eventSeq + 1;
    for (let i = 0; i < remainingEvents; i++) {
      const miscEvent = {
        type: 'EFFECT_REQUESTED',
        recordedAt: new Date(baseTime.getTime() + eventSeq * 1000).toISOString(),
        data: {
          effectId: `misc-effect-${eventSeq}`,
          kind: 'node',
          taskId: `misc-task-${eventSeq}`,
          title: `Misc task ${eventSeq}`,
        },
        checksum: `checksum-${eventSeq}`,
      };
      fs.writeFileSync(
        path.join(journalDir, `${eventSeq.toString().padStart(6, '0')}.${generateTestUlid(eventSeq)}.json`),
        JSON.stringify(miscEvent, null, 2),
      );
      eventSeq++;
    }

    // Add terminal event (alternate between completed and failed)
    const terminalEvent = {
      type: runIdx % 2 === 0 ? 'RUN_COMPLETED' : 'RUN_FAILED',
      recordedAt: new Date(baseTime.getTime() + eventSeq * 1000).toISOString(),
      data:
        runIdx % 2 === 0
          ? { runId }
          : {
              runId,
              error: 'Process failed',
              message: 'Test failure',
            },
      checksum: `checksum-${eventSeq}`,
    };
    fs.writeFileSync(
      path.join(journalDir, `${eventSeq.toString().padStart(6, '0')}.${generateTestUlid(eventSeq)}.json`),
      JSON.stringify(terminalEvent, null, 2),
    );
  }

  return fixtureDir;
}

/**
 * Clean up a fixture directory
 */
export function cleanupFixture(baseDir: string): void {
  if (fs.existsSync(baseDir)) {
    fs.rmSync(baseDir, { recursive: true, force: true });
  }
}
