# iac-quality — Install Instructions

Set up infrastructure-as-code quality feedback loops — tflint for Terraform best practices, Checkov for security misconfigurations, OPA/Rego policy enforcement, and `terraform fmt` in pre-commit. Covers Terraform, OpenTofu, CloudFormation, Kubernetes manifests, and Dockerfiles.

## Step 1: Interview the User

### Stage 1: Project Analysis

1. Discover IaC assets: `*.tf`, `*.tf.json`, `*.hcl`, `cloudformation.yaml`, `k8s/**/*.yaml`, `helm/**`, `kustomization.yaml`
2. Detect Terraform provider(s): AWS, GCP, Azure, Kubernetes, Helm
3. Check existing tooling: `tflint`, `checkov`, `tfsec`, `terrascan`, `conftest`, `opa`
4. Check pre-existing `.pre-commit-config.yaml` — terraform hooks often already present
5. Check CI: `.github/workflows/`, `.gitlab-ci.yml`, `atlantis.yaml`
6. Summarize findings to the user

### Stage 2: Layers

Ask the user which layers to install (multi-select):

1. **tflint** — Terraform best-practice and provider-specific lint
2. **Checkov** — Static security + compliance scan across IaC formats
3. **OPA/Rego policies** — Custom org policies via conftest
4. **Format pre-commit** — `terraform fmt`, `tflint`, `yamllint` on staged files
5. **Plan review gate** — Post `terraform plan` summary + Checkov on PRs
6. **All** — Install every layer

### Stage 3: Strictness

Ask:
- Checkov soft-fail mode? (default: `off` in prod dirs, `on` in experimental dirs)
- Minimum tflint severity to fail? (default: `error`)
- Enable provider-specific tflint rulesets (AWS/GCP/Azure)? (default: yes, per detected provider)
- Custom Rego policies location? (default: `policy/`)

## Step 2: Install tflint

```bash
# macOS
brew install tflint
# Linux
curl -s https://raw.githubusercontent.com/terraform-linters/tflint/master/install_linux.sh | bash
```

Create `.tflint.hcl`:

```hcl
plugin "terraform" {
  enabled = true
  preset  = "recommended"
}

plugin "aws" {
  enabled = true
  version = "0.35.0"
  source  = "github.com/terraform-linters/tflint-ruleset-aws"
}

config {
  format = "compact"
  call_module_type = "local"
}

rule "terraform_required_version" { enabled = true }
rule "terraform_required_providers" { enabled = true }
rule "terraform_unused_declarations" { enabled = true }
rule "terraform_documented_variables" { enabled = true }
rule "terraform_naming_convention" {
  enabled = true
  format  = "snake_case"
}
```

Install plugins:

```bash
tflint --init
```

## Step 3: Install Checkov

```bash
pip install checkov
```

Create `.checkov.yaml`:

```yaml
framework:
  - terraform
  - kubernetes
  - helm
  - dockerfile
  - cloudformation
soft-fail-on:
  - LOW
skip-check:
  - CKV_AWS_130  # example: public subnet map on ELB — only where intentional
output: cli
quiet: true
compact: true
```

Add script:

```json
{ "scripts": { "iac:checkov": "checkov -d . --config-file .checkov.yaml" } }
```

## Step 4: Install OPA / Conftest

```bash
# Install conftest
brew install conftest
# or
curl -L https://github.com/open-policy-agent/conftest/releases/latest/download/conftest_Linux_x86_64.tar.gz | tar xz
```

Create `policy/required_tags.rego`:

```rego
package main

required_tags := {"Owner", "CostCenter", "Environment"}

deny[msg] {
  resource := input.resource.aws_instance[name]
  missing := required_tags - {key | resource.tags[key]}
  count(missing) > 0
  msg := sprintf("aws_instance.%s missing required tags: %v", [name, missing])
}
```

Run against plan JSON:

```bash
terraform plan -out=tfplan.bin
terraform show -json tfplan.bin > tfplan.json
conftest test tfplan.json --policy policy/
```

Script:

```json
{ "scripts": { "iac:opa": "bash scripts/iac-opa.sh" } }
```

## Step 5: Install Pre-commit Framework

```bash
pip install pre-commit
```

Create `.pre-commit-config.yaml` (or extend existing):

```yaml
repos:
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.96.1
    hooks:
      - id: terraform_fmt
      - id: terraform_validate
      - id: terraform_tflint
        args:
          - --args=--config=__GIT_WORKING_DIR__/.tflint.hcl
      - id: terraform_checkov
        args:
          - --args=--config-file __GIT_WORKING_DIR__/.checkov.yaml
  - repo: https://github.com/adrienverge/yamllint
    rev: v1.35.1
    hooks:
      - id: yamllint
        files: \.(ya?ml)$
```

Install hooks:

```bash
pre-commit install
```

## Step 6: Create GitHub Actions Workflow

Create `.github/workflows/iac-quality.yml`:

```yaml
name: IaC Quality

on:
  pull_request:
    paths: ['**/*.tf', '**/*.tf.json', 'k8s/**', 'helm/**', '**/*.yaml', '**/*.yml']
  push:
    branches: [main]

jobs:
  terraform-fmt:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: hashicorp/setup-terraform@v3
      - run: terraform fmt -check -recursive

  tflint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: terraform-linters/setup-tflint@v4
      - run: tflint --init
      - run: tflint --recursive --config=$(pwd)/.tflint.hcl

  checkov:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: bridgecrewio/checkov-action@master
        with:
          config_file: .checkov.yaml
          output_format: cli,sarif
          output_file_path: console,checkov.sarif
      - uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: checkov.sarif

  opa:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v6
      - uses: hashicorp/setup-terraform@v3
      - run: |
          terraform init -backend=false
          terraform plan -out=tfplan.bin
          terraform show -json tfplan.bin > tfplan.json
      - uses: instrumenta/conftest-action@master
        with:
          files: tfplan.json
          policy: policy
```

## Step 7: Run Baseline

```bash
terraform fmt -check -recursive || true
tflint --recursive || true
checkov -d . --config-file .checkov.yaml || true
```

Report to user: fmt diffs, tflint violations, Checkov findings by severity.

## Step 8: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name iac-quality --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 9: Verify Setup

1. `terraform fmt -check -recursive` passes
2. `tflint --recursive` runs without config errors
3. `checkov -d .` reports findings
4. `conftest test` runs Rego policies against plan JSON
5. Pre-commit hooks fire on staged `.tf` files
6. Workflow committed at `.github/workflows/iac-quality.yml`

## Reference

- tflint: https://github.com/terraform-linters/tflint
- Checkov: https://www.checkov.io/
- OPA / Rego: https://www.openpolicyagent.org/
- Conftest: https://www.conftest.dev/
- pre-commit-terraform: https://github.com/antonbabenko/pre-commit-terraform
