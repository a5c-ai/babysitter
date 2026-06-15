import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * @process microagent/code-analyzer
 * @description Analyzes code for patterns, anti-patterns, and quality signals
 *   using deterministic scanning followed by agent-based interpretation.
 * @inputs { paths: string[], analysis: string }
 * @outputs { findings: Array<{ file: string, line: number, severity: string, message: string }> }
 */

const scanTask = defineTask('scan', (args) => ({
  kind: 'shell',
  title: `Scan ${args.paths.length} path(s) for ${args.analysis} signals`,
  shell: {
    command: buildScanCommand(args.paths, args.analysis),
  },
}));

const interpretTask = defineTask('interpret', (args) => ({
  kind: 'agent',
  title: `Interpret ${args.analysis} scan results`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Code quality analyst',
      task: `Analyze the scan results and produce structured findings for a "${args.analysis}" analysis`,
      context: {
        analysisType: args.analysis,
        scanOutput: args.scanOutput,
        paths: args.paths,
      },
      instructions: [
        `You received raw scan output from grep/find commands on the following paths: ${args.paths.join(', ')}.`,
        `The analysis type requested is "${args.analysis}".`,
        'Interpret the raw scan output into structured findings.',
        'Each finding must have: file (string), line (number), severity ("info"|"warning"|"error"|"critical"), message (string).',
        'Severity guidelines:',
        '  - critical: security vulnerabilities, data loss risks',
        '  - error: definite bugs, broken logic',
        '  - warning: likely problems, anti-patterns, complexity hotspots',
        '  - info: style issues, improvement suggestions',
        'Return a JSON object: { "findings": [...] }',
      ],
      outputFormat: 'JSON',
    },
  },
}));

export async function process(inputs, ctx) {
  const scanResult = await ctx.task(scanTask, inputs);
  const interpreted = await ctx.task(interpretTask, {
    ...inputs,
    scanOutput: scanResult,
  });
  return { findings: interpreted.findings };
}

/**
 * Build a deterministic scan command based on analysis type.
 * Uses grep/find to collect raw signals the agent then interprets.
 */
function buildScanCommand(paths, analysis) {
  const pathArgs = paths.map((p) => JSON.stringify(p)).join(' ');

  switch (analysis) {
    case 'complexity':
      return `find ${pathArgs} -type f \\( -name "*.ts" -o -name "*.js" -o -name "*.py" \\) -exec grep -nE "(if|else|for|while|switch|catch|\\?|&&|\\|\\|)" {} +`;
    case 'dead-code':
      return `find ${pathArgs} -type f \\( -name "*.ts" -o -name "*.js" \\) -exec grep -nE "^\\s*(export\\s+)?(function|const|class|interface|type)\\s+\\w+" {} +`;
    case 'security':
      return `find ${pathArgs} -type f \\( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.env*" \\) -exec grep -nEi "(password|secret|token|api.?key|credential|private.?key|eval\\(|exec\\(|innerHTML|dangerouslySetInnerHTML)" {} +`;
    default:
      return `find ${pathArgs} -type f \\( -name "*.ts" -o -name "*.js" -o -name "*.py" \\) -exec grep -nc "." {} +`;
  }
}
