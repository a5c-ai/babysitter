# Secrets Management Skill

## Overview

The `secrets-management` skill provides enterprise secrets management across multiple platforms. It enables AI-powered secret lifecycle management with HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, GCP Secret Manager, and Kubernetes secrets.

## Quick Start

### Prerequisites

1. **Secrets Platform** - Access to at least one:
   - HashiCorp Vault
   - AWS Secrets Manager
   - Azure Key Vault
   - GCP Secret Manager
2. **CLI Tools** - vault, aws, az, gcloud, kubectl as needed
3. **Authentication** - Proper credentials configured

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

For MCP integration:

```bash
# Install claude-vault-mcp for Vault with TOKEN system
pip install claude-vault-mcp
```

## Usage

### Basic Operations

```bash
# Store a secret in Vault
/skill secrets-management store --platform vault --path secret/myapp/db --data '{"user":"admin"}'

# Retrieve secret from AWS
/skill secrets-management get --platform aws --name myapp/production/db

# Rotate secret
/skill secrets-management rotate --platform vault --path secret/myapp/api-key

# Configure access policy
/skill secrets-management set-policy --platform vault --policy myapp-policy.hcl
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(secretsTask, {
  operation: 'configure',
  platform: 'vault',
  application: 'myapp',
  secrets: [
    { key: 'db_password', generator: 'random', length: 32 },
    { key: 'api_key', generator: 'uuid' }
  ],
  policy: {
    readers: ['app-service-account'],
    rotation: '30d'
  }
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Multi-Platform** | Vault, AWS, Azure, GCP, Kubernetes |
| **Policy Management** | Configure access policies |
| **Secret Rotation** | Automated rotation setup |
| **Dynamic Secrets** | Short-lived credentials |
| **Sealed Secrets** | GitOps-safe secrets |
| **Audit** | Access logging and compliance |

## Supported Platforms

| Platform | Key Features |
|----------|--------------|
| HashiCorp Vault | Dynamic secrets, policies, AppRole |
| AWS Secrets Manager | Rotation Lambda, IAM integration |
| Azure Key Vault | RBAC, managed identity |
| GCP Secret Manager | IAM, automatic replication |
| Kubernetes | Secrets, Sealed Secrets, External Secrets |

## Examples

### Example 1: Application Secrets Setup

```bash
# Set up complete secrets infrastructure for an application
/skill secrets-management setup-app \
  --platform vault \
  --app-name myapp \
  --environments dev,staging,production \
  --secrets db-password,api-key,jwt-secret \
  --rotation-period 30d
```

Creates:
- Vault paths for each environment
- Access policies per environment
- Rotation schedules
- Kubernetes integration (if applicable)

### Example 2: Secret Migration

```bash
# Migrate secrets from .env file to Vault
/skill secrets-management migrate \
  --source .env.production \
  --target vault:secret/myapp/production \
  --backup true \
  --verify true
```

### Example 3: Kubernetes External Secrets

```bash
# Configure External Secrets Operator integration
/skill secrets-management configure-external-secrets \
  --backend vault \
  --vault-url https://vault.example.com \
  --namespace production \
  --secrets myapp-db,myapp-api
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VAULT_ADDR` | Vault server URL | - |
| `VAULT_TOKEN` | Vault authentication token | - |
| `AWS_REGION` | AWS region for Secrets Manager | - |
| `AZURE_KEYVAULT_URL` | Azure Key Vault URL | - |
| `GOOGLE_CLOUD_PROJECT` | GCP project for Secret Manager | - |

### Skill Configuration

```yaml
# .babysitter/skills/secrets-management.yaml
secrets-management:
  defaultPlatform: vault
  vault:
    address: https://vault.example.com
    authMethod: oidc
    defaultEngine: secret
  rotation:
    defaultPeriod: 30d
    notifyBefore: 7d
  audit:
    enabled: true
    logPath: /var/log/secrets-audit.log
```

## Process Integration

### Processes Using This Skill

1. **secrets-management.js** - Initial secrets infrastructure setup
2. **security-scanning.js** - Secret leak detection and remediation
3. **kubernetes-setup.js** - K8s secret configuration

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const configureSecretsTask = defineTask({
  name: 'configure-secrets',
  description: 'Configure secrets for application deployment',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Configure secrets for ${inputs.appName}`,
      skill: {
        name: 'secrets-management',
        context: {
          operation: 'configure-app',
          platform: inputs.platform,
          appName: inputs.appName,
          environment: inputs.environment,
          secrets: inputs.secretDefinitions,
          kubernetes: {
            enabled: inputs.deployToK8s,
            namespace: inputs.namespace,
            useExternalSecrets: true
          }
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## MCP Server Reference

### claude-vault-mcp

Specialized MCP server for HashiCorp Vault with AI-safe secret handling.

**Key Features:**
- **TOKEN System**: AI sees tokenized references (`@token-abc123`), never actual secrets
- **WebAuthn Approval**: Human approval for sensitive operations via TouchID/WebAuthn
- **Migration Tools**: Move secrets from .env files to Vault
- **Full Audit Trail**: Complete operation logging

**Installation:**
```bash
pip install claude-vault-mcp
```

**GitHub:** https://libraries.io/pypi/claude-vault-mcp

## Security Best Practices

### General

1. **Least Privilege**: Grant minimum required permissions
2. **Rotation**: Automate secret rotation
3. **Audit**: Enable and monitor access logs
4. **Encryption**: Use TLS and encrypt at rest
5. **No Hardcoding**: Never commit secrets to code

### Vault-Specific

```hcl
# Restrictive policy example
path "secret/data/myapp/{{identity.entity.aliases.auth_approle.metadata.env}}/*" {
  capabilities = ["read"]
}
```

### Kubernetes-Specific

```yaml
# Use RBAC to restrict secret access
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: secret-reader
rules:
  - apiGroups: [""]
    resources: ["secrets"]
    resourceNames: ["myapp-secrets"]
    verbs: ["get"]
```

## Rotation Strategies

### Vault Dynamic Secrets

Automatically generate short-lived credentials:

```bash
# Database credentials with 1-hour TTL
vault read database/creds/myapp
```

### AWS Rotation Lambda

```bash
# Enable rotation for RDS credentials
aws secretsmanager rotate-secret \
  --secret-id myapp/db \
  --rotation-lambda-arn $LAMBDA_ARN \
  --rotation-rules AutomaticallyAfterDays=30
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `permission denied` | Check policies and authentication |
| `secret not found` | Verify path/name and engine mount |
| `token expired` | Re-authenticate or increase TTL |
| `vault sealed` | Unseal with threshold keys |

### Debug Mode

```bash
# Enable verbose logging
VAULT_LOG_LEVEL=debug /skill secrets-management get \
  --platform vault \
  --path secret/myapp/config
```

## Related Skills

- **security-scanning** - Detect secret leaks
- **kubernetes-ops** - K8s secret deployment
- **terraform-iac** - Infrastructure secrets

## References

- [HashiCorp Vault Documentation](https://developer.hashicorp.com/vault/docs)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)
- [Azure Key Vault](https://learn.microsoft.com/en-us/azure/key-vault/)
- [GCP Secret Manager](https://cloud.google.com/secret-manager/docs)
- [External Secrets Operator](https://external-secrets.io/)
- [Sealed Secrets](https://sealed-secrets.netlify.app/)
- [claude-vault-mcp](https://libraries.io/pypi/claude-vault-mcp)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-008
**Category:** Security
**Status:** Active
