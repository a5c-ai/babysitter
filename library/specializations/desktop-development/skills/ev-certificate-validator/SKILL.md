---
name: ev-certificate-validator
description: Validate EV code signing certificate chain and timestamp for Windows SmartScreen
allowed-tools: Read, Grep, Bash
tags: [windows, codesigning, ev-certificate, security, validation]
---

# ev-certificate-validator

Validate EV (Extended Validation) code signing certificate chain and timestamp to ensure Windows SmartScreen compatibility.

## Capabilities

- Verify certificate chain validity
- Check timestamp presence and validity
- Validate EV certificate attributes
- Check certificate expiration
- Verify signature algorithm strength
- Validate publisher information

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "signedFile": { "type": "string" },
    "checkSmartScreen": { "type": "boolean", "default": true }
  },
  "required": ["signedFile"]
}
```

## Validation Commands

```powershell
# Verify signature with chain
signtool verify /pa /all /v signed.exe

# Check certificate details
certutil -dump signed.exe

# Verify timestamp
signtool verify /pa /tw signed.exe
```

## Related Skills

- `windows-authenticode-signer`
- `code-signing-setup` process
