/**
 * @process assimilation/workflows/methodology-assimilation
 * @description Assimilate an external AI coding workflow/methodology (e.g., GSD, Aider, Mentat)
 *   from its source repo. Learns the procedural instructions, commands, agent roles, and manual
 *   triggering flows, then converts them into well-defined babysitter process definitions with
 *   accompanying skills/ and agents/ directories — matching the software-architecture specialization
 *   pattern. Supports outputting to either methodologies/ (enriching existing conversions) or
 *   specializations/ (standalone new specialization).
 *
 * @inputs {
 *   sourceRepo: string,           // GitHub URL or local path to source methodology repo
 *   methodologyName: string,      // e.g., "gsd", "aider"
 *   methodologyDisplayName: string, // e.g., "Get Shit Done", "Aider"
 *   outputTarget: "methodology" | "specialization", // Where to write output
 *   existingConversionPath: string | null,  // Path to existing babysitter conversion (if enriching)
 *   targetQuality: number,        // Quality gate threshold (0-100), default 85
 *   maxIterations: number         // Max convergence iterations, default 3
 * }
 *
 * @outputs {
 *   success: boolean,
 *   outputPath: string,
 *   processFiles: string[],
 *   skillsDirs: string[],
 *   agentsDirs: string[],
 *   supportFiles: string[],
 *   finalQuality: number,
 *   iterations: number
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 1: DEEP RESEARCH — Learn the source methodology
// ═══════════════════════════════════════════════════════════════════════════

const researchSourceRepoTask = defineTask('research-source-repo', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deep research: ${args.methodologyDisplayName} source repository`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior methodology analyst and software archaeologist',
      task: `Perform exhaustive research on the ${args.methodologyDisplayName} methodology from its source repository at ${args.sourceRepo}.

You must produce a comprehensive analysis covering ALL of the following:

1. REPOSITORY STRUCTURE — Full directory tree with descriptions of every significant file/directory
2. COMMAND DEFINITIONS — Every slash command, CLI command, or entry point. For each:
   - Name, description, arguments
   - What workflow/file it references
   - Tools/permissions it requires
3. WORKFLOW DEFINITIONS — Every procedural workflow. For each:
   - Step-by-step flow (preserve the exact sequencing)
   - Decision points and branching logic
   - State transitions
   - Input/output contracts
4. AGENT DEFINITIONS — Every agent/role. For each:
   - Name, role description, expertise
   - Tools/permissions
   - Prompt patterns and deviation rules
   - Which workflows use this agent
5. TEMPLATES — Every template file and its purpose
6. REFERENCES — Every reference doc and its content domain
7. STATE MODEL — How the methodology tracks state (files, format, transitions)
8. CONFIGURATION — Config options and their effects
9. HOOKS — Any lifecycle hooks and what they do
10. CROSS-CUTTING PATTERNS — Recurring patterns like:
    - Context engineering (how it manages LLM context windows)
    - Quality gates (verification, checking, approval)
    - Parallelization strategies
    - Error handling and recovery
    - Git integration patterns`,
      context: {
        sourceRepo: args.sourceRepo,
        methodologyName: args.methodologyName,
        methodologyDisplayName: args.methodologyDisplayName
      },
      instructions: [
        `Research the repository at ${args.sourceRepo} thoroughly`,
        'Read the README, package.json, and all key files',
        'Map every command to its workflow definition',
        'Map every agent to the workflows that use it',
        'Identify the complete lifecycle (init → research → plan → execute → verify)',
        'Note every state file and its format',
        'Document the exact sequencing of steps within each workflow',
        'Identify which parts are procedural instructions vs agent prompts vs tool configs',
        'Return comprehensive structured analysis'
      ],
      outputFormat: `JSON with {
        overview: { name, version, description, philosophy, targetUsers },
        structure: { directories: [{path, purpose, files: [{name, purpose, size}]}] },
        commands: [{ name, description, args, workflowRef, tools, agentRef }],
        workflows: [{ name, file, steps: [{order, action, agent, description, inputs, outputs, branching}], stateTransitions }],
        agents: [{ name, role, expertise: [], tools: [], workflows: [], promptPatterns: {}, deviationRules: [] }],
        templates: [{ name, file, purpose, fields }],
        references: [{ name, file, domain }],
        stateModel: { files: [{name, format, purpose, transitions}], persistenceDir },
        config: { file, options: [{key, type, default, description}] },
        hooks: [{ name, trigger, purpose }],
        patterns: { contextEngineering, qualityGates, parallelization, errorHandling, gitIntegration }
      }`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'assimilation', 'research', 'methodology']
}));

const researchExistingConversionTask = defineTask('research-existing-conversion', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze existing babysitter conversion: ${args.methodologyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Babysitter SDK process analyst',
      task: `Analyze the existing babysitter conversion of ${args.methodologyDisplayName} at ${args.existingConversionPath}.

Map what has already been converted and what is missing:
1. Which process .js files exist? What do they cover?
2. Are there skills/ and agents/ directories? What's in them?
3. What parts of the source methodology are NOT yet represented?
4. What agent roles are inlined in .js files that should be extracted to agents/ dirs?
5. What tool/capability abstractions are missing that should become skills?
6. Quality of existing conversion: accuracy of mapping, completeness, structure`,
      context: {
        existingConversionPath: args.existingConversionPath,
        methodologyName: args.methodologyName,
        sourceResearch: args.sourceResearch
      },
      instructions: [
        `Read all files at ${args.existingConversionPath}`,
        'Compare each process file against the source methodology research',
        'Identify gaps: missing processes, missing agents, missing skills',
        'Identify inlined agents that should be extracted',
        'Identify tool capabilities that should become skills',
        'Return structured gap analysis'
      ],
      outputFormat: `JSON with {
        existingProcesses: [{ file, coversWorkflow, quality }],
        existingSkills: [{ dir, name }],
        existingAgents: [{ dir, name }],
        missingProcesses: [{ sourceWorkflow, reason }],
        inlinedAgents: [{ processFile, agentName, role, shouldExtract: boolean }],
        missingSkills: [{ name, purpose, usedByProcesses }],
        missingAgents: [{ name, role, usedByProcesses }],
        supportFilesNeeded: [{ file, purpose }],
        overallGapScore: number
      }`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'assimilation', 'gap-analysis']
}));

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2: ARCHITECTURE — Design the babysitter process structure
// ═══════════════════════════════════════════════════════════════════════════

const designProcessArchitectureTask = defineTask('design-process-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design babysitter process architecture for ${args.methodologyDisplayName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Babysitter SDK process architect specializing in methodology conversion',
      task: `Design the complete babysitter process architecture for ${args.methodologyDisplayName}.

Using the source research and gap analysis, design:

1. PROCESS FILES — Which .js process files to create/update. Each process should:
   - Map to one or more source workflows
   - Use defineTask() for each step
   - Include quality-gated convergence loops where appropriate
   - Use ctx.parallel.all() for independent steps
   - Include ctx.breakpoint() for human review gates

2. SKILLS DIRECTORY — Which skills to create. Each skill should:
   - Abstract a reusable capability (not a role)
   - Have a SKILL.md with: name, description, allowed-tools, capabilities, configuration
   - Have a README.md with quick start and examples
   - Be referenced by process files via skill: { name: 'skill-name' }

3. AGENTS DIRECTORY — Which agents to create. Each agent should:
   - Represent a specialized role/expertise (not a capability)
   - Have an AGENT.md with: name, description, role, expertise, prompt template, target processes
   - Have a README.md with overview and use cases
   - Be referenced by process files via agent: { name: 'agent-name' }

4. SUPPORT FILES — README.md, references.md, processes-backlog.md, skills-agents-backlog.md

5. OUTPUT DIRECTORY STRUCTURE — Complete tree of files to create

DESIGN PRINCIPLES:
- Separate concerns: agents own ROLES, skills own CAPABILITIES
- Skills are reusable across multiple processes and agents
- Agents can use multiple skills
- Process files orchestrate agents using skills
- Match the software-architecture specialization pattern exactly
- Preserve the source methodology's philosophy and sequencing
- Add quality gates that the source may lack
- Convert procedural instructions into structured agent prompts
- Convert manual command flows into automated process phases`,
      context: {
        sourceResearch: args.sourceResearch,
        gapAnalysis: args.gapAnalysis,
        outputTarget: args.outputTarget,
        outputBasePath: args.outputBasePath,
        referencePattern: 'library/specializations/software-architecture/ — has skills/ with 43 skills, agents/ with 34+ agents, 20 process .js files, README.md, references.md, backlogs'
      },
      instructions: [
        'Map every source workflow to one or more process .js files',
        'Extract every agent role from source into agents/ directory',
        'Identify tool/capability abstractions for skills/ directory',
        'Design the complete file tree',
        'For each process, list the phases and task types',
        'For each skill, list capabilities and which processes use it',
        'For each agent, list expertise and which processes use it',
        'Ensure no inlined agent definitions — all should reference agents/ dir',
        'Return the complete architecture design'
      ],
      outputFormat: `JSON with {
        outputBasePath: string,
        directoryTree: string,
        processes: [{ file, name, description, phases: [{name, tasks: [{taskId, agent, skill, kind}]}], sourceWorkflows }],
        skills: [{ dirName, name, description, capabilities: [], usedByProcesses: [], allowedTools: [] }],
        agents: [{ dirName, name, role, expertise: [], usedByProcesses: [], promptTemplate: {} }],
        supportFiles: [{ file, purpose }],
        migrationNotes: string
      }`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'assimilation', 'architecture', 'design']
}));

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 3: GENERATE — Create all the files
// ═══════════════════════════════════════════════════════════════════════════

const generateProcessFilesTask = defineTask('generate-process-files', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate process .js files for ${args.methodologyDisplayName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Babysitter SDK process developer',
      task: `Generate all babysitter process definition .js files for ${args.methodologyDisplayName}.

For each process in the architecture design, create a complete .js file that:
- Has JSDoc header with @process, @description, @inputs, @outputs
- Imports defineTask from '@a5c-ai/babysitter-sdk'
- Exports async function process(inputs, ctx)
- Defines all tasks with kind: 'agent', referencing agents from agents/ dir
- References skills from skills/ dir where appropriate
- Uses ctx.parallel.all() for independent tasks
- Uses ctx.breakpoint() for human review gates
- Includes quality-gated convergence loops
- Includes ctx.log() for progress tracking
- Has proper io paths and labels on every task`,
      context: {
        architecture: args.architecture,
        sourceResearch: args.sourceResearch,
        outputBasePath: args.outputBasePath
      },
      instructions: [
        'Create every process file listed in the architecture',
        `Write files under ${args.outputBasePath}/`,
        'Follow the exact pattern from software-architecture specialization',
        'Reference agents by name from agents/ dir (not inlined)',
        'Reference skills by name from skills/ dir',
        'Preserve source methodology sequencing and philosophy',
        'Add quality gates where the source lacks them',
        'Return list of all files created'
      ],
      outputFormat: 'JSON with { filesCreated: [{ path, processId, phases, taskCount }], totalFiles: number }'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'assimilation', 'generate', 'processes']
}));

const generateSkillsTask = defineTask('generate-skills', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate skills/ directory for ${args.methodologyDisplayName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Babysitter skill designer and technical writer',
      task: `Generate all skill directories for ${args.methodologyDisplayName}.

For each skill in the architecture design, create a directory with:

1. SKILL.md — YAML frontmatter with:
   - name, description, allowed-tools, metadata (author, version, category, backlog-id)
   Then markdown body with:
   - Overview and capabilities
   - Prerequisites
   - Detailed capability sections with examples
   - Tool use instructions (which tools the skill uses and how)
   - Process integration (which processes reference this skill)
   - Output format specification
   - Configuration options
   - Error handling and troubleshooting
   - Constraints

2. README.md — Quick start guide with:
   - Installation/prerequisites
   - Basic usage examples
   - Process integration table
   - Troubleshooting tips`,
      context: {
        architecture: args.architecture,
        sourceResearch: args.sourceResearch,
        outputBasePath: args.outputBasePath
      },
      instructions: [
        'Create every skill directory and files listed in the architecture',
        `Write files under ${args.outputBasePath}/skills/`,
        'Follow the exact SKILL.md pattern from software-architecture/skills/',
        'Include tool use instructions specific to each skill',
        'Include process integration table showing which processes use each skill',
        'Return list of all files created'
      ],
      outputFormat: 'JSON with { skillsCreated: [{ dir, name, files: [] }], totalSkills: number }'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'assimilation', 'generate', 'skills']
}));

const generateAgentsTask = defineTask('generate-agents', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate agents/ directory for ${args.methodologyDisplayName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Babysitter agent designer and prompt engineer',
      task: `Generate all agent directories for ${args.methodologyDisplayName}.

For each agent in the architecture design, create a directory with:

1. AGENT.md — YAML frontmatter with:
   - name, description, role, expertise (list)
   Then markdown body with:
   - Overview of the agent's specialization
   - Capabilities list
   - Target processes (which processes use this agent)
   - Prompt template structure (role, expertise areas, task framing, guidelines, output format)
   - Interaction patterns (how it collaborates with other agents/skills)
   - Deviation rules (when to auto-fix vs ask for guidance)

2. README.md — Brief agent overview with:
   - Expertise summary
   - Use cases
   - Example task integration`,
      context: {
        architecture: args.architecture,
        sourceResearch: args.sourceResearch,
        outputBasePath: args.outputBasePath
      },
      instructions: [
        'Create every agent directory and files listed in the architecture',
        `Write files under ${args.outputBasePath}/agents/`,
        'Follow the exact AGENT.md pattern from software-architecture/agents/',
        'Preserve original agent roles and expertise from source methodology',
        'Add prompt templates that match the babysitter task definition pattern',
        'Map deviation rules from source where they exist',
        'Return list of all files created'
      ],
      outputFormat: 'JSON with { agentsCreated: [{ dir, name, role, files: [] }], totalAgents: number }'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'assimilation', 'generate', 'agents']
}));

const generateSupportFilesTask = defineTask('generate-support-files', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate support files for ${args.methodologyDisplayName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical documentation writer',
      task: `Generate support files for the ${args.methodologyDisplayName} babysitter specialization.

Create:
1. README.md — Specialization overview matching software-architecture/README.md pattern:
   - Category, focus, scope
   - Overview of the methodology
   - Roles and responsibilities
   - Process catalog (table of all process files)
   - Skills catalog (table of all skills)
   - Agents catalog (table of all agents)
   - Usage guide

2. references.md — Reference materials and links:
   - Source repo reference
   - Key concepts and terminology
   - External resources

3. processes-backlog.md — Future process ideas

4. skills-agents-backlog.md — Future skills/agents ideas

5. examples/ directory — JSON input examples for each process file`,
      context: {
        architecture: args.architecture,
        sourceResearch: args.sourceResearch,
        outputBasePath: args.outputBasePath
      },
      instructions: [
        `Write files under ${args.outputBasePath}/`,
        'Follow software-architecture support file patterns',
        'Include complete catalogs of all processes, skills, agents',
        'Create example input JSONs for every process',
        'Return list of all files created'
      ],
      outputFormat: 'JSON with { filesCreated: [{ path, purpose }], totalFiles: number }'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'assimilation', 'generate', 'support']
}));

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 4: VERIFY — Quality gate
// ═══════════════════════════════════════════════════════════════════════════

const verifyAssimilationTask = defineTask('verify-assimilation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify assimilation quality for ${args.methodologyDisplayName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Quality assurance engineer specializing in babysitter process verification',
      task: `Verify the quality of the ${args.methodologyDisplayName} assimilation output.

Score on these dimensions (weighted):
1. COMPLETENESS (30%): Every source workflow, agent, and capability is represented
2. ACCURACY (25%): Process flows match source methodology sequencing and philosophy
3. STRUCTURE (20%): Matches software-architecture pattern (skills/, agents/, proper SKILL.md/AGENT.md)
4. SEPARATION (15%): Clean separation — agents own roles, skills own capabilities, no inlining
5. QUALITY_GATES (10%): Convergence loops and breakpoints present where appropriate

For each dimension:
- Score 0-100
- List specific issues with file paths
- List specific fixes

Calculate weighted overall score.`,
      context: {
        outputBasePath: args.outputBasePath,
        architecture: args.architecture,
        sourceResearch: args.sourceResearch,
        targetScore: args.targetScore
      },
      instructions: [
        `Read all generated files under ${args.outputBasePath}/`,
        'Verify every source workflow has a corresponding process',
        'Verify every process task references an agent from agents/ dir',
        'Verify skill references point to existing skills',
        'Check SKILL.md and AGENT.md formats match the reference pattern',
        'Check for inlined agent definitions that should be extracted',
        'Verify quality gates and convergence loops exist',
        'Return structured scoring'
      ],
      outputFormat: `JSON with {
        overall: number,
        completeness: { score: number, issues: [{ file, issue, fix }] },
        accuracy: { score: number, issues: [{ file, issue, fix }] },
        structure: { score: number, issues: [{ file, issue, fix }] },
        separation: { score: number, issues: [{ file, issue, fix }] },
        qualityGates: { score: number, issues: [{ file, issue, fix }] },
        topFixes: [{ priority: number, description: string, file: string }]
      }`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'assimilation', 'verify', 'quality']
}));

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 5: CONVERGE — Fix and re-verify
// ═══════════════════════════════════════════════════════════════════════════

const fixAssimilationTask = defineTask('fix-assimilation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fix assimilation issues for ${args.methodologyDisplayName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Babysitter SDK developer fixing assimilation quality issues',
      task: `Apply the review feedback to fix issues in the ${args.methodologyDisplayName} assimilation.

Feedback: ${JSON.stringify(args.feedback)}

Apply all fixes systematically:
1. Add missing processes for uncovered source workflows
2. Extract inlined agents to agents/ directory
3. Create missing skills in skills/ directory
4. Fix SKILL.md/AGENT.md format issues
5. Add missing quality gates and convergence loops
6. Fix process flow accuracy`,
      context: {
        outputBasePath: args.outputBasePath,
        feedback: args.feedback
      },
      instructions: [
        'Apply each fix from the feedback',
        'Do not remove working content',
        'Add missing files and directories',
        'Fix format issues in existing files',
        'Return summary of changes made'
      ],
      outputFormat: 'JSON with { changesApplied: number, filesModified: [], filesCreated: [], summary: string }'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'assimilation', 'fix', 'convergence']
}));

// ═══════════════════════════════════════════════════════════════════════════
// PROCESS FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

export async function process(inputs, ctx) {
  const {
    sourceRepo,
    methodologyName,
    methodologyDisplayName,
    outputTarget = 'methodology',
    existingConversionPath = null,
    targetQuality = 85,
    maxIterations = 3
  } = inputs;

  // Determine output base path
  const basePaths = {
    methodology: `library/methodologies/${methodologyName}`,
    specialization: `library/specializations/${methodologyName}`
  };
  const outputBasePath = basePaths[outputTarget] || basePaths.methodology;

  // ═══════════════════════════════════════════════════════════════════
  // PHASE 1: DEEP RESEARCH
  // ═══════════════════════════════════════════════════════════════════

  ctx.log('info', `Phase 1: Deep research of ${methodologyDisplayName} from ${sourceRepo}`);

  const researchTasks = [
    () => ctx.task(researchSourceRepoTask, {
      sourceRepo,
      methodologyName,
      methodologyDisplayName
    })
  ];

  // If there's an existing conversion, analyze it in parallel
  if (existingConversionPath) {
    // Run source research first, then gap analysis needs its output
    const sourceResearch = await ctx.task(researchSourceRepoTask, {
      sourceRepo,
      methodologyName,
      methodologyDisplayName
    });

    let gapAnalysis = await ctx.task(researchExistingConversionTask, {
      existingConversionPath,
      methodologyName,
      methodologyDisplayName,
      sourceResearch
    });

    ctx.log('info', `Research complete. Gap score: ${gapAnalysis.overallGapScore || 'N/A'}`);

    // ═══════════════════════════════════════════════════════════════
    // PHASE 1.5: BREAKPOINT — Review research before architecture
      let lastFeedback_finalApproval = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (lastFeedback_finalApproval) {
        gapAnalysis = await ctx.task(researchExistingConversionTask, { ...{
      existingConversionPath,
      methodologyName,
      methodologyDisplayName,
      sourceResearch
    }, feedback: lastFeedback_finalApproval, attempt: attempt + 1 });
      }
  const finalApproval = await ctx.breakpoint({
      question: `Research on ${methodologyDisplayName} is complete. Found ${gapAnalysis.missingProcesses?.length || 0} missing processes, ${gapAnalysis.missingSkills?.length || 0} missing skills, ${gapAnalysis.missingAgents?.length || 0} missing agents. Proceed with architecture design?`,
      title: 'Research Review',
      context: { runId: ctx.runId },
      expert: 'owner',
      tags: ['approval-gate'],
      previousFeedback: lastFeedback_finalApproval || undefined,
      attempt: attempt > 0 ? attempt + 1 : undefined
      });
      if (finalApproval.approved) break;
      lastFeedback_finalApproval = finalApproval.response || finalApproval.feedback || 'Changes requested';
    }
  // ═══════════════════════════════════════════════════════════════
    // PHASE 2: ARCHITECTURE
    // ═══════════════════════════════════════════════════════════════

    ctx.log('info', 'Phase 2: Designing babysitter process architecture');
    const architecture = await ctx.task(designProcessArchitectureTask, {
      sourceResearch,
      gapAnalysis,
      outputTarget,
      outputBasePath,
      methodologyName,
      methodologyDisplayName
    });

    // ═══════════════════════════════════════════════════════════════
    // PHASE 3: GENERATE — Create all files in parallel
    // ═══════════════════════════════════════════════════════════════

    ctx.log('info', 'Phase 3: Generating all files');
    const [processResults, skillsResults, agentsResults, supportResults] = await ctx.parallel.all([
      () => ctx.task(generateProcessFilesTask, {
        architecture,
        sourceResearch,
        outputBasePath,
        methodologyDisplayName
      }),
      () => ctx.task(generateSkillsTask, {
        architecture,
        sourceResearch,
        outputBasePath,
        methodologyDisplayName
      }),
      () => ctx.task(generateAgentsTask, {
        architecture,
        sourceResearch,
        outputBasePath,
        methodologyDisplayName
      }),
      () => ctx.task(generateSupportFilesTask, {
        architecture,
        sourceResearch,
        outputBasePath,
        methodologyDisplayName
      })
    ]);

    ctx.log('info', `Generated: ${processResults.totalFiles || 0} processes, ${skillsResults.totalSkills || 0} skills, ${agentsResults.totalAgents || 0} agents, ${supportResults.totalFiles || 0} support files`);

    // ═══════════════════════════════════════════════════════════════
    // PHASE 4: VERIFY — Quality gate
    // ═══════════════════════════════════════════════════════════════

    ctx.log('info', 'Phase 4: Quality verification');
    let verifyResult = await ctx.task(verifyAssimilationTask, {
      outputBasePath,
      architecture,
      sourceResearch,
      targetScore: targetQuality,
      methodologyDisplayName
    });

    // ═══════════════════════════════════════════════════════════════
    // PHASE 5: CONVERGE — Fix loop
    // ═══════════════════════════════════════════════════════════════

    let iteration = 0;
    while (verifyResult.overall < targetQuality && iteration < maxIterations) {
      iteration++;
      ctx.log('info', `Convergence iteration ${iteration}: score=${verifyResult.overall}, target=${targetQuality}`);

      await ctx.task(fixAssimilationTask, {
        outputBasePath,
        feedback: verifyResult,
        methodologyDisplayName
      });

      verifyResult = await ctx.task(verifyAssimilationTask, {
        outputBasePath,
        architecture,
        sourceResearch,
        targetScore: targetQuality,
        methodologyDisplayName
      });
    }

    ctx.log('info', `Assimilation complete: score=${verifyResult.overall}, iterations=${iteration}`);

    return {
      success: verifyResult.overall >= targetQuality,
      outputPath: outputBasePath,
      processFiles: processResults.filesCreated?.map(f => f.path) || [],
      skillsDirs: skillsResults.skillsCreated?.map(s => s.dir) || [],
      agentsDirs: agentsResults.agentsCreated?.map(a => a.dir) || [],
      supportFiles: supportResults.filesCreated?.map(f => f.path) || [],
      finalQuality: verifyResult.overall,
      iterations: iteration,
      metadata: {
        processId: 'assimilation/workflows/methodology-assimilation',
        timestamp: ctx.now()
      }
    };

  } else {
    // No existing conversion — fresh assimilation
    const sourceResearch = await ctx.task(researchSourceRepoTask, {
      sourceRepo,
      methodologyName,
      methodologyDisplayName
    let lastFeedback_finalApproval2 = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (lastFeedback_finalApproval2) {
        verifyResult = await ctx.task(verifyAssimilationTask, { ...{
      outputBasePath,
      architecture,
      sourceResearch,
      targetScore: targetQuality,
      methodologyDisplayName
    }, feedback: lastFeedback_finalApproval2, attempt: attempt + 1 });
      }
  const finalApproval2 = await ctx.breakpoint({
      question: `Research on ${methodologyDisplayName} is complete. Found ${sourceResearch.workflows?.length || 0} workflows, ${sourceResearch.agents?.length || 0} agents, ${sourceResearch.commands?.length || 0} commands. Proceed with architecture design?`,
      title: 'Research Review',
      context: { runId: ctx.runId },
      expert: 'owner',
      tags: ['approval-gate'],
      previousFeedback: lastFeedback_finalApproval2 || undefined,
      attempt: attempt > 0 ? attempt + 1 : undefined
      });
      if (finalApproval2.approved) break;
      lastFeedback_finalApproval2 = finalApproval2.response || finalApproval2.feedback || 'Changes requested';
    }

    ctx.log('info', 'Phase 2: Designing babysitter process architecture');
    const architecture = await ctx.task(designProcessArchitectureTask, {
      sourceResearch,
      gapAnalysis: null,
      outputTarget,
      outputBasePath,
      methodologyName,
      methodologyDisplayName
    });

    ctx.log('info', 'Phase 3: Generating all files');
    const [processResults, skillsResults, agentsResults, supportResults] = await ctx.parallel.all([
      () => ctx.task(generateProcessFilesTask, { architecture, sourceResearch, outputBasePath, methodologyDisplayName }),
      () => ctx.task(generateSkillsTask, { architecture, sourceResearch, outputBasePath, methodologyDisplayName }),
      () => ctx.task(generateAgentsTask, { architecture, sourceResearch, outputBasePath, methodologyDisplayName }),
      () => ctx.task(generateSupportFilesTask, { architecture, sourceResearch, outputBasePath, methodologyDisplayName })
    ]);

    ctx.log('info', 'Phase 4: Quality verification');
    let verifyResult = await ctx.task(verifyAssimilationTask, {
      outputBasePath, architecture, sourceResearch, targetScore: targetQuality, methodologyDisplayName
    });

    let iteration = 0;
    while (verifyResult.overall < targetQuality && iteration < maxIterations) {
      iteration++;
      ctx.log('info', `Convergence iteration ${iteration}: score=${verifyResult.overall}, target=${targetQuality}`);
      await ctx.task(fixAssimilationTask, { outputBasePath, feedback: verifyResult, methodologyDisplayName });
      verifyResult = await ctx.task(verifyAssimilationTask, {
        outputBasePath, architecture, sourceResearch, targetScore: targetQuality, methodologyDisplayName
      });
    }
  return {
      success: verifyResult.overall >= targetQuality,
      outputPath: outputBasePath,
      processFiles: processResults.filesCreated?.map(f => f.path) || [],
      skillsDirs: skillsResults.skillsCreated?.map(s => s.dir) || [],
      agentsDirs: agentsResults.agentsCreated?.map(a => a.dir) || [],
      supportFiles: supportResults.filesCreated?.map(f => f.path) || [],
      finalQuality: verifyResult.overall,
      iterations: iteration,
      metadata: {
        processId: 'assimilation/workflows/methodology-assimilation',
        timestamp: ctx.now()
      }
    };
  }
}
