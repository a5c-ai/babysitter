#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { evaluateActionTrigger } from './action.js';
import { enrichEvent } from './enrich.js';
import { parseQuery } from './query.js';

function take(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  return args[index + 1];
}

function has(args: string[], name: string): boolean {
  return args.includes(name);
}

export async function main(argv = process.argv.slice(2)): Promise<number> {
  const command = argv[0];
  if (!command || has(argv, '--help') || has(argv, '-h')) {
    process.stdout.write([
      'Usage: triggers <evaluate|enrich> [flags]',
      '',
      'Flags:',
      '  --backend <github|gitlab|bitbucket|generic-webhook>',
      '  --event <name>',
      '  --event-path <file>',
      '  --query <query>',
      '  --include-diff',
      '  --token <token>',
      '  --output <file>',
      '',
      'Query examples:',
      '  event:issue_comment text:@develop-this',
      '  path:packages/agent-mux/** diff:@develop-this',
      '  {"event":"pull_request","paths":["src/**"],"expression":"text ~ \'@develop-this\'"}',
    ].join('\n') + '\n');
    return 0;
  }

  const options = {
    backend: take(argv, '--backend'),
    eventName: take(argv, '--event'),
    eventPath: take(argv, '--event-path'),
    query: take(argv, '--query'),
    includeDiff: has(argv, '--include-diff'),
    githubToken: take(argv, '--token') ?? process.env.GITHUB_TOKEN,
  };

  if (command === 'enrich') {
    const event = await enrichEvent({ backend: options.backend as any, eventName: options.eventName, eventPath: options.eventPath, token: options.githubToken, includeDiff: options.includeDiff });
    const output = JSON.stringify(event, null, 2);
    const outputPath = take(argv, '--output');
    if (outputPath) await writeFile(outputPath, `${output}\n`, 'utf8');
    else process.stdout.write(`${output}\n`);
    return 0;
  }

  if (command === 'evaluate') {
    const result = await evaluateActionTrigger(options);
    const output = JSON.stringify({ ...result, query: parseQuery(options.query) }, null, 2);
    const outputPath = take(argv, '--output');
    if (outputPath) await writeFile(outputPath, `${output}\n`, 'utf8');
    else process.stdout.write(`${output}\n`);
    return result.matched ? 0 : 78;
  }

  throw new Error(`Unknown command: ${command}`);
}

const isDirectRun = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  main().then((code) => {
    process.exitCode = code;
  }).catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
