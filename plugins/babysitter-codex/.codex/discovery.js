'use strict';
const fs = require('fs');
const path = require('path');
const { runJson, supports } = require('./sdk-cli');
const { getLibraryStats, resolveProcessLibraryRoot, resolveReferenceRoot } = require('./process-library');
const { buildIndex, loadIndex, searchIndex } = require('./process-index');
const { resolvePluginRoot } = require('./skill-loader');

/**
 * Run a babysitter CLI sub-command and return parsed JSON output.
 * @param {string[]} subArgs - Arguments to pass after the package name
 * @returns {Object|null} Parsed JSON result or null on error
 */
function runBabysitter(subArgs) {
  const command = subArgs[0];
  if (command && String(command).includes(':') && !supports(command)) return null;
  const result = runJson(subArgs);
  if (!result.ok) return null;
  return result.parsed || null;
}

/**
 * Discover available skills, agents, and processes.
 * @param {Object} options
 * @param {string} [options.pluginRoot] - Plugin root directory
 * @param {string} [options.runsDir] - Runs directory
 * @param {number} [options.cacheTtl] - Cache TTL in seconds
 * @param {boolean} [options.includeRemote] - Include remote sources
 * @param {boolean} [options.summaryOnly] - Summary only
 * @param {string} [options.processPath] - Process file for targeted discovery via @skill/@agent markers
 * @returns {Object|null} Discovery results or null on error
 */
function discoverSkills(options = {}) {
  const repoRoot = options.repoRoot || process.cwd();
  const pluginRoot = resolvePluginRoot({ pluginRoot: options.pluginRoot });
  const processRoot = resolveProcessLibraryRoot(repoRoot);
  const indexPath = path.join(repoRoot, '.a5c', 'index', 'process-library-index.json');
  const cachedIndex = loadIndex(indexPath) || buildIndex(processRoot, indexPath);

  if (!supports('skill:discover')) {
    const stats = getLibraryStats(repoRoot);
    return {
      mode: 'compat-core',
      skills: [],
      agents: [],
      pluginRoot,
      processLibrary: stats,
      processLibraryRoot: stats.processRoot,
      referenceRoot: stats.referenceRoot,
      processIndex: {
        path: indexPath,
        count: cachedIndex.count,
        sample: searchIndex(cachedIndex, options.query || '').slice(0, 20).map((e) => e.path),
      },
      message: 'skill:discover unsupported by this SDK build; using local/manual skill loading only.',
    };
  }

  const args = ['skill:discover', '--json'];
  if (!pluginRoot) {
    return {
      ok: false,
      error: 'MISSING_PLUGIN_ROOT',
      message: 'Could not resolve plugin root for skill:discover.',
      processLibraryRoot: processRoot,
      referenceRoot: resolveReferenceRoot(repoRoot),
      processIndex: {
        path: indexPath,
        count: cachedIndex.count,
      },
    };
  }
  args.push('--plugin-root', pluginRoot);

  if (options.runsDir) {
    args.push('--runs-dir', options.runsDir);
  }

  if (options.cacheTtl !== undefined && options.cacheTtl !== null) {
    args.push('--cache-ttl', String(options.cacheTtl));
  }

  if (options.includeRemote) {
    args.push('--include-remote');
  }

  if (options.summaryOnly) {
    args.push('--summary-only');
  }

  if (options.processPath) {
    args.push('--process-path', options.processPath);
  }

  const result = runBabysitter(args) || { ok: false, error: 'DISCOVERY_FAILED', message: 'skill:discover command failed' };
  result.pluginRoot = pluginRoot;
  result.processLibraryRoot = processRoot;
  result.referenceRoot = resolveReferenceRoot(repoRoot);
  result.processIndex = {
    path: indexPath,
    count: cachedIndex.count,
  };
  return result;
}

/**
 * Fetch skills from remote sources.
 * @param {string} sourceType - 'github' or 'well-known'
 * @param {string} url - Source URL
 * @returns {Object|null} Fetched skills or null on error
 */
function fetchRemoteSkills(sourceType, url) {
  if (!supports('skill:fetch-remote')) {
    return {
      mode: 'compat-core',
      skills: [],
      message: 'skill:fetch-remote unsupported by this SDK build.',
    };
  }

  if (!sourceType || !url) {
    console.error('[discovery] fetchRemoteSkills: sourceType and url are required');
    return null;
  }

  const args = [
    'skill:fetch-remote',
    '--source-type', sourceType,
    '--url', url,
    '--json',
  ];

  return runBabysitter(args);
}

/**
 * Parse @skill and @agent JSDoc markers from a process file.
 * @param {string} filePath - Path to the process JS file
 * @returns {{ skills: Array, agents: Array }} Parsed markers
 */
function parseProcessMarkers(filePath) {
  const result = { skills: [], agents: [] };

  if (!filePath) {
    return result;
  }

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (readErr) {
    return result;
  }

  // Match @skill and @agent JSDoc tags in the form:
  //   @skill name [optional/path]
  //   @agent name [optional/path]
  // These may appear inside block comments (/** ... */) or line comments (//)
  //
  // Patterns to handle:
  //   * @skill mySkillName
  //   * @skill mySkillName ./path/to/skill
  //   // @skill mySkillName
  //   // @agent myAgentName ./agents/myAgent
  const markerRegex = /(?:\/\/|[\*\s]+)\s*@(skill|agent)\s+(\S+)(?:\s+(\S+))?/g;

  let match;
  while ((match = markerRegex.exec(content)) !== null) {
    const kind = match[1];      // 'skill' or 'agent'
    const name = match[2];      // marker name
    const markerPath = match[3] || null; // optional path (may be undefined)

    const entry = { name };
    if (markerPath) {
      // Resolve path relative to the directory containing the process file
      entry.path = path.resolve(path.dirname(filePath), markerPath);
    }

    if (kind === 'skill') {
      result.skills.push(entry);
    } else if (kind === 'agent') {
      result.agents.push(entry);
    }
  }

  return result;
}

module.exports = { discoverSkills, fetchRemoteSkills, parseProcessMarkers };
