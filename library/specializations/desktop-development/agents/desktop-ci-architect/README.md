# desktop-ci-architect

Expert agent for designing CI/CD pipelines for multi-platform desktop applications.

## Overview

The desktop-ci-architect agent specializes in CI/CD pipeline design for desktop applications. It provides guidance on multi-platform builds, caching strategies, code signing automation, and release workflows across GitHub Actions, Azure DevOps, CircleCI, and other platforms.

## Quick Start

### Design New Pipeline

```javascript
const result = await invokeAgent('desktop-ci-architect', {
  task: 'Design a complete CI/CD pipeline for our Electron app',
  context: {
    framework: 'electron',
    platforms: ['windows', 'macos', 'linux'],
    ciPlatform: 'github-actions',
    requirements: [
      'Build on all platforms',
      'Run tests',
      'Code sign builds',
      'Publish to GitHub Releases'
    ]
  }
});
```

### Optimize Existing Pipeline

```javascript
const result = await invokeAgent('desktop-ci-architect', {
  task: 'Optimize our CI pipeline - currently takes 45 minutes',
  context: {
    ciPlatform: 'github-actions',
    currentPipeline: '.github/workflows/build.yml'
  },
  analysisDepth: 'comprehensive'
});
```

## Expertise Areas

### CI/CD Platforms

| Platform | Expertise Level |
|----------|----------------|
| GitHub Actions | Expert |
| Azure DevOps | Expert |
| CircleCI | Expert |
| GitLab CI | Advanced |
| Jenkins | Advanced |

### Desktop Frameworks

- Electron (electron-builder, electron-forge)
- Tauri (Rust + WebView)
- Qt (CMake, qmake)
- WPF / .NET
- macOS Native (Xcode, Swift)
- Flutter Desktop

## Common Tasks

### Multi-Platform Build Matrix

```javascript
const result = await invokeAgent('desktop-ci-architect', {
  task: 'Create build matrix for all platforms',
  context: {
    framework: 'electron',
    platforms: ['windows', 'macos', 'linux'],
    architectures: ['x64', 'arm64']
  }
});
```

### Code Signing Automation

```javascript
const result = await invokeAgent('desktop-ci-architect', {
  task: 'Set up code signing in CI',
  context: {
    platforms: ['windows', 'macos'],
    windowsSigning: 'azure-key-vault',
    macSigning: 'developer-id',
    requirements: ['notarization']
  }
});
```

### Release Automation

```javascript
const result = await invokeAgent('desktop-ci-architect', {
  task: 'Automate release process',
  context: {
    versioning: 'semantic',
    changelog: 'conventional-commits',
    distribution: ['github-releases', 'update-server'],
    rollout: 'staged'
  }
});
```

## Pipeline Components

### Build Job

```yaml
build:
  strategy:
    matrix:
      include:
        - os: windows-latest
          target: win
        - os: macos-latest
          target: mac
        - os: ubuntu-latest
          target: linux

  runs-on: ${{ matrix.os }}
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
    - run: npm ci
    - run: npm run build
    - run: npm run package:${{ matrix.target }}
```

### Test Job

```yaml
test:
  needs: build
  strategy:
    matrix:
      os: [windows-latest, macos-latest, ubuntu-latest]
      shardIndex: [1, 2, 3, 4]
      shardTotal: [4]

  runs-on: ${{ matrix.os }}
  steps:
    - run: npm test -- --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
```

### Release Job

```yaml
release:
  needs: [build, test]
  if: startsWith(github.ref, 'refs/tags/v')
  runs-on: ubuntu-latest
  steps:
    - uses: actions/download-artifact@v4
    - uses: softprops/action-gh-release@v1
      with:
        files: dist/*
        generate_release_notes: true
```

## Caching Strategies

### Node.js Projects

```yaml
- uses: actions/cache@v4
  with:
    path: |
      node_modules
      ~/.cache/electron
      ~/.cache/electron-builder
    key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
```

### Rust/Tauri Projects

```yaml
- uses: Swatinem/rust-cache@v2
  with:
    workspaces: src-tauri
```

### Qt/CMake Projects

```yaml
- uses: actions/cache@v4
  with:
    path: build
    key: ${{ runner.os }}-cmake-${{ hashFiles('CMakeLists.txt') }}
```

## Code Signing

### Windows (Azure Key Vault)

```yaml
- uses: azure/trusted-signing-action@v0.3.16
  with:
    azure-tenant-id: ${{ secrets.AZURE_TENANT_ID }}
    azure-client-id: ${{ secrets.AZURE_CLIENT_ID }}
    azure-client-secret: ${{ secrets.AZURE_CLIENT_SECRET }}
    endpoint: https://eus.codesigning.azure.net/
    trusted-signing-account-name: account
    certificate-profile-name: profile
    files-folder: dist
```

### macOS (Notarization)

```yaml
env:
  APPLE_ID: ${{ secrets.APPLE_ID }}
  APPLE_ID_PASSWORD: ${{ secrets.APPLE_ID_PASSWORD }}
  APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
  CSC_LINK: ${{ secrets.MAC_CERTIFICATE }}
  CSC_KEY_PASSWORD: ${{ secrets.MAC_CERTIFICATE_PASSWORD }}
```

### Linux (GPG)

```yaml
- name: Import GPG key
  run: echo "${{ secrets.GPG_PRIVATE_KEY }}" | gpg --import
- name: Sign packages
  run: |
    for file in dist/*.deb; do
      gpg --detach-sign --armor "$file"
    done
```

## Optimization Tips

### Reduce Build Time

1. **Cache dependencies**: node_modules, Cargo, CMake build
2. **Parallelize platforms**: Run Windows/macOS/Linux concurrently
3. **Use incremental builds**: Only rebuild changed files
4. **Self-hosted runners**: Faster for frequent builds
5. **Skip unnecessary steps**: Conditional execution

### Reduce Costs

1. **Cancel redundant workflows**: On new pushes
2. **Use matrix exclude**: Skip unnecessary combinations
3. **Optimize artifact retention**: Reduce storage days
4. **Use free tier runners**: Where possible
5. **Cache external downloads**: Electron, etc.

## Required Secrets

| Secret | Description |
|--------|-------------|
| `GH_TOKEN` | GitHub token for releases |
| `APPLE_ID` | Apple Developer email |
| `APPLE_ID_PASSWORD` | App-specific password |
| `APPLE_TEAM_ID` | Apple Team ID |
| `MAC_CERTIFICATE` | Base64 .p12 certificate |
| `MAC_CERTIFICATE_PASSWORD` | Certificate password |
| `AZURE_TENANT_ID` | Azure AD tenant ID |
| `AZURE_CLIENT_ID` | Service principal ID |
| `AZURE_CLIENT_SECRET` | Service principal secret |
| `GPG_PRIVATE_KEY` | GPG signing key |
| `GPG_PASSPHRASE` | Key passphrase |

## Platform Comparison

| Feature | GitHub Actions | Azure DevOps | CircleCI |
|---------|---------------|--------------|----------|
| macOS M1 | Yes | Yes | Yes |
| Windows ARM64 | Limited | Yes | No |
| Free Minutes | 2000/mo | 1800/mo | 6000/mo |
| Self-Hosted | Yes | Yes | Yes |
| Secrets Masking | Yes | Yes | Yes |
| OIDC Auth | Yes | Yes | Yes |

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Slow builds | No caching | Add dependency caching |
| Sign failures | Missing secrets | Check secret configuration |
| macOS timeout | Notarization slow | Increase job timeout |
| Windows hang | MSBuild issues | Use specific VS version |
| Artifact missing | Wrong path | Check upload path patterns |

## Best Practices

### Security

1. Pin action versions to SHA
2. Use OIDC for cloud auth
3. Limit secret scopes
4. Audit workflow changes
5. Review third-party actions

### Reliability

1. Use `fail-fast: false` for matrix
2. Add retry for flaky steps
3. Test workflows with `act`
4. Monitor workflow metrics
5. Set appropriate timeouts

### Maintenance

1. Document all secrets
2. Automate dependency updates
3. Review and optimize quarterly
4. Track build metrics
5. Clean up old workflows

## References

- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Azure DevOps Pipelines](https://docs.microsoft.com/azure/devops/pipelines)
- [CircleCI Documentation](https://circleci.com/docs)
- [electron-builder CI](https://www.electron.build/multi-platform-build)

## Related Agents

- `electron-architect`
- `release-manager`
- `desktop-test-architect`

## Version History

- **1.0.0** - Initial release with GitHub Actions
- **1.1.0** - Added Azure DevOps and CircleCI
- **1.2.0** - Added code signing automation
- **1.3.0** - Added optimization recommendations
