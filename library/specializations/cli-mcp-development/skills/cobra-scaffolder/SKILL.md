---
name: cobra-scaffolder
description: Generate Cobra/Viper-based Go CLI applications with persistent flags, subcommands, and configuration management. Creates production-ready Go CLI with modern patterns.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Cobra Scaffolder

Generate a complete Cobra CLI application with Viper configuration, proper Go module structure, and best practices.

## Capabilities

- Generate Go-based Cobra CLI projects
- Create command hierarchy with persistent and local flags
- Integrate Viper for configuration management
- Set up automatic environment variable binding
- Implement shell completion generation
- Configure go.mod and build workflows

## Usage

Invoke this skill when you need to:
- Bootstrap a new CLI application using Cobra
- Create a Go CLI with hierarchical commands
- Integrate Viper for multi-source configuration
- Build cross-platform native binaries

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| projectName | string | Yes | Name of the CLI project (kebab-case) |
| modulePath | string | Yes | Go module path (e.g., github.com/user/project) |
| description | string | Yes | Short description of the CLI |
| commands | array | No | List of commands to scaffold |
| useViper | boolean | No | Integrate Viper config (default: true) |
| useCobra | boolean | No | Use cobra-cli generator patterns (default: true) |

### Command Structure

```json
{
  "commands": [
    {
      "name": "serve",
      "description": "Start the server",
      "persistentFlags": [
        { "name": "config", "shorthand": "c", "type": "string", "usage": "config file path" }
      ],
      "flags": [
        { "name": "port", "shorthand": "p", "type": "int", "default": 8080, "usage": "port to listen on" }
      ],
      "subcommands": ["start", "stop", "status"]
    }
  ]
}
```

## Output Structure

```
<projectName>/
├── go.mod
├── go.sum
├── main.go
├── README.md
├── .goreleaser.yaml
├── cmd/
│   ├── root.go              # Root command with Viper
│   ├── serve.go             # Serve command
│   ├── version.go           # Version command
│   └── completion.go        # Completion command
├── internal/
│   ├── config/
│   │   └── config.go        # Configuration structures
│   ├── server/
│   │   └── server.go        # Server implementation
│   └── logger/
│       └── logger.go        # Logging setup
├── pkg/
│   └── utils/
│       └── helpers.go       # Public utilities
└── tests/
    └── cmd/
        └── root_test.go
```

## Generated Code Patterns

### Root Command (cmd/root.go)

```go
package cmd

import (
    "fmt"
    "os"

    "github.com/spf13/cobra"
    "github.com/spf13/viper"
)

var cfgFile string

var rootCmd = &cobra.Command{
    Use:   "<projectName>",
    Short: "<description>",
    Long:  `<long description>`,
    PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
        return initConfig()
    },
}

func Execute() {
    if err := rootCmd.Execute(); err != nil {
        fmt.Fprintln(os.Stderr, err)
        os.Exit(1)
    }
}

func init() {
    rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "",
        "config file (default is $HOME/.<projectName>.yaml)")
    rootCmd.PersistentFlags().BoolP("verbose", "v", false, "verbose output")

    viper.BindPFlag("verbose", rootCmd.PersistentFlags().Lookup("verbose"))
}

func initConfig() error {
    if cfgFile != "" {
        viper.SetConfigFile(cfgFile)
    } else {
        home, err := os.UserHomeDir()
        cobra.CheckErr(err)

        viper.AddConfigPath(home)
        viper.SetConfigType("yaml")
        viper.SetConfigName(".<projectName>")
    }

    viper.AutomaticEnv()
    viper.SetEnvPrefix("<PROJECT_NAME>")

    if err := viper.ReadInConfig(); err == nil {
        fmt.Fprintln(os.Stderr, "Using config file:", viper.ConfigFileUsed())
    }
    return nil
}
```

### Command Template (cmd/serve.go)

```go
package cmd

import (
    "fmt"

    "github.com/spf13/cobra"
    "github.com/spf13/viper"
)

var serveCmd = &cobra.Command{
    Use:   "serve",
    Short: "Start the server",
    Long:  `Start the server with the specified configuration.`,
    RunE: func(cmd *cobra.Command, args []string) error {
        port := viper.GetInt("port")
        host := viper.GetString("host")

        fmt.Printf("Starting server on %s:%d\n", host, port)
        return nil
    },
}

func init() {
    rootCmd.AddCommand(serveCmd)

    serveCmd.Flags().IntP("port", "p", 8080, "port to listen on")
    serveCmd.Flags().String("host", "localhost", "host to bind to")

    viper.BindPFlag("port", serveCmd.Flags().Lookup("port"))
    viper.BindPFlag("host", serveCmd.Flags().Lookup("host"))
}
```

## Dependencies

```go
module github.com/user/<projectName>

go 1.21

require (
    github.com/spf13/cobra v1.8.0
    github.com/spf13/viper v1.18.0
)
```

## Workflow

1. **Validate inputs** - Check project name, module path
2. **Create directory structure** - Set up Go project layout
3. **Generate go.mod** - Configure module and dependencies
4. **Create root command** - Viper integration and global flags
5. **Generate commands** - Individual command files
6. **Create internal packages** - Config, logger, etc.
7. **Set up goreleaser** - Cross-platform build config
8. **Create tests** - Command tests with cobra testing

## Best Practices Applied

- Standard Go project layout
- Viper for configuration management
- Persistent flags for shared options
- Environment variable binding
- Built-in completion generation
- Goreleaser for distribution

## References

- Cobra Documentation: https://cobra.dev/
- Cobra GitHub: https://github.com/spf13/cobra
- Viper GitHub: https://github.com/spf13/viper
- Go Project Layout: https://github.com/golang-standards/project-layout

## Target Processes

- cli-application-bootstrap
- cli-command-structure-design
- configuration-management-system
