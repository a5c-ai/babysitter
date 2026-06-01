# terraform-module — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `terraformVersion` | semver | `1.9.8` | `versions.tf` `required_version` |
| `providerConstraints` | semver ranges | per provider | `versions.tf` `required_providers` |
| `tflintPreset` | `recommended`, `all` | `recommended` | `.tflint.hcl` |
| `tfdocsFormat` | `markdown table`, `markdown document`, `json`, `yaml` | `markdown table` | `.terraform-docs.yml` |
| `tfdocsFailOnDiff` | `true`, `false` | `true` | CI step |
| `tfsecSeverity` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | `HIGH` | `.tfsec/config.yml` |
| `testFramework` | `terraform-test`, `terratest`, `both` | `terraform-test` | `tests/` layout |
| `exampleValidation` | `plan`, `apply`, `none` | `plan` | CI step |
| `registryVisibility` | `public`, `private`, `none` | `none` | Registry connection |
| `lockfileCommitted` | `true`, `false` | `false` (modules) | `.terraform.lock.hcl` |

## 2. Bump Terraform Version

```hcl
# versions.tf
terraform {
  required_version = ">= 1.10.0"
}
```

Update the CI workflow:

```yaml
- uses: hashicorp/setup-terraform@v3
  with:
    terraform_version: 1.10.1
```

## 3. Tighten Provider Constraints

```hcl
required_providers {
  aws = {
    source  = "hashicorp/aws"
    version = "~> 5.70"   # lock to 5.70.x — 5.71+ allowed once explicitly tested
  }
}
```

For modules, prefer upper-bound-only constraints; let consumers pin exactly.

## 4. Configure tflint Provider Plugins

```hcl
plugin "aws"     { enabled = true; version = "0.33.0"; source = "github.com/terraform-linters/tflint-ruleset-aws" }
plugin "google"  { enabled = true; version = "0.30.0"; source = "github.com/terraform-linters/tflint-ruleset-google" }
plugin "azurerm" { enabled = true; version = "0.27.0"; source = "github.com/terraform-linters/tflint-ruleset-azurerm" }
```

Run `tflint --init` after editing.

## 5. Add a tfsec Baseline Ignore

For justified exceptions, use inline comments rather than global ignores:

```hcl
resource "aws_s3_bucket" "logs" {
  bucket = "${var.name}-logs"
  # tfsec:ignore:aws-s3-enable-versioning rationale: append-only log bucket
}
```

Or `.tfsec/config.yml`:

```yaml
severity_overrides:
  aws-s3-enable-versioning: LOW
exclude:
  - aws-vpc-no-public-ingress-sgr   # exception documented in SECURITY.md#sg-001
```

## 6. Switch to checkov

```yaml
- uses: bridgecrewio/checkov-action@master
  with:
    directory: .
    framework: terraform
    soft_fail: false
    skip_check: CKV_AWS_18,CKV_AWS_21
```

Remove the `tfsec-action` step if replacing.

## 7. Add Integration Tests (Terratest)

```bash
mkdir -p test
cd test
go mod init github.com/<owner>/<repo>/test
go get github.com/gruntwork-io/terratest/modules/terraform
```

`test/simple_test.go`:

```go
package test

import (
    "testing"
    "github.com/gruntwork-io/terratest/modules/terraform"
    "github.com/stretchr/testify/assert"
)

func TestSimpleExample(t *testing.T) {
    opts := &terraform.Options{TerraformDir: "../examples/simple"}
    defer terraform.Destroy(t, opts)
    terraform.InitAndApply(t, opts)
    id := terraform.Output(t, opts, "id")
    assert.NotEmpty(t, id)
}
```

Add CI job (requires real cloud credentials):

```yaml
- uses: actions/setup-go@v5
  with: { go-version: '1.23' }
- run: cd test && go test -v -timeout 30m
```

## 8. Enable `terraform apply` in Examples CI

```yaml
- name: apply examples (throwaway account)
  run: |
    for ex in examples/*/; do
      (cd "$ex" && terraform init && terraform apply -auto-approve && terraform destroy -auto-approve)
    done
  env:
    AWS_ACCESS_KEY_ID:     ${{ secrets.SANDBOX_AWS_KEY }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.SANDBOX_AWS_SECRET }}
```

Only do this in an isolated sandbox account.

## 9. Publish to Terraform Cloud Private Registry

```bash
tfc-module publish --organization <org> --name <module> --provider <provider> --tag v0.1.0
```

Or use the [terraform-cloud-action](https://github.com/hashicorp/tfc-workflows-github) for automated publishing on tag.

## 10. Switch terraform-docs Output Format

### Full document

```yaml
formatter: markdown document
output: { file: README.md, mode: inject }
```

### JSON (for custom rendering)

```yaml
formatter: json
output: { file: terraform-docs.json, mode: replace }
```

## 11. Cost Estimation on PRs

```yaml
- uses: infracost/actions/setup@v3
  with: { api-key: ${{ secrets.INFRACOST_API_KEY }} }
- run: infracost breakdown --path=examples/complete --format=json --out-file=/tmp/cost.json
- uses: infracost/actions/comment@v2
  with: { path: /tmp/cost.json, behavior: update }
```

## 12. Automate Hygiene via Babysitter

```bash
babysitter run:create \
  --process-id terraform-hygiene \
  --entry .a5c/processes/terraform/hygiene.js#process \
  --prompt "Ensure terraform fmt, regenerate terraform-docs, resolve all tflint warnings, and bump provider version minor-ranges" \
  --json
```
