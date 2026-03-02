requirements:

based on the SDK in this repo in the packages/sdk (npm @a5c-ai/babysitter-sdk) and claude plugin (REPO_ROOT/plugins/babysitter). look at sdk.md and BABYSITTER_PLUGIN_SPECIFICATION.md for more information.

create a UX for the system that will be used for:
1. observability of the runs, tasks, and breakpoints.
2. breakpoint management (same view as the breakpoints tool ux)
3. orchestrate the runs. interactive and responsive.
4. journal management (view the journal events and the state cache)
5. run management (create run, resume runs, delete, view, etc.) 

can dispatch claude code slash commands (claude "/...")
/babysitter:babysit <PROMPT> [--max-iterations <n>]
/babysitter:babysit resume <run-id> [--max-iterations <n>] 

requirements:
  - should be a web app in nextjs without a database
  - should use the babysitter-sdk as an npm package dependency.

methodology:
    - research and create specs (iterative, quality gated) with more than what is described here as requirements - what would be convenient for the user to have in the ux in terms of controls, observability, breakpoint management, tracking, monitoring, functionality, feedback, process understanding, review and control, error handling, etc.
    - plan the architecture, parts, milestones, etc.
    - integrate/link the main pages with functionality created for every phase of the development process (where relevant). so that is a way to test the functionality of the app as we go.
    - Quality gated iterative and convergent development loops for each part of the implementation, definition, ux design and definition, specs, etc.
    - Test driven
    - Integration Phases for each new functionality in every milestone with integration tests and quality gates.
    - Beutiful and polished ux design and implementation. pixel perfect verification and refinement loops.
