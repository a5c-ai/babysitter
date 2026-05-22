/**
 * @process specializations/research/patentable-novelties
 * @description Patentable Novelties persona — extends the novelties scanner with
 *   patent-potential assessment and generates a structured Invention Disclosure
 *   Questionnaire (YAML) for each qualifying invention.
 * @inputs { novelty: object, priorArt?: object[] }
 * @outputs { success: boolean, patentabilityScore: number, disclosureYaml: string, recommendation: string }
 *
 * Source: a5c-ai/registry/prompts/research/patentable-novelties-agent.prompt.md
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:research]
 *   skillAreas: [skill-area:deep-web-research, skill-area:data-analysis, skill-area:statistical-analysis]
 *   topics: [topic:developer-experience]
 *   roles: [role:research-engineer, role:tech-lead]
 *   workflows: [workflow:experiment-design]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// Verbatim questionnaire template from the source prompt. Agents fill in values.
const DISCLOSURE_QUESTIONNAIRE_YAML = `form_name: "Invention Disclosure Questionnaire"
sections:
  - name: "Patent Disclosure Overview"
    description: |
      An invention with potential for **patent** protection is a **technical solution** to a **problem** that:

      1. Has value for your project or business (direct, e.g. product differentiation, or indirect, e.g. cost effectiveness).
      2. Has not been applied to the problem before (to the best of your knowledge).
      3. Preferably leaves a detectable effect or signature so you can recognise when others copy it.

      With this in mind, please answer the questions below.

  - name: "Field of Invention"
    questions:
      - id: field_of_invention
        type: single_choice
        prompt: "What is the field of your invention?"
        options:
          - "Electronics"
          - "Mechanical / Medical Device"
          - "Software / Mechanics"
          - "Biotech / Agriculture"
          - "Chemistry / Pharma"
          - "Physics"

  - name: "Core Details"
    questions:
      - id: title
        type: text
        prompt: "Please provide a title to your invention:"
      - id: problem
        type: textarea
        prompt: "Which technical or non-technical problem do you solve?"
      - id: technical_solution
        type: textarea
        prompt: "Describe your technical solution (2-3 paragraphs)."
      - id: exemplary_usage
        type: textarea
        prompt: "If relevant, provide 1-2 examples defining an exemplary usage of your invention."

  - name: "Prior-Art Search"
    questions:
      - id: conducted_search
        type: single_choice
        prompt: "Did you conduct a search?"
        options: ["Yes", "No"]
      - id: close_results
        type: table
        prompt: "Please mention 1-5 close results and explain how your technical solution is different."
        columns: ["Close result", "Key difference"]
        min_rows: 1
        max_rows: 5

  - name: "Similar Technical Solutions"
    questions:
      - id: aware_similar
        type: single_choice
        prompt: "Are you aware of similar Technical Solutions?"
        options: ["Yes", "No"]
      - id: existing_solutions
        type: table
        columns: ["Existing solution", "Usage context", "Weaknesses", "Advantage of your solution", "Key features driving adoption", "Technical difference"]

  - name: "Technical Description"
    questions:
      - id: have_spec
        type: single_choice
        prompt: "Do you have a spec-level technical description ready?"
        options: ["Yes", "No"]

  - name: "Additional Problems"
    questions:
      - id: additional_problems
        type: single_choice
        prompt: "Does your solution solve other problems?"
        options: ["Yes", "No"]
      - id: additional_problems_table
        type: table
        columns: ["Problem", "Why non-obvious to apply", "Alternative solutions", "Features of alternatives", "Why alternatives are worse"]
`;

const assessTask = defineTask(
  'patentable-novelties-assess',
  async ({ novelty, priorArt }, ctx) => {
    return ctx.agent({
      title: `Assess patentability: ${novelty?.title ?? '(unnamed)'}`,
      prompt: [
        'You are the Patentable Novelties Agent. Assess this novelty for patentability.',
        '',
        'Apply criteria: Novelty, Inventive Step, Industrial Application, Technical Character,',
        'Sufficient Disclosure. Evaluate Technical Nature, Problem-Solution Fit, Commercial Value,',
        'Uniqueness, Implementability.',
        '',
        `Novelty: ${JSON.stringify(novelty ?? {}, null, 2)}`,
        `Prior art: ${JSON.stringify(priorArt ?? [], null, 2)}`,
        '',
        'Return JSON: { patentabilityScore (1-10), strengths: string[], weaknesses: string[],',
        '  recommendation: "file"|"dont-file"|"strengthen-first", rationale, priority: "high"|"medium"|"low" }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Patentability assessment', labels: ['a5c', 'research', 'patent'] },
);

const disclosureTask = defineTask(
  'patentable-novelties-disclosure',
  async ({ novelty, assessment }, ctx) => {
    return ctx.agent({
      title: 'Generate Invention Disclosure Questionnaire',
      prompt: [
        'You are the Patentable Novelties Agent. Generate a filled-in Invention Disclosure',
        'Questionnaire for this qualifying invention, using the exact YAML structure below.',
        '',
        'Fill every section with concrete analyzed information: problem, technical_solution,',
        'exemplary_usage, close prior-art results with key differences, competing solutions,',
        'spec availability, additional problems solved.',
        '',
        `Novelty: ${JSON.stringify(novelty ?? {}, null, 2)}`,
        `Assessment: ${JSON.stringify(assessment ?? {}, null, 2)}`,
        '',
        'Template (preserve structure):',
        DISCLOSURE_QUESTIONNAIRE_YAML,
        '',
        'Return JSON: { disclosureYaml: string }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Invention Disclosure YAML', labels: ['a5c', 'research', 'patent'] },
);

export async function process(inputs, ctx) {
  const { novelty = {}, priorArt = [] } = inputs ?? {};
  const assessment = await ctx.task(assessTask, { novelty, priorArt });
  const score = Number(assessment?.patentabilityScore ?? 0);
  let disclosureYaml = '';
  if (assessment?.recommendation && assessment.recommendation !== 'dont-file') {
    const disclosure = await ctx.task(disclosureTask, { novelty, assessment });
    disclosureYaml = String(disclosure?.disclosureYaml ?? '');
  }
  return {
    success: true,
    patentabilityScore: score,
    disclosureYaml,
    recommendation: String(assessment?.recommendation ?? 'dont-file'),
  };
}
