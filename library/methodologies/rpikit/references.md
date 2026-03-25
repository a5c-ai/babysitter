# RPIKit References and Attribution

## Primary Source

- **Repository**: [https://github.com/bostonaholic/rpikit](https://github.com/bostonaholic/rpikit)
- **Author**: Matthew Boston ([@bostonaholic](https://github.com/bostonaholic))
- **Description**: Claude Code plugin implementing the Research-Plan-Implement (RPI) framework for structured software engineering

## Concepts Adapted

The following RPIKit concepts have been adapted into babysitter process definitions:

### Core Workflow Phases
- **Brainstorm**: Requirement clarification -> `rpikit-brainstorm.js`
- **Research**: Codebase exploration (Iron Law) -> `rpikit-research.js`
- **Plan**: Stakes-based implementation planning -> `rpikit-plan.js`
- **Implement**: Disciplined execution with verification -> `rpikit-implement.js`
- **Review**: Code quality + security assessment -> `rpikit-review.js`
- **Decision**: Architecture Decision Records -> `rpikit-decision.js`

### Commands (mapped to process steps)
- `/rpikit:brainstorm` -> rpikit-brainstorm explore-problem task
- `/rpikit:research` -> rpikit-research clarify-request + examine-codebase tasks
- `/rpikit:plan` -> rpikit-plan decompose-tasks + write-plan tasks
- `/rpikit:implement` -> rpikit-implement execute-step loop
- `/rpikit:review-code` -> rpikit-review run-code-review task
- `/rpikit:review-security` -> rpikit-review run-security-review task
- `/rpikit:decision` -> rpikit-decision write-adr task

### Agents (mapped to agent definitions)
- **file-finder** -> `agents/file-finder/` (file discovery for research)
- **web-researcher** -> `agents/web-researcher/` (external context gathering)
- **code-reviewer** -> `agents/code-reviewer/` (structured code quality review)
- **security-reviewer** -> `agents/security-reviewer/` (vulnerability assessment)
- **test-runner** -> `agents/test-runner/` (test execution and coverage)
- **verifier** -> `agents/verifier/` (step verification)
- **debugger** -> `agents/debugger/` (failure investigation)

### Skills (mapped to skill definitions)
- **researching-codebase** -> `skills/codebase-research/` (Iron Law research)
- **writing-plans** -> `skills/plan-writing/` (stakes-based planning)
- **implementing-plans** -> `skills/plan-implementation/` (disciplined execution)
- **reviewing-code** -> `skills/code-review/` (quality assessment)
- **security-review** -> `skills/security-review/` (vulnerability scan)
- **brainstorming** -> `skills/brainstorming/` (requirement clarification)
- **documenting-decisions** -> `skills/decision-documentation/` (ADRs)
- **test-driven-development** -> `skills/test-driven-development/` (test-first)
- **systematic-debugging** -> `skills/systematic-debugging/` (hypothesis-driven debugging)
- **verification-before-completion** -> `skills/verification/` (completion verification)
- **finishing-work** -> `skills/finishing-work/` (completion protocol)

### Core Principles
- **Iron Law**: Do not explore the codebase until the problem is understood
- **Stakes Classification**: Low/Medium/High rigor scaling
- **Test-First**: Test specification as first sub-step of every code-changing task
- **Soft-Gating Reviews**: Code review verdicts preserve user autonomy
- **Human Approval Gates**: Explicit approval between phases

### Output Conventions
- Research documents: `docs/plans/YYYY-MM-DD-<topic>-research.md`
- Plan documents: `docs/plans/YYYY-MM-DD-<topic>-plan.md`
- Decision records: `docs/decisions/NNNN-<title>.md`

## Acknowledgment

This adaptation brings RPIKit's Research-Plan-Implement framework into the babysitter process system. All credit for the original concepts, workflow design, and methodology belongs to Matthew Boston and the RPIKit project contributors.
