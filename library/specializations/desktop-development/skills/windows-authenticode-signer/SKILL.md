---
name: windows-authenticode-signer
description: Sign Windows executables with Authenticode using signtool, supporting EV and standard certificates
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [windows, codesigning, authenticode, security, distribution]
---

# windows-authenticode-signer

Sign Windows executables with Authenticode using signtool. This skill configures code signing for Windows applications with standard and EV certificates, timestamping, and CI/CD integration.

## Capabilities

- Sign executables with Authenticode
- Configure EV certificate signing
- Set up timestamping servers
- Sign with Azure Key Vault
- Configure CI/CD signing workflows
- Verify existing signatures
- Sign DLLs and nested binaries
- Configure dual SHA1/SHA256 signing

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "executablePath": { "type": "string" },
    "certificateSource": { "enum": ["file", "store", "azure-keyvault", "digicert"] },
    "timestampServer": { "type": "string" },
    "hashAlgorithm": { "enum": ["SHA256", "SHA1", "dual"] }
  },
  "required": ["executablePath"]
}
```

## Signing Commands

```powershell
# Sign with PFX file
signtool sign /f certificate.pfx /p password /fd SHA256 /tr http://timestamp.digicert.com /td SHA256 MyApp.exe

# Sign with certificate store
signtool sign /n "My Company" /fd SHA256 /tr http://timestamp.digicert.com /td SHA256 MyApp.exe

# Sign with Azure Key Vault
AzureSignTool sign -kvu https://myvault.vault.azure.net -kvi $AZURE_CLIENT_ID -kvt $AZURE_TENANT_ID -kvs $AZURE_CLIENT_SECRET -kvc MyCertificate -tr http://timestamp.digicert.com -td sha256 MyApp.exe
```

## Verification

```powershell
signtool verify /pa /v MyApp.exe
```

## Related Skills

- `msix-package-generator`
- `code-signing-setup` process
