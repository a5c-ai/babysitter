#!/usr/bin/env node
/**
 * Release version CLI (FIX-001).
 *
 * GitHub workflow YAML cannot be executed or tested locally, so every piece of
 * release version reasoning lives here — in a script with fixture tests
 * (scripts/__tests__/release-version.test.mjs) — and the workflows are thin
 * wiring around it. See scripts/lib/release-version.cjs for the contract and
 * docs/release-incident-2026-08-13.md for the incident this prevents.
 *
 * Subcommands:
 *   resolve  --branch <b> --sha <short-sha> [--root-version <v>]
 *            [--github-output] [--write <file>] [--print <field>]
 *       Produce THE release identity for this branch/commit exactly once.
 *
 *   verify   --branch <b> --sha <short-sha> --version <v> [--root-version <v>]
 *       Validate an explicitly passed release version against the resolver
 *       instead of re-reading (possibly divergent) manifests.
 *
 *   from-tag --tag <babysitter/<branch>/v<version>> [--github-output] [--print <field>]
 *       Derive the exact version/dist-tag a tag-triggered run may act on.
 *
 *   verify-manifests --version <v>
 *       Fail unless every synchronized manifest — versions AND internal
 *       dependency pins — is exactly <v>.
 *
 *   tag-message --version <v> --branch <b> [--commit <sha>] [--source <s>] [--run-url <u>]
 *       Emit the annotated-tag body carrying release provenance.
 *
 *   ensure-tag --version <v> --branch <b> [--commit <sha>] [--source <s>] [--run-url <u>]
 *       Idempotently create the annotated release tag locally. Never pushes,
 *       never moves an existing release tag.
 *
 *   tag-source --tag <t> [--print <field>]
 *       Report who created a release tag, so a tag created by the publish
 *       workflow cannot trigger a second conflicting publication.
 *
 *   assert-channel-tags --version <v> --dist-tag <t> [--mode final|preflight] [--npm <bin>]
 *       Assert channel state over the FULL publishable inventory.
 *
 * Registry access is limited to read-only `npm view` in assert-channel-tags.
 * This CLI never publishes, unpublishes, or mutates a dist-tag.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const {
  RELEASE_PLAN_FILENAME,
  TAG_SOURCE_MANUAL,
  TAG_SOURCE_PUBLISH_WORKFLOW,
  assertChannelTags,
  collectVersionDivergences,
  ensureReleaseTag,
  formatTagMessage,
  parseReleaseTag,
  parseTagMessage,
  readTagMessage,
  resolveReleaseVersion,
  writeReleasePlan,
} = require('./lib/release-version.cjs');

const repoRoot = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const options = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const eq = arg.indexOf('=');
      if (eq !== -1) {
        options[arg.slice(2, eq)] = arg.slice(eq + 1);
        continue;
      }
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        options[arg.slice(2)] = true;
      } else {
        options[arg.slice(2)] = next;
        i += 1;
      }
    } else {
      options._.push(arg);
    }
  }
  return options;
}

function required(options, name) {
  const value = options[name];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`--${name} is required`);
  }
  return value;
}

function rootVersion(options) {
  if (typeof options['root-version'] === 'string') return options['root-version'];
  return JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8')).version;
}

function emit(payload, options) {
  if (typeof options.print === 'string') {
    if (!(options.print in payload)) {
      throw new Error(`Unknown field ${JSON.stringify(options.print)}; available: ${Object.keys(payload).join(', ')}`);
    }
    process.stdout.write(`${payload[options.print]}\n`);
    return;
  }
  if (options['github-output']) {
    const outputPath = process.env.GITHUB_OUTPUT;
    if (!outputPath) throw new Error('--github-output requires the GITHUB_OUTPUT environment variable');
    const lines = Object.entries(payload)
      .map(([key, value]) => `${key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)}=${value}`)
      .join('\n');
    fs.appendFileSync(outputPath, `${lines}\n`);
  }
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

const COMMANDS = {
  resolve(options) {
    const plan = resolveReleaseVersion({
      branch: required(options, 'branch'),
      rootVersion: rootVersion(options),
      shortSha: required(options, 'sha'),
    });
    if (typeof options.commit === 'string') plan.commit = options.commit;
    if (typeof options.write === 'string') {
      writeReleasePlan(path.resolve(repoRoot, options.write), plan);
    }
    emit(plan, options);
  },

  verify(options) {
    const claimed = required(options, 'version');
    const plan = resolveReleaseVersion({
      branch: required(options, 'branch'),
      rootVersion: rootVersion(options),
      shortSha: required(options, 'sha'),
    });
    if (plan.releaseVersion !== claimed) {
      throw new Error(
        `Release version mismatch: caller passed ${claimed}, but branch ${plan.branch} at ${plan.shortSha} ` +
          `resolves to ${plan.releaseVersion}. One version must flow through publication, tagging and promotion; ` +
          'do not re-derive it downstream.',
      );
    }
    emit(plan, options);
  },

  'from-tag': (options) => {
    const parsed = parseReleaseTag(required(options, 'tag'));
    if (typeof options.write === 'string') {
      // A recovery run turns the tag into the same release plan the branch
      // release workflow produces, so every helper it invokes reads one
      // immutable version and channel.
      writeReleasePlan(path.resolve(repoRoot, options.write), parsed);
    }
    emit(parsed, options);
  },

  'verify-manifests': (options) => {
    const releaseVersion = required(options, 'version');
    const divergences = collectVersionDivergences({ repoRoot, releaseVersion });
    if (divergences.length) {
      throw new Error(
        `${divergences.length} manifest value(s) diverge from release version ${releaseVersion}. ` +
          'Publishing from this workspace would publish or promote a different version ' +
          '(docs/release-incident-2026-08-13.md). Run ' +
          `\`node scripts/sync-workspace-versions.mjs --version ${releaseVersion}\` first:\n` +
          divergences
            .slice(0, 40)
            .map((d) => `  - ${d.manifestPath} ${d.field} ${d.subject}: ${d.actual} (expected ${d.expected})`)
            .join('\n') +
          (divergences.length > 40 ? `\n  ... and ${divergences.length - 40} more` : ''),
      );
    }
    process.stdout.write(`All synchronized manifests are at release version ${releaseVersion}.\n`);
  },

  'tag-message': (options) => {
    process.stdout.write(
      formatTagMessage({
        releaseVersion: required(options, 'version'),
        branch: required(options, 'branch'),
        commit: typeof options.commit === 'string' ? options.commit : undefined,
        source: typeof options.source === 'string' ? options.source : TAG_SOURCE_PUBLISH_WORKFLOW,
        runUrl: typeof options['run-url'] === 'string' ? options['run-url'] : undefined,
      }),
    );
  },

  'ensure-tag': (options) => {
    const result = ensureReleaseTag({
      repoRoot,
      releaseVersion: required(options, 'version'),
      branch: required(options, 'branch'),
      commit: typeof options.commit === 'string' ? options.commit : undefined,
      source: typeof options.source === 'string' ? options.source : TAG_SOURCE_PUBLISH_WORKFLOW,
      runUrl: typeof options['run-url'] === 'string' ? options['run-url'] : undefined,
    });
    emit({ releaseTag: result.tag, created: String(result.created), commit: result.commit }, options);
  },

  'tag-source': (options) => {
    const tag = required(options, 'tag');
    const parsedTag = parseReleaseTag(tag);
    const metadata = parseTagMessage(readTagMessage(repoRoot, tag));
    if (metadata.version && metadata.version !== parsedTag.releaseVersion) {
      throw new Error(
        `Release tag ${tag} names version ${parsedTag.releaseVersion} but its tag object records ` +
          `${metadata.version}. Refusing to act on an ambiguous tag.`,
      );
    }
    emit(
      {
        releaseTag: parsedTag.releaseTag,
        branch: parsedTag.branch,
        releaseVersion: parsedTag.releaseVersion,
        distTag: parsedTag.distTag,
        source: metadata.source || TAG_SOURCE_MANUAL,
        publishedByReleaseWorkflow: metadata.source === TAG_SOURCE_PUBLISH_WORKFLOW ? 'true' : 'false',
      },
      options,
    );
  },

  'assert-channel-tags': (options) => {
    const report = assertChannelTags({
      repoRoot,
      releaseVersion: required(options, 'version'),
      distTag: required(options, 'dist-tag'),
      mode: typeof options.mode === 'string' ? options.mode : 'final',
      npmBin: typeof options.npm === 'string' ? options.npm : 'npm',
    });
    if (report.problems.length) {
      throw new Error(
        `${report.problems.length} of ${report.checked} public package(s) fail the ${report.mode} ` +
          `channel-tag assertion for ${report.distTag}=${report.releaseVersion}:\n` +
          report.problems
            .map((problem) => `  - ${problem.package}: ${problem.reason} (found ${problem.actual ?? 'nothing'})`)
            .join('\n'),
      );
    }
    process.stdout.write(
      `${report.checked} public package(s) satisfy the ${report.mode} channel-tag assertion ` +
        `${report.distTag}=${report.releaseVersion}.\n`,
    );
  },
};

function main() {
  const [command, ...rest] = process.argv.slice(2);
  if (!command || command === '--help' || command === '-h') {
    process.stdout.write(
      `Usage: node scripts/release-version.cjs <${Object.keys(COMMANDS).join('|')}> [options]\n` +
        'See the header comment of scripts/release-version.cjs for the full contract.\n' +
        `Release plan file: ${RELEASE_PLAN_FILENAME}\n`,
    );
    return;
  }
  const handler = COMMANDS[command];
  if (!handler) {
    throw new Error(`Unknown subcommand ${JSON.stringify(command)}; known: ${Object.keys(COMMANDS).join(', ')}`);
  }
  handler(parseArgs(rest));
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
