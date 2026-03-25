---
name: viper-go-setup
description: Set up Viper for Go configuration management with file, env, and flag binding.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Viper Go Setup

Set up Viper for Go configuration management.

## Generated Patterns

```go
package config

import (
    "github.com/spf13/viper"
    "github.com/spf13/cobra"
)

type Config struct {
    Server   ServerConfig   `mapstructure:"server"`
    Database DatabaseConfig `mapstructure:"database"`
}

type ServerConfig struct {
    Host string `mapstructure:"host"`
    Port int    `mapstructure:"port"`
}

func InitConfig(cfgFile string) (*Config, error) {
    if cfgFile != "" {
        viper.SetConfigFile(cfgFile)
    } else {
        viper.SetConfigName("config")
        viper.SetConfigType("yaml")
        viper.AddConfigPath(".")
        viper.AddConfigPath("$HOME/.myapp")
    }

    viper.AutomaticEnv()
    viper.SetEnvPrefix("MYAPP")

    if err := viper.ReadInConfig(); err != nil {
        if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
            return nil, err
        }
    }

    var cfg Config
    if err := viper.Unmarshal(&cfg); err != nil {
        return nil, err
    }
    return &cfg, nil
}
```

## Target Processes

- configuration-management-system
- cli-application-bootstrap
