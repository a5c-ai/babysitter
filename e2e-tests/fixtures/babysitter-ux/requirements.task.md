requirements:


based on the SDKs  in this repo in the packages/sdk (npm @a5c-ai/babysitter-sdk) and the breakpoints SDK (npm @a5c-ai/babysitter-breakpoints) and claude plugin (REPO_ROOT/plugins/babysitter).

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

methodology:
    - research and create specs (iterative, quality gated) with more than what is described here as requirements.
    - plan
    - Test driven, quality gated iterative for each part of the architecture.
