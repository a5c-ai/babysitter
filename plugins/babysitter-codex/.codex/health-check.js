'use strict';
const { runJson, supports, getSupportedCommands, getCompatibilityReport } = require('./sdk-cli');

/**
 * Run SDK health check.
 * @param {boolean} [verbose=false] - Include verbose output
 * @returns {Object} Health status with overall status and per-check details
 */
function checkHealth(verbose) {
  if (supports('health')) {
    const args = ['health', '--json'];
    if (verbose) args.push('--verbose');
    const result = runJson(args, { timeout: 15000 });
    if (result.ok && result.parsed) return result.parsed;
    return { status: 'unhealthy', error: result.stderr || result.stdout || 'health check failed' };
  }

  // Compatibility mode: old SDKs do not ship `health`.
  const versionRes = runJson(['version'], { timeout: 10000 });
  const compat = getCompatibilityReport();
  return {
    status: compat.mode === 'unsupported' ? 'unhealthy' : 'degraded',
    mode: compat.mode,
    version: versionRes.parsed || String(versionRes.stdout || '').trim() || null,
    availableCommands: Array.from(getSupportedCommands()),
    missingCore: compat.missingCore,
    missingAdvanced: compat.missingAdvanced,
    missing: ['health', ...compat.missingAdvanced.filter((x) => x !== 'health')],
  };
}

/**
 * Show current effective configuration.
 * Runs: babysitter configure show --json
 * @returns {Object} Parsed configuration object, or error descriptor on failure.
 */
function showConfig() {
  if (!supports('configure')) return { unsupported: true, command: 'configure show' };
  const result = runJson(['configure', 'show', '--json'], { timeout: 10000 });
  return result.parsed || { error: result.stderr || result.stdout || 'configure show failed' };
}

/**
 * Validate current configuration.
 * Runs: babysitter configure validate --json
 * @returns {Object} Validation result object with a `valid` boolean and any
 *                   `errors` / `warnings` arrays, or an error descriptor on
 *                   failure.
 */
function validateConfig() {
  if (!supports('configure')) return { unsupported: true, command: 'configure validate', valid: null };
  const result = runJson(['configure', 'validate', '--json'], { timeout: 10000 });
  return result.parsed || { valid: false, error: result.stderr || result.stdout || 'configure validate failed' };
}

/**
 * Show all important paths used by the SDK.
 * Runs: babysitter configure paths --json
 * @returns {Object} Parsed paths object (e.g. configDir, logsDir, runsDir, …),
 *                   or an error descriptor on failure.
 */
function showPaths() {
  if (!supports('configure')) return { unsupported: true, command: 'configure paths' };
  const result = runJson(['configure', 'paths', '--json'], { timeout: 10000 });
  return result.parsed || { error: result.stderr || result.stdout || 'configure paths failed' };
}

/**
 * Run startup health gate — returns true if healthy/degraded, false if unhealthy.
 * @param {boolean} [verbose=false] - Pass --verbose to the health check
 * @returns {boolean} true when the SDK is healthy or degraded, false when unhealthy.
 */
function runStartupHealthGate(verbose) {
  const health = checkHealth(verbose);
  if (health.status === 'unhealthy') {
    console.error('[health-check] SDK is unhealthy:', JSON.stringify(health));
    return false;
  }
  if (health.status === 'degraded') {
    console.warn('[health-check] SDK is degraded:', JSON.stringify(health));
  }
  return true;
}

module.exports = { checkHealth, showConfig, validateConfig, showPaths, runStartupHealthGate };
