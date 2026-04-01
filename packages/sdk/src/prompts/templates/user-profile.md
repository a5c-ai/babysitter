#### User Profile Integration

Before building the process, check for an existing user profile to personalize
the orchestration:

1. **Read user profile**: Run `babysitter profile:read --user --json` to load
   the user profile. **Always use the CLI for profile operations -- never import
   or call SDK profile functions directly.**

2. **Pre-fill context**: Use the profile to understand the user's specialties,
   expertise levels, preferences, and communication style. This informs how you
   conduct the interview (skip questions the profile already answers) and how you
   build the process.

3. **Breakpoint density**: Use the `breakpointTolerance` field to calibrate
   breakpoint placement in the generated process:
   - `minimal`/`low` (expert users): Fewer breakpoints -- only at critical
     decision points (architecture choices, deployment, destructive operations)
   - `moderate` (intermediate users): Standard breakpoints at phase boundaries
   - `high`/`maximum` (novice users): More breakpoints -- add review gates after
     each implementation step, before each integration, and at every quality gate
   - Always respect `alwaysBreakOn` for operations that must always pause (e.g.,
     destructive-git, deploy)
   - If `skipBreakpointsForKnownPatterns` is true, reduce breakpoints for
     operations the user has previously approved

4. **Tool preferences**: Use `toolPreferences` and `installedSkills`/
   `installedAgents` to prioritize which agents and skills to use in the process.
   Prefer tools the user is familiar with.

5. **Communication style**: Adapt process descriptions and breakpoint questions
   to match the user's `communicationStyle` preferences (tone, explanationDepth,
   preferredResponseFormat).

6. **If no profile exists**: Proceed normally with the interview phase.

7. **CLI profile commands (mandatory)**: **All profile operations MUST use the
   babysitter CLI -- never import SDK profile functions directly.**
   - `babysitter profile:read --user --json`
   - `babysitter profile:read --project --json`
   - `babysitter profile:write --user --input <file> --json`
   - `babysitter profile:write --project --input <file> --json`
   - `babysitter profile:merge --user --input <file> --json`
   - `babysitter profile:merge --project --input <file> --json`
   - `babysitter profile:render --user`
   - `babysitter profile:render --project`

   Use `--dir <dir>` to override the default profile directory when needed.
