# CLI and MCP Development Specialization

**Comprehensive guide to Command Line Interface Development, Model Context Protocol Development, Terminal Applications, Shell Scripting, and Developer Tools CLI.**

## Overview

This specialization encompasses the design, development, and deployment of command-line interfaces and Model Context Protocol (MCP) implementations that enable AI-powered developer tools. It covers the full spectrum from simple shell scripts to complex interactive terminal applications and sophisticated MCP servers that extend AI capabilities.

### Core Domains

- **CLI Development**: Building robust command-line applications with intuitive argument parsing, helpful output, and excellent user experience
- **MCP Development**: Implementing Model Context Protocol servers and tools that extend AI assistant capabilities
- **Terminal Applications**: Creating interactive terminal user interfaces (TUI) with rich visual feedback
- **Shell Scripting**: Automating tasks through portable, maintainable shell scripts
- **Developer Tools**: Building productivity tools that integrate into development workflows

## Roles and Responsibilities

### CLI Developer

**Primary Focus**: Design and implementation of command-line applications

#### Core Responsibilities
- **Command Design**: Create intuitive command structures and argument schemas
- **Argument Parsing**: Implement robust parsing with validation and help generation
- **Output Formatting**: Design human-readable and machine-parseable output formats
- **Error Handling**: Provide clear, actionable error messages
- **Documentation**: Write comprehensive help text and man pages
- **Testing**: Implement CLI-specific testing strategies
- **Distribution**: Package and distribute CLI tools across platforms

#### Key Skills
- **Languages**: Node.js/TypeScript, Python, Go, Rust
- **Argument Parsers**: Commander.js, Yargs, argparse, Click, Cobra, clap
- **Terminal Libraries**: Chalk, Inquirer, blessed, Rich, Bubble Tea
- **Build Tools**: pkg, PyInstaller, goreleaser, cargo
- **Testing**: Bats, pytest, go test, snapshot testing
- **Documentation**: Help text generation, man page authoring

#### Typical Workflows
1. **New CLI Tool**: Design commands -> Implement argument parsing -> Add business logic -> Create output formatting -> Write tests -> Document usage
2. **Feature Addition**: Analyze requirements -> Design command structure -> Implement with backwards compatibility -> Update documentation
3. **Bug Fix**: Reproduce issue -> Analyze argument parsing/execution flow -> Fix and add regression test
4. **Release**: Version bump -> Generate changelog -> Build binaries -> Publish to package managers

### MCP Developer

**Primary Focus**: Implementation of Model Context Protocol servers and tools

#### Core Responsibilities
- **MCP Server Development**: Build servers that expose tools and resources to AI assistants
- **Tool Implementation**: Create MCP tools with clear schemas and reliable execution
- **Resource Management**: Implement resource providers for dynamic content access
- **Protocol Compliance**: Ensure correct implementation of MCP specification
- **Error Handling**: Design robust error responses and recovery mechanisms
- **Security**: Implement proper input validation and sandboxing
- **Documentation**: Document tool capabilities and usage patterns

#### Key Skills
- **MCP SDK**: @modelcontextprotocol/sdk, mcp Python package
- **Languages**: TypeScript/Node.js, Python
- **JSON Schema**: Tool and resource schema definition
- **Transport Protocols**: stdio, HTTP/SSE, WebSocket
- **Security**: Input validation, sandboxing, permission models
- **Testing**: MCP testing patterns, mock clients

#### MCP Architecture Components
- **Server**: Process that implements MCP protocol
- **Tools**: Functions that AI can invoke with parameters
- **Resources**: Content providers (files, APIs, databases)
- **Prompts**: Pre-defined prompt templates
- **Transport**: Communication layer (stdio, HTTP, WebSocket)

#### Typical Workflows
1. **New MCP Server**: Define capabilities -> Implement transport -> Create tools/resources -> Test with MCP client -> Document
2. **Tool Development**: Design tool schema -> Implement handler -> Add validation -> Test edge cases -> Document parameters
3. **Resource Provider**: Define resource URI scheme -> Implement content fetching -> Add caching -> Handle errors

### Shell Script Developer

**Primary Focus**: Automation through portable shell scripts

#### Core Responsibilities
- **Script Development**: Write maintainable, portable shell scripts
- **Cross-Platform Compatibility**: Ensure scripts work across Unix variants
- **Error Handling**: Implement robust error detection and recovery
- **Documentation**: Add inline comments and usage documentation
- **Security**: Avoid common shell scripting security pitfalls
- **Testing**: Test scripts across different environments

#### Key Skills
- **Shells**: Bash, POSIX sh, Zsh
- **Tools**: sed, awk, grep, find, xargs
- **Best Practices**: ShellCheck, defensive programming
- **Cross-Platform**: Cygwin, WSL, Git Bash compatibility

### Terminal Application Developer

**Primary Focus**: Interactive terminal user interfaces

#### Core Responsibilities
- **TUI Design**: Design intuitive terminal interfaces
- **Input Handling**: Implement keyboard navigation and interaction
- **Visual Elements**: Create progress bars, tables, menus, forms
- **Accessibility**: Ensure compatibility with screen readers
- **Performance**: Optimize rendering for smooth interaction
- **Testing**: Test across different terminal emulators

#### Key Skills
- **TUI Frameworks**: Ink (React), blessed, Bubble Tea, Textual
- **Terminal Protocols**: ANSI escape sequences, cursor control
- **Layout**: Box model, flexbox-like layouts for terminal
- **Input**: Raw input mode, mouse support, key combinations

## CLI Design Principles

### Command Structure Best Practices

#### 1. Hierarchical Command Organization
```
mytool [global-options] <command> [command-options] [arguments]

Examples:
  git commit -m "message"
  docker container ls --all
  npm run build -- --watch
```

#### 2. Consistent Naming Conventions
- Use lowercase, hyphenated command names
- Verbs for actions: `create`, `delete`, `list`, `show`
- Consistent flag naming: `--verbose`, `--output`, `--format`

#### 3. Flag Design Guidelines
```
Short flags: -v, -h, -o
Long flags: --verbose, --help, --output
Boolean flags: --no-cache, --force
Value flags: --output=file.txt, --format json
```

### Output Design

#### Human-Readable Output
- Use colors and formatting for clarity
- Show progress for long operations
- Provide clear success/error indicators
- Use tables for structured data

#### Machine-Parseable Output
- Support JSON output (`--json`, `--output json`)
- Support quiet mode (`--quiet`, `-q`)
- Use exit codes consistently
- Avoid mixing output with progress indicators

### Error Handling

#### Error Message Guidelines
```
Error: Could not read configuration file
  Path: ~/.config/mytool/config.yaml
  Reason: Permission denied

Suggestion: Run 'chmod 644 ~/.config/mytool/config.yaml' to fix permissions
```

- State what went wrong clearly
- Include relevant context (paths, values)
- Suggest how to fix the issue
- Use appropriate exit codes

### Exit Codes Convention
```
0   - Success
1   - General error
2   - Misuse of command (invalid arguments)
64  - Command line usage error
65  - Data format error
66  - Cannot open input file
73  - Cannot create output file
74  - I/O error
130 - Interrupted (Ctrl+C)
```

## Argument Parsing Patterns

### Common Parser Libraries

#### Node.js/TypeScript
```typescript
// Commander.js
import { Command } from 'commander';

const program = new Command();
program
  .name('mytool')
  .description('A CLI tool description')
  .version('1.0.0')
  .option('-v, --verbose', 'Enable verbose output')
  .option('-o, --output <file>', 'Output file path')
  .argument('<input>', 'Input file')
  .action((input, options) => {
    // Handle command
  });

// Yargs
import yargs from 'yargs';

const argv = yargs(process.argv.slice(2))
  .command('build <project>', 'Build a project', (yargs) => {
    return yargs.positional('project', { describe: 'Project name' });
  })
  .option('verbose', { alias: 'v', type: 'boolean' })
  .help()
  .parse();
```

#### Python
```python
# Click
import click

@click.command()
@click.option('--verbose', '-v', is_flag=True, help='Enable verbose output')
@click.option('--output', '-o', type=click.Path(), help='Output file')
@click.argument('input_file', type=click.Path(exists=True))
def main(verbose, output, input_file):
    """Process INPUT_FILE and generate output."""
    pass

# Argparse
import argparse

parser = argparse.ArgumentParser(description='Process files')
parser.add_argument('input', help='Input file path')
parser.add_argument('-o', '--output', help='Output file path')
parser.add_argument('-v', '--verbose', action='store_true')
args = parser.parse_args()
```

#### Go
```go
// Cobra
var rootCmd = &cobra.Command{
    Use:   "mytool",
    Short: "A brief description",
    Run: func(cmd *cobra.Command, args []string) {
        // Main logic
    },
}

func init() {
    rootCmd.PersistentFlags().BoolVarP(&verbose, "verbose", "v", false, "verbose output")
    rootCmd.Flags().StringVarP(&output, "output", "o", "", "output file")
}
```

### Argument Validation Patterns

```typescript
// Input validation with helpful errors
function validateInput(options: Options): void {
  if (!options.input) {
    throw new ValidationError(
      'Missing required argument: input',
      'Provide an input file: mytool <input-file>'
    );
  }

  if (!fs.existsSync(options.input)) {
    throw new ValidationError(
      `Input file not found: ${options.input}`,
      'Check that the file exists and the path is correct'
    );
  }

  if (options.format && !['json', 'yaml', 'xml'].includes(options.format)) {
    throw new ValidationError(
      `Invalid format: ${options.format}`,
      'Supported formats: json, yaml, xml'
    );
  }
}
```

## Model Context Protocol (MCP) Architecture

### MCP Overview

The Model Context Protocol enables AI assistants to interact with external tools and resources through a standardized interface. MCP servers expose capabilities that AI models can discover and invoke.

### Core MCP Concepts

#### Server Structure
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server(
  { name: 'my-mcp-server', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {} } }
);

// Tool registration
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'search_files',
      description: 'Search for files matching a pattern',
      inputSchema: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Glob pattern' },
          path: { type: 'string', description: 'Search directory' }
        },
        required: ['pattern']
      }
    }
  ]
}));

// Tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'search_files':
      return await searchFiles(args.pattern, args.path);
    default:
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
  }
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

#### Tool Definition Schema
```typescript
interface ToolDefinition {
  name: string;           // Unique tool identifier
  description: string;    // Human-readable description for AI
  inputSchema: {          // JSON Schema for parameters
    type: 'object';
    properties: Record<string, PropertySchema>;
    required?: string[];
  };
}

// Example tool with comprehensive schema
const readFileTool: ToolDefinition = {
  name: 'read_file',
  description: 'Read contents of a file. Returns file content as text.',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Absolute path to the file to read'
      },
      encoding: {
        type: 'string',
        enum: ['utf8', 'base64', 'hex'],
        default: 'utf8',
        description: 'File encoding'
      },
      maxLines: {
        type: 'number',
        description: 'Maximum lines to read (omit for all)'
      }
    },
    required: ['path']
  }
};
```

#### Resource Definition
```typescript
// Resources provide dynamic content access
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'file:///workspace/config.json',
      name: 'Project Configuration',
      mimeType: 'application/json'
    },
    {
      uri: 'api://github/repos/{owner}/{repo}',
      name: 'GitHub Repository',
      mimeType: 'application/json'
    }
  ]
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri.startsWith('file://')) {
    const path = uri.slice(7);
    const content = await fs.readFile(path, 'utf-8');
    return {
      contents: [{ uri, mimeType: 'text/plain', text: content }]
    };
  }

  throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
});
```

### MCP Transport Layers

#### stdio Transport (Default)
```typescript
// Server-side
const transport = new StdioServerTransport();
await server.connect(transport);

// Client-side (spawning server process)
const transport = new StdioClientTransport({
  command: 'node',
  args: ['./my-server.js']
});
```

#### HTTP/SSE Transport
```typescript
// For web-based MCP servers
import express from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

const app = express();

app.get('/sse', async (req, res) => {
  const transport = new SSEServerTransport('/messages', res);
  await server.connect(transport);
});

app.post('/messages', async (req, res) => {
  // Handle incoming messages
});
```

### MCP Best Practices

#### Tool Design Guidelines
1. **Clear Descriptions**: Write descriptions that help AI understand when to use the tool
2. **Precise Schemas**: Define exact parameter types and constraints
3. **Error Messages**: Return helpful error messages the AI can understand
4. **Idempotency**: Design tools to be safely retryable when possible
5. **Bounded Output**: Limit output size to avoid context overflow

#### Security Considerations
```typescript
// Input validation
function validatePath(path: string): void {
  // Prevent path traversal
  const normalized = path.normalize(path);
  if (normalized.includes('..')) {
    throw new McpError(ErrorCode.InvalidParams, 'Path traversal not allowed');
  }

  // Check against allowed directories
  const allowed = ['/workspace', '/tmp'];
  if (!allowed.some(dir => normalized.startsWith(dir))) {
    throw new McpError(ErrorCode.InvalidParams, 'Path outside allowed directories');
  }
}

// Rate limiting
const rateLimiter = new RateLimiter({ maxRequests: 100, windowMs: 60000 });

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (!rateLimiter.check()) {
    throw new McpError(ErrorCode.InvalidRequest, 'Rate limit exceeded');
  }
  // ... handle request
});
```

## Interactive Terminal Interfaces

### TUI Framework Comparison

| Framework | Language | Style | Best For |
|-----------|----------|-------|----------|
| Ink | TypeScript | React components | Complex UIs with state |
| Blessed | Node.js | Widget-based | Full-screen applications |
| Bubble Tea | Go | Elm architecture | Elegant, testable TUIs |
| Textual | Python | Widget-based | Rich Python applications |
| Rich | Python | Output formatting | Beautiful CLI output |

### Common TUI Patterns

#### Progress Indicators
```typescript
// Using ora for spinners
import ora from 'ora';

const spinner = ora('Loading...').start();
try {
  await longOperation();
  spinner.succeed('Complete');
} catch (error) {
  spinner.fail('Failed');
}

// Progress bar with cli-progress
import { SingleBar, Presets } from 'cli-progress';

const bar = new SingleBar({}, Presets.shades_classic);
bar.start(100, 0);
for (let i = 0; i <= 100; i++) {
  bar.update(i);
  await delay(50);
}
bar.stop();
```

#### Interactive Prompts
```typescript
// Using Inquirer.js
import inquirer from 'inquirer';

const answers = await inquirer.prompt([
  {
    type: 'input',
    name: 'name',
    message: 'Project name:',
    validate: (input) => input.length > 0 || 'Name is required'
  },
  {
    type: 'list',
    name: 'template',
    message: 'Select template:',
    choices: ['React', 'Vue', 'Angular', 'Svelte']
  },
  {
    type: 'confirm',
    name: 'typescript',
    message: 'Use TypeScript?',
    default: true
  }
]);
```

#### Tables and Structured Output
```typescript
// Using cli-table3
import Table from 'cli-table3';

const table = new Table({
  head: ['Name', 'Status', 'Last Updated'],
  style: { head: ['cyan'] }
});

table.push(
  ['api-server', 'Running', '2 minutes ago'],
  ['worker', 'Stopped', '1 hour ago'],
  ['scheduler', 'Running', '5 minutes ago']
);

console.log(table.toString());
```

## Cross-Platform CLI Considerations

### Path Handling
```typescript
import path from 'path';
import os from 'os';

// Use path.join for cross-platform paths
const configPath = path.join(os.homedir(), '.config', 'mytool', 'config.json');

// Handle Windows drive letters
function normalizePath(inputPath: string): string {
  return inputPath.replace(/\\/g, '/');
}

// Platform-specific config directories
function getConfigDir(): string {
  switch (process.platform) {
    case 'win32':
      return process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Application Support');
    default:
      return process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
  }
}
```

### Shell Compatibility
```bash
#!/usr/bin/env bash
# Use /usr/bin/env for portability

# Check for required commands
command -v jq >/dev/null 2>&1 || { echo "jq is required"; exit 1; }

# Portable string manipulation (avoid bash-specific features for POSIX)
# Bash-specific: ${var,,} for lowercase
# Portable: $(echo "$var" | tr '[:upper:]' '[:lower:]')

# Handle different sed versions (GNU vs BSD)
if sed --version 2>/dev/null | grep -q GNU; then
  sed -i 's/old/new/' file.txt
else
  sed -i '' 's/old/new/' file.txt  # BSD sed
fi
```

### Terminal Capabilities
```typescript
import supportsColor from 'supports-color';

// Check color support
const useColors = supportsColor.stdout && supportsColor.stdout.hasBasic;

// Check if running in TTY
const isInteractive = process.stdin.isTTY && process.stdout.isTTY;

// Fallback for non-interactive mode
if (!isInteractive) {
  // Use simple output without prompts
  console.log(JSON.stringify(result));
} else {
  // Use interactive prompts and colors
  displayInteractiveUI(result);
}
```

## Testing Strategies

### CLI Testing Approaches

#### Unit Testing
```typescript
// Test argument parsing
describe('CLI argument parsing', () => {
  it('should parse input file argument', () => {
    const args = parseArgs(['input.txt']);
    expect(args.input).toBe('input.txt');
  });

  it('should parse output flag', () => {
    const args = parseArgs(['input.txt', '-o', 'output.txt']);
    expect(args.output).toBe('output.txt');
  });
});
```

#### Integration Testing
```typescript
import { execSync, spawn } from 'child_process';

describe('CLI integration', () => {
  it('should process file and output JSON', () => {
    const result = execSync('node ./cli.js input.txt --json', {
      encoding: 'utf-8'
    });
    const output = JSON.parse(result);
    expect(output.success).toBe(true);
  });

  it('should return error code for missing file', () => {
    expect(() => {
      execSync('node ./cli.js nonexistent.txt');
    }).toThrow();
  });
});
```

#### Snapshot Testing
```typescript
// Capture and compare CLI output
describe('CLI output snapshots', () => {
  it('should match help output', () => {
    const output = execSync('node ./cli.js --help', { encoding: 'utf-8' });
    expect(output).toMatchSnapshot();
  });
});
```

### MCP Testing
```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

describe('MCP Server', () => {
  let client: Client;

  beforeAll(async () => {
    // Connect to test server
    client = new Client({ name: 'test-client', version: '1.0.0' }, {});
    await client.connect(transport);
  });

  it('should list available tools', async () => {
    const tools = await client.listTools();
    expect(tools.tools).toContainEqual(
      expect.objectContaining({ name: 'read_file' })
    );
  });

  it('should execute tool successfully', async () => {
    const result = await client.callTool({
      name: 'read_file',
      arguments: { path: '/tmp/test.txt' }
    });
    expect(result.content[0].text).toContain('test content');
  });
});
```

## Distribution and Packaging

### Node.js CLI Distribution

#### npm Publishing
```json
{
  "name": "my-cli-tool",
  "version": "1.0.0",
  "bin": {
    "mytool": "./dist/cli.js"
  },
  "files": ["dist"],
  "engines": {
    "node": ">=18"
  }
}
```

#### Single Executable (pkg/nexe)
```bash
# Using pkg
npx pkg . --targets node18-linux-x64,node18-macos-x64,node18-win-x64

# Output: mytool-linux, mytool-macos, mytool-win.exe
```

### Python CLI Distribution

#### PyPI Publishing
```toml
# pyproject.toml
[project.scripts]
mytool = "mytool.cli:main"

[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"
```

#### PyInstaller Binary
```bash
pyinstaller --onefile --name mytool cli.py
```

### Go CLI Distribution

#### goreleaser Configuration
```yaml
# .goreleaser.yml
builds:
  - main: ./cmd/mytool
    binary: mytool
    goos: [linux, darwin, windows]
    goarch: [amd64, arm64]

archives:
  - format_overrides:
      - goos: windows
        format: zip

brews:
  - tap:
      owner: myorg
      name: homebrew-tap
    homepage: https://github.com/myorg/mytool
    description: My CLI tool
```

### Homebrew Formula
```ruby
class Mytool < Formula
  desc "My CLI tool description"
  homepage "https://github.com/myorg/mytool"
  url "https://github.com/myorg/mytool/archive/v1.0.0.tar.gz"
  sha256 "..."
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *Language::Node.std_npm_install_args(libexec)
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match "1.0.0", shell_output("#{bin}/mytool --version")
  end
end
```

## Goals and Objectives

### CLI Development Goals
- **Intuitive UX**: Users can discover and use commands without documentation
- **Fast Execution**: Minimize startup time and operation latency
- **Reliable Operation**: Consistent behavior across environments
- **Clear Feedback**: Progress indication and helpful error messages
- **Easy Distribution**: Simple installation across platforms

### MCP Development Goals
- **AI Integration**: Seamless integration with AI assistants
- **Tool Reliability**: Tools that execute correctly and handle errors gracefully
- **Security**: Safe execution with proper sandboxing and validation
- **Discoverability**: Well-documented tools that AI can understand and use appropriately
- **Performance**: Fast tool execution without blocking AI interactions

### Terminal Application Goals
- **Responsive UI**: Smooth, lag-free interaction
- **Accessibility**: Work with screen readers and different terminal capabilities
- **Cross-Platform**: Consistent experience across operating systems
- **Intuitive Navigation**: Keyboard shortcuts and clear navigation patterns

## Key Metrics

### CLI Performance Metrics
- **Startup Time**: Time from invocation to first output (target: <200ms)
- **Command Completion Time**: Execution duration for common operations
- **Memory Usage**: Peak memory consumption during operation
- **Binary Size**: Distribution artifact size

### MCP Quality Metrics
- **Tool Success Rate**: Percentage of successful tool invocations
- **Response Time**: Latency from request to response
- **Error Rate**: Frequency of errors and failures
- **Schema Compliance**: Adherence to defined schemas

### User Experience Metrics
- **Help Invocation Rate**: How often users need --help
- **Error Resolution Time**: Time to resolve user errors
- **Command Completion Rate**: Successful command completions vs. failures

## Learning Path

### Foundational Knowledge
1. **Shell Basics**: Bash/Zsh fundamentals, pipes, redirection
2. **Programming**: Node.js, Python, or Go proficiency
3. **Terminal**: Understanding terminal emulation, ANSI codes
4. **JSON**: JSON and JSON Schema for data interchange

### Intermediate Skills
1. **Argument Parsing**: Commander.js, Click, Cobra
2. **CLI UX Design**: Output formatting, progress indicators
3. **Testing**: CLI testing strategies and tools
4. **Distribution**: npm/pip/brew publishing

### Advanced Topics
1. **MCP Implementation**: Full MCP server development
2. **TUI Development**: Complex interactive applications
3. **Cross-Platform**: Windows/macOS/Linux compatibility
4. **Performance**: Startup optimization, lazy loading
5. **Security**: Input validation, sandboxing, permissions

## Career Progression

### Entry Level: Junior CLI Developer
- Focus: Basic CLI tools, argument parsing, simple scripts
- Experience: 0-2 years

### Mid Level: CLI Developer / MCP Developer
- Focus: Complex CLI applications, MCP servers, distribution
- Experience: 2-5 years

### Senior Level: Senior CLI/Platform Developer
- Focus: Developer tools architecture, CLI frameworks, MCP ecosystem
- Experience: 5-8 years

### Staff Level: Staff Developer Tools Engineer
- Focus: Developer experience strategy, tool ecosystem design
- Experience: 8+ years

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Specialization**: CLI and MCP Development
