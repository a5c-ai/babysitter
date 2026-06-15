# Orchestra-Research/AI-Research-SKILLs

## Metadata
- **Stars**: 6,637
- **License**: MIT
- **Last pushed**: 2026-04-10
- **Topics**: ai, ai-research, claude, claude-code, claude-skills, codex, gemini, skills, vllm
- **Fork**: No

## Overview
Comprehensive open-source library of 87 AI research skills organized into 22 categories covering the full AI research lifecycle — from idea to paper. Includes an `autoresearch` orchestration skill that uses a two-loop architecture (inner experiment loop + outer synthesis loop) to run autonomous research projects.

## Architecture
- 22 numbered skill categories (model-architecture, tokenization, fine-tuning, interpretability, data-processing, post-training, safety, distributed-training, infrastructure, optimization, evaluation, inference, mlops, agents, rag, prompt-engineering, observability, multimodal, emerging-techniques, paper-writing, ideation)
- Each skill follows SKILL.md format with YAML frontmatter, references/, scripts/, templates/
- Claude Code plugin marketplace with `marketplace.json`
- NPM installer: `npx @orchestra-research/ai-research-skills`

## Extractable Value

### Process: specializations/science/ai-research-orchestration
The `autoresearch` SKILL.md contains a complete two-loop research orchestration methodology:
1. Bootstrap: scope question, literature survey, form hypotheses
2. Inner loop: pick hypothesis, experiment, measure, record, learn
3. Outer loop: review results, find patterns, update findings, new hypotheses
4. Finalize: write paper, presentation, archive

Includes workspace structure template (research-state.yaml, experiments/, paper/), agent continuity patterns, and routing to domain skills. This is a full generic research methodology suitable for `specializations/science/autonomous-ai-research`.

### Process: specializations/science/ml-paper-writing
The `research-paper-writing` skill (also found in hermes-agent, attributed to Orchestra Research) provides a complete 7-phase pipeline for ML paper writing targeting NeurIPS/ICML/ICLR/ACL/AAAI/COLM. Includes experiment design, monitoring, statistical analysis, iterative drafting, self-review, and submission prep.

### Plugin idea: ai-research-skills
The marketplace already has a `marketplace.json` with plugin structure. Could be assimilated as a babysitter marketplace plugin providing AI research domain skills. However, these are tool/framework-specific skills (vLLM, DeepSpeed, etc.), not babysitter processes — they'd need to be wrapped as process definitions.

## Processes

### 1. Autonomous AI Research Orchestration
- **Source**: autoresearch SKILL.md two-loop architecture (inner experiment loop + outer synthesis loop)
- **Placement**: `specializations/science/autonomous-ai-research.js`
- **Description**: Complete research methodology: bootstrap (scope question, literature survey, form hypotheses) → inner loop (pick hypothesis, experiment, measure, record, learn) → outer loop (review results, find patterns, update findings, new hypotheses) → finalize (write paper, presentation, archive).

### 2. ML Paper Writing Pipeline
- **Source**: research-paper-writing skill 7-phase pipeline for ML conferences
- **Placement**: `specializations/science/ml-paper-writing.js`
- **Description**: End-to-end ML paper writing for NeurIPS/ICML/ICLR/ACL/AAAI/COLM: experiment design → monitoring → statistical analysis → iterative drafting → self-review → submission prep.

## Plugin Ideas

- **AI Research Skills Suite**: Babysitter marketplace plugin providing AI research domain skills with 87 skills across 22 categories covering full AI research lifecycle.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Autonomous AI Research Orchestration | NEW | Two-loop research methodology with experiment and synthesis cycles | - | specializations/science/autonomous-ai-research.js |
| ML Paper Writing Pipeline | NEW | 7-phase ML paper writing process for major conferences with statistical analysis | - | specializations/science/ml-paper-writing.js |
| Research Workspace Organization | NEW | Structured research workspace with research-state.yaml and experiment tracking | - | specializations/science/research-workspace-organization.js |
| Agent Continuity Patterns | NEW | Maintaining research state and context across long-running autonomous research projects | - | specializations/shared/agent-continuity-patterns.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| AI Research Skills Suite | NEW | Comprehensive AI research domain skills across 22 categories with orchestration | - | plugins/a5c/marketplace/blueprints/ai-research-skills-suite/ |

## Classification
- **Archetype**: Domain skill library with orchestration layer
- **Primary value**: Two processes extractable — autonomous research orchestration and ML paper writing pipeline
- **Process placement**: `specializations/science/autonomous-ai-research` and `specializations/science/ml-paper-writing`
