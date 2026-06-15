# terraform-module — Install Instructions

Scaffold a reusable Terraform module with the canonical layout — `main.tf`, `variables.tf`, `outputs.tf`, `versions.tf`, `examples/`, and `tests/` — plus a CI feedback loop: `terraform fmt`, `terraform validate`, `tflint`, `terraform-docs` (auto-generated README), `tfsec` security scanning, and a release workflow that tags and registers the module.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Check for existing `*.tf`, `main.tf`, `versions.tf` files
2. Detect whether this is a module (reusable) vs. a rootmodule (deployable stack)
3. Read existing `.terraform-docs.yml`, `.tflint.hcl`, `terraform.tfvars` if present
4. Detect cloud providers from existing `required_providers` blocks (aws, google, azurerm, etc.)
5. Check for existing `.github/workflows/*.yml` to avoid collisions
6. Summarize findings

### Stage 2: Module Shape

Ask:

1. **Single module** — Root is the module itself (Terraform Registry convention)
2. **Monorepo of modules** — `modules/<name>/` subdirectories, each independently tagged
3. **Root module (stack)** — Not a reusable module; skip this plugin and use a stack template instead

### Stage 3: Providers

Ask which providers the module will use (multi-select):
- AWS (`hashicorp/aws`)
- Google Cloud (`hashicorp/google`)
- Azure (`hashicorp/azurerm`)
- Kubernetes (`hashicorp/kubernetes`)
- Helm (`hashicorp/helm`)
- Cloudflare (`cloudflare/cloudflare`)
- Other (supply custom)

### Stage 4: CI Tools

Ask (each defaults on):
- `terraform fmt -check -recursive`
- `terraform validate` (per provider)
- `tflint` with the recommended ruleset + provider plugins
- `terraform-docs` — generate `README.md`, fail CI if diff
- `tfsec` or `checkov` for security scanning
- `terraform test` (native framework, 1.6+)
- `infracost` for cost estimation on PRs (optional)

### Stage 5: Release Strategy

Ask:
- Tag-on-merge to `main` with autorelease-drafted notes? (default)
- Register to Terraform Registry (public/Terraform Cloud private)? (default: no, opt in)
- Semantic versioning labels? (default: yes — breaking/feature/fix)
- Maintain a signed `CHANGELOG.md`? (default: yes)

### Stage 6: Testing

Ask:
- Unit tests via `terraform test` (`.tftest.hcl`)? (default: yes)
- Integration tests via [Terratest](https://terratest.gruntwork.io/) (Go)? (default: no, opt in)
- Example deployments under `examples/`? (default: yes — one `examples/simple/`, one `examples/complete/`)

## Step 2: Install Tooling

```bash
# Terraform
brew install terraform
# or: tfenv install 1.9.8

# tflint
brew install tflint

# terraform-docs
brew install terraform-docs

# tfsec
brew install tfsec
# or: go install github.com/aquasecurity/tfsec/cmd/tfsec@latest
```

## Step 3: Scaffold Module Layout

```bash
mkdir -p examples/simple examples/complete tests
touch main.tf variables.tf outputs.tf versions.tf README.md
```

### `versions.tf`

```hcl
terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0, < 6.0"
    }
  }
}
```

### `variables.tf`

```hcl
variable "name" {
  description = "Name prefix for created resources"
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,30}[a-z0-9]$", var.name))
    error_message = "name must be 4-32 chars, lowercase, digits, hyphens; start with letter."
  }
}

variable "tags" {
  description = "Common tags applied to all resources"
  type        = map(string)
  default     = {}
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be one of: dev, staging, prod."
  }
}
```

### `main.tf`

```hcl
locals {
  default_tags = merge(
    { Module = "<name>", Environment = var.environment },
    var.tags,
  )
}

# ... module resources go here ...
```

### `outputs.tf`

```hcl
output "id" {
  description = "Identifier of the primary resource"
  value       = null   # replace with real output
}
```

### `examples/simple/main.tf`

```hcl
module "example" {
  source = "../.."

  name        = "example"
  environment = "dev"
  tags        = { Owner = "platform" }
}
```

Each example is a minimal self-contained root that `terraform init` + `terraform plan` can validate.

## Step 4: Configure tflint

Create `.tflint.hcl`:

```hcl
plugin "terraform" {
  enabled = true
  preset  = "recommended"
}

plugin "aws" {
  enabled = true
  version = "0.33.0"
  source  = "github.com/terraform-linters/tflint-ruleset-aws"
}

rule "terraform_required_version" { enabled = true }
rule "terraform_required_providers" { enabled = true }
rule "terraform_standard_module_structure" { enabled = true }
rule "terraform_unused_declarations" { enabled = true }
rule "terraform_documented_outputs" { enabled = true }
rule "terraform_documented_variables" { enabled = true }
rule "terraform_naming_convention" { enabled = true }
rule "terraform_typed_variables" { enabled = true }
```

```bash
tflint --init
tflint
```

## Step 5: Configure terraform-docs

Create `.terraform-docs.yml`:

```yaml
formatter: markdown table

sections:
  hide: []
  show: [header, requirements, providers, modules, resources, inputs, outputs]

output:
  file: README.md
  mode: inject
  template: |-
    <!-- BEGIN_TF_DOCS -->
    {{ .Content }}
    <!-- END_TF_DOCS -->

settings:
  anchor: true
  color: true
  default: true
  description: true
  escape: true
  hide-empty: false
  html: true
  indent: 2
  lockfile: false
  read-comments: true
  required: true
  sensitive: true
  type: true
```

Seed README.md with the injection markers:

```markdown
# <module-name>

<brief description>

<!-- BEGIN_TF_DOCS -->
<!-- END_TF_DOCS -->

## Usage

See `examples/simple/`.
```

Generate:

```bash
terraform-docs .
```

## Step 6: Unit Tests (`terraform test`)

Create `tests/simple.tftest.hcl`:

```hcl
variables {
  name        = "unit-test"
  environment = "dev"
}

run "validates_inputs" {
  command = plan
  assert {
    condition     = length(var.name) >= 4
    error_message = "name too short"
  }
}

run "rejects_invalid_environment" {
  command = plan
  variables {
    environment = "production"   # not in allowed list
  }
  expect_failures = [var.environment]
}
```

Run:

```bash
terraform test
```

## Step 7: CI Workflow

Create `.github/workflows/terraform.yml`:

```yaml
name: terraform

on:
  pull_request:
    paths: ['**.tf', '**.tftest.hcl', '.github/workflows/terraform.yml']
  push:
    branches: [main]
    paths: ['**.tf', '**.tftest.hcl']

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.9.8
          terraform_wrapper: false

      - name: fmt
        run: terraform fmt -check -recursive

      - name: init (module)
        run: terraform init -backend=false

      - name: validate (module)
        run: terraform validate

      - name: validate examples
        run: |
          for ex in examples/*/; do
            (cd "$ex" && terraform init -backend=false && terraform validate)
          done

      - uses: terraform-linters/setup-tflint@v4
        with:
          tflint_version: v0.53.0

      - run: tflint --init
      - run: tflint --recursive

      - uses: aquasecurity/tfsec-action@v1.0.3
        with:
          soft_fail: false

      - uses: terraform-docs/gh-actions@v1
        with:
          working-dir: .
          output-file: README.md
          output-method: inject
          fail-on-diff: true

      - name: terraform test
        run: terraform test
```

## Step 8: Release Workflow

Pair with the `autorelease` plugin for tag-on-label-merge. Minimal standalone version:

`.github/workflows/terraform-release.yml`:

```yaml
name: terraform-release

on:
  push:
    tags: ['v*']

permissions:
  contents: write

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with: { fetch-depth: 0 }

      - uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true
          draft: false
          prerelease: false
```

Terraform Registry picks up tags automatically if the repo is connected (`gh repo view` — module repo must match `terraform-<provider>-<name>`).

## Step 9: Add Babysitter Convergence Process (Optional)

Modules benefit from periodic "fmt/docs/tflint green" sweeps:

```bash
babysitter run:create \
  --process-id terraform-hygiene \
  --entry .a5c/processes/terraform/hygiene.js#process \
  --prompt "Run terraform fmt, regenerate terraform-docs, fix tflint warnings, bump provider versions conservatively, open PR" \
  --json
```

## Step 10: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name terraform-module --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 11: Verify Setup

1. `terraform fmt -check -recursive` passes
2. `terraform init -backend=false && terraform validate` succeeds at root and each example
3. `tflint --recursive` passes
4. `terraform-docs .` produces the same README.md that is committed
5. `tfsec` reports no high-severity issues (or they are explicitly ignored with rationale)
6. `terraform test` passes
7. Tagging `v0.1.0` publishes a GitHub Release and (if connected) appears on the Registry

## Reference

- Terraform module structure: https://developer.hashicorp.com/terraform/language/modules/develop/structure
- Terraform Registry publishing: https://developer.hashicorp.com/terraform/registry/modules/publish
- tflint: https://github.com/terraform-linters/tflint
- terraform-docs: https://terraform-docs.io/
- tfsec: https://aquasecurity.github.io/tfsec/
- terraform test: https://developer.hashicorp.com/terraform/language/tests
- Terratest: https://terratest.gruntwork.io/
