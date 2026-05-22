# terraform-module — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **CI only** — Remove workflows and config files, keep module code
2. **Everything** — Remove module sources, examples, tests, CI, and configs
3. **Selective** — Let the user pick layers

**Warning**: Consumers of this module (other Terraform stacks referencing `source = "git::..."`) will break if the module is deleted or moved. Either publish a final pinned tag and notify consumers, or keep the module and remove only CI tooling.

## Step 2: Check for Consumers

```bash
# Same org, public:
gh search code "source = \"github.com/<owner>/<repo>\"" --json repository
```

Notify consumers to pin to the last tagged version before deletion.

## Step 3: Remove GitHub Actions Workflows

```bash
rm -f .github/workflows/terraform.yml
rm -f .github/workflows/terraform-release.yml
```

## Step 4: Remove Config Files

```bash
rm -f .terraform-docs.yml
rm -f .tflint.hcl
rm -f .tfsec/config.yml
```

## Step 5: Remove Module Sources (Only if Retiring Module)

```bash
rm -rf examples/
rm -rf tests/
rm -f main.tf variables.tf outputs.tf versions.tf
rm -rf .terraform/ .terraform.lock.hcl
```

Keep README.md if you want the repo to remain as an archive.

## Step 6: Uninstall Tooling (Optional)

Only if unused elsewhere.

```bash
brew uninstall tflint
brew uninstall terraform-docs
brew uninstall tfsec
```

## Step 7: Disconnect from Terraform Registry (If Published)

1. registry.terraform.io → your module → Settings → "Delist from Registry" (public) or revoke GitHub app permissions (Terraform Cloud private registry)
2. Deleting tags via `git push origin --delete v1.0.0` is NOT sufficient — Registry metadata persists

## Step 8: Revoke CI Credentials

If cloud provider credentials were configured for example deployments:
1. Provider console → revoke IAM user / service account
2. Repo → Settings → Secrets → delete `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `GOOGLE_CREDENTIALS`, `ARM_CLIENT_SECRET`, etc.

## Step 9: Remove Processes

```bash
rm -rf .a5c/processes/terraform-module
rm -rf .a5c/processes/terraform
```

## Step 10: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name terraform-module --project --json
```

## Notes

- Existing git tags and GitHub Releases are preserved; delete them manually if you need to fully retire the module
- `.terraform.lock.hcl` lists exact provider versions — retain it in git history even after removal for reproducibility
- `tfsec` / `checkov` baseline exception files (`.tfsec/` ignores) should be reviewed — they may contain security-relevant context worth archiving
- If downstream stacks used `source = "./modules/<name>"` in a monorepo, update their sources before deletion
