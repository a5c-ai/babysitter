#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

export function parseArgs(argv = process.argv.slice(2)) {
  const options = { apply: false, json: false, profile: 'krate', namespace: 'krate-system', release: 'krate', driver: 'docker', chart: '../charts' };
  for (const arg of argv) {
    if (arg === '--apply') options.apply = true;
    else if (arg === '--dry-run') options.apply = false;
    else if (arg === '--json') options.json = true;
    else if (arg.startsWith('--profile=')) options.profile = arg.slice('--profile='.length);
    else if (arg.startsWith('--namespace=')) options.namespace = arg.slice('--namespace='.length);
    else if (arg.startsWith('--release=')) options.release = arg.slice('--release='.length);
    else if (arg.startsWith('--driver=')) options.driver = arg.slice('--driver='.length);
    else if (arg.startsWith('--chart=')) options.chart = arg.slice('--chart='.length);
    else throw new Error(`Unknown option: ${arg}`);
  }
  return options;
}

export function buildMinikubePlan(options = parseArgs([])) {
  const { profile, namespace, release, driver, chart } = options;
  return {
    mode: options.apply ? 'apply' : 'dry-run',
    requiredTools: ['minikube', 'kubectl', 'helm', 'node', 'npm'],
    commands: [
      ['minikube', ['start', '-p', profile, '--driver', driver]],
      ['minikube', ['addons', 'enable', 'ingress', '-p', profile]],
      ['minikube', ['addons', 'enable', 'metrics-server', '-p', profile]],
      ['kubectl', ['config', 'use-context', profile]],
      ['kubectl', ['create', 'namespace', namespace, '--dry-run=client', '-o', 'yaml']],
      ['helm', ['lint', chart]],
      ['helm', ['upgrade', '--install', release, chart, '--namespace', namespace, '--create-namespace', '--set', 'demo.enabled=true']],
      ['kubectl', ['apply', '-n', namespace, '-f', 'examples/minikube-demo.yaml']],
      ['kubectl', ['wait', '--for=condition=Available', `deployment/${release}-krate-api`, '-n', namespace, '--timeout=120s']],
      ['node', ['scripts/smoke.mjs']]
    ]
  };
}

function commandToString([command, args]) {
  return [command, ...args].join(' ');
}

function runCommand(command) {
  const [bin, args] = command;
  const result = spawnSync(bin, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) throw new Error(`Command failed: ${commandToString(command)}`);
}

const isMain = process.argv[1]?.replace(/\\/g, '/').endsWith('/scripts/setup-minikube.mjs');
if (isMain) {
  try {
    const options = parseArgs();
    const plan = buildMinikubePlan(options);
    if (options.json) console.log(JSON.stringify({ ...plan, commands: plan.commands.map(commandToString) }, null, 2));
    else {
      console.log(`Krate minikube setup (${plan.mode})`);
      for (const command of plan.commands) console.log(`- ${commandToString(command)}`);
    }
    if (options.apply) for (const command of plan.commands) runCommand(command);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
