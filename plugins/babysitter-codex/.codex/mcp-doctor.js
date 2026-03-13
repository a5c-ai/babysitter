'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function checkPath(value) {
  if (!value) return { ok: false, reason: 'missing' };
  return { ok: fs.existsSync(value), reason: fs.existsSync(value) ? 'ok' : 'not_found' };
}

function runMcpDoctor(repoRoot) {
  const root = repoRoot || process.cwd();
  const checks = [];
  const codexConfigPath = path.join(root, '.codex', 'config.toml');

  checks.push({
    name: 'mcp_config_file',
    ...checkPath(codexConfigPath),
  });

  checks.push({
    name: 'oauth_env_present',
    ok: Boolean(process.env.MCP_OAUTH_CLIENT_ID || process.env.BABYSITTER_MCP_OAUTH_CLIENT_ID),
    reason: process.env.MCP_OAUTH_CLIENT_ID || process.env.BABYSITTER_MCP_OAUTH_CLIENT_ID ? 'ok' : 'missing',
  });

  checks.push({
    name: 'transport_env_present',
    ok: Boolean(process.env.MCP_TRANSPORT || process.env.BABYSITTER_MCP_TRANSPORT),
    reason: process.env.MCP_TRANSPORT || process.env.BABYSITTER_MCP_TRANSPORT ? 'ok' : 'missing',
  });

  checks.push({
    name: 'mcp_server_command_available',
    ...(() => {
      const cmd = process.env.MCP_SERVER_COMMAND || process.env.BABYSITTER_MCP_SERVER_COMMAND;
      if (!cmd) return { ok: false, reason: 'missing' };
      const probe = spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd], { encoding: 'utf8' });
      return { ok: probe.status === 0, reason: probe.status === 0 ? 'ok' : 'not_in_path' };
    })(),
  });

  checks.push({
    name: 'mcp_auth_token_present',
    ok: Boolean(process.env.MCP_AUTH_TOKEN || process.env.BABYSITTER_MCP_AUTH_TOKEN),
    reason: process.env.MCP_AUTH_TOKEN || process.env.BABYSITTER_MCP_AUTH_TOKEN ? 'ok' : 'missing',
  });

  checks.push({
    name: 'codex_config_mentions_mcp',
    ...(() => {
      if (!fs.existsSync(codexConfigPath)) return { ok: false, reason: 'config_missing' };
      const text = fs.readFileSync(codexConfigPath, 'utf8');
      const has = text.includes('mcp') || text.includes('MCP');
      return { ok: has, reason: has ? 'ok' : 'not_referenced' };
    })(),
  });

  const failed = checks.filter((c) => !c.ok);
  return {
    ok: failed.length === 0,
    checks,
    failedCount: failed.length,
    recommendations: failed.map((f) => recommendationFor(f.name)),
  };
}

function recommendationFor(name) {
  const map = {
    mcp_config_file: 'Create .codex/config.toml with MCP transport settings.',
    oauth_env_present: 'Set MCP_OAUTH_CLIENT_ID or BABYSITTER_MCP_OAUTH_CLIENT_ID.',
    transport_env_present: 'Set MCP_TRANSPORT or BABYSITTER_MCP_TRANSPORT (stdio/http).',
    mcp_server_command_available: 'Install MCP server binary and ensure it is on PATH.',
    mcp_auth_token_present: 'Set MCP_AUTH_TOKEN or BABYSITTER_MCP_AUTH_TOKEN for authenticated servers.',
    codex_config_mentions_mcp: 'Update .codex/config.toml to include MCP-related settings.',
  };
  return map[name] || 'Inspect MCP settings and environment variables.';
}

module.exports = {
  runMcpDoctor,
};
