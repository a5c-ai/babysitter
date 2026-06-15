# seb1n/awesome-ai-agent-skills

- **Archetype**: domain-skill-pack
- **Stars**: 58
- **Last pushed**: 2026-03-02
- **License**: MIT
- **Discovered**: 2026-04-13
- **Source**: backlog evaluation
- **Skills found**: 90+ across multiple domains

## Summary
Comprehensive collection of 90+ universal, self-contained skills organized by domain (code-development, data-analytics, security, communication, devops, etc.). Each skill includes systematic workflows with concrete steps, multi-language support, and practical usage guidance. Claims to be "complete, ready-to-use instruction sets" rather than just a link directory.

## Assessment
High transferable value despite relatively low star count. Skills contain detailed procedural workflows rather than just expert personas. The refactoring skill demonstrates systematic 6-step process (identify smells → select patterns → plan order → apply → test → document) with concrete patterns and verification steps. Organized domain structure allows for easy extraction of domain-specific processes. Includes SKILL_TEMPLATE.md suggesting standardized skill creation methodology.

## Extraction Priority
- Medium-High
- Rationale: Systematic workflows with concrete procedures across multiple domains relevant to babysitter specializations. Quality over quantity - each skill appears to contain extractable procedural knowledge rather than just prompts.

## Skills Inventory

| Skill | Path | Domain | Transferable? | Notes |
|-------|------|--------|---------------|-------|
| refactoring | code-and-development/refactoring/SKILL.md | Development | Yes - systematic process | 6-step refactoring workflow with smell identification, pattern selection |
| data-cleaning | data-and-analytics/data-cleaning/SKILL.md | Data Science | Yes - methodology | Data cleaning and validation procedures |
| dependency-scanning | security/dependency-scanning/SKILL.md | Security | Yes - security process | Security vulnerability scanning workflow |
| lead-scoring | sales/lead-scoring/SKILL.md | Business | Yes - scoring methodology | Sales lead evaluation and scoring process |
| meeting-scheduler | productivity-and-workflow/meeting-scheduler/SKILL.md | Productivity | Yes - automation pattern | Meeting coordination and scheduling workflow |
| file-organization | productivity-and-workflow/file-organization/SKILL.md | Productivity | Yes - organization process | File and directory organization methodology |
| context-injection | context-engineering/context-injection/SKILL.md | AI Engineering | Yes - context pattern | Context engineering and prompt optimization |
| wireframing | design-and-ui-ux/wireframing/SKILL.md | Design | Yes - design process | UI/UX wireframing and prototyping workflow |
| email-drafting | communication/email-drafting/SKILL.md | Communication | Yes - communication process | Professional email composition methodology |
| analytics-reporting | marketing-and-seo/analytics-reporting/SKILL.md | Marketing | Yes - reporting process | Analytics data collection and reporting workflow |

## Processes
- **Systematic Code Refactoring**: 6-phase refactoring workflow with smell identification, pattern selection, and verification
  - Source: code-and-development/refactoring/SKILL.md (complete workflow section)
  - Placement: specializations/shared/systematic-refactoring
  - Inputs/Outputs: Code with quality issues → Improved code + change documentation
  - Complexity: moderate
  - Notes: Covers code smell identification, refactoring pattern selection, safe change ordering, verification

- **Security Dependency Scanning**: Systematic process for identifying and addressing security vulnerabilities in dependencies
  - Source: security/dependency-scanning/SKILL.md
  - Placement: specializations/security-compliance/dependency-scanning
  - Inputs/Outputs: Project dependencies → Vulnerability report + remediation plan
  - Complexity: simple
  - Notes: Vulnerability identification, risk assessment, update prioritization

- **Data Cleaning and Validation**: Structured approach to data quality assessment and improvement
  - Source: data-and-analytics/data-cleaning/SKILL.md
  - Placement: specializations/data-science-ml/data-cleaning
  - Inputs/Outputs: Raw data → Clean, validated dataset + quality report
  - Complexity: moderate
  - Notes: Data profiling, anomaly detection, validation rules, cleaning procedures

- **Context Engineering Methodology**: Process for optimizing AI prompt context and information injection
  - Source: context-engineering/context-injection/SKILL.md
  - Placement: specializations/shared/context-engineering
  - Inputs/Outputs: Base prompt + context requirements → Optimized prompt + injection strategy
  - Complexity: moderate
  - Notes: Context analysis, injection point identification, optimization techniques

## Plugin Ideas
- **Code Quality Suite**: Plugin providing systematic code improvement processes including refactoring, security scanning, and quality gates
  - What install.md would do: Install refactoring workflows, dependency scanning processes, code smell detection, quality gate configs
  - Processes it would copy: systematic-refactoring, dependency-scanning
  - Configs/hooks it would create: Pre-commit hooks for code quality, refactoring checklists, security scanning automation
  - Source evidence: Systematic refactoring workflow and security dependency scanning processes

- **Data Engineering Toolkit**: Plugin for data science projects providing data quality and processing workflows
  - What install.md would do: Set up data cleaning processes, validation frameworks, quality assessment tools
  - Processes it would copy: data-cleaning, data validation workflows
  - Configs/hooks it would create: Data quality gates, validation rules, cleaning pipeline configs
  - Source evidence: Comprehensive data cleaning and analytics workflow skills

- **Productivity Automation**: Plugin installing workflow automation and organization processes for general productivity
  - What install.md would do: Set up file organization systems, meeting coordination workflows, communication templates
  - Processes it would copy: file-organization, meeting-scheduler, email-drafting
  - Configs/hooks it would create: File organization rules, meeting templates, communication standards
  - Source evidence: Productivity and workflow skills with systematic organization approaches

## Harness Integration Ideas
N/A - This is not a harness framework repository.

## Implicit Procedural Knowledge
- **Code Smell Detection Strategy**: Systematic approach to identifying code quality issues across languages
  - Source: Refactoring skill's code smell identification methodology
  - Placement: specializations/shared/code-quality-assessment
  - Why codify: Reusable pattern for any code analysis task, not just refactoring
  - Sketch: Scan code → Identify patterns → Classify smells → Prioritize fixes → Document findings

- **Multi-Domain Skill Template**: Standardized approach to creating systematic skill definitions
  - Source: SKILL_TEMPLATE.md and consistent skill structure across domains
  - Placement: specializations/shared/skill-creation
  - Why codify: Template for creating high-quality, procedural skills rather than just expert personas
  - Sketch: Define workflow steps → Add concrete guidance → Include verification → Document usage patterns

- **Domain-Specific Process Extraction**: Method for identifying transferable procedures within domain-specific skills
  - Source: Systematic organization and procedural content across 90+ skills
  - Placement: specializations/shared/process-extraction
  - Why codify: Enables extraction of procedural knowledge from narrative skill descriptions
  - Sketch: Analyze skill content → Identify procedural steps → Extract workflow → Classify domain → Package as process

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Systematic Code Refactoring | NEW | 6-phase refactoring workflow with smell identification, pattern selection, and verification | - | specializations/shared/systematic-refactoring.js |
| Security Dependency Scanning | NEW | Systematic process for identifying and addressing security vulnerabilities in dependencies | - | specializations/security-compliance/dependency-scanning.js |
| Data Cleaning and Validation | NEW | Structured approach to data quality assessment and improvement | - | specializations/data-science-ml/data-cleaning.js |
| Context Engineering Methodology | NEW | Process for optimizing AI prompt context and information injection | - | specializations/shared/context-engineering.js |
| Code Smell Detection Strategy | NEW | Systematic approach to identifying code quality issues across languages | - | specializations/shared/code-quality-assessment.js |
| Multi-Domain Skill Template | NEW | Standardized approach to creating systematic skill definitions | - | specializations/shared/skill-creation.js |
| Domain-Specific Process Extraction | NEW | Method for identifying transferable procedures within domain-specific skills | - | specializations/shared/process-extraction.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Code Quality Suite | NEW | Systematic code improvement processes including refactoring, security scanning, and quality gates | - | plugins/a5c/marketplace/blueprints/code-quality-suite/ |
| Data Engineering Toolkit | NEW | Data quality and processing workflows for data science projects | - | plugins/a5c/marketplace/blueprints/data-engineering-toolkit/ |
| Productivity Automation | NEW | Workflow automation and organization processes for general productivity | - | plugins/a5c/marketplace/blueprints/productivity-automation/ |