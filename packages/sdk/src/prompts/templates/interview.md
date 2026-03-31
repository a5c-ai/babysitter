#### Interview phase

##### Interactive mode (default)

Interview the user for the intent, requirements, goal, scope, etc.

A multi-step phase to understand the intent and perspective to approach the
process building after researching the repo, short research online if needed,
short research in the target repo, additional instructions, intent and library
(processes, specializations, skills, subagents, methodologies, references, etc.)
/ guide for methodology building.
{{#processLibraryRoot}}
The active process-library root is: `{{processLibraryRoot}}`
{{#processLibraryReferenceRoot}}
The reference root is: `{{processLibraryReferenceRoot}}`
{{/processLibraryReferenceRoot}}
Search this directory for relevant specializations, methodologies, and references.
Treat `specializations/**/**/**`, `methodologies/`, `contrib/`, and `reference/`
as paths relative to the active process-library root. You MUST conduct an actual
search against that active process library instead of skipping directly to writing
a process.
{{/processLibraryRoot}}
{{^processLibraryRoot}}
You MUST resolve the active library root with
`babysitter process-library:active --json` before process authoring, and you MUST
conduct an actual search against that active process library instead of skipping
directly to writing a process. The `process-library:active` command bootstraps
the shared global SDK process library automatically if no binding exists yet.
Read `binding.dir` from the returned JSON to get the active process-library root
that must be searched. If you need the cloned repo root itself, read
`defaultSpec.cloneDir` from the same JSON. After that, treat
`specializations/**/**/**`, `methodologies/`, `contrib/`, and `reference/` as
paths relative to `binding.dir`.
{{/processLibraryRoot}}

The first step should be to look at the state of the repo, then find the most
relevant processes, specializations, skills, subagents, methodologies,
references, etc. to use as a reference. Use the babysitter CLI discover command
to find the relevant processes, skills, subagents, etc. at various stages.

Then this phase can have: research online, research the repo, user questions, and
other steps one after the other until the intent, requirements, goal, scope, etc.
are clear and the user is satisfied with the understanding. After each step,
decide the type of next step to take. Do not plan more than 1 step ahead in this
phase. The same step type can be used more than once in this phase.

##### Non-interactive mode (running with -p flag{{interactiveToolName}})

When running non-interactively, skip the interview phase entirely. Instead:

1. Parse the initial prompt to extract intent, scope, and requirements.
2. Research the repo structure to understand the codebase.
{{#processLibraryRoot}}
3. The active process-library root is already resolved: `{{processLibraryRoot}}`.
   Search that active library for the most relevant specialization/methodology.
   Do not skip this search step.
{{/processLibraryRoot}}
{{^processLibraryRoot}}
3. Resolve the active process-library root with
   `babysitter process-library:active --json`, then search that active library
   for the most relevant specialization/methodology. Do not skip this search
   step.
{{/processLibraryRoot}}
4. Proceed directly to the process creation phase using the extracted
   requirements.
