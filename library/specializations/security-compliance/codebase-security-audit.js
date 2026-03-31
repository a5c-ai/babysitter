/**
 * @process specializations/security-compliance/codebase-security-audit
 * @description Comprehensive Codebase Security Audit - Multi-domain static security assessment with
 * parallel scan agents covering OWASP Top 10, suspicious code patterns, secrets & credentials,
 * dependency vulnerabilities, cloud/infrastructure security, frontend client-side security, and
 * AI/LLM integration security. Produces a self-contained HTML report with executive summary,
 * severity-filtered findings, and prioritized remediation recommendations. Designed for white-box
 * audits of full-stack web applications with optional AI/MCP components.
 * @inputs { projectName?: string, projectRoot: string, reportOutputPath?: string, techStack?: object, auditDomains?: string[], knownComponents?: string[] }
 * @outputs { success: boolean, reportPath: string, overallRisk: string, totalFindings: number, criticalCount: number, highCount: number, findings: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-compliance/codebase-security-audit', {
 *   projectName: 'My Finance App',
 *   projectRoot: '/path/to/project',
 *   reportOutputPath: '/path/to/project/reports/security-audit-report.html',
 *   techStack: {
 *     frontend: 'React 19, Tailwind CSS',
 *     backend: 'Google Cloud Functions (Node.js)',
 *     database: 'Firestore',
 *     auth: 'Firebase Auth',
 *     ai: 'Gemini 2.0 Flash via LangChain, MCP tools',
 *     cicd: 'GitHub Actions',
 *     hosting: 'Firebase Hosting'
 *   },
 *   auditDomains: ['recon', 'owasp', 'patterns', 'secrets', 'dependencies', 'cloud', 'frontend', 'ai'],
 *   knownComponents: [
 *     'React SPA (src/)',
 *     'Cloud Functions (cloud_functions/)',
 *     'Firestore database',
 *     'Firebase Auth',
 *     'MCP server integration',
 *     'GitHub Actions CI/CD (.github/workflows/)'
 *   ]
 * });
 *
 * @example
 * // Minimal invocation — auto-detect domains, only projectRoot required
 * const result = await orchestrate('specializations/security-compliance/codebase-security-audit', {
 *   projectRoot: '/path/to/api'
 * });
 *
 * @example
 * // Backend-only audit — skip frontend and AI domains
 * const result = await orchestrate('specializations/security-compliance/codebase-security-audit', {
 *   projectName: 'API Backend',
 *   projectRoot: '/path/to/api',
 *   auditDomains: ['recon', 'owasp', 'secrets', 'dependencies'],
 *   techStack: { backend: 'Express.js', database: 'PostgreSQL', auth: 'JWT' }
 * });
 *
 * @references
 * - OWASP Top 10 (2021): https://owasp.org/www-project-top-ten/
 * - OWASP Testing Guide: https://owasp.org/www-project-web-security-testing-guide/
 * - OWASP LLM Top 10: https://owasp.org/www-project-top-10-for-large-language-model-applications/
 * - CWE Top 25: https://cwe.mitre.org/top25/archive/2023/2023_top25_list.html
 * - NIST SP 800-53: https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ════════════════════════════════════════════════════════════════════

/** All supported audit domains — order defines default scan sequence. */
const ALL_DOMAINS = ['recon', 'owasp', 'patterns', 'secrets', 'dependencies', 'cloud', 'frontend', 'ai'];

/** Human-readable labels shown in the breakpoint confirmation UI. */
const DOMAIN_LABELS = {
  recon:        'Reconnaissance & Asset Inventory',
  owasp:        'OWASP Top 10 Vulnerability Scan',
  patterns:     'Suspicious Code Pattern Detection',
  secrets:      'Secrets & Credential Scanning',
  dependencies: 'Dependency Vulnerability Scan (npm audit)',
  cloud:        'Cloud & Infrastructure Security',
  frontend:     'Frontend Client-Side Security',
  ai:           'AI / LLM / MCP Integration Security'
};

/**
 * File/dir patterns used by the auto-detect agent to determine which optional
 * domains (frontend, ai, cloud) are relevant for a given project.
 * @type {Record<string, {globs: string[], markers: string[], reason: string}>}
 */
const DOMAIN_DETECTION_RULES = {
  frontend: {
    globs: ['src/**/*.jsx', 'src/**/*.tsx', 'src/**/*.vue', 'src/**/*.svelte', 'pages/**/*.js', 'app/**/*.tsx'],
    markers: ['react', 'vue', 'svelte', 'angular', 'next', 'nuxt'],
    reason: 'Found frontend framework files'
  },
  ai: {
    globs: ['**/*langchain*', '**/*openai*', '**/*gemini*', '**/*anthropic*', '**/mcp*/**', '**/*llm*', '**/*agent*'],
    markers: ['langchain', '@langchain', 'openai', '@google/generative-ai', '@anthropic-ai', 'mcp'],
    reason: 'Found AI/LLM dependencies or MCP integration'
  },
  cloud: {
    globs: ['**/deploy.sh', '**/Dockerfile', '**/*.rules', '**/serverless.yml', '**/terraform/**', '**/.github/workflows/**', '**/cloudbuild.yaml'],
    markers: ['firebase', 'gcloud', 'aws-sdk', '@azure', 'serverless', 'terraform'],
    reason: 'Found cloud/infrastructure config files'
  }
};

/** Domains that always run regardless of detection — they apply to any codebase. */
const ALWAYS_ON_DOMAINS = ['recon', 'owasp', 'patterns', 'secrets', 'dependencies'];

/** Hex colors used in the HTML report for severity badges and charts. */
const SEVERITY_COLORS = {
  CRITICAL: '#FF1744',
  HIGH: '#FF9100',
  MEDIUM: '#FFC400',
  LOW: '#00E676',
  INFO: '#448AFF'
};

// ════════════════════════════════════════════════════════════════════
// TASK DEFINITIONS
// ════════════════════════════════════════════════════════════════════

export const autoDetectTask = defineTask('auto-detect-domains', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Auto-Detect Audit Domains',
  description: 'Scan project to identify technology profile and relevant security audit domains',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevSecOps engineer analyzing a codebase to determine its technology profile',
      task: `Quickly scan the project at ${args.projectRoot} and determine which security audit domains are relevant. Do NOT perform any security analysis — just identify what technologies and patterns exist. For each domain, list the specific files and directories that will be audited.`,
      context: {
        projectRoot: args.projectRoot,
        detectionRules: DOMAIN_DETECTION_RULES,
        allDomains: ALL_DOMAINS,
        alwaysOnDomains: ALWAYS_ON_DOMAINS,
        domainLabels: DOMAIN_LABELS
      },
      instructions: [
        'List all package.json files and read their dependencies',
        'Check for frontend framework files (*.jsx, *.tsx, *.vue, *.svelte)',
        'Check for AI/LLM dependencies (langchain, openai, anthropic, google-generative-ai, mcp)',
        'Check for cloud/infra files (deploy.sh, Dockerfile, *.rules, serverless.yml, terraform, GitHub Actions workflows)',
        'Identify the tech stack: frontend framework, backend framework, database, auth system, hosting, CI/CD',
        'IMPORTANT: For EVERY domain (both always-on and detected optional), list the specific files and directories that the audit will scan. Use relative paths from project root. Group by module type (e.g., "API endpoints", "Auth middleware", "React components", "Database rules", "CI/CD pipelines").',
        'For always-on domains (recon, owasp, patterns, secrets, dependencies): scan ALL source directories but still list the key modules.',
        'For optional domains (frontend, ai, cloud): list only the specific files/dirs that triggered detection.',
        'Return JSON: { techStack: { frontend?, backend?, database?, auth?, ai?, cicd?, hosting? }, detectedDomains: { frontend: {detected: bool, reason: string, modules: [{type: string, paths: string[]}]}, ai: {detected: bool, reason: string, modules: [{type: string, paths: string[]}]}, cloud: {detected: bool, reason: string, modules: [{type: string, paths: string[]}]} }, alwaysOnModules: { recon: [{type: string, paths: string[]}], owasp: [{type: string, paths: string[]}], patterns: [{type: string, paths: string[]}], secrets: [{type: string, paths: string[]}], dependencies: [{type: string, paths: string[]}] }, projectName: string }'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['techStack', 'detectedDomains', 'alwaysOnModules']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['security', 'detection']
}));

export const reconTask = defineTask('recon-asset-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Reconnaissance & Asset Inventory',
  description: 'Map complete attack surface including endpoints, data flows, trust boundaries, and admin scripts',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security reconnaissance analyst',
      task: `Map the complete attack surface of "${args.projectName}" at ${args.projectRoot}.`,
      context: {
        projectRoot: args.projectRoot,
        techStack: args.techStack,
        knownComponents: args.knownComponents || []
      },
      instructions: [
        'Map every network endpoint (URLs, APIs, WebSocket connections, webhook receivers)',
        'Identify all data flows: user input -> processing -> storage -> output',
        'List all authentication/authorization boundaries and trust boundaries',
        'Identify all third-party integrations and external service dependencies',
        'Map all files containing or referencing credentials, API keys, or secrets',
        'List all admin/privileged scripts and their access patterns',
        'Check .gitignore for what IS and IS NOT excluded (especially key files, env files)',
        'Check for service account key files tracked in git',
        'Identify all entry points accessible to unauthenticated users',
        'Return structured JSON: { endpoints[], dataFlows[], authBoundaries[], trustBoundaries[], secretFiles[], adminScripts[], gitignoreGaps[], entryPoints[] }'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['endpoints', 'dataFlows', 'authBoundaries', 'secretFiles', 'gitignoreGaps']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['security', 'recon']
}));

export const owaspScanTask = defineTask('owasp-top10-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'OWASP Top 10 Vulnerability Scan',
  description: 'Assess all OWASP Top 10 (2021) vulnerability categories against the codebase',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Application security engineer specializing in OWASP Top 10',
      task: `Perform a thorough OWASP Top 10 (2021) vulnerability assessment on "${args.projectName}" at ${args.projectRoot}. Tech stack: ${JSON.stringify(args.techStack || {})}.`,
      context: {
        projectRoot: args.projectRoot,
        recon: args.recon,
        techStack: args.techStack
      },
      instructions: [
        'A01:2021 Broken Access Control — Check auth rules, CORS config, direct object references, privilege escalation paths',
        'A02:2021 Cryptographic Failures — Check for plaintext secrets, weak crypto, insecure transport, exposed keys in client bundles',
        'A03:2021 Injection — Check for SQL/NoSQL injection, XSS (dangerouslySetInnerHTML/innerHTML), command injection, template injection, prompt injection',
        'A04:2021 Insecure Design — Check for missing rate limiting, abuse controls, brute force protection, insufficient logging',
        'A05:2021 Security Misconfiguration — Check configs, CORS, error handling that leaks info, default credentials, debug modes',
        'A06:2021 Vulnerable Components — Check dependencies for known CVEs, outdated packages with security patches',
        'A07:2021 Authentication Failures — Check auth implementation, session management, token handling, logout completeness',
        'A08:2021 Software and Data Integrity — Check CI/CD pipeline security, dependency integrity, deploy verification',
        'A09:2021 Security Logging Failures — Check audit logging, PII redaction, monitoring gaps, alert mechanisms',
        'A10:2021 SSRF — Check for SSRF vectors via URL handling, fetch calls, redirects',
        'For EACH finding: exact file path, line number(s), code snippet, severity (CRITICAL/HIGH/MEDIUM/LOW/INFO), CVSS estimate, proof of concept description, remediation',
        'Return findings as JSON: { findings: [...], summary: { categoryCounts: {...} } } sorted by severity'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: { type: 'object', required: ['findings', 'summary'] }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['security', 'owasp']
}));

export const weirdPatternsTask = defineTask('weird-patterns-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Suspicious & Weird Code Pattern Detection',
  description: 'Scan for obfuscated code, backdoors, data exfiltration, and supply chain attack indicators',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Malware analyst and code forensics expert',
      task: `Scan "${args.projectName}" at ${args.projectRoot} for suspicious, obfuscated, or potentially malicious code patterns.`,
      context: { projectRoot: args.projectRoot },
      instructions: [
        'Search for dynamic code execution: eval(), new Function(), setTimeout/setInterval with string args',
        'Search for obfuscated code: base64 encoded strings, hex-encoded strings, char code manipulation, string concatenation to build URLs',
        'Search for data exfiltration: unexpected fetch/XMLHttpRequest calls, navigator.sendBeacon, WebSocket to unknown hosts, image/pixel tracking',
        'Search for backdoor patterns: hardcoded admin bypasses, hidden endpoints, debug modes left enabled, test accounts with known passwords',
        'Search for supply chain indicators: postinstall scripts in package.json, modified node_modules, lockfile tampering',
        'Search for prototype pollution: Object.assign with user input, deep merge without sanitization, __proto__ access',
        'Check all console.log statements for PII/secret leakage',
        'Check TODO/FIXME/HACK comments for security-relevant technical debt',
        'For EACH finding: exact file, line, code snippet, threat category, severity, explanation',
        'Return JSON: { dynamicExec[], obfuscation[], exfiltration[], backdoors[], supplyChain[], prototypePollution[], piiLeakage[], securityDebt[] }'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: { type: 'object', required: ['dynamicExec', 'obfuscation', 'exfiltration', 'backdoors', 'piiLeakage'] }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['security', 'patterns']
}));

export const secretsScanTask = defineTask('secrets-credential-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Secrets & Credential Scanning',
  description: 'Deep scan for exposed secrets, API keys, tokens, and misconfigured credential management',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Secrets management and credential security specialist',
      task: `Deep scan "${args.projectName}" at ${args.projectRoot} for exposed secrets, credentials, API keys, tokens, and sensitive configuration.`,
      context: { projectRoot: args.projectRoot, techStack: args.techStack },
      instructions: [
        'Scan ALL .env files for API keys, tokens, passwords, connection strings',
        'Check if .env files are in .gitignore',
        'Scan for service account key JSON files and check if they are gitignored',
        'Search for hardcoded API keys (AIzaSy*, sk-*, ghp_*, AKIA*, xoxb-*, etc.) in ALL source files',
        'Check client-side config files for keys that should be private',
        'Check CI/CD workflows for secret handling — are secrets used properly?',
        'Check for secrets in package.json scripts, deploy scripts, or build scripts',
        'Verify that client-side code does not embed server-side secrets',
        'Check for secrets in git history (recent commits with accidental exposure)',
        'Identify entropy-based potential secrets (long random strings in source)',
        'Check REACT_APP_ / NEXT_PUBLIC_ / VITE_ env vars — these get bundled into client JS',
        'For EACH finding: file, line, secret type, exposure scope (git/client/server), severity, remediation',
        'Return JSON: { exposedSecrets[], gitignoreStatus{}, envFileAudit[], clientBundledSecrets[], cicdSecretHandling[], recommendations[] }'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: { type: 'object', required: ['exposedSecrets', 'gitignoreStatus', 'clientBundledSecrets', 'recommendations'] }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['security', 'secrets']
}));

export const depScanTask = defineTask('dependency-vuln-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Dependency Vulnerability Scan',
  description: 'Audit all project dependencies for known CVEs, typosquatting, and risky packages',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Software composition analysis (SCA) specialist',
      task: `Audit all dependencies in "${args.projectName}" at ${args.projectRoot} for known vulnerabilities, outdated packages, and risky dependency patterns.`,
      context: { projectRoot: args.projectRoot },
      instructions: [
        'Run npm/yarn/pnpm audit in all directories containing package.json',
        'Parse audit results and categorize by severity (critical, high, moderate, low)',
        'For each vulnerable dependency: name, version, CVE ID, severity, description, fix version',
        'Check for outdated packages with known security patches',
        'Check for typosquatting risks: verify package names against known legitimate packages',
        'Check for abandoned/unmaintained packages (last publish date)',
        'Check lockfile integrity',
        'Identify packages with postinstall scripts or native addons',
        'Check if any dependencies have been deprecated',
        'Return JSON: { auditResults{...}, criticalVulns[], highVulns[], moderateVulns[], outdatedWithSecurityFixes[], riskyDependencies[], recommendations[] }'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: { type: 'object', required: ['auditResults', 'criticalVulns', 'highVulns'] }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['security', 'dependencies']
}));

export const cloudInfraScanTask = defineTask('cloud-infra-security', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Cloud & Infrastructure Security Audit',
  description: 'Audit database rules, serverless functions, IAM, deployment scripts, and network security',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cloud security architect',
      task: `Audit the cloud infrastructure security of "${args.projectName}" at ${args.projectRoot}. Tech stack: ${JSON.stringify(args.techStack || {})}.`,
      context: { projectRoot: args.projectRoot, techStack: args.techStack },
      instructions: [
        'DATABASE RULES: Read any database rules files (firestore.rules, security rules, RLS policies). Check for overly permissive rules, missing validation, data type enforcement, cross-collection access',
        'SERVERLESS FUNCTIONS: Check for CORS misconfiguration, rate limiting (especially in-memory vs distributed), input validation, error handling that leaks stack traces, timeout/memory config',
        'AUTHENTICATION: Check auth flow completeness, token validation, session management, account enumeration protection',
        'API KEY SCOPING: Are API keys restricted to specific APIs/domains? Are endpoints properly protected?',
        'DEPLOYMENT SECURITY: Check deploy scripts for hardcoded credentials, CI/CD secret exposure in logs, service account permissions scope',
        'NETWORK SECURITY: Check for publicly accessible services that should be private, missing ingress controls, service-to-service auth',
        'IAM: Check service account permissions — are they least-privilege? Are there overly broad roles?',
        'LOGGING & MONITORING: Are security events logged? Is PII redacted? Are there alerting mechanisms?',
        'For EACH finding: component, severity, description, attack scenario, remediation',
        'Return JSON: { firestoreRules{score, findings[]}, cloudFunctions{score, findings[]}, authSecurity{score, findings[]}, deploymentSecurity{score, findings[]}, networkSecurity{score, findings[]}, overallScore, recommendations[] }'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: { type: 'object', required: ['overallScore'] }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['security', 'cloud']
}));

export const frontendSecTask = defineTask('frontend-security-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Frontend Security Audit',
  description: 'Audit client-side code for XSS, prototype pollution, insecure storage, and auth bypass',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Frontend security specialist focusing on client-side web application vulnerabilities',
      task: `Audit the frontend of "${args.projectName}" at ${args.projectRoot} for client-side security vulnerabilities. Tech stack: ${JSON.stringify(args.techStack || {})}.`,
      context: { projectRoot: args.projectRoot, techStack: args.techStack },
      instructions: [
        'DOM-BASED XSS: Search for dangerouslySetInnerHTML, innerHTML, document.write, unescaped user input in templates',
        'PROTOTYPE POLLUTION: Check for deep merge with external data, Object.assign with user-controlled paths, JSON.parse of untrusted data',
        'INSECURE STORAGE: Check for sensitive data in localStorage, sessionStorage, cookies without secure/httpOnly flags',
        'CLIENT-SIDE AUTH BYPASS: Check if auth state can be manipulated, if protected routes can be accessed by URL, if API calls validate auth',
        'SENSITIVE DATA EXPOSURE: Check if data is cached in browser, if API responses with sensitive data are stored client-side, console.log leaks',
        'CLICKJACKING: Check for X-Frame-Options or CSP frame-ancestors in hosting config',
        'OPEN REDIRECTS: Check for redirect patterns using user-controlled URLs',
        'FILE UPLOAD SECURITY: Check if uploads validate file type, size, and content',
        'FRAMEWORK-SPECIFIC: Check for ref-based DOM manipulation bypassing sanitization, state injection, key-based rendering issues',
        'For EACH finding: file, line, vulnerability type, severity, exploit scenario, remediation',
        'Return JSON: { xss[], prototypePollution[], insecureStorage[], authBypass[], dataExposure[], clickjacking{}, fileUpload[], frameworkSpecific[], overallScore, recommendations[] }'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: { type: 'object', required: ['xss', 'overallScore'] }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['security', 'frontend']
}));

export const mcpAiSecTask = defineTask('mcp-ai-security', (args, taskCtx) => ({
  kind: 'agent',
  title: 'AI / LLM Integration Security Audit',
  description: 'Audit LLM integrations for prompt injection, tool abuse, data leakage, and hallucination risks',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'AI security researcher specializing in LLM application security, prompt injection, and tool-use vulnerabilities',
      task: `Audit the AI/LLM integration security of "${args.projectName}" at ${args.projectRoot}. Tech stack: ${JSON.stringify(args.techStack || {})}.`,
      context: { projectRoot: args.projectRoot, techStack: args.techStack },
      instructions: [
        'PROMPT INJECTION: Read system prompts and templates. Check injection defenses, test if user messages can escape system prompt context, check if tool results can inject payloads',
        'TOOL ABUSE: Check if tool calls are validated (name whitelist, argument validation, result sanitization). Can a user trick the agent into calling tools with malicious arguments?',
        'DATA LEAKAGE VIA LLM: Can the bot be tricked into revealing system prompts, API keys, internal tool names, other users data, or infrastructure details?',
        'HALLUCINATION RISK: In financial/medical/legal contexts, hallucinated data causes real harm. Check if validators catch hallucinated facts.',
        'MEMORY POISONING: Can a user inject persistent context into chat memory that affects future conversations?',
        'RATE LIMITING BYPASS: Can the rate limiter be bypassed by changing userId, session rotation, or parallel requests?',
        'DENIAL OF SERVICE: Can a user craft messages causing excessive LLM calls, tool calls, or processing time?',
        'CROSS-USER DATA ACCESS: Can user A access user B data through the chatbot? Check userId propagation to tools.',
        'RESPONSE SANITIZATION: Check sanitization functions for bypass vectors. Can structured markers be injected?',
        'For EACH finding: component, vulnerability type, severity, attack scenario, proof of concept, remediation',
        'Return JSON: { promptInjection[], toolAbuse[], dataLeakage[], hallucinationRisks[], memoryPoisoning[], rateLimitBypass[], dos[], crossUserAccess[], responseSanitization[], overallScore, recommendations[] }'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: { type: 'object', required: ['promptInjection', 'toolAbuse', 'dataLeakage', 'overallScore'] }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['security', 'ai']
}));

export const reportGeneratorTask = defineTask('html-report-generator', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate HTML Security Audit Report',
  description: 'Produce self-contained HTML report with executive summary, findings, and remediation plan',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security report writer and HTML developer',
      task: `Generate a comprehensive, professional HTML security audit report for "${args.projectName}" from the findings data provided. Write the complete HTML file to: ${args.reportPath}`,
      context: {
        reportPath: args.reportPath,
        projectName: args.projectName,
        auditDate: args.auditDate,
        severityColors: SEVERITY_COLORS,
        ...args.scanResults
      },
      instructions: [
        'Create a SINGLE self-contained HTML file with embedded CSS — no external dependencies',
        'Use a professional dark theme with cybersecurity aesthetic (dark background, severity-colored accents)',
        'Structure: 1) EXECUTIVE SUMMARY with risk rating, finding counts, key metrics, donut chart (pure CSS)',
        '2) ATTACK SURFACE MAP: architecture and trust boundaries from recon data',
        '3) FINDINGS BY DOMAIN: collapsible sections for each audit domain',
        '4) Each finding card: severity badge (color-coded), title, description, file:line, code snippet in <pre><code>, attack scenario, remediation',
        '5) SEVERITY STATISTICS: summary table with counts per category',
        '6) RECOMMENDATIONS: prioritized action items (immediate/short-term/long-term)',
        '7) METHODOLOGY: brief description of audit approach',
        `Use severity colors: CRITICAL=${SEVERITY_COLORS.CRITICAL}, HIGH=${SEVERITY_COLORS.HIGH}, MEDIUM=${SEVERITY_COLORS.MEDIUM}, LOW=${SEVERITY_COLORS.LOW}, INFO=${SEVERITY_COLORS.INFO}`,
        'Make finding cards collapsible with CSS-only accordion (checkbox hack)',
        'Add a sticky sidebar navigation for jumping between sections',
        'Add severity filter buttons (CSS-only using :checked + sibling selectors)',
        'Include print-friendly @media print styles and responsive mobile styles',
        'IMPORTANT: Write the actual HTML file to disk at the specified reportPath using the Write tool',
        'Return JSON: { success: true, reportPath, totalFindings, criticalCount, highCount, mediumCount, lowCount, infoCount }'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: { type: 'object', required: ['success', 'reportPath', 'totalFindings'] }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['security', 'report']
}));

// ════════════════════════════════════════════════════════════════════
// DOMAIN REGISTRY — maps domain name → { task, extractFindings }
// ════════════════════════════════════════════════════════════════════

/**
 * Maps each scan domain to its task definition and a function that extracts
 * a flat findings array from the agent's structured output.
 * @type {Record<string, {task: DefinedTask, extractFindings: (result: object) => object[]}>}
 */
const DOMAIN_REGISTRY = {
  owasp: {
    task: owaspScanTask,
    extractFindings: (r) => r.findings || []
  },
  patterns: {
    task: weirdPatternsTask,
    extractFindings: (r) => [
      ...(r.dynamicExec || []), ...(r.obfuscation || []),
      ...(r.exfiltration || []), ...(r.backdoors || []),
      ...(r.piiLeakage || []), ...(r.supplyChain || []),
      ...(r.prototypePollution || []), ...(r.securityDebt || [])
    ]
  },
  secrets: {
    task: secretsScanTask,
    extractFindings: (r) => [...(r.exposedSecrets || []), ...(r.clientBundledSecrets || [])]
  },
  dependencies: {
    task: depScanTask,
    extractFindings: (r) => [...(r.criticalVulns || []), ...(r.highVulns || []), ...(r.moderateVulns || [])]
  },
  cloud: {
    task: cloudInfraScanTask,
    extractFindings: (r) => [
      ...(r.firestoreRules?.findings || []), ...(r.cloudFunctions?.findings || []),
      ...(r.authSecurity?.findings || []), ...(r.deploymentSecurity?.findings || []),
      ...(r.networkSecurity?.findings || [])
    ]
  },
  frontend: {
    task: frontendSecTask,
    extractFindings: (r) => [
      ...(r.xss || []), ...(r.prototypePollution || []),
      ...(r.insecureStorage || []), ...(r.authBypass || []),
      ...(r.dataExposure || []), ...(r.fileUpload || []),
      ...(r.frameworkSpecific || [])
    ]
  },
  ai: {
    task: mcpAiSecTask,
    extractFindings: (r) => [
      ...(r.promptInjection || []), ...(r.toolAbuse || []),
      ...(r.dataLeakage || []), ...(r.hallucinationRisks || []),
      ...(r.memoryPoisoning || []), ...(r.rateLimitBypass || []),
      ...(r.dos || []), ...(r.crossUserAccess || []),
      ...(r.responseSanitization || [])
    ]
  }
};

// ════════════════════════════════════════════════════════════════════
// MAIN PROCESS
// ════════════════════════════════════════════════════════════════════

/**
 * Codebase Security Audit — Multi-domain orchestrated security assessment.
 *
 * Flow: Auto-detect → Confirm scope → Recon → Parallel deep scans → Review → HTML report
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectRoot - Absolute path to the project directory (required)
 * @param {string} [inputs.projectName] - Display name; auto-detected if omitted
 * @param {string} [inputs.reportOutputPath] - Where to write the HTML report; defaults to `<projectRoot>/reports/security-audit-report.html`
 * @param {Object} [inputs.techStack] - Technology profile; auto-detected if omitted
 * @param {string[]} [inputs.auditDomains] - Domains to scan; auto-detected if omitted or empty
 * @param {string[]} [inputs.knownComponents] - Known system components to seed the recon scan
 * @param {ProcessContext} ctx - Babysitter SDK process context
 * @returns {Promise<{success: boolean, reportPath: string, overallRisk: string, totalFindings: number, criticalCount: number, highCount: number, mediumCount: number, findings: Object, artifacts: Object[], duration: number, metadata: Object}>}
 */
export async function process(inputs, ctx) {
  const {
    projectRoot,
    reportOutputPath,
    knownComponents = []
  } = inputs;

  if (!projectRoot) {
    throw new Error('projectRoot is required — specify the absolute path to the project directory');
  }
  // These may be overridden by auto-detection
  let projectName = inputs.projectName || 'Application';
  let techStack = inputs.techStack || {};
  let auditDomains = inputs.auditDomains; // undefined = auto-detect

  const startTime = ctx.now();
  const artifacts = [];

  // ── PHASE 0: Auto-Detect & Confirm ───────────────────────────────

  if (!auditDomains || auditDomains.length === 0) {
    ctx.log?.('info', '=== PHASE 0: Auto-Detecting Project Profile ===');

    let detection = await ctx.task(autoDetectTask, { projectRoot });

    // Use detected project name and tech stack if not provided by user
    if (!inputs.projectName && detection.projectName) {
      projectName = detection.projectName;
    }
    if (!inputs.techStack && detection.techStack) {
      techStack = detection.techStack;
    }
  // Build domains list: always-on + detected optional domains
    auditDomains = [...ALWAYS_ON_DOMAINS];
    const detectedOptional = [];

    for (const [domain, info] of Object.entries(detection.detectedDomains || {})) {
      if (info.detected) {
        auditDomains.push(domain);
        detectedOptional.push({ domain, reason: info.reason });
      }
    }
  // Merge module info from both alwaysOnModules and detectedDomains
    const allModules = { ...(detection.alwaysOnModules || {}) };
    for (const [domain, info] of Object.entries(detection.detectedDomains || {})) {
      if (info.detected && info.modules) {
        allModules[domain] = info.modules;
      }
    }
  // Build a human-readable summary for the breakpoint — with modules per domain
    const formatModules = (modules) => {
      if (!modules || modules.length === 0) return '';
      return modules.map(m => {
        const paths = (m.paths || []).slice(0, 8); // cap at 8 paths per module type
        const more = (m.paths || []).length > 8 ? ` (+${m.paths.length - 8} more)` : '';
        return `      ${m.type}:\n` + paths.map(p => `        - ${p}`).join('\n') + (more ? `\n        ${more}` : '');
      }).join('\n');
    };

    const domainSummary = auditDomains
      .map(d => {
        const label = DOMAIN_LABELS[d] || d;
        const optInfo = detectedOptional.find(o => o.domain === d);
        const header = `  [x] ${label}${optInfo ? ` — ${optInfo.reason}` : ''}`;
        const modules = formatModules(allModules[d]);
        return modules ? `${header}\n${modules}` : header;
      })
      .join('\n\n');

    const skippedDomains = ALL_DOMAINS.filter(d => !auditDomains.includes(d));
    const skippedSummary = skippedDomains.length > 0
      ? '\n\nSkipped (not detected):\n' + skippedDomains.map(d => `  [ ] ${DOMAIN_LABELS[d] || d}`).join('\n')
      : '';

    const techSummary = Object.entries(techStack)
      .map(([k, v]) => `  ${k}: ${v}`)
      .join('\n');

    ctx.log?.('info', `Detected ${auditDomains.length} audit domains for "${projectName}"`);

      let lastFeedback_stepApproval = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (lastFeedback_stepApproval) {
        detection = await ctx.task(autoDetectTask, { ...{ projectRoot }, feedback: lastFeedback_stepApproval, attempt: attempt + 1 });
      }
  const stepApproval = await ctx.breakpoint({
      question: [
        `Auto-detected project profile for "${projectName}":`,
        '',
        'Tech Stack:',
        techSummary || '  (none detected)',
        '',
        `Audit Domains (${auditDomains.length}/${ALL_DOMAINS.length}) — modules to scan:`,
        '',
        domainSummary,
        skippedSummary,
        '',
        'Approve this audit scope? (You can adjust domains in the inputs to override.)'
      ].join('\n'),
      title: 'Confirm Audit Scope',
      context: {
        detectedDomains: auditDomains,
        skippedDomains,
        techStack,
        projectName,
        modulesPerDomain: allModules
      },
      expert: 'owner',
      tags: ['approval-gate'],
      previousFeedback: lastFeedback_stepApproval || undefined,
      attempt: attempt > 0 ? attempt + 1 : undefined
      });
      if (stepApproval.approved) break;
      lastFeedback_stepApproval = stepApproval.response || stepApproval.feedback || 'Changes requested';
    } }

  const finalReportPath = reportOutputPath || `${projectRoot}/reports/security-audit-report.html`;

  ctx.log?.('info', `Starting Codebase Security Audit for "${projectName}"`);
  ctx.log?.('info', `Project root: ${projectRoot}`);
  ctx.log?.('info', `Audit domains: ${auditDomains.join(', ')}`);

  // ── PHASE 1: Reconnaissance ──────────────────────────────────────

  ctx.log?.('info', '=== PHASE 1: Reconnaissance & Asset Inventory ===');

  const recon = auditDomains.includes('recon')
    ? await ctx.task(reconTask, { projectName, projectRoot, techStack, knownComponents })
    : { endpoints: [], dataFlows: [], authBoundaries: [], secretFiles: [], gitignoreGaps: [] };

  ctx.log?.('info', `Recon complete: ${recon.endpoints?.length || 0} endpoints, ${recon.secretFiles?.length || 0} secret files`);

  // ── PHASE 2: Parallel Deep Scans ─────────────────────────────────

  const scanDomains = auditDomains.filter(d => d !== 'recon' && DOMAIN_REGISTRY[d]);
  ctx.log?.('info', `=== PHASE 2: Parallel Security Scans (${scanDomains.length} domains) ===`);

  const scanArgs = { projectName, projectRoot, techStack, recon };

  const scanResults = {};
  const scanFns = scanDomains.map(domain => {
    return () => ctx.task(DOMAIN_REGISTRY[domain].task, scanArgs)
      .then(result => { scanResults[domain] = result; return result; });
  });

  await ctx.parallel.all(scanFns);

  ctx.log?.('info', `All ${scanDomains.length} parallel scans complete`);

  // ── Aggregate findings ───────────────────────────────────────────

  const allFindings = [];
  for (const domain of scanDomains) {
    if (scanResults[domain] && DOMAIN_REGISTRY[domain]) {
      const domainFindings = DOMAIN_REGISTRY[domain].extractFindings(scanResults[domain]);
      if (domainFindings.length === 0) {
        ctx.log?.('warn', `Domain "${domain}" returned zero findings — verify agent output`);
      }
      allFindings.push(...domainFindings);
    }
  }
  const criticalCount = allFindings.filter(f => (f.severity || '').toUpperCase() === 'CRITICAL').length;
  const highCount = allFindings.filter(f => (f.severity || '').toUpperCase() === 'HIGH').length;
  const mediumCount = allFindings.filter(f => (f.severity || '').toUpperCase() === 'MEDIUM').length;

  ctx.log?.('info', `Total findings: ${allFindings.length} (${criticalCount} critical, ${highCount} high, ${mediumCount} medium)`);

  // ── PHASE 3: Human Review ────────────────────────────────────────

    let lastFeedback_finalApproval = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback_finalApproval) {
      detection = await ctx.task(autoDetectTask, { ...{ projectRoot }, feedback: lastFeedback_finalApproval, attempt: attempt + 1 });
    }
  const finalApproval = await ctx.breakpoint({
    question: `Security scan complete. Found ${allFindings.length} total findings (${criticalCount} CRITICAL, ${highCount} HIGH, ${mediumCount} MEDIUM). Review and approve report generation?`,
    title: 'Security Scan Results Review',
    context: {
      runId: ctx.runId,
      summary: {
        totalFindings: allFindings.length,
        critical: criticalCount,
        high: highCount,
        medium: mediumCount,
        domains: Object.fromEntries(
          scanDomains.map(d => [d, DOMAIN_REGISTRY[d].extractFindings(scanResults[d] || {}).length])
        )
      }
    },
    expert: 'owner',
    tags: ['approval-gate'],
    previousFeedback: lastFeedback_finalApproval || undefined,
    attempt: attempt > 0 ? attempt + 1 : undefined
    });
    if (finalApproval.approved) break;
    lastFeedback_finalApproval = finalApproval.response || finalApproval.feedback || 'Changes requested';
  }
  // ── PHASE 4: HTML Report Generation ──────────────────────────────

  ctx.log?.('info', '=== PHASE 4: HTML Report Generation ===');

  const report = await ctx.task(reportGeneratorTask, {
    projectName,
    reportPath: finalReportPath,
    auditDate: ctx.now().toISOString().split('T')[0],
    scanResults: { recon, ...scanResults }
  });

  ctx.log?.('info', `Report generated at: ${report.reportPath || finalReportPath}`);
  artifacts.push({ type: 'html-report', path: report.reportPath || finalReportPath });

  // ── Return ───────────────────────────────────────────────────────

  const endTime = ctx.now();
  const overallRisk = criticalCount > 0 ? 'CRITICAL'
    : highCount > 3 ? 'HIGH'
    : highCount > 0 ? 'MEDIUM'
    : 'LOW';

  return {
    success: true,
    reportPath: report.reportPath || finalReportPath,
    overallRisk,
    totalFindings: allFindings.length,
    criticalCount,
    highCount,
    mediumCount,
    findings: Object.fromEntries(
      scanDomains.map(d => [d, DOMAIN_REGISTRY[d].extractFindings(scanResults[d] || {})])
    ),
    artifacts,
    duration: endTime.getTime() - startTime.getTime(),
    metadata: {
      processId: 'specializations/security-compliance/codebase-security-audit',
      timestamp: startTime.toISOString(),
      projectRoot,
      reportOutputPath: finalReportPath,
      auditDomains
    }
  };
}
