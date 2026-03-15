# windows-authenticode-signer

Sign Windows executables with Authenticode.

## Quick Start

```javascript
const result = await invokeSkill('windows-authenticode-signer', {
  executablePath: 'MyApp.exe',
  certificateSource: 'file',
  timestampServer: 'http://timestamp.digicert.com',
  hashAlgorithm: 'SHA256'
});
```

## Features

- Standard and EV certificates
- Azure Key Vault integration
- Timestamping
- Dual SHA1/SHA256 signing

## Related Skills

- `msix-package-generator`
- `code-signing-setup` process
