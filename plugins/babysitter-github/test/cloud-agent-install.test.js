#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const INSTALL_SCRIPT = path.join(PACKAGE_ROOT, 'bin', 'install.js');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function main() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'babysitter-gh-cloud-install-'));
  const workspaceRoot = path.join(tempRoot, 'workspace');
  const globalStateDir = path.join(tempRoot, 'global-state');
  fs.mkdirSync(workspaceRoot, { recursive: true });
  fs.mkdirSync(globalStateDir, { recursive: true });

  const existingAgentsPath = path.join(workspaceRoot, 'AGENTS.md');
  const existingInstructionsPath = path.join(workspaceRoot, '.github', 'copilot-instructions.md');
  const existingWorkflowPath = path.join(workspaceRoot, '.github', 'workflows', 'copilot-setup-steps.yml');

  fs.mkdirSync(path.dirname(existingInstructionsPath), { recursive: true });
  fs.mkdirSync(path.dirname(existingWorkflowPath), { recursive: true });
  fs.writeFileSync(existingAgentsPath, '# Existing AGENTS\n\nKeep this.\n', 'utf8');
  fs.writeFileSync(existingInstructionsPath, '# Existing Instructions\n\nKeep this too.\n', 'utf8');
  fs.writeFileSync(existingWorkflowPath, 'name: Existing Workflow\njobs:\n  existing:\n    runs-on: ubuntu-latest\n', 'utf8');

  const result = spawnSync(process.execPath, [
    INSTALL_SCRIPT,
    '--cloud-agent',
    '--workspace',
    workspaceRoot,
  ], {
    cwd: PACKAGE_ROOT,
    encoding: 'utf8',
    env: {
      ...process.env,
      BABYSITTER_GLOBAL_STATE_DIR: globalStateDir,
    },
  });

  if (result.status !== 0) {
    throw new Error(
      `cloud-agent install failed:\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );
  }

  const pluginBundleRoot = path.join(workspaceRoot, '.github', 'babysitter', 'github-plugin');
  const cloudSkillPath = path.join(workspaceRoot, '.github', 'skills', 'babysitter-babysit', 'SKILL.md');
  const generatedWorkflowPath = path.join(
    workspaceRoot,
    '.github',
    'workflows',
    'copilot-setup-steps.babysitter.generated.yml',
  );

  assert(fs.existsSync(pluginBundleRoot), 'expected mirrored plugin bundle to be installed for cloud agent');
  assert(fs.existsSync(path.join(pluginBundleRoot, 'hooks.json')), 'expected hooks.json in mirrored plugin bundle');
  assert(fs.existsSync(path.join(pluginBundleRoot, 'hooks', 'session-start.sh')), 'expected hook scripts in mirrored plugin bundle');
  assert(fs.existsSync(cloudSkillPath), 'expected babysitter cloud skill to be installed');
  assert(read(cloudSkillPath).includes('name: babysitter-babysit'), 'expected cloud skill frontmatter to be namespaced');

  const agentsContents = read(existingAgentsPath);
  assert(agentsContents.includes('# Existing AGENTS'), 'expected existing AGENTS.md content to be preserved');
  assert(agentsContents.includes('BEGIN BABYSITTER GITHUB CLOUD AGENT'), 'expected managed AGENTS block to be appended');

  const instructionsContents = read(existingInstructionsPath);
  assert(instructionsContents.includes('# Existing Instructions'), 'expected existing copilot instructions to be preserved');
  assert(instructionsContents.includes('Babysitter Copilot Cloud Agent Support'), 'expected managed copilot instructions block to be appended');

  assert(fs.existsSync(generatedWorkflowPath), 'expected generated setup workflow example when repo already has a workflow');
  assert(read(generatedWorkflowPath).includes('copilot-setup-steps:'), 'expected generated workflow to define copilot-setup-steps job');
  assert(read(generatedWorkflowPath).includes('@a5c-ai/babysitter-sdk@'), 'expected generated workflow to install the Babysitter SDK');

  fs.rmSync(tempRoot, { recursive: true, force: true });
  console.log('cloud-agent install test passed');
}

main();
