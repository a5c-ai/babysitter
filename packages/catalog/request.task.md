build an amazing catalog for the process library at:

plugins/babysitter/skills/babysit/process/specializations
plugins/babysitter/skills/babysit/process/specializations/domains
plugins/babysitter/skills/babysit/process/methodologies

research the structure of the process library and the fields in the process, specialization, domain, skill, agent files.

study the sdk.md and README.md file in the sdk package to understand the core concepts and principles of the babysitter sdk and the bigger picture of the babysitter framework.

examine some of the existing processes (js files under methodologies and specializations), specializations (dirs under specializations are r&d domain's and the ones under domains/[domain-name-slugified] are specialization under that domain), domains (dirs under specializations/domains/), skills (dirs with SKILL.md file), agents (dirs with AGENT.md file) to understand the patterns and best practices.

minimum features:
    search processes, specializations, domains, skills, agents for the catalog by:
    - all the fields in the process, specialization, domain, skill, agent
    filtering for the catalog
    sorting for the catalog by
    pagination for the catalog
    associative links between the catalog items where relevant
    detailed view of the catalog items with all the fields and links with reasonable detail, readability, usability and design.
    read only - no editing of the catalog items
    no real db backend, should be based on the files in the process library, but allow building and maintaining a fs based index in sqlite for cache and search.
    no authentication or authorization
    detailed dashboard with analytics and metrics for the catalog - number of processes, specializations, domains, skills, agents, etc. and other relevant metrics that can be derived from the existing files and data in the process library.
    markdown rendering for the markdown parts of the catalog items - with code highlighting for the code parts of the catalog items in the markdown.
    frontmatter parsing for the frontmatter parts of the catalog items (with relevant fields and metadata)
    parsing of the process files to extract the process definition (main export), task definitions, (agent definitions or skill definitions or other), breakpoints statements, etc. also extracting the docstrings and the relevant metadata from the process files.

use the github primer design system, nextjs, tailwindcss, shadcn/ui, react, typescript. 