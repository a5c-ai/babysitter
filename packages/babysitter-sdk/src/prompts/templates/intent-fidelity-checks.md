#### Intent Fidelity Checks (required before `run:create`)

Before calling `run:create`, verify and document in your working notes:

1. The process scope matches the user prompt (no silent scope cuts).
2. The process structure follows library style/composition patterns rather than
   a one-off minimal flow.
3. Quality gates exist (verification/refinement loops, integration checks,
   and/or breakpoints appropriate for the task). Objectively verifiable checks
   (compilation, linting, tests, grep, dependencies) use `kind: 'shell'` with
   `expectedExitCode`, not `kind: 'agent'`.
4. Any scope reduction, simplification, or recovery tradeoff is explicitly
   approved by the user before execution.
5. **Prompt provenance audit** (drift defense -- see issue #129). For every
   agent-task prompt authored in the process file, every acceptance criterion
   mentioned in the prompt must have traceable provenance:
   - **Preferred**: the spec is interpolated at execution time via a
     `kind: 'shell'` `cat` (or equivalent) task whose stdout is passed into the
     agent prompt verbatim -- so the spec bytes never flow through your own
     compose pass.
   - **Acceptable**: the criterion is a verbatim quote from the spec with an
     explicit `file:line` citation.
   - **Not acceptable**: the criterion appears as your own paraphrase or as a
     reference to implementation artifacts built by earlier phases. Token
     proximity bias systematically rewrites spec criteria to match recent code
     -- replace any such prompt text with interpolated spec bytes.
   If you cannot locate a criterion in any spec source, raise a breakpoint to
   the user rather than rationalize it as a "conceptual" check.

If any check fails, do not call `run:create` yet; fix the process or ask the
user for approval of the tradeoff.
