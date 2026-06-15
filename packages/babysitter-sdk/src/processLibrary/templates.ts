/**
 * Built-in process templates — pre-defined process skeletons that can
 * be parameterised and instantiated for common development workflows
 * (GAP-AGENT-004).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TemplateParameter {
  name: string;
  description: string;
  required: boolean;
  defaultValue?: string;
}

export interface ProcessTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  parameters: TemplateParameter[];
  /** Generate a process definition from the given parameter values. */
  generateProcess(params: Record<string, string>): GeneratedProcess;
}

export interface GeneratedProcess {
  id: string;
  title: string;
  description: string;
  steps: GeneratedStep[];
}

export interface GeneratedStep {
  id: string;
  title: string;
  instruction: string;
}

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------

const fixBug: ProcessTemplate = {
  id: 'fix-bug',
  name: 'Fix Bug',
  description: 'Diagnose and fix a reported bug with regression tests.',
  category: 'maintenance',
  parameters: [
    { name: 'bugDescription', description: 'Description of the bug', required: true },
    { name: 'affectedFile', description: 'Primary file affected', required: false },
  ],
  generateProcess(params) {
    const desc = params.bugDescription ?? 'a reported bug';
    return {
      id: `fix-bug-${Date.now()}`,
      title: `Fix: ${desc}`,
      description: `Diagnose and fix: ${desc}`,
      steps: [
        { id: 'reproduce', title: 'Reproduce', instruction: `Reproduce the bug: ${desc}` },
        { id: 'diagnose', title: 'Diagnose', instruction: 'Identify root cause.' },
        { id: 'fix', title: 'Fix', instruction: `Apply fix${params.affectedFile ? ` in ${params.affectedFile}` : ''}.` },
        { id: 'test', title: 'Regression Test', instruction: 'Add regression test to prevent recurrence.' },
      ],
    };
  },
};

const addFeature: ProcessTemplate = {
  id: 'add-feature',
  name: 'Add Feature',
  description: 'Implement a new feature end-to-end.',
  category: 'development',
  parameters: [
    { name: 'featureName', description: 'Name of the feature', required: true },
    { name: 'scope', description: 'Scope description', required: false },
  ],
  generateProcess(params) {
    const name = params.featureName ?? 'new feature';
    return {
      id: `add-feature-${Date.now()}`,
      title: `Feature: ${name}`,
      description: `Implement ${name}${params.scope ? ` (${params.scope})` : ''}`,
      steps: [
        { id: 'design', title: 'Design', instruction: `Design the ${name} feature.` },
        { id: 'implement', title: 'Implement', instruction: `Implement ${name}.` },
        { id: 'test', title: 'Test', instruction: 'Write tests for the new feature.' },
        { id: 'document', title: 'Document', instruction: 'Update documentation.' },
      ],
    };
  },
};

const refactor: ProcessTemplate = {
  id: 'refactor',
  name: 'Refactor',
  description: 'Refactor code for improved clarity or performance.',
  category: 'maintenance',
  parameters: [
    { name: 'target', description: 'Code area to refactor', required: true },
    { name: 'goal', description: 'Goal of the refactor', required: false, defaultValue: 'improve clarity' },
  ],
  generateProcess(params) {
    const target = params.target ?? 'target code';
    const goal = params.goal ?? 'improve clarity';
    return {
      id: `refactor-${Date.now()}`,
      title: `Refactor: ${target}`,
      description: `Refactor ${target} to ${goal}.`,
      steps: [
        { id: 'analyse', title: 'Analyse', instruction: `Analyse ${target} for refactoring opportunities.` },
        { id: 'plan', title: 'Plan', instruction: `Plan refactoring steps to ${goal}.` },
        { id: 'refactor', title: 'Refactor', instruction: 'Apply refactoring changes.' },
        { id: 'verify', title: 'Verify', instruction: 'Ensure all tests still pass.' },
      ],
    };
  },
};

const testCoverage: ProcessTemplate = {
  id: 'test-coverage',
  name: 'Improve Test Coverage',
  description: 'Add tests to improve coverage for under-tested code.',
  category: 'testing',
  parameters: [
    { name: 'target', description: 'Module or file to cover', required: true },
    { name: 'coverageGoal', description: 'Target coverage percentage', required: false, defaultValue: '80' },
  ],
  generateProcess(params) {
    const target = params.target ?? 'target module';
    const goal = params.coverageGoal ?? '80';
    return {
      id: `test-coverage-${Date.now()}`,
      title: `Test Coverage: ${target}`,
      description: `Improve test coverage for ${target} to ${goal}%.`,
      steps: [
        { id: 'audit', title: 'Audit', instruction: `Measure current coverage of ${target}.` },
        { id: 'identify', title: 'Identify Gaps', instruction: 'Find uncovered branches and edge cases.' },
        { id: 'write-tests', title: 'Write Tests', instruction: `Write tests to reach ${goal}% coverage.` },
        { id: 'verify', title: 'Verify', instruction: 'Run coverage report and confirm goal met.' },
      ],
    };
  },
};

const codeReview: ProcessTemplate = {
  id: 'code-review',
  name: 'Code Review',
  description: 'Perform a structured code review on a branch or PR.',
  category: 'review',
  parameters: [
    { name: 'branch', description: 'Branch or PR to review', required: true },
    { name: 'focusAreas', description: 'Areas to focus on', required: false },
  ],
  generateProcess(params) {
    const branch = params.branch ?? 'target branch';
    return {
      id: `code-review-${Date.now()}`,
      title: `Review: ${branch}`,
      description: `Code review for ${branch}${params.focusAreas ? ` focusing on ${params.focusAreas}` : ''}.`,
      steps: [
        { id: 'overview', title: 'Overview', instruction: `Read the diff for ${branch}.` },
        { id: 'analyse', title: 'Analyse', instruction: `Check for correctness, style, and edge cases${params.focusAreas ? ` with focus on ${params.focusAreas}` : ''}.` },
        { id: 'feedback', title: 'Feedback', instruction: 'Write review comments.' },
        { id: 'summarise', title: 'Summarise', instruction: 'Provide overall assessment.' },
      ],
    };
  },
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const BUILT_IN_TEMPLATES: ProcessTemplate[] = [
  fixBug,
  addFeature,
  refactor,
  testCoverage,
  codeReview,
];

/**
 * Retrieve a template by id.
 */
export function getTemplate(id: string): ProcessTemplate | undefined {
  return BUILT_IN_TEMPLATES.find((t) => t.id === id);
}

/**
 * List all built-in templates.
 */
export function listTemplates(): ProcessTemplate[] {
  return [...BUILT_IN_TEMPLATES];
}

/**
 * List templates filtered by category.
 */
export function listByCategory(category: string): ProcessTemplate[] {
  return BUILT_IN_TEMPLATES.filter((t) => t.category === category);
}
