# community-health — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Funding only** — Remove `FUNDING.yml`, keep governance files
2. **Everything** — Remove all community files (**strongly discouraged for public OSS**)
3. **Selective** — Let the user choose which files to remove

**Warning**: Removing `CODE_OF_CONDUCT.md` or `SECURITY.md` from a public repo lowers the GitHub Community Profile score and signals reduced project maturity. Consider replacing instead of deleting.

## Step 2: Remove Files (Selective)

Ask per file before deleting:

```bash
rm -f CODE_OF_CONDUCT.md
rm -f CONTRIBUTING.md
rm -f SUPPORT.md
rm -f SECURITY.md
rm -f .github/FUNDING.yml
```

## Step 3: Remove Issue Templates

```bash
rm -rf .github/ISSUE_TEMPLATE/
```

Keep the directory if the `pr-templates` plugin is still installed.

## Step 4: Clean README Links

Edit `README.md` and remove the "Community" section or individual links added by this plugin.

## Step 5: Archive Security Advisories

Do **not** close or delete existing GitHub Security Advisories when uninstalling — they are historical records of vulnerabilities and fixes.

## Step 6: Rotate Reporting Email

If `security@example.org` or `conduct@example.org` were set up specifically for this project, set a forwarding rule or bounce-response to redirect reporters.

## Step 7: Remove Processes

```bash
rm -rf .a5c/processes/community-health
```

## Step 8: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name community-health --project --json
```

## Notes

- GitHub Community Profile score will drop proportionally to removed files
- Inheriting org-level `.github` defaults may silently fill gaps after removal — verify with `gh api repos/:owner/:repo/community/profile`
- Consider replacing removed files with links to org-wide equivalents instead of leaving the slots empty
