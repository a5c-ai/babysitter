# Meta Specialization - Skills and Agents Backlog

This file contains the skills and agents needed to support the Meta Specialization processes.

## Skills

### Research and Analysis Skills

- [x] SK-META-001: specialization-researcher - Research specialization domains, compile references, analyze best practices
- [x] SK-META-002: process-analyzer - Analyze processes, identify workflows, define boundaries and scope
- [ ] SK-META-003: skill-analyzer - Analyze skill requirements, define capabilities and tool permissions
- [ ] SK-META-004: agent-analyzer - Analyze agent requirements, define roles and expertise areas
- [ ] SK-META-005: reference-researcher - Search GitHub and web for existing skills, agents, and MCP servers

### Generation and Creation Skills

- [x] SK-META-006: process-generator - Generate process JS files following SDK patterns
- [x] SK-META-007: skill-generator - Generate SKILL.md files with proper frontmatter and documentation
- [x] SK-META-008: agent-generator - Generate AGENT.md files with proper frontmatter and documentation
- [ ] SK-META-009: documentation-generator - Generate README.md and supporting documentation files
- [ ] SK-META-010: prompt-engineer - Create effective prompt templates for agents

### Validation Skills

- [x] SK-META-011: specialization-validator - Validate specialization completeness across all phases
- [x] SK-META-012: process-validator - Validate process JS files for correct patterns and syntax
- [ ] SK-META-013: skill-validator - Validate SKILL.md files for proper format and content
- [ ] SK-META-014: agent-validator - Validate AGENT.md files for proper format and content
- [ ] SK-META-015: backlog-validator - Validate backlog files for completeness and format

### Integration Skills

- [x] SK-META-016: process-integrator - Integrate skills and agents into process files
- [ ] SK-META-017: backlog-manager - Update backlogs with completion status
- [ ] SK-META-018: index-generator - Generate index files for skills, agents, and processes

## Agents

### Research and Curation Agents

- [x] AG-META-001: specialization-curator - Research and curate specialization content, manage references
- [ ] AG-META-002: reference-librarian - Find and organize external references and resources

### Architecture and Design Agents

- [x] AG-META-003: process-architect - Design and implement process orchestration workflows
- [x] AG-META-004: skill-designer - Design skill capabilities, tool permissions, and documentation
- [x] AG-META-005: agent-designer - Design agent roles, expertise, and prompt templates

### Quality and Validation Agents

- [x] AG-META-006: quality-assessor - Assess quality, validate completeness, score phases
- [x] AG-META-007: technical-writer - Write comprehensive documentation, README files

### Integration Agents

- [ ] AG-META-008: integration-specialist - Integrate components, update process files with references

## Process-to-Skill/Agent Mapping

| Process | Skills | Agents |
|---------|--------|--------|
| specialization-creation.js | SK-META-001, SK-META-002, SK-META-003, SK-META-004, SK-META-005, SK-META-006, SK-META-007, SK-META-008, SK-META-011, SK-META-016 | AG-META-001, AG-META-003, AG-META-004, AG-META-006 |
| process-creation.js | SK-META-002, SK-META-006, SK-META-012 | AG-META-003, AG-META-006 |
| skill-creation.js | SK-META-003, SK-META-007, SK-META-009, SK-META-013 | AG-META-004, AG-META-006, AG-META-007 |
| agent-creation.js | SK-META-004, SK-META-008, SK-META-009, SK-META-010, SK-META-014 | AG-META-005, AG-META-006, AG-META-007 |
| specialization-validator.js | SK-META-011, SK-META-012, SK-META-013, SK-META-014, SK-META-015 | AG-META-006 |
| domain-creation.js | SK-META-001, SK-META-009 | AG-META-001, AG-META-007 |
| phase1-research-readme.js | SK-META-001, SK-META-009 | AG-META-001, AG-META-007 |
| phase2-identify-processes.js | SK-META-002 | AG-META-003 |
| phase3-implement-processes.js | SK-META-006, SK-META-012 | AG-META-003, AG-META-006 |
| phase4-identify-skills-agents.js | SK-META-003, SK-META-004 | AG-META-004, AG-META-005 |
| phase5-research-references.js | SK-META-005 | AG-META-002 |
| phase6-create-skills-agents.js | SK-META-007, SK-META-008, SK-META-009 | AG-META-004, AG-META-005, AG-META-007 |
| phase7-integrate-skills-agents.js | SK-META-016, SK-META-017 | AG-META-008 |

## Skill Details

### SK-META-001: specialization-researcher

**Description**: Research specialization domains, compile references, and analyze best practices

**Allowed Tools**: Read, Write, Glob, Grep, WebFetch, WebSearch

**Capabilities**:
- Research domain knowledge
- Compile reference materials
- Analyze industry best practices
- Identify key roles and responsibilities
- Generate comprehensive overviews

---

### SK-META-006: process-generator

**Description**: Generate process JS files following Babysitter SDK patterns

**Allowed Tools**: Read, Write, Edit, Glob, Grep

**Capabilities**:
- Generate JSDoc metadata headers
- Create process function structure
- Define task definitions with defineTask
- Implement quality gates and breakpoints
- Add proper io configuration

---

### SK-META-011: specialization-validator

**Description**: Validate specialization completeness across all 7 phases

**Allowed Tools**: Read, Glob, Grep

**Capabilities**:
- Check file existence and structure
- Validate frontmatter format
- Score phase completion
- Identify gaps and issues
- Generate validation reports

---

## Agent Details

### AG-META-003: process-architect

**Description**: Design and implement process orchestration workflows

**Role**: Process Architecture and Design

**Expertise**:
- Babysitter SDK process patterns
- Task definition design
- Quality gate placement
- Breakpoint strategy
- Process flow optimization
- Error handling patterns

---

### AG-META-004: skill-designer

**Description**: Design skill capabilities, tool permissions, and documentation

**Role**: Skill Architecture and Design

**Expertise**:
- Skill capability definition
- Tool permission management
- SKILL.md format and structure
- Documentation best practices
- MCP server integration

---

### AG-META-006: quality-assessor

**Description**: Assess quality, validate completeness, score phases

**Role**: Quality Assurance

**Expertise**:
- Validation methodology
- Scoring criteria
- Gap analysis
- Quality metrics
- Improvement recommendations

---

## Notes

- All skills should use the minimal set of tools required
- Agents should have clear, non-overlapping expertise
- Process integration should reference exact skill/agent names
- Validation should be comprehensive but not blocking
