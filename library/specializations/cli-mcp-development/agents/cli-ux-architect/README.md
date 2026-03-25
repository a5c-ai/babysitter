# CLI UX Architect Agent

Expert in command-line interface user experience design, command naming conventions, and user workflow optimization.

## Overview

The CLI UX Architect agent provides guidance on creating intuitive, user-friendly command-line interfaces. It evaluates designs against established conventions and best practices, offering specific recommendations for improvement.

## When to Use

- Designing new CLI application structure
- Reviewing command naming and organization
- Improving help text and documentation
- Crafting error messages
- Optimizing user workflows

## Expertise Areas

### Command Design

The agent provides guidance on:
- Verb-noun naming patterns
- Subcommand hierarchy organization
- Consistent naming conventions
- Command grouping strategies

### Argument Architecture

Expertise in:
- Positional vs optional arguments
- Flag design (-v vs --verbose)
- Type coercion and validation
- Default value selection

### User Experience

Focus on:
- Task completion efficiency
- Learning curve reduction
- Scripting compatibility
- Interactive flow design

## Interaction Examples

### Command Review

**Input:**
```
I'm designing a CLI for database management with these commands:
- db init
- db connect
- db query
- db backup
- db restore
```

**Agent Response:**
```
Command structure analysis:

Strengths:
- Clear verb-based naming
- Consistent 'db' prefix
- Logical grouping

Recommendations:
1. Consider adding 'db status' for connection health
2. Add 'db list' for available databases
3. Consider 'db migrate' for schema management
4. Group backup/restore under 'db snapshot' subcommand:
   - db snapshot create
   - db snapshot restore
   - db snapshot list
```

### Help Text Review

**Input:**
```
deploy [options] <target>

Options:
  -e <env>    environment
  -r          rollback
  --tag       version tag
```

**Agent Response:**
```
Help text improvements needed:

1. Add description:
   "Deploy application to target environment"

2. Improve options:
   -e, --env <name>     Target environment (dev, staging, prod)
   -r, --rollback       Rollback to previous version
   -t, --tag <version>  Deploy specific version tag

3. Add examples:
   Examples:
     deploy api                    Deploy api to default env
     deploy api -e production      Deploy api to production
     deploy api --rollback         Rollback api deployment

4. Add see also:
   See also: deploy:status, deploy:logs, deploy:history
```

### Error Message Review

**Input:**
```
Error: Invalid input
```

**Agent Response:**
```
Error message should be more helpful:

Before:
  Error: Invalid input

After:
  Error: Invalid configuration file

  The file at './config.yaml' is not valid YAML:
    Line 15: Expected ':' but found '='

  To fix:
    1. Check YAML syntax at line 15
    2. Use 'myapp config validate' to check your file
    3. See 'myapp config --help' for format documentation
```

## Design Principles Applied

### 1. Least Surprise
Commands behave as users expect based on conventions.

### 2. Progressive Disclosure
Simple by default, powerful when needed.

### 3. Fail Gracefully
Clear errors with actionable solutions.

### 4. Consistency
Uniform patterns across all commands.

### 5. Scriptability
Works in both interactive and automated contexts.

## Common Recommendations

### Command Structure

```
Good:
  myapp project create <name>
  myapp project list
  myapp project delete <name>

Avoid:
  myapp create-project <name>
  myapp list-projects
  myapp delete-project <name>
```

### Flag Design

```
Good:
  -v, --verbose         Verbose output
  -o, --output <file>   Output file
  -f, --force           Skip confirmation

Avoid:
  --verbose-mode
  --outputFile
  --force-yes
```

### Help Format

```
myapp command - Short description

Usage: myapp command [options] <required> [optional]

Arguments:
  <required>    Description of required arg
  [optional]    Description of optional arg (default: value)

Options:
  -o, --option <val>   Description (default: value)
  -f, --flag           Boolean flag description

Examples:
  myapp command foo           Simple usage
  myapp command foo -o bar    With option

See also: myapp other-command, myapp help
```

## Integration

The CLI UX Architect agent integrates with:

| Process | Role |
|---------|------|
| cli-application-bootstrap | Initial design review |
| cli-command-structure-design | Structure recommendations |
| argument-parser-setup | Argument schema guidance |
| cli-documentation-generation | Help text quality |
| error-handling-user-feedback | Error message design |

## References

- [CLI Guidelines](https://clig.dev/) - Comprehensive CLI design guide
- [12 Factor CLI Apps](https://medium.com/@jdxcode/12-factor-cli-apps-dd3c227a0e46)
- [Heroku CLI Style Guide](https://devcenter.heroku.com/articles/cli-style-guide)
- [GNU Standards](https://www.gnu.org/prep/standards/html_node/Command_002dLine-Interfaces.html)
