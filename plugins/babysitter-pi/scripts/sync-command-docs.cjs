'use strict';

const path = require('path');
const {
  listMarkdownBasenames,
  reportCheckResult,
  syncCommandMirrors,
  syncSkillsFromCommands,
  writeFileIfChanged,
} = require('../../../scripts/plugin-command-sync-lib.cjs');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PACKAGE_ROOT, '..', '..');
const ROOT_COMMANDS = path.join(REPO_ROOT, 'plugins', 'babysitter', 'commands');
const COMMANDS_ROOT = path.join(PACKAGE_ROOT, 'commands');
const SKILLS_ROOT = path.join(PACKAGE_ROOT, 'skills');
const LABEL = 'babysitter-pi sync';

const BABYSIT_SKILL = `---
name: babysit
description: Orchestrate via @babysitter. Use this skill when asked to babysit a run, orchestrate a process or whenever it is called explicitly. (babysit, babysitter, orchestrate, orchestrate a run, workflow, etc.)
---

# babysit

Orchestrate \`.a5c/runs/<runId>/\` through iterative execution.

## Dependencies

### Babysitter SDK and CLI

Read the SDK version from \`versions.json\` to ensure version compatibility:

\`\`\`bash
PLUGIN_ROOT="\${PI_PLUGIN_ROOT:-\$(pwd)}"
SDK_VERSION=$(node -e "try{const fs=require('fs');const path=require('path');const pluginRoot=process.env.PI_PLUGIN_ROOT||process.env.PLUGIN_ROOT||process.cwd();const probes=[path.join(pluginRoot,'versions.json'),path.join(pluginRoot,'plugins','babysitter-pi','versions.json'),path.join(pluginRoot,'node_modules','@a5c-ai','babysitter-pi','versions.json'),path.join(process.cwd(),'node_modules','@a5c-ai','babysitter-pi','versions.json')];for(const probe of probes){if(fs.existsSync(probe)){console.log(JSON.parse(fs.readFileSync(probe,'utf8')).sdkVersion||'latest');process.exit(0)}}console.log('latest')}catch{console.log('latest')}")
CLI="npx -y @a5c-ai/babysitter-sdk@$SDK_VERSION"
\`\`\`

## Instructions

Run the following command to get full orchestration instructions:

\`\`\`bash
babysitter instructions:babysit-skill --harness pi --interactive
\`\`\`

For non-interactive mode:

\`\`\`bash
babysitter instructions:babysit-skill --harness pi --no-interactive
\`\`\`

Follow the instructions returned by the command above to orchestrate the run.
`;

function getCommandNames() {
  return listMarkdownBasenames(ROOT_COMMANDS);
}

function main() {
  const check = process.argv.includes('--check');
  const commandNames = getCommandNames();
  const mirrorResult = syncCommandMirrors({
    label: LABEL,
    sourceRoot: ROOT_COMMANDS,
    targetRoot: COMMANDS_ROOT,
    names: commandNames,
    check,
    cwd: PACKAGE_ROOT,
  });
  const skillsResult = syncSkillsFromCommands({
    label: LABEL,
    sourceRoot: COMMANDS_ROOT,
    skillsRoot: SKILLS_ROOT,
    names: commandNames,
    check,
    cwd: PACKAGE_ROOT,
  });

  const babysitSkillPath = path.join(SKILLS_ROOT, 'babysit', 'SKILL.md');
  if (check) {
    const fs = require('fs');
    const stale = [...mirrorResult.stale, ...skillsResult.stale];
    const current = fs.existsSync(babysitSkillPath)
      ? fs.readFileSync(babysitSkillPath, 'utf8')
      : null;
    if (current !== BABYSIT_SKILL) {
      stale.push(path.relative(PACKAGE_ROOT, babysitSkillPath));
    }
    reportCheckResult(LABEL, stale);
    return;
  }

  const babysitUpdated = writeFileIfChanged(babysitSkillPath, BABYSIT_SKILL) ? 1 : 0;
  const updated = mirrorResult.updated + skillsResult.updated + babysitUpdated;

  if (updated === 0) {
    console.log(`[${LABEL}] no Pi command or skill changes were needed.`);
    return;
  }

  console.log(`[${LABEL}] updated ${updated} Pi command/skill file(s).`);
}

main();
