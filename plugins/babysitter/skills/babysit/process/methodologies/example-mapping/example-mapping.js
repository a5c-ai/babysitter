/**
 * @process methodologies/example-mapping
 * @description Example Mapping BDD workshop technique - colored cards methodology for exploring requirements
 * @inputs { userStory: string, timeboxMinutes: number, sessionMode: string }
 * @outputs { success: boolean, story: object, rules: array, examples: array, questions: array, gherkinScenarios: array, readiness: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Example Mapping Process
 *
 * Creator: Matt Wynne (Cucumber Ltd)
 * Methodology: BDD workshop technique using four colored cards:
 * - Blue: User Story (one per session)
 * - Yellow: Rules/Acceptance Criteria (business rules)
 * - Green: Examples (concrete scenarios)
 * - Red: Questions (unknowns, assumptions, risks)
 *
 * Process Flow:
 * 1. Story Analysis - Parse and understand the user story
 * 2. Rule Extraction - Identify business rules and acceptance criteria
 * 3. Example Generation - Create concrete examples for each rule
 * 4. Question Identification - Capture unknowns and risks
 * 5. Gherkin Generation - Convert examples to Given-When-Then scenarios
 * 6. Readiness Assessment - Determine if story is ready for development
 *
 * Success Criteria:
 * - Session completes within timebox (default: 25 minutes)
 * - All questions resolved or documented
 * - Examples cover all rules
 * - Gherkin scenarios are testable
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.userStory - The user story to map (required)
 * @param {number} inputs.timeboxMinutes - Session time limit (default: 25)
 * @param {string} inputs.sessionMode - collaborative|solo|async (default: collaborative)
 * @param {Object} inputs.existingContext - Existing domain knowledge or related stories
 * @param {Array<Object>} inputs.stakeholders - Stakeholder information for questions
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Mapping results with rules, examples, questions, and Gherkin
 */
export async function process(inputs, ctx) {
  const {
    userStory,
    timeboxMinutes = 25,
    sessionMode = 'collaborative',
    existingContext = null,
    stakeholders = []
  } = inputs;

  if (!userStory || userStory.trim().length === 0) {
    throw new Error('User story is required for Example Mapping');
  }

  const sessionStartTime = ctx.now();

  // ============================================================================
  // PHASE 1: STORY ANALYSIS (Blue Card)
  // ============================================================================

  const storyAnalysis = await ctx.task(storyAnalysisTask, {
    userStory,
    existingContext,
    sessionMode
  });

  // Check if story is too complex (early warning)
  if (storyAnalysis.complexityScore > 8) {
    await ctx.breakpoint({
      question: `Story complexity score is ${storyAnalysis.complexityScore}/10. This may exceed the ${timeboxMinutes}-minute timebox. Consider splitting the story or proceed with mapping?`,
      title: 'High Complexity Warning',
      context: {
        runId: ctx.runId,
        files: [
          {
            path: 'artifacts/example-mapping/story-analysis.json',
            format: 'code',
            language: 'json',
            label: 'Story Analysis'
          }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 2: RULE EXTRACTION (Yellow Cards)
  // ============================================================================

  const ruleExtraction = await ctx.task(ruleExtractionTask, {
    userStory,
    storyAnalysis,
    existingContext
  });

  const rules = ruleExtraction.rules;

  // Breakpoint: Review extracted rules
  await ctx.breakpoint({
    question: `Identified ${rules.length} business rules for this story. Review rules before generating examples?`,
    title: 'Rule Review',
    context: {
      runId: ctx.runId,
      files: [
        {
          path: 'artifacts/example-mapping/rules.md',
          format: 'markdown',
          label: 'Business Rules'
        }
      ]
    }
  });

  // ============================================================================
  // PHASE 3: EXAMPLE GENERATION (Green Cards)
  // ============================================================================

  // Generate examples for each rule in parallel
  const exampleResults = await ctx.parallel.all(
    rules.map(rule => async () => {
      const result = await ctx.task(exampleGenerationTask, {
        userStory,
        rule,
        storyAnalysis,
        existingContext
      });
      return result;
    })
  );

  // Flatten and consolidate examples
  const allExamples = exampleResults.flatMap(result => result.examples);

  // Validate coverage - ensure all rules have examples
  const coverageCheck = rules.map(rule => {
    const ruleExamples = allExamples.filter(ex => ex.ruleId === rule.id);
    return {
      rule: rule.description,
      exampleCount: ruleExamples.length,
      hasCoverage: ruleExamples.length > 0,
      hasHappyPath: ruleExamples.some(ex => ex.type === 'happy-path'),
      hasEdgeCases: ruleExamples.some(ex => ex.type === 'edge-case'),
      hasErrorCases: ruleExamples.some(ex => ex.type === 'error-case')
    };
  });

  const uncoveredRules = coverageCheck.filter(c => !c.hasCoverage);
  if (uncoveredRules.length > 0) {
    await ctx.breakpoint({
      question: `${uncoveredRules.length} rule(s) lack examples. Generate additional examples or proceed?`,
      title: 'Incomplete Coverage',
      context: {
        runId: ctx.runId,
        files: [
          {
            path: 'artifacts/example-mapping/coverage-report.json',
            format: 'code',
            language: 'json',
            label: 'Coverage Report'
          }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 4: QUESTION IDENTIFICATION (Red Cards)
  // ============================================================================

  const questionIdentification = await ctx.task(questionIdentificationTask, {
    userStory,
    storyAnalysis,
    rules,
    examples: allExamples,
    stakeholders,
    existingContext
  });

  const questions = questionIdentification.questions;

  // Breakpoint: Review questions
  if (questions.length > 0) {
    await ctx.breakpoint({
      question: `Identified ${questions.length} question(s) requiring clarification. These represent unknowns, assumptions, or risks. Review and resolve or document?`,
      title: 'Questions Identified',
      context: {
        runId: ctx.runId,
        files: [
          {
            path: 'artifacts/example-mapping/questions.md',
            format: 'markdown',
            label: 'Questions & Risks'
          }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 5: GHERKIN GENERATION
  // ============================================================================

  const gherkinGeneration = await ctx.task(gherkinGenerationTask, {
    userStory,
    storyAnalysis,
    rules,
    examples: allExamples
  });

  const gherkinScenarios = gherkinGeneration.scenarios;

  // Breakpoint: Review Gherkin scenarios
  await ctx.breakpoint({
    question: `Generated ${gherkinScenarios.length} Gherkin scenario(s) from examples. These can be used directly in BDD test frameworks. Review scenarios?`,
    title: 'Gherkin Review',
    context: {
      runId: ctx.runId,
      files: [
        {
          path: 'artifacts/example-mapping/scenarios.feature',
          format: 'code',
          language: 'gherkin',
          label: 'Gherkin Scenarios'
        }
      ]
    }
  });

  // ============================================================================
  // PHASE 6: READINESS ASSESSMENT
  // ============================================================================

  const sessionEndTime = ctx.now();
  const sessionDurationMinutes = (sessionEndTime - sessionStartTime) / (1000 * 60);

  const readinessAssessment = await ctx.task(readinessAssessmentTask, {
    userStory,
    storyAnalysis,
    rules,
    examples: allExamples,
    questions,
    gherkinScenarios,
    coverageCheck,
    sessionDurationMinutes,
    timeboxMinutes
  });

  // Final breakpoint: Review readiness
  await ctx.breakpoint({
    question: `Example Mapping complete. Story readiness: ${readinessAssessment.isReady ? '✅ READY' : '❌ NOT READY'}. ${readinessAssessment.isReady ? 'Proceed to development?' : 'Address issues before development?'}`,
    title: 'Story Readiness Assessment',
    context: {
      runId: ctx.runId,
      files: [
        {
          path: 'artifacts/example-mapping/readiness-report.md',
          format: 'markdown',
          label: 'Readiness Report'
        },
        {
          path: 'artifacts/example-mapping/summary.json',
          format: 'code',
          language: 'json',
          label: 'Complete Summary'
        }
      ]
    }
  });

  // ============================================================================
  // RETURN RESULTS
  // ============================================================================

  return {
    success: true,
    sessionDurationMinutes,
    withinTimebox: sessionDurationMinutes <= timeboxMinutes,
    story: {
      original: userStory,
      analysis: storyAnalysis
    },
    rules,
    ruleCount: rules.length,
    examples: allExamples,
    exampleCount: allExamples.length,
    questions,
    questionCount: questions.length,
    unresolvedQuestions: questions.filter(q => !q.resolved).length,
    gherkinScenarios,
    scenarioCount: gherkinScenarios.length,
    coverageCheck,
    readiness: readinessAssessment,
    isReady: readinessAssessment.isReady,
    artifacts: {
      storyAnalysis: 'artifacts/example-mapping/story-analysis.json',
      rules: 'artifacts/example-mapping/rules.md',
      examples: 'artifacts/example-mapping/examples.json',
      questions: 'artifacts/example-mapping/questions.md',
      gherkin: 'artifacts/example-mapping/scenarios.feature',
      readinessReport: 'artifacts/example-mapping/readiness-report.md',
      summary: 'artifacts/example-mapping/summary.json'
    },
    metadata: {
      processId: 'methodologies/example-mapping',
      sessionMode,
      timestamp: ctx.now(),
      creator: 'Matt Wynne (Cucumber Ltd)'
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

/**
 * Task: Analyze User Story
 * Parses and understands the user story, assesses complexity, identifies scope
 */
export const storyAnalysisTask = defineTask('story-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze User Story',
  agent: {
    name: 'story-analyzer',
    prompt: {
      role: 'system',
      content: `You are an expert BDD practitioner and business analyst conducting an Example Mapping session.

Your task is to analyze the provided user story and prepare for the mapping session.

Analyze:
1. **Story Structure**: Is it in proper user story format? (As a [role], I want [feature], so that [benefit])
2. **Clarity**: Is the story clear and unambiguous?
3. **Scope**: What is in scope vs. out of scope?
4. **Complexity**: Rate complexity 1-10 (1=simple, 10=very complex)
5. **Acceptance Criteria**: Are there existing acceptance criteria mentioned?
6. **Domain Context**: What domain knowledge is needed?
7. **Personas**: Who are the key users/roles?
8. **Splitting Recommendations**: Should this story be split?

Context:
- User Story: {{userStory}}
- Existing Context: {{existingContext}}
- Session Mode: {{sessionMode}}

Output a structured JSON analysis.`
    },
    outputSchema: {
      type: 'object',
      properties: {
        storyFormat: { type: 'string', enum: ['standard', 'non-standard', 'technical-task'] },
        persona: { type: 'string', description: 'The user role' },
        feature: { type: 'string', description: 'What they want' },
        benefit: { type: 'string', description: 'Why they want it' },
        clarity: { type: 'number', description: 'Clarity score 1-10' },
        complexityScore: { type: 'number', description: 'Complexity 1-10' },
        complexityReason: { type: 'string' },
        scope: {
          type: 'object',
          properties: {
            inScope: { type: 'array', items: { type: 'string' } },
            outOfScope: { type: 'array', items: { type: 'string' } },
            assumptions: { type: 'array', items: { type: 'string' } }
          }
        },
        domainContext: { type: 'string' },
        suggestSplit: { type: 'boolean' },
        splitReason: { type: 'string' },
        estimatedRules: { type: 'number', description: 'Expected rule count' }
      },
      required: ['storyFormat', 'complexityScore', 'scope']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'example-mapping', 'analysis']
}));

/**
 * Task: Extract Business Rules
 * Identifies business rules and acceptance criteria from the story
 */
export const ruleExtractionTask = defineTask('rule-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract Business Rules',
  agent: {
    name: 'rule-extractor',
    prompt: {
      role: 'system',
      content: `You are an expert BDD practitioner extracting business rules for Example Mapping.

Your task is to identify all business rules (Yellow Cards) that apply to this user story.

Business Rules are:
- Constraints that govern the behavior
- Acceptance criteria that must be met
- Business logic that applies
- Validation rules
- Edge cases that need handling

Guidelines:
- Each rule should be a single, testable statement
- Rules should be independent where possible
- Include both happy path and exception rules
- Consider edge cases and boundaries
- Think about what makes this story "done"

Context:
- User Story: {{userStory}}
- Story Analysis: {{storyAnalysis}}
- Existing Context: {{existingContext}}

Extract and categorize all business rules.`
    },
    outputSchema: {
      type: 'object',
      properties: {
        rules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              category: {
                type: 'string',
                enum: ['validation', 'business-logic', 'constraint', 'edge-case', 'error-handling', 'security', 'performance']
              },
              priority: { type: 'string', enum: ['must-have', 'should-have', 'nice-to-have'] },
              testable: { type: 'boolean' },
              complexity: { type: 'string', enum: ['simple', 'medium', 'complex'] }
            },
            required: ['id', 'description', 'category', 'priority']
          }
        },
        totalRuleCount: { type: 'number' },
        mustHaveCount: { type: 'number' }
      },
      required: ['rules', 'totalRuleCount']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'example-mapping', 'rules']
}));

/**
 * Task: Generate Examples
 * Creates concrete examples to illustrate business rules
 */
export const exampleGenerationTask = defineTask('example-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Examples for Rule: ${args.rule.id}`,
  agent: {
    name: 'example-generator',
    prompt: {
      role: 'system',
      content: `You are an expert BDD practitioner generating concrete examples (Green Cards) for Example Mapping.

Your task is to create specific, concrete examples that illustrate the business rule.

Example Types:
- **Happy Path**: Normal, successful scenarios
- **Edge Cases**: Boundary conditions, special cases
- **Error Cases**: What happens when things go wrong

Example Qualities:
- Concrete and specific (use real data, not placeholders)
- Testable and verifiable
- Illustrative of the rule
- Cover different conditions/paths
- Simple and clear

Context:
- User Story: {{userStory}}
- Business Rule: {{rule}}
- Story Analysis: {{storyAnalysis}}
- Existing Context: {{existingContext}}

Generate 3-5 examples for this rule.`
    },
    outputSchema: {
      type: 'object',
      properties: {
        ruleId: { type: 'string' },
        examples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              type: { type: 'string', enum: ['happy-path', 'edge-case', 'error-case'] },
              description: { type: 'string' },
              given: { type: 'array', items: { type: 'string' } },
              when: { type: 'string' },
              then: { type: 'array', items: { type: 'string' } },
              data: { type: 'object', description: 'Concrete test data' }
            },
            required: ['id', 'title', 'type', 'given', 'when', 'then']
          }
        }
      },
      required: ['ruleId', 'examples']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'example-mapping', 'examples', args.rule.id]
}));

/**
 * Task: Identify Questions
 * Captures unknowns, assumptions, and risks
 */
export const questionIdentificationTask = defineTask('question-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Questions and Risks',
  agent: {
    name: 'question-identifier',
    prompt: {
      role: 'system',
      content: `You are an expert BDD practitioner identifying questions (Red Cards) in Example Mapping.

Your task is to identify all unknowns, assumptions, and risks that need clarification.

Question Types:
- **Missing Information**: What information do we lack?
- **Assumptions**: What are we assuming that needs validation?
- **Technical Unknowns**: Implementation questions
- **Business Unknowns**: Business logic or process questions
- **Dependencies**: External dependencies or integrations
- **Risks**: Potential issues or concerns

Guidelines:
- Frame as specific, answerable questions
- Identify who can answer each question
- Prioritize questions by impact
- Note if question is blocking development

Context:
- User Story: {{userStory}}
- Story Analysis: {{storyAnalysis}}
- Rules: {{rules}}
- Examples: {{examples}}
- Stakeholders: {{stakeholders}}
- Existing Context: {{existingContext}}

Identify all questions that need answers.`
    },
    outputSchema: {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              question: { type: 'string' },
              type: {
                type: 'string',
                enum: ['missing-info', 'assumption', 'technical', 'business', 'dependency', 'risk']
              },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              blocking: { type: 'boolean', description: 'Blocks development?' },
              whoCanAnswer: { type: 'string' },
              resolved: { type: 'boolean' },
              answer: { type: 'string' }
            },
            required: ['id', 'question', 'type', 'priority', 'blocking']
          }
        },
        criticalCount: { type: 'number' },
        blockingCount: { type: 'number' }
      },
      required: ['questions']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'example-mapping', 'questions']
}));

/**
 * Task: Generate Gherkin Scenarios
 * Converts examples into Gherkin Given-When-Then scenarios
 */
export const gherkinGenerationTask = defineTask('gherkin-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Gherkin Scenarios',
  agent: {
    name: 'gherkin-generator',
    prompt: {
      role: 'system',
      content: `You are an expert BDD practitioner generating Gherkin scenarios from Example Mapping results.

Your task is to convert examples into properly formatted Gherkin scenarios that can be used with BDD testing frameworks (Cucumber, SpecFlow, Behave, etc.).

Gherkin Format:
\`\`\`gherkin
Feature: [Feature name]
  [Feature description]

Scenario: [Scenario name]
  Given [precondition]
  And [another precondition]
  When [action]
  Then [expected result]
  And [another expected result]

Scenario Outline: [Parameterized scenario]
  Given [precondition with <parameter>]
  When [action with <parameter>]
  Then [expected result with <parameter>]

  Examples:
    | parameter | result |
    | value1    | result1|
    | value2    | result2|
\`\`\`

Guidelines:
- Use clear, business-readable language
- Keep scenarios focused (one behavior per scenario)
- Use Scenario Outlines for data-driven tests
- Add @tags for organization (@smoke, @regression, @wip)
- Include background steps for common setup
- Make scenarios independent and repeatable

Context:
- User Story: {{userStory}}
- Story Analysis: {{storyAnalysis}}
- Rules: {{rules}}
- Examples: {{examples}}

Generate complete Gherkin feature file.`
    },
    outputSchema: {
      type: 'object',
      properties: {
        featureName: { type: 'string' },
        featureDescription: { type: 'string' },
        background: {
          type: 'array',
          items: { type: 'string' },
          description: 'Common Given steps'
        },
        scenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string', enum: ['scenario', 'scenario-outline'] },
              tags: { type: 'array', items: { type: 'string' } },
              steps: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    keyword: { type: 'string', enum: ['Given', 'When', 'Then', 'And', 'But'] },
                    text: { type: 'string' }
                  }
                }
              },
              examples: {
                type: 'object',
                properties: {
                  headers: { type: 'array', items: { type: 'string' } },
                  rows: { type: 'array', items: { type: 'array', items: { type: 'string' } } }
                }
              },
              relatedRuleId: { type: 'string' },
              relatedExampleIds: { type: 'array', items: { type: 'string' } }
            },
            required: ['id', 'name', 'type', 'steps']
          }
        },
        gherkinText: { type: 'string', description: 'Complete .feature file content' }
      },
      required: ['featureName', 'scenarios', 'gherkinText']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'example-mapping', 'gherkin']
}));

/**
 * Task: Assess Story Readiness
 * Determines if the story is ready for development
 */
export const readinessAssessmentTask = defineTask('readiness-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Story Readiness',
  agent: {
    name: 'readiness-assessor',
    prompt: {
      role: 'system',
      content: `You are an expert BDD practitioner assessing story readiness after Example Mapping.

Your task is to determine if the story is ready for development based on the mapping results.

Readiness Criteria:
1. **Questions Resolved**: All critical/blocking questions answered
2. **Complete Coverage**: All rules have examples
3. **Within Timebox**: Session completed within time limit (suggests appropriate scope)
4. **Testable**: Gherkin scenarios are clear and executable
5. **Complexity Appropriate**: Story is not too large or complex

If Not Ready:
- Identify specific issues blocking readiness
- Recommend actions (answer questions, split story, add examples)
- Suggest story splitting if too complex

Context:
- User Story: {{userStory}}
- Story Analysis: {{storyAnalysis}}
- Rules (${args.rules.length}): {{rules}}
- Examples (${args.examples.length}): {{examples}}
- Questions (${args.questions.length}): {{questions}}
- Gherkin Scenarios (${args.gherkinScenarios.length}): {{gherkinScenarios}}
- Coverage Check: {{coverageCheck}}
- Session Duration: {{sessionDurationMinutes}} minutes (timebox: {{timeboxMinutes}} minutes)

Assess readiness and provide detailed report.`
    },
    outputSchema: {
      type: 'object',
      properties: {
        isReady: { type: 'boolean' },
        readinessScore: { type: 'number', description: 'Score 0-100' },
        criteria: {
          type: 'object',
          properties: {
            questionsResolved: { type: 'boolean' },
            completeCoverage: { type: 'boolean' },
            withinTimebox: { type: 'boolean' },
            testable: { type: 'boolean' },
            appropriateComplexity: { type: 'boolean' }
          }
        },
        blockingIssues: {
          type: 'array',
          items: { type: 'string' }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              description: { type: 'string' }
            }
          }
        },
        splittingSuggestion: {
          type: 'object',
          properties: {
            shouldSplit: { type: 'boolean' },
            reason: { type: 'string' },
            suggestedStories: { type: 'array', items: { type: 'string' } }
          }
        },
        summary: { type: 'string' }
      },
      required: ['isReady', 'readinessScore', 'criteria', 'summary']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'example-mapping', 'readiness']
}));
