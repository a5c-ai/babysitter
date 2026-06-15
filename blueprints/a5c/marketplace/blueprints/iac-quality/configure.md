# iac-quality — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `tflintPreset` | `recommended`, `all`, custom | `recommended` | `.tflint.hcl` plugin block |
| `tflintProviders` | `aws`, `google`, `azurerm`, list | (detected) | `.tflint.hcl` |
| `namingConvention` | `snake_case`, `camel_case`, `mixed_snake_case` | `snake_case` | `terraform_naming_convention` |
| `checkovFrameworks` | list | `[terraform,kubernetes,helm,dockerfile,cloudformation]` | `.checkov.yaml` |
| `checkovSoftFailSeverity` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | `LOW` | `.checkov.yaml` soft-fail-on |
| `checkovSkipChecks` | list of CKV IDs | `[]` | `.checkov.yaml` skip-check |
| `opaPolicyDir` | path | `policy/` | conftest `--policy` |
| `requiredTags` | list | `[Owner, CostCenter, Environment]` | Rego policy |
| `ciGate` | `off`, `warn`, `error` | `error` | workflow |
| `planOnPr` | `true`/`false` | `true` | workflow `opa` job |
| `yamllintStrict` | `true`/`false` | `false` | yamllint config |

## 2. Add a Provider-Specific tflint Ruleset

```hcl
# .tflint.hcl
plugin "google" {
  enabled = true
  version = "0.30.0"
  source  = "github.com/terraform-linters/tflint-ruleset-google"
}

plugin "azurerm" {
  enabled = true
  version = "0.27.0"
  source  = "github.com/terraform-linters/tflint-ruleset-azurerm"
}
```

Then run `tflint --init`.

## 3. Skip Specific Checkov Checks

Edit `.checkov.yaml`:

```yaml
skip-check:
  - CKV_AWS_130
  - CKV_K8S_43     # ImagePullPolicy not Always — acceptable for pinned digests
  - CKV_DOCKER_2   # HEALTHCHECK not required for short-lived batch images
```

Per-file suppression via comment:

```hcl
# checkov:skip=CKV_AWS_23: security groups are internal-only; rule not applicable
resource "aws_security_group" "internal" { ... }
```

## 4. Change Severity Gate

```yaml
# .checkov.yaml
soft-fail-on:
  - LOW
  - MEDIUM   # warn rather than fail for MEDIUM
hard-fail-on:
  - HIGH
  - CRITICAL
```

## 5. Write Custom Rego Policy

`policy/no_public_s3.rego`:

```rego
package main

deny[msg] {
  resource := input.resource.aws_s3_bucket[name]
  resource.acl == "public-read"
  msg := sprintf("S3 bucket %s must not be public-read", [name])
}

deny[msg] {
  resource := input.resource_changes[_]
  resource.type == "aws_s3_bucket_public_access_block"
  resource.change.after.block_public_acls == false
  msg := sprintf("S3 public access block must have block_public_acls=true (%s)", [resource.address])
}
```

## 6. Multi-environment Policy Bundles

```bash
conftest test tfplan.json --policy policy/base --policy policy/prod --namespace main
```

With `policy/prod/stricter.rego` layering on top of `policy/base/`.

## 7. terraform fmt Configuration

No config file — always enforce:

```yaml
# Pre-commit
- id: terraform_fmt
  args:
    - --args=-recursive
    - --args=-diff
```

## 8. yamllint Rules

Create `.yamllint.yaml`:

```yaml
extends: default
rules:
  line-length:
    max: 160
    level: warning
  indentation:
    spaces: 2
    indent-sequences: true
  truthy:
    allowed-values: ['true', 'false', 'on', 'off']  # allow GH Actions 'on:'
```

## 9. Run IaC Fix Process

```bash
babysitter run:create \
  --process-id iac-fix \
  --entry .a5c/processes/iac-quality/fix.js#process \
  --prompt "Fix all Checkov HIGH/CRITICAL findings in terraform/, add missing required tags, run terraform fmt" \
  --json
```

## 10. Atlantis Integration

If the project uses Atlantis for PR-driven Terraform, add tflint + Checkov to the workflow:

```yaml
# atlantis.yaml
workflows:
  default:
    plan:
      steps:
        - init
        - run: tflint --recursive
        - run: checkov -d . --config-file .checkov.yaml
        - plan
```
