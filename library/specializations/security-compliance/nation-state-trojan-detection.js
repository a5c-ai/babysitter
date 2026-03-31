/**
 * @process specializations/security-compliance/nation-state-trojan-detection
 * @description LLM-Powered Nation-State Trojan Detection — Semantic code analysis engine that detects
 * business-logic trojans invisible to traditional SAST tools, linters, and unit tests. Uses git diff
 * forensics, byte-level homoglyph detection, cross-file data flow reasoning, and LLM semantic
 * understanding to identify operator substitutions, logic inversions, constant manipulation,
 * narrative camouflage, compound self-masking attacks, and Unicode homoglyph injections.
 * Produces a self-contained HTML report with attack classification, stealth assessment,
 * blast radius mapping, and remediation recommendations.
 *
 * @inputs {
 *   projectRoot: string,
 *   projectName?: string,
 *   reportOutputPath?: string,
 *   scanMode?: 'uncommitted' | 'commit-range' | 'branch-diff',
 *   baseRef?: string,
 *   headRef?: string,
 *   targetPaths?: string[],
 *   autoRevert?: boolean,
 *   drillMode?: boolean
 * }
 * @outputs {
 *   success: boolean,
 *   verdict: 'CLEAN' | 'SUSPICIOUS' | 'TROJAN_DETECTED',
 *   reportPath: string,
 *   findings: object[],
 *   layerCount: number,
 *   stealthRating: string,
 *   signatures: string[],
 *   artifacts: object[],
 *   duration: number,
 *   metadata: object
 * }
 *
 * @example
 * // Scan uncommitted changes (default — ideal for CI pre-commit hooks)
 * const result = await orchestrate('specializations/security-compliance/nation-state-trojan-detection', {
 *   projectRoot: '/path/to/project'
 * });
 *
 * @example
 * // Scan a PR branch diff against main
 * const result = await orchestrate('specializations/security-compliance/nation-state-trojan-detection', {
 *   projectRoot: '/path/to/project',
 *   projectName: 'My API',
 *   scanMode: 'branch-diff',
 *   baseRef: 'main',
 *   headRef: 'feature/new-scoring',
 *   reportOutputPath: '/path/to/project/reports/trojan-scan.html'
 * });
 *
 * @example
 * // Red-team drill mode with auto-revert
 * const result = await orchestrate('specializations/security-compliance/nation-state-trojan-detection', {
 *   projectRoot: '/path/to/project',
 *   drillMode: true,
 *   autoRevert: true,
 *   reportOutputPath: '/path/to/project/reports/drill-report.html'
 * });
 *
 * @example
 * // Scan specific commit range
 * const result = await orchestrate('specializations/security-compliance/nation-state-trojan-detection', {
 *   projectRoot: '/path/to/project',
 *   scanMode: 'commit-range',
 *   baseRef: 'abc1234',
 *   headRef: 'def5678'
 * });
 *
 * @references
 * - MITRE ATT&CK T1565.001 — Stored Data Manipulation: https://attack.mitre.org/techniques/T1565/001/
 * - Unicode Confusables: https://unicode.org/reports/tr39/
 * - Trojan Source (CVE-2021-42574): https://trojansource.codes/
 * - OWASP Code Review Guide: https://owasp.org/www-project-code-review-guide/
 *
 * @skill git-forensics-scanner specializations/security-compliance/skills/git-forensics-scanner/SKILL.md
 * @skill semantic-code-analyzer specializations/security-compliance/skills/semantic-code-analyzer/SKILL.md
 * @skill homoglyph-detector specializations/security-compliance/skills/homoglyph-detector/SKILL.md
 * @agent trojan-detection-agent specializations/security-compliance/agents/trojan-detection-agent/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ════════════════════════════════════════════════════════════════════
// ATTACK SIGNATURE TAXONOMY
// ════════════════════════════════════════════════════════════════════

/**
 * Known attack signatures detected across adversarial drill programs.
 * Each signature includes detection heuristics and stealth rating.
 */
const ATTACK_SIGNATURES = {
  'constant-manipulation': {
    label: 'Constant Manipulation',
    description: 'Shift thresholds, limits, or default values to disable functionality',
    stealth: 'MODERATE',
    examples: ['_MIN_OBS = 5 -> 8', 'damped_trend = True -> False'],
    detection: 'Compare numeric constants against docstring semantics and upstream consumers'
  },
  'logic-inversion': {
    label: 'Logic Inversion',
    description: 'Flip comparison operators or ratio direction',
    stealth: 'HIGH',
    examples: ['< 0.85 -> > 0.85', 'league_avg / opp -> opp / league_avg'],
    detection: 'Verify operator semantics match variable names and docstrings'
  },
  'narrative-camouflage': {
    label: 'Narrative Camouflage',
    description: 'Update docstrings/comments to match malicious code, fooling reviewers',
    stealth: 'HIGH',
    examples: ['Rewritten docstring matches inverted logic', 'Comment justifies sabotage'],
    detection: 'Cross-reference docstring claims against mathematical behavior'
  },
  'edge-case-exploitation': {
    label: 'Edge-Case Exploitation',
    description: 'Corrupt fallback paths triggered only in rare conditions',
    stealth: 'VERY_HIGH',
    examples: ['else n -> else 1', 'default param change'],
    detection: 'Trace all fallback/default paths and verify they produce sensible values'
  },
  'self-masking-compound': {
    label: 'Self-Masking Compound',
    description: 'Multiple layers where one hides the visible impact of another',
    stealth: 'VERY_HIGH',
    examples: ['Layer 1 inflates by 10x, Layer 2 shifts blend to dampen output by 7%'],
    detection: 'Cross-file compound analysis — compute net effect of all changes together'
  },
  'precision-truncation': {
    label: 'Precision Truncation',
    description: 'Swap division operators to silently lose decimal precision',
    stealth: 'EXTREME',
    examples: ['/ -> // (true division to floor division)'],
    detection: 'Flag any division operator change in financial/pricing code'
  },
  'homoglyph-injection': {
    label: 'Homoglyph Injection',
    description: 'Replace ASCII characters with visually identical Unicode counterparts',
    stealth: 'EXTREME',
    examples: ['Latin p (U+0070) -> Cyrillic р (U+0440)'],
    detection: 'Byte-level hexdump analysis of all string literals in changed hunks'
  },
  'window-overlap-neutralization': {
    label: 'Window Overlap Neutralization',
    description: 'Narrow comparison windows until data overlap makes detection impossible',
    stealth: 'HIGH',
    examples: ['window_3 vs window_10 -> window_3 vs window_5 (60% overlap)'],
    detection: 'Compute data overlap ratio between comparison windows'
  },
  'calibration-camouflage': {
    label: 'Calibration Camouflage',
    description: 'Tune ML hyperparameters to degrade model accuracy without breaking it',
    stealth: 'HIGH',
    examples: ['learning_rate: 0.1 -> 0.3', 'ddof=1 -> ddof=0'],
    detection: 'Compare hyperparameters against established baselines and best practices'
  },
  'cosmetic-decoy': {
    label: 'Cosmetic Decoy',
    description: 'Add harmless formatting changes to distract from the real attack',
    stealth: 'HIGH',
    examples: ['Add round() wrappers to 4 lines while injecting homoglyph in 1'],
    detection: 'Classify each hunk as cosmetic vs semantic — investigate semantic changes deeply'
  }
};

const STEALTH_LEVELS = ['MODERATE', 'HIGH', 'VERY_HIGH', 'EXTREME'];

const VERDICT_THRESHOLDS = {
  CLEAN: 0,
  SUSPICIOUS: 1,
  TROJAN_DETECTED: 2
};

// ════════════════════════════════════════════════════════════════════
// TASK DEFINITIONS
// ════════════════════════════════════════════════════════════════════

// --- Phase 1: Git Forensics ---

export const gitForensicsTask = defineTask('git-forensics-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Git Forensics — Surface Change Set',
  description: 'Use git diff to identify all changed files, hunks, and change statistics',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Git forensics analyst specializing in detecting subtle code modifications',
      task: `Analyze the git diff at "${args.projectRoot}" to surface the complete change set for trojan analysis.`,
      context: {
        projectRoot: args.projectRoot,
        scanMode: args.scanMode || 'uncommitted',
        baseRef: args.baseRef,
        headRef: args.headRef,
        targetPaths: args.targetPaths
      },
      instructions: [
        `Run the appropriate git diff command based on scanMode:`,
        `- "uncommitted": git diff (unstaged) + git diff --cached (staged)`,
        `- "commit-range": git diff <baseRef>..<headRef>`,
        `- "branch-diff": git diff <baseRef>...<headRef>`,
        'Run git diff --stat to get file-level change summary',
        'For EACH changed file, run git diff on that specific file to get the full patch',
        'Record: file path, lines added, lines removed, total hunks, hunk line ranges',
        'Classify each change as: code (logic/algorithm), config (constants/params), data-model (schemas/types), cosmetic (formatting/comments)',
        'Flag files with very small diffs (1-5 lines) in critical code paths — these are highest-risk for trojans',
        'IMPORTANT: Record the RAW diff output for each file — the semantic analyzer needs it',
        'Return JSON: { totalFiles, totalInsertions, totalDeletions, files: [{ path, insertions, deletions, hunks, classification, rawDiff, riskLevel }] }'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['totalFiles', 'files'],
      properties: {
        totalFiles: { type: 'number' },
        totalInsertions: { type: 'number' },
        totalDeletions: { type: 'number' },
        files: {
          type: 'array',
          items: {
            type: 'object',
            required: ['path', 'rawDiff'],
            properties: {
              path: { type: 'string' },
              insertions: { type: 'number' },
              deletions: { type: 'number' },
              hunks: { type: 'number' },
              classification: { type: 'string' },
              rawDiff: { type: 'string' },
              riskLevel: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['security', 'trojan-detection', 'git-forensics']
}));

// --- Phase 2: Semantic Analysis (per file) ---

export const semanticAnalysisTask = defineTask('semantic-code-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Semantic Analysis — ${args.filePath || 'File'}`,
  description: 'LLM semantic analysis of a single file diff for business-logic trojans',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security researcher specializing in nation-state supply chain attacks and business-logic trojans. You understand that these attacks use VALID code that passes all linters, type checkers, and existing tests. Your job is to determine if the code does what it CLAIMS to do.',
      task: `Analyze this diff for potential business-logic trojans. The file is "${args.filePath}" in project "${args.projectName}".`,
      context: {
        filePath: args.filePath,
        rawDiff: args.rawDiff,
        classification: args.classification,
        projectRoot: args.projectRoot,
        knownSignatures: Object.keys(ATTACK_SIGNATURES)
      },
      instructions: [
        'Read the FULL file (not just the diff) to understand the complete context',
        'For each changed hunk, answer these questions:',
        '  1. INTENT: What does the docstring/function name claim this code should do?',
        '  2. IMPLEMENTATION: What does the modified code ACTUALLY do?',
        '  3. CONTRADICTION: Is there any gap between intent and implementation?',
        '  4. MATHEMATICAL VERIFICATION: If the change involves math (ratios, divisions, comparisons), compute the before/after values with concrete examples',
        '  5. TEST EVASION: Could this change pass existing tests? If so, why? (e.g., test uses round numbers, test doesnt cover this code path)',
        '  6. BLAST RADIUS: What downstream code consumes the output of this function?',
        '',
        'Check for these specific attack patterns:',
        '  - Operator substitution: / vs //, < vs >, + vs -, and vs or',
        '  - Ratio inversion: a/b changed to b/a',
        '  - Constant manipulation: threshold/limit/default value changes',
        '  - Docstring camouflage: comments updated to match malicious code',
        '  - Window/overlap neutralization: comparison windows narrowed until meaningless',
        '  - Cosmetic decoy: formatting changes hiding a semantic modification',
        '',
        'IMPORTANT: Read the full file using the Read tool to see the complete context around the diff',
        'IMPORTANT: Use Grep to find all consumers of changed functions/values to map blast radius',
        '',
        'Return JSON: {',
        '  filePath: string,',
        '  verdict: "CLEAN" | "SUSPICIOUS" | "TROJAN_DETECTED",',
        '  confidence: number (0-100),',
        '  findings: [{',
        '    line: number,',
        '    originalCode: string,',
        '    modifiedCode: string,',
        '    signature: string (from known signatures),',
        '    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",',
        '    explanation: string,',
        '    mathematicalImpact: string,',
        '    blastRadius: string[],',
        '    testEvasionReason: string',
        '  }],',
        '  stealthRating: "MODERATE" | "HIGH" | "VERY_HIGH" | "EXTREME"',
        '}'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['filePath', 'verdict', 'confidence', 'findings'],
      properties: {
        filePath: { type: 'string' },
        verdict: { type: 'string', enum: ['CLEAN', 'SUSPICIOUS', 'TROJAN_DETECTED'] },
        confidence: { type: 'number' },
        findings: { type: 'array' },
        stealthRating: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['security', 'trojan-detection', 'semantic-analysis']
}));

// --- Phase 3: Byte-Level Homoglyph Detection ---

export const homoglyphDetectionTask = defineTask('homoglyph-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Byte-Level Homoglyph Detection',
  description: 'Hexdump analysis of all changed string literals to detect Unicode homoglyph substitutions',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Unicode security analyst and binary forensics expert specializing in homoglyph attacks (CVE-2021-42574 Trojan Source class)',
      task: `Perform byte-level analysis on all changed files in "${args.projectRoot}" to detect Unicode homoglyph substitutions — characters that look identical to ASCII but have different codepoints.`,
      context: {
        projectRoot: args.projectRoot,
        changedFiles: args.changedFiles,
        scanMode: args.scanMode || 'uncommitted',
        baseRef: args.baseRef,
        headRef: args.headRef
      },
      instructions: [
        'For EACH changed file, pipe the git diff through hexdump -C',
        'Scan the hexdump for multi-byte UTF-8 sequences where single-byte ASCII is expected:',
        '  - Cyrillic: а(U+0430/61), с(U+0441/63), е(U+0435/65), о(U+043E/6F), р(U+0440/70), х(U+0445/78), у(U+0443/79)',
        '  - Greek: ο(U+03BF/6F), α(U+03B1/61), ε(U+03B5/65)',
        '  - Other: zero-width spaces (U+200B), zero-width joiners (U+200D), right-to-left marks (U+200F)',
        'Focus especially on string literals used as dictionary keys, variable names, and identifiers',
        'For each homoglyph found: record the file, line, byte offset, expected ASCII byte, actual UTF-8 bytes, Unicode codepoint, visual appearance',
        'Also check for Bidi control characters that could reorder code display (Trojan Source attack)',
        'Return JSON: {',
        '  filesScanned: number,',
        '  homoglyphsFound: [{',
        '    file: string,',
        '    line: number,',
        '    byteOffset: string,',
        '    context: string,',
        '    expectedAscii: string,',
        '    actualBytes: string,',
        '    unicodeCodepoint: string,',
        '    scriptName: string,',
        '    impact: string',
        '  }],',
        '  bidiControlChars: [],',
        '  verdict: "CLEAN" | "HOMOGLYPH_DETECTED"',
        '}'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['filesScanned', 'homoglyphsFound', 'verdict'],
      properties: {
        filesScanned: { type: 'number' },
        homoglyphsFound: { type: 'array' },
        bidiControlChars: { type: 'array' },
        verdict: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['security', 'trojan-detection', 'homoglyph']
}));

// --- Phase 4: Cross-File Compound Analysis ---

export const compoundAnalysisTask = defineTask('compound-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Cross-File Compound Analysis',
  description: 'Analyze how changes across multiple files interact to produce compound malicious effects',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security architect specializing in multi-stage supply chain attacks where individual changes appear benign but combine to produce malicious compound effects',
      task: `Analyze the interactions between all detected changes in "${args.projectName}" to identify compound attack patterns.`,
      context: {
        projectRoot: args.projectRoot,
        perFileResults: args.perFileResults,
        homoglyphResults: args.homoglyphResults,
        projectName: args.projectName
      },
      instructions: [
        'Review all per-file semantic analysis results together',
        'Map data flow between changed files: does file A output feed into file B input?',
        'Look for COMPOUND PATTERNS:',
        '  - Self-masking: One change inflates values, another dampens the visible output',
        '  - Cascading: Change in data model corrupts every downstream consumer',
        '  - Complementary: Two changes that are benign individually but malicious together',
        '  - Decoy + payload: Cosmetic changes in one file distract from a semantic change in another',
        '',
        'For each compound pattern found:',
        '  1. List the participating layers (files + line numbers)',
        '  2. Explain the interaction mechanism',
        '  3. Compute the NET effect with concrete numbers',
        '  4. Assess whether the compound effect would be visible in integration tests',
        '',
        'Compute overall verdict by considering:',
        '  - Number of independent trojan layers',
        '  - Whether layers show coordination (e.g., masking pattern)',
        '  - Whether changes target multiple stages of the same data pipeline',
        '  - Whether cosmetic decoys are present alongside semantic changes',
        '',
        'Return JSON: {',
        '  compoundPatterns: [{ layers: [], mechanism: string, netEffect: string, testVisibility: string }],',
        '  overallVerdict: "CLEAN" | "SUSPICIOUS" | "TROJAN_DETECTED",',
        '  overallConfidence: number,',
        '  overallStealthRating: string,',
        '  allSignatures: string[],',
        '  layerCount: number,',
        '  attackNarrative: string',
        '}'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['overallVerdict', 'overallConfidence', 'layerCount'],
      properties: {
        compoundPatterns: { type: 'array' },
        overallVerdict: { type: 'string' },
        overallConfidence: { type: 'number' },
        overallStealthRating: { type: 'string' },
        allSignatures: { type: 'array', items: { type: 'string' } },
        layerCount: { type: 'number' },
        attackNarrative: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['security', 'trojan-detection', 'compound-analysis']
}));

// --- Phase 5: HTML Report Generation ---

export const reportTask = defineTask('trojan-report-generator', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Trojan Detection Report',
  description: 'Produce self-contained HTML report with attack classification, stealth assessment, and remediation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security report writer and HTML developer specializing in threat intelligence reports',
      task: `Generate a comprehensive, self-contained HTML report for the nation-state trojan detection scan of "${args.projectName}". Write the file to: ${args.reportPath}`,
      context: {
        reportPath: args.reportPath,
        projectName: args.projectName,
        scanDate: args.scanDate,
        verdict: args.verdict,
        forensicsResults: args.forensicsResults,
        perFileResults: args.perFileResults,
        homoglyphResults: args.homoglyphResults,
        compoundResults: args.compoundResults,
        attackSignatures: ATTACK_SIGNATURES,
        drillMode: args.drillMode
      },
      instructions: [
        'Create a SINGLE self-contained HTML file with embedded CSS — no external dependencies',
        'Use a dark cybersecurity theme (dark navy background #0f172a, red accents for trojans, green for clean)',
        '',
        'REPORT STRUCTURE:',
        '1) HEADER: Project name, scan date, verdict badge (CLEAN=green, SUSPICIOUS=amber, TROJAN_DETECTED=red)',
        '2) EXECUTIVE SUMMARY: Verdict, layer count, stealth rating, signatures found, files affected',
        '3) METRIC GRID: Characters changed, files affected, attack layer (data model/prediction/API), blast radius',
        '4) ATTACK VECTOR: For each finding — file, line, original vs modified code, signature, severity, explanation',
        '5) MATHEMATICAL IMPACT: Concrete before/after calculations with example values',
        '6) TEST EVASION ANALYSIS: Why existing tests dont catch each finding',
        '7) STEALTH ASSESSMENT: Bar charts showing visual stealth, test evasion, code review, blast radius ratings',
        '8) COMPOUND ANALYSIS: How changes interact across files (if multi-file)',
        '9) DETECTION METHODOLOGY: The LLM detection engine explanation with tool descriptions',
        '10) BLAST RADIUS MAP: Table of affected downstream code paths',
        '11) ATTACK CLASSIFICATION: Signature, MITRE ATT&CK mapping, sophistication level',
        '12) REMEDIATION: Immediate fix + preventive measures',
        '',
        'STYLE REQUIREMENTS:',
        '- Code blocks with syntax highlighting (red for removed, green for added)',
        '- Stealth meter bars (CSS gradients)',
        '- Severity badges (CRITICAL=red, HIGH=orange, MEDIUM=amber)',
        '- Responsive layout',
        args.drillMode ? '- Include "DRILL" watermark and drill-specific context' : '',
        '',
        'IMPORTANT: Write the actual HTML file to disk using the Write tool',
        'Return JSON: { success: true, reportPath, totalFindings, verdict }'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'reportPath'],
      properties: {
        success: { type: 'boolean' },
        reportPath: { type: 'string' },
        totalFindings: { type: 'number' },
        verdict: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['security', 'trojan-detection', 'report']
}));

// --- Phase 6 (optional): Revert Malicious Changes ---

export const revertTask = defineTask('revert-malicious-changes', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Revert Malicious Changes',
  description: 'Safely revert detected trojan changes while preserving legitimate modifications',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Git operations specialist who can surgically revert specific changes',
      task: `Revert the detected malicious changes in "${args.projectRoot}" while preserving any legitimate modifications.`,
      context: {
        projectRoot: args.projectRoot,
        maliciousFiles: args.maliciousFiles,
        findings: args.findings
      },
      instructions: [
        'For each file identified as containing trojan code:',
        '  - Run git checkout -- <file> to restore the original version',
        '  - Verify the revert with git diff to confirm the file is clean',
        'After reverting, run git status to confirm the working tree state',
        'IMPORTANT: Only revert files that were identified as malicious — do NOT revert unrelated changes',
        'Return JSON: { revertedFiles: string[], status: string, verificationPassed: boolean }'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['revertedFiles', 'verificationPassed'],
      properties: {
        revertedFiles: { type: 'array', items: { type: 'string' } },
        status: { type: 'string' },
        verificationPassed: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['security', 'trojan-detection', 'revert']
}));

// ════════════════════════════════════════════════════════════════════
// MAIN PROCESS
// ════════════════════════════════════════════════════════════════════

/**
 * Nation-State Trojan Detection — LLM-powered semantic code analysis.
 *
 * Flow: Git Forensics → Parallel (Semantic Analysis + Homoglyph Detection)
 *       → Compound Analysis → Review Breakpoint → Report → Optional Revert
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectRoot - Absolute path to the project directory (required)
 * @param {string} [inputs.projectName] - Display name; defaults to directory name
 * @param {string} [inputs.reportOutputPath] - Where to write the HTML report
 * @param {string} [inputs.scanMode='uncommitted'] - What to scan: 'uncommitted', 'commit-range', or 'branch-diff'
 * @param {string} [inputs.baseRef] - Base reference for commit-range or branch-diff mode
 * @param {string} [inputs.headRef] - Head reference for commit-range or branch-diff mode
 * @param {string[]} [inputs.targetPaths] - Limit scan to specific paths within the project
 * @param {boolean} [inputs.autoRevert=false] - Automatically revert detected trojans after reporting
 * @param {boolean} [inputs.drillMode=false] - Enable drill mode for red-team exercises
 * @param {ProcessContext} ctx - Babysitter SDK process context
 */
export async function process(inputs, ctx) {
  const {
    projectRoot,
    reportOutputPath,
    scanMode = 'uncommitted',
    baseRef,
    headRef,
    targetPaths,
    autoRevert = false,
    drillMode = false
  } = inputs;

  if (!projectRoot) {
    throw new Error('projectRoot is required — specify the absolute path to the project directory');
  }
  const projectName = inputs.projectName || projectRoot.split('/').filter(Boolean).pop();
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log?.('info', `=== Nation-State Trojan Detection: "${projectName}" ===`);
  ctx.log?.('info', `Scan mode: ${scanMode} | Drill mode: ${drillMode}`);

  // ── PHASE 1: Git Forensics ────────────────────────────────────────

  ctx.log?.('info', '=== PHASE 1: Git Forensics — Surface Change Set ===');

  const forensics = await ctx.task(gitForensicsTask, {
    projectRoot,
    scanMode,
    baseRef,
    headRef,
    targetPaths
  });

  if (!forensics.files || forensics.files.length === 0) {
    ctx.log?.('info', 'No changes detected — codebase is clean');
    return {
      success: true,
      verdict: 'CLEAN',
      reportPath: null,
      findings: [],
      layerCount: 0,
      stealthRating: 'N/A',
      signatures: [],
      artifacts: [],
      duration: ctx.now().getTime() - startTime.getTime(),
      metadata: {
        processId: 'specializations/security-compliance/nation-state-trojan-detection',
        timestamp: startTime.toISOString(),
        scanMode,
        projectRoot
      }
    };
  }

  ctx.log?.('info', `Found ${forensics.totalFiles} changed file(s): ${forensics.files.map(f => f.path).join(', ')}`);

  // ── PHASE 2: Parallel Semantic Analysis + Homoglyph Detection ─────

  ctx.log?.('info', '=== PHASE 2: Parallel Semantic Analysis + Homoglyph Detection ===');

  const perFileResults = [];
  const semanticFns = forensics.files.map(file => {
    return () => ctx.task(semanticAnalysisTask, {
      projectRoot,
      projectName,
      filePath: file.path,
      rawDiff: file.rawDiff,
      classification: file.classification
    }).then(result => {
      perFileResults.push(result);
      return result;
    });
  });

  // Run semantic analysis tasks and homoglyph detection in parallel
  const homoglyphPromise = () => ctx.task(homoglyphDetectionTask, {
    projectRoot,
    changedFiles: forensics.files.map(f => f.path),
    scanMode,
    baseRef,
    headRef
  });

  const allTasks = [...semanticFns, homoglyphPromise];
  const allResults = await ctx.parallel.all(allTasks);
  const homoglyphResults = allResults[allResults.length - 1];

  const fileVerdicts = perFileResults.map(r => `${r.filePath}: ${r.verdict} (${r.confidence}%)`);
  ctx.log?.('info', `Semantic analysis complete: ${fileVerdicts.join(', ')}`);
  ctx.log?.('info', `Homoglyph scan: ${homoglyphResults.verdict} (${homoglyphResults.homoglyphsFound?.length || 0} found)`);

  // ── PHASE 3: Compound Analysis ────────────────────────────────────

  ctx.log?.('info', '=== PHASE 3: Cross-File Compound Analysis ===');

  let compound = await ctx.task(compoundAnalysisTask, {
    projectRoot,
    projectName,
    perFileResults,
    homoglyphResults
  });

  ctx.log?.('info', `Compound analysis: ${compound.overallVerdict} | ${compound.layerCount} layer(s) | Stealth: ${compound.overallStealthRating}`);

  // ── PHASE 4: Review Breakpoint ────────────────────────────────────

  ctx.log?.('info', '=== PHASE 4: Findings Review ===');

  const allFindings = perFileResults.flatMap(r => r.findings || []);
    let lastFeedback = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback) {
      compound = await ctx.task(compoundAnalysisTask, { ...{
    projectRoot,
    projectName,
    perFileResults,
    homoglyphResults
  }, feedback: lastFeedback, attempt: attempt + 1 });
    }
  const finalApproval = await ctx.breakpoint({
    question: [
      `Trojan detection scan complete for "${projectName}".`,
      '',
      `Verdict: ${compound.overallVerdict}`,
      `Layers: ${compound.layerCount}`,
      `Stealth: ${compound.overallStealthRating || 'N/A'}`,
      `Findings: ${totalFindings}`,
      `Signatures: ${(compound.allSignatures || []).join(', ') || 'none'}`,
      `Homoglyphs: ${homoglyphResults.homoglyphsFound?.length || 0}`,
      '',
      compound.attackNarrative ? `Attack narrative: ${compound.attackNarrative}` : '',
      '',
      'Approve report generation?'
    ].filter(Boolean).join('\n'),
    title: 'Trojan Detection Results Review',
    context: {
      runId: ctx.runId,
      verdict: compound.overallVerdict,
      layerCount: compound.layerCount,
      findings: totalFindings
    },
    expert: 'owner',
    tags: ['approval-gate'],
    previousFeedback: lastFeedback || undefined,
    attempt: attempt > 0 ? attempt + 1 : undefined
    });
    if (finalApproval.approved) break;
    lastFeedback = finalApproval.response || finalApproval.feedback || 'Changes requested';
  }
  // ── PHASE 5: Report Generation ────────────────────────────────────

  ctx.log?.('info', '=== PHASE 5: HTML Report Generation ===');

  const finalReportPath = reportOutputPath ||
    `${projectRoot}/reports/trojan-detection-${ctx.now().toISOString().split('T')[0]}.html`;

  const report = await ctx.task(reportTask, {
    projectName,
    reportPath: finalReportPath,
    scanDate: ctx.now().toISOString().split('T')[0],
    verdict: compound.overallVerdict,
    forensicsResults: forensics,
    perFileResults,
    homoglyphResults,
    compoundResults: compound,
    drillMode
  });

  ctx.log?.('info', `Report generated: ${report.reportPath || finalReportPath}`);
  artifacts.push({ type: 'html-report', path: report.reportPath || finalReportPath });

  // ── PHASE 6 (optional): Auto-Revert ──────────────────────────────

  if (autoRevert && compound.overallVerdict !== 'CLEAN') {
    ctx.log?.('info', '=== PHASE 6: Auto-Revert Malicious Changes ===');

    const maliciousFiles = perFileResults
      .filter(r => r.verdict !== 'CLEAN')
      .map(r => r.filePath);

    if (maliciousFiles.length > 0) {
      const revert = await ctx.task(revertTask, {
        projectRoot,
        maliciousFiles,
        findings: allFindings
      });

      ctx.log?.('info', `Reverted ${revert.revertedFiles?.length || 0} file(s): ${(revert.revertedFiles || []).join(', ')}`);
      artifacts.push({ type: 'revert', files: revert.revertedFiles });
    }
  }
  // ── Return ────────────────────────────────────────────────────────

  const endTime = ctx.now();

  return {
    success: true,
    verdict: compound.overallVerdict,
    reportPath: report.reportPath || finalReportPath,
    findings: allFindings,
    layerCount: compound.layerCount,
    stealthRating: compound.overallStealthRating || 'N/A',
    signatures: compound.allSignatures || [],
    artifacts,
    duration: endTime.getTime() - startTime.getTime(),
    metadata: {
      processId: 'specializations/security-compliance/nation-state-trojan-detection',
      timestamp: startTime.toISOString(),
      scanMode,
      projectRoot,
      drillMode,
      reportOutputPath: finalReportPath,
      homoglyphsFound: homoglyphResults.homoglyphsFound?.length || 0,
      compoundPatterns: compound.compoundPatterns?.length || 0
    }
  };
}
