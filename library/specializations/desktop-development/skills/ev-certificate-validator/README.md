# ev-certificate-validator

Validate EV code signing certificate chain and timestamp.

## Quick Start

```javascript
const result = await invokeSkill('ev-certificate-validator', {
  signedFile: 'MyApp.exe',
  checkSmartScreen: true
});
```

## Features

- Chain validation
- Timestamp verification
- EV attribute checking
- SmartScreen compatibility

## Related Skills

- `windows-authenticode-signer`
- `code-signing-setup` process
