#!/usr/bin/env node
"use strict";

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

function usage() {
  console.log(`Usage:
  breakpoints start
  breakpoints run
  breakpoints breakpoint create --question <text> [--run-id <id>] [--title <title>] [--agent-id <id>] [--tag <tag>] [--ttl <seconds>] [--file <path,format,language,label>]
  breakpoints breakpoint status <id>
  breakpoints breakpoint show <id>
  breakpoints breakpoint wait <id> [--interval <seconds>]
  breakpoints version
`);
}

function runCommand(command, args, options = {}) {
  const proc = spawn(command, args, {
    stdio: "inherit",
    cwd: options.cwd || process.cwd(),
    shell: true,
    env: options.env ? { ...process.env, ...options.env } : process.env,
  });
  proc.on("exit", (code) => {
    process.exitCode = code ?? 1;
  });
}

function apiBase() {
  return process.env.BREAKPOINT_API_URL || "http://localhost:3185";
}

async function httpJson(method, url, body) {
  const headers = { "Content-Type": "application/json" };
  if (process.env.AGENT_TOKEN) {
    headers.Authorization = `Bearer ${process.env.AGENT_TOKEN}`;
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

function parseFlags(argv) {
  const flags = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      flags._.push(arg);
      continue;
    }
    const key = arg.slice(2);
    const value = argv[i + 1];
    if (value === undefined || value.startsWith("--")) {
      flags[key] = true;
      continue;
    }
    i += 1;
    if (flags[key] !== undefined) {
      const existing = Array.isArray(flags[key]) ? flags[key] : [flags[key]];
      flags[key] = existing.concat(value);
      continue;
    }
    flags[key] = value;
  }
  return flags;
}

function parseFiles(flagValue) {
  if (!flagValue) return [];
  const values = Array.isArray(flagValue) ? flagValue : [flagValue];
  return values
    .map((entry) => String(entry))
    .map((entry) => entry.split(","))
    .map(([pathValue, format, language, label]) => ({
      path: pathValue,
      format: format || undefined,
      language: language || undefined,
      label: label || undefined,
    }))
    .filter((file) => file.path);
}

async function breakpointCreate(flags) {
  const question = flags.question;
  if (!question) {
    throw new Error("--question is required");
  }
  const files = parseFiles(flags.file);
  const payload = {
    question,
    context: {
      runId: flags["run-id"] || undefined,
      files,
    },
  };
  const body = {
    agentId: flags["agent-id"] || "codex",
    title: flags.title || "Breakpoint",
    payload,
    tags: flags.tag ? (Array.isArray(flags.tag) ? flags.tag : [flags.tag]) : [],
    ttlSeconds: flags.ttl ? Number(flags.ttl) : undefined,
  };
  const result = await httpJson("POST", `${apiBase()}/api/breakpoints`, body);
  console.log(JSON.stringify(result, null, 2));
}

async function breakpointStatus(id) {
  const result = await httpJson(
    "GET",
    `${apiBase()}/api/breakpoints/${id}/status`
  );
  console.log(JSON.stringify(result, null, 2));
}

async function breakpointShow(id) {
  const result = await httpJson(
    "GET",
    `${apiBase()}/api/breakpoints/${id}`
  );
  console.log(JSON.stringify(result, null, 2));
}

async function breakpointWait(id, intervalSeconds) {
  const interval = Number(intervalSeconds) || 3;
  let status = "waiting";
  while (status === "waiting") {
    const res = await httpJson(
      "GET",
      `${apiBase()}/api/breakpoints/${id}/status`
    );
    status = res.status;
    if (status !== "waiting") break;
    await new Promise((resolve) => setTimeout(resolve, interval * 1000));
  }
  const details = await httpJson(
    "GET",
    `${apiBase()}/api/breakpoints/${id}`
  );
  console.log(JSON.stringify(details, null, 2));
}

function runSystem() {
  const repoRoot = path.join(__dirname, "..");
  const runner = path.join(repoRoot, "scripts", "dev-runner.js");
  const env = {
    DB_PATH:
      process.env.DB_PATH ||
      path.join(
        require("os").homedir(),
        ".a5c",
        "breakpoints",
        "db",
        "breakpoints.db"
      ),
    PORT: process.env.PORT || "3185",
    WEB_PORT: process.env.WEB_PORT || "3184",
    REPO_ROOT: process.env.REPO_ROOT || process.cwd(),
  };
  runCommand("node", [runner], { cwd: repoRoot, env });
}

const args = process.argv.slice(2);
const cmd = args[0];

if (!cmd || cmd === "--help" || cmd === "-h") {
  usage();
  process.exit(0);
}

if (cmd === "version" || cmd === "--version" || cmd === "-v") {
  const packagePath = path.join(__dirname, "..", "package.json");
  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  console.log(pkg.version || "unknown");
  process.exit(0);
}

if (cmd === "start" || cmd === "run") {
  runSystem();
  return;
}

if (cmd === "breakpoint") {
  const flags = parseFlags(args.slice(1));
  const subcmd = flags._[0];
  const id = flags._[1];
  Promise.resolve()
    .then(() => {
      if (subcmd === "create") {
        return breakpointCreate(flags);
      }
      if (subcmd === "status" && id) {
        return breakpointStatus(id);
      }
      if (subcmd === "show" && id) {
        return breakpointShow(id);
      }
      if (subcmd === "wait" && id) {
        return breakpointWait(id, flags.interval);
      }
      throw new Error("Unknown breakpoint command.");
    })
    .catch((err) => {
      console.error(err.message || err);
      process.exitCode = 1;
    });
  return;
}

usage();
process.exitCode = 1;
