# Provider & Model Configuration

> Archived design document. Preserved for historical context; not part of the current normative `reference/` contract.

**Specification v1.0** | `@a5c-ai/agent-mux`

---

## 1. Overview

This spec defines how `amux` resolves which LLM provider and model a harness should use, covering both the CLI surface (`amux launch`, `amux run`) and the programmatic SDK. It introduces a **provider configuration system** that abstracts away per-harness differences in how providers and models are specified.

The core problem: each harness has its own way of configuring providers — Claude uses env vars (`ANTHROPIC_API_KEY`, `CLAUDE_CODE_USE_BEDROCK`), Codex uses `config.toml` profiles, Gemini uses settings.json and env vars, OpenCode uses `opencode.json` with Vercel AI SDK provider packages. `amux` unifies this into a single configuration surface that is then translated into harness-specific configuration at launch time.

### 1.1 Cross-References

| Concept | Spec |
|---|---|
| `amux launch` command | `docs/launcher.md` |
| `amux-proxy` package | `docs/provider-mux.md` |
| Config & auth | `08-config-and-auth.md` |
| Capabilities & models | `06-capabilities-and-models.md` |
| CLI reference | `10-cli-reference.md` |

---

## 2. Provider Configuration Schema

### 2.1 Core Type

```typescript
interface ProviderConfig {
  /** Provider identifier from the taxonomy */
  provider: ProviderId;
  
  /** Model identifier (provider-specific format) */
  model: string;
  
  /** Wire protocol the provider's API speaks */
  transport: TransportId;
  
  /** Authentication configuration */
  auth: ProviderAuth;
  
  /** Provider-specific parameters */
  params: Record<string, string>;
}

type ProviderId =
  | 'anthropic'     // Anthropic direct API
  | 'openai'        // OpenAI direct API
  | 'google'        // Google AI Studio
  | 'bedrock'       // AWS Bedrock
  | 'vertex'        // Google Vertex AI
  | 'azure'         // Azure OpenAI
  | 'foundry'       // Azure AI Foundry
  | 'ollama'        // Local Ollama instance
  | 'local'         // Generic local model server
  | 'openrouter'    // OpenRouter
  | 'groq'          // Groq
  | 'fireworks'     // Fireworks AI
  | 'together'      // Together AI
  | 'deepseek'      // DeepSeek
  | 'mistral'       // Mistral AI
  | 'cerebras'      // Cerebras
  | 'sambanova'     // SambaNova
  | 'custom';       // User-defined endpoint

type TransportId =
  | 'anthropic'          // Anthropic Messages API
  | 'openai-chat'        // OpenAI Chat Completions
  | 'openai-responses'   // OpenAI Responses API
  | 'google';            // Google GenerateContent

interface ProviderAuth {
  /** Auth mechanism */
  type: 'api_key' | 'oauth' | 'iam' | 'adc' | 'service_account' | 'spn' | 'bearer' | 'none' | 'command';
  
  /** API key value (or env var name prefixed with $) */
  apiKey?: string;
  
  /** OAuth/bearer token */
  token?: string;
  
  /** External command that outputs a token */
  command?: string;
  
  /** AWS-specific */
  awsProfile?: string;
  awsRoleArn?: string;
  awsSessionToken?: string;
  
  /** GCP-specific */
  gcpCredentialsFile?: string;
  
  /** Azure-specific */
  azureTenantId?: string;
  azureClientId?: string;
  azureClientSecret?: string;
}
```

### 2.2 Provider Defaults

Each `ProviderId` has default values that reduce configuration burden:

| Provider | Default Transport | Default Auth Type | Default API Base | Default Model Format |
|---|---|---|---|---|
| `anthropic` | `anthropic` | `api_key` | `https://api.anthropic.com` | `claude-sonnet-4-20250514` |
| `openai` | `openai-responses` | `api_key` | `https://api.openai.com` | `gpt-4o` |
| `google` | `google` | `api_key` | `https://generativelanguage.googleapis.com` | `gemini-2.5-pro` |
| `bedrock` | `anthropic` | `iam` | `https://bedrock-runtime.{region}.amazonaws.com` | `anthropic.claude-sonnet-4-20250514-v1:0` |
| `vertex` | `google` | `adc` | `https://{region}-aiplatform.googleapis.com` | `claude-sonnet-4@20250514` |
| `azure` | `openai-chat` | `api_key` | `https://{resource}.openai.azure.com` | `{deployment-name}` |
| `foundry` | `openai-chat` | `api_key` | `https://{resource}.services.ai.azure.com` | `{deployment-name}` |
| `ollama` | `openai-chat` | `none` | `http://localhost:11434` | `qwen3:latest` |
| `local` | `openai-chat` | `none` | `http://localhost:8080` | (required) |
| `openrouter` | `openai-chat` | `api_key` | `https://openrouter.ai/api` | `anthropic/claude-sonnet-4` |
| `groq` | `openai-chat` | `api_key` | `https://api.groq.com/openai` | `llama-4-scout-17b-16e-instruct` |
| `fireworks` | `openai-chat` | `api_key` | `https://api.fireworks.ai/inference` | `accounts/fireworks/models/llama-v3p3-70b-instruct` |
| `together` | `openai-chat` | `api_key` | `https://api.together.xyz` | `meta-llama/Meta-Llama-3.3-70B-Instruct-Turbo` |
| `deepseek` | `openai-chat` | `api_key` | `https://api.deepseek.com` | `deepseek-chat` |
| `mistral` | `openai-chat` | `api_key` | `https://api.mistral.ai` | `mistral-large-latest` |
| `cerebras` | `openai-chat` | `api_key` | `https://api.cerebras.ai` | `llama-4-scout-17b-16e-instruct` |
| `sambanova` | `openai-chat` | `api_key` | `https://api.sambanova.ai` | `Meta-Llama-3.3-70B-Instruct` |
| `custom` | (required) | (required) | (required) | (required) |

---

## 3. Configuration Sources (Precedence Order)

Provider configuration is resolved from multiple sources, with later sources overriding earlier ones:

```
1. Provider defaults (§2.2)              ← lowest priority
2. Global config:  ~/.amux/providers.json
3. Project config: .amux/providers.json
4. Named profile:  --profile <name>
5. Environment variables
6. CLI flags                              ← highest priority
```

### 3.1 Configuration File Format

`~/.amux/providers.json` and `.amux/providers.json`:

```json
{
  "$schema": "https://a5c.ai/schemas/amux-providers.json",
  "version": 1,
  
  "defaults": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-20250514"
  },

  "profiles": {
    "work-bedrock": {
      "provider": "bedrock",
      "model": "anthropic.claude-sonnet-4-20250514-v1:0",
      "auth": {
        "type": "iam",
        "awsProfile": "work-sso"
      },
      "params": {
        "region": "us-east-1"
      }
    },
    "home-vertex": {
      "provider": "vertex",
      "model": "claude-sonnet-4@20250514",
      "auth": {
        "type": "adc"
      },
      "params": {
        "project": "my-home-project",
        "region": "us-central1"
      }
    },
    "local-ollama": {
      "provider": "ollama",
      "model": "qwen3:32b",
      "auth": { "type": "none" },
      "params": {
        "apiBase": "http://localhost:11434"
      }
    },
    "corp-proxy": {
      "provider": "custom",
      "transport": "openai-chat",
      "model": "internal-claude-proxy",
      "auth": {
        "type": "command",
        "command": "corp-auth-helper get-token --scope llm"
      },
      "params": {
        "apiBase": "https://llm-proxy.corp.internal/v1"
      }
    }
  }
}
```

### 3.2 Environment Variables

Environment variables follow the pattern `AMUX_PROVIDER_*`:

| Variable | Maps To | Example |
|---|---|---|
| `AMUX_PROVIDER` | `provider` | `bedrock` |
| `AMUX_MODEL` | `model` | `anthropic.claude-sonnet-4-20250514-v1:0` |
| `AMUX_TRANSPORT` | `transport` | `anthropic` |
| `AMUX_API_KEY` | `auth.apiKey` | `sk-ant-...` |
| `AMUX_API_BASE` | `params.apiBase` | `https://custom.endpoint.com` |
| `AMUX_REGION` | `params.region` | `us-east-1` |
| `AMUX_PROJECT` | `params.project` | `my-project` |
| `AMUX_PROFILE` | Profile name | `work-bedrock` |
| `AMUX_AUTH_COMMAND` | `auth.command` | `my-token-script` |

Additionally, provider-native env vars are respected as fallbacks:

| Native Variable | Used When Provider Is |
|---|---|
| `ANTHROPIC_API_KEY` | `anthropic` |
| `OPENAI_API_KEY` | `openai` |
| `GOOGLE_API_KEY`, `GEMINI_API_KEY` | `google` |
| `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` | `bedrock` |
| `AWS_PROFILE` | `bedrock` (profile-based auth) |
| `GOOGLE_APPLICATION_CREDENTIALS` | `vertex` |
| `AZURE_API_KEY` | `azure`, `foundry` |
| `OPENROUTER_API_KEY` | `openrouter` |
| `GROQ_API_KEY` | `groq` |
| `FIREWORKS_API_KEY` | `fireworks` |
| `TOGETHER_API_KEY` | `together` |
| `DEEPSEEK_API_KEY` | `deepseek` |
| `MISTRAL_API_KEY` | `mistral` |

### 3.3 CLI Flag Mapping

| CLI Flag | Config Field |
|---|---|
| `--model` / `-m` | `model` |
| `--api-key` | `auth.apiKey` |
| `--api-base` | `params.apiBase` |
| `--region` | `params.region` |
| `--project` | `params.project` |
| `--resource-group` | `params.resourceGroup` |
| `--endpoint-name` | `params.endpointName` |
| `--transport` / `-t` | `transport` |
| `--profile` | Loads named profile |
| `--auth-command` | `auth.command` |

---

## 4. Provider → Harness Translation

Once a `ProviderConfig` is resolved, it must be translated into the harness-specific configuration format. This section defines the translation rules.

### 4.1 Translation Interface

```typescript
interface HarnessProviderTranslation {
  /** Environment variables to set */
  env: Record<string, string>;
  
  /** CLI arguments to prepend */
  args: string[];
  
  /** Config file content to write (for harnesses that need it) */
  configContent?: string;
  
  /** Config file path (if configContent is set) */
  configPath?: string;
  
  /** Whether a proxy is required */
  proxyRequired: boolean;
  
  /** If proxy is required, what transport should it expose */
  proxyExposedTransport?: TransportId;
}
```

### 4.2 Claude Code Translation Rules

| Provider | Translation |
|---|---|
| `anthropic` | `env.ANTHROPIC_API_KEY = auth.apiKey` |
| `bedrock` | `env.CLAUDE_CODE_USE_BEDROCK = "1"`, `env.AWS_REGION = params.region`, AWS auth env vars |
| `vertex` | `env.CLAUDE_CODE_USE_VERTEX = "1"`, `env.GOOGLE_CLOUD_PROJECT = params.project`, `env.GOOGLE_CLOUD_LOCATION = params.region` |
| `foundry` | `env.CLAUDE_CODE_USE_FOUNDRY = "1"`, Foundry auth env vars |
| `ollama` | `env.ANTHROPIC_BASE_URL = params.apiBase`, `env.ANTHROPIC_API_KEY = ""`, `env.ANTHROPIC_AUTH_TOKEN = "ollama"`, model override env vars |
| Others | `proxyRequired = true`, `proxyExposedTransport = "anthropic"` |

Model mapping for Claude: when model ID doesn't match a known Claude model, set `ANTHROPIC_DEFAULT_SONNET_MODEL`, `ANTHROPIC_DEFAULT_OPUS_MODEL`, `ANTHROPIC_DEFAULT_HAIKU_MODEL` to the resolved model ID.

### 4.3 Codex Translation Rules

| Provider | Translation |
|---|---|
| `openai` | `env.OPENAI_API_KEY = auth.apiKey` |
| `ollama` | `args = ["--oss"]` (native Ollama support) |
| Custom OpenAI-compat | `env.OPENAI_BASE_URL = params.apiBase`, `env.OPENAI_API_KEY = auth.apiKey` |
| Others | `proxyRequired = true`, `proxyExposedTransport = "openai-responses"` |

For providers with config.toml support, generate a profile entry:

```typescript
configContent = `
[model_providers.amux]
name = "amux-proxy"
base_url = "${proxyBaseUrl}/v1/"
wire_api = "responses"
env_key = "AMUX_PROXY_KEY"
`;
configPath = path.join(os.homedir(), '.codex', 'config.toml');
args = ['--profile', 'amux'];
```

### 4.4 Gemini CLI Translation Rules

| Provider | Translation |
|---|---|
| `google` | `env.GEMINI_API_KEY = auth.apiKey` or `env.GOOGLE_API_KEY = auth.apiKey` |
| `vertex` | `env.GOOGLE_GENAI_USE_VERTEXAI = "true"`, `env.GOOGLE_CLOUD_PROJECT = params.project`, `env.GOOGLE_CLOUD_LOCATION = params.region` |
| Others | `proxyRequired = true`, `proxyExposedTransport = "google"` |

### 4.5 OpenCode Translation Rules

OpenCode is the most flexible harness — it supports many providers natively via Vercel AI SDK packages:

| Provider | Translation |
|---|---|
| `anthropic` | `OPENCODE_CONFIG_CONTENT` with `@ai-sdk/anthropic` provider, `ANTHROPIC_API_KEY` |
| `openai` | `OPENCODE_CONFIG_CONTENT` with `@ai-sdk/openai` provider, `OPENAI_API_KEY` |
| `google` | `OPENCODE_CONFIG_CONTENT` with `@ai-sdk/google` provider, `GOOGLE_GENERATIVE_AI_API_KEY` |
| `vertex` | `OPENCODE_CONFIG_CONTENT` with `@ai-sdk/google-vertex` provider |
| `bedrock` | `OPENCODE_CONFIG_CONTENT` with `@ai-sdk/amazon-bedrock` provider |
| `azure` | `OPENCODE_CONFIG_CONTENT` with `@ai-sdk/azure` provider |
| `ollama`, `local`, others | `OPENCODE_CONFIG_CONTENT` with `@ai-sdk/openai-compatible`, `baseURL = params.apiBase` |
| Via proxy | Same as `ollama`/`local` but `baseURL = proxyBaseUrl` |

```typescript
function buildOpenCodeConfig(resolved: ProviderConfig, proxyUrl?: string): string {
  const baseUrl = proxyUrl || resolved.params.apiBase;
  const npm = proxyUrl
    ? '@ai-sdk/openai-compatible'
    : resolveOpenCodeNpm(resolved.provider);
  
  return JSON.stringify({
    $schema: 'https://opencode.ai/config.json',
    provider: {
      amux: { npm, options: { baseURL: baseUrl } },
    },
    model: {
      default: `amux/${resolved.model}`,
    },
  });
}
```

---

## 5. Programmatic API

### 5.1 SDK Surface

```typescript
import { resolveProvider, translateForHarness } from '@a5c-ai/agent-mux-core';

// Resolve from mixed sources
const config: ProviderConfig = resolveProvider({
  provider: 'bedrock',
  model: 'anthropic.claude-sonnet-4-20250514-v1:0',
  region: 'us-east-1',
  // ... other overrides
});

// Translate to harness-specific config
const translation: HarnessProviderTranslation = translateForHarness('claude', config);
console.log(translation.env);    // { CLAUDE_CODE_USE_BEDROCK: "1", AWS_REGION: "us-east-1", ... }
console.log(translation.args);   // []
console.log(translation.proxyRequired); // false

// Use with RunOptions
const runOptions: RunOptions = {
  agent: 'claude',
  prompt: 'hello',
  providerConfig: config,  // new field on RunOptions
};
```

### 5.2 RunOptions Extension

```typescript
interface RunOptions {
  // ... existing fields ...
  
  /** Provider configuration. When set, overrides adapter-default provider settings. */
  providerConfig?: ProviderConfig;
  
  /** Named provider profile to load. Merged with providerConfig if both set. */
  providerProfile?: string;
}
```

### 5.3 Adapter Integration

Each adapter gains an optional method:

```typescript
interface SubprocessAdapter {
  // ... existing methods ...
  
  /**
   * Translate a ProviderConfig into harness-specific env vars and args.
   * Returns proxyRequired=true if the harness cannot speak this provider natively.
   */
  translateProvider?(config: ProviderConfig): HarnessProviderTranslation;
}
```

If `translateProvider` is not implemented, the harness is assumed to only support its default provider and all others require a proxy.

---

## 6. Model Discovery & Validation

### 6.1 Model List Integration

`amux models` is extended to show available models per provider:

```bash
# List models for a provider
amux models --provider bedrock
amux models --provider vertex --region us-central1

# List models available for a harness+provider combo
amux models --harness claude --provider bedrock
```

### 6.2 Model ID Translation

Some providers use different model ID formats for the same underlying model:

| Canonical Model | Anthropic | Bedrock | Vertex |
|---|---|---|---|
| Claude Sonnet 4 | `claude-sonnet-4-20250514` | `anthropic.claude-sonnet-4-20250514-v1:0` | `claude-sonnet-4@20250514` |
| Claude Opus 4 | `claude-opus-4-20250514` | `anthropic.claude-opus-4-20250514-v1:0` | `claude-opus-4@20250514` |
| Claude Haiku 3.5 | `claude-3-5-haiku-20241022` | `anthropic.claude-3-5-haiku-20241022-v1:0` | `claude-3-5-haiku@20241022` |

`amux` maintains a model ID translation table. When `--model` is given, it is translated to the provider-specific format. Users can also use the canonical format and let amux translate.

```typescript
function translateModelId(canonical: string, provider: ProviderId): string {
  const entry = MODEL_TRANSLATION_TABLE[canonical];
  if (!entry) return canonical; // pass through unknown models
  return entry[provider] ?? canonical;
}
```

### 6.3 Validation

Before launching, `amux` validates:

1. The model exists in the provider's known model list (warning if unknown, not error)
2. The model supports the required capabilities (tool calling, streaming, etc.)
3. The auth is valid for the provider (where possible — e.g., checking AWS STS for Bedrock)

---

## 7. Local Model Management

### 7.1 Ollama Integration

For `provider: "ollama"`, amux integrates with the local Ollama server:

```bash
# Launch with Ollama, auto-pull model if not present
amux launch claude ollama --model qwen3:32b --with-proxy-if-needed

# List locally available models
amux models --provider ollama
```

The `amux-proxy` package handles Ollama model management (see `docs/provider-mux.md` §6).

### 7.2 Model Pull

When launching with Ollama and the model is not locally available:

1. Check `ollama list` for the model
2. If missing, prompt the user: `Model 'qwen3:32b' is not available locally. Pull it? [Y/n]`
3. If confirmed, pull with progress: `ollama pull qwen3:32b`
4. On success, continue with launch

In non-interactive mode (`--prompt`), auto-pull is controlled by `--auto-pull` flag (default: `false`).

---

## 8. Security Considerations

### 8.1 Credential Handling

- API keys passed via `--api-key` are **not** logged or written to config files
- Keys in `providers.json` should use env var references: `"apiKey": "$ANTHROPIC_API_KEY"`
- The `--auth-command` approach is preferred for dynamic credentials
- `--dry-run` masks API keys in output: `"ANTHROPIC_API_KEY": "sk-ant-***"`

### 8.2 Proxy Trust

- The proxy listens on `127.0.0.1` only (not `0.0.0.0`)
- The proxy uses a random session-scoped bearer token for auth between amux and the proxy
- The token is passed to the harness as the API key
- The proxy validates the token on every request

### 8.3 Config File Permissions

- `~/.amux/providers.json` should be `0600` (user-only read/write)
- `amux config` warns if permissions are too open
- Project-level `.amux/providers.json` should not contain secrets (use env var references)
