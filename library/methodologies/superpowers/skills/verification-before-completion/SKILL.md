---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, or passing, before committing or creating PRs. Evidence before assertions.
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
2. RUN - Execute the FULL command (fresh, complete)
3. READ - Full output, check exit code
4. VERIFY - Does output confirm the claim?
5. ONLY THEN - Make the claim

---

## Red Flags

- Using "should", "probably", "seems to"
- Expressing satisfaction before verification
- Trusting agent success reports without independent verification

## Agents Used

- Process agents defined in `verification-before-completion.js`

## Tool Use

Invoke via babysitter process: `methodologies/superpowers/verification-before-completion`
