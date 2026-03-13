---
name: secrets-management
description: Enterprise secrets management across platforms. Manage secrets with HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, GCP Secret Manager, and Kubernetes secrets. Configure rotation, policies, and access controls.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: security
  backlog-id: SK-008
---

# secrets-management

You are **secrets-management** - a specialized skill for enterprise secrets management across multiple platforms. This skill provides comprehensive capabilities for managing secrets securely throughout their lifecycle.

## Overview

This skill enables AI-powered secrets management including:
- HashiCorp Vault operations and policy configuration
- AWS Secrets Manager integration
- Azure Key Vault operations
- GCP Secret Manager integration
- Kubernetes secrets and sealed secrets
- Secret rotation automation
- Access policy configuration

## Prerequisites

- Access to secrets management platform
- Appropriate authentication credentials
- CLI tools: vault, aws, az, gcloud, kubectl

## Capabilities

### 1. HashiCorp Vault

Operations and policy management:

```bash
# Login and check status
vault status
vault login -method=oidc

# Secret operations
vault kv put secret/myapp/config username=admin password=secret
vault kv get secret/myapp/config
vault kv get -format=json secret/myapp/config

# Enable secrets engine
vault secrets enable -path=secret kv-v2

# List secrets
vault kv list secret/myapp/

# Delete secret
vault kv delete secret/myapp/config
vault kv destroy -versions=1 secret/myapp/config
```

#### Vault Policies

```hcl
# Policy for application access
path "secret/data/myapp/*" {
  capabilities = ["read", "list"]
}

path "secret/metadata/myapp/*" {
  capabilities = ["list"]
}

# Admin policy
path "secret/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Database credentials
path "database/creds/myapp" {
  capabilities = ["read"]
}
```

#### AppRole Authentication

```bash
# Enable AppRole
vault auth enable approle

# Create role
vault write auth/approle/role/myapp \
  token_policies="myapp-policy" \
  token_ttl=1h \
  token_max_ttl=4h

# Get role ID
vault read auth/approle/role/myapp/role-id

# Generate secret ID
vault write -f auth/approle/role/myapp/secret-id
```

### 2. AWS Secrets Manager

```bash
# Create secret
aws secretsmanager create-secret \
  --name myapp/production/db \
  --secret-string '{"username":"admin","password":"secret"}'

# Get secret value
aws secretsmanager get-secret-value \
  --secret-id myapp/production/db \
  --query SecretString --output text

# Update secret
aws secretsmanager update-secret \
  --secret-id myapp/production/db \
  --secret-string '{"username":"admin","password":"newsecret"}'

# Enable rotation
aws secretsmanager rotate-secret \
  --secret-id myapp/production/db \
  --rotation-lambda-arn arn:aws:lambda:region:account:function:rotation

# List secrets
aws secretsmanager list-secrets --filter Key=name,Values=myapp
```

#### IAM Policy for Secrets Access

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:myapp/*"
    }
  ]
}
```

### 3. Azure Key Vault

```bash
# Create vault
az keyvault create \
  --name myapp-vault \
  --resource-group myapp-rg \
  --location eastus

# Set secret
az keyvault secret set \
  --vault-name myapp-vault \
  --name db-password \
  --value "secret"

# Get secret
az keyvault secret show \
  --vault-name myapp-vault \
  --name db-password \
  --query value -o tsv

# List secrets
az keyvault secret list \
  --vault-name myapp-vault

# Set access policy
az keyvault set-policy \
  --name myapp-vault \
  --spn $SERVICE_PRINCIPAL_ID \
  --secret-permissions get list
```

### 4. GCP Secret Manager

```bash
# Create secret
gcloud secrets create db-password \
  --replication-policy="automatic"

# Add secret version
echo -n "secret" | gcloud secrets versions add db-password --data-file=-

# Access secret
gcloud secrets versions access latest --secret=db-password

# Grant access
gcloud secrets add-iam-policy-binding db-password \
  --member="serviceAccount:myapp@project.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# List secrets
gcloud secrets list
```

### 5. Kubernetes Secrets

```bash
# Create secret
kubectl create secret generic myapp-secrets \
  --from-literal=username=admin \
  --from-literal=password=secret \
  -n production

# Create from file
kubectl create secret generic tls-certs \
  --from-file=tls.crt=./cert.pem \
  --from-file=tls.key=./key.pem

# View secret (base64 encoded)
kubectl get secret myapp-secrets -o yaml

# Decode secret
kubectl get secret myapp-secrets -o jsonpath='{.data.password}' | base64 -d
```

#### Sealed Secrets (Bitnami)

```bash
# Install kubeseal
brew install kubeseal

# Seal a secret
kubeseal --format yaml < secret.yaml > sealed-secret.yaml

# Apply sealed secret
kubectl apply -f sealed-secret.yaml
```

#### External Secrets Operator

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: myapp-secret
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
  target:
    name: myapp-secret
    creationPolicy: Owner
  data:
    - secretKey: password
      remoteRef:
        key: secret/data/myapp/config
        property: password
```

### 6. Secret Rotation

#### Vault Dynamic Secrets

```bash
# Enable database secrets engine
vault secrets enable database

# Configure PostgreSQL connection
vault write database/config/mydb \
  plugin_name=postgresql-database-plugin \
  allowed_roles="myapp" \
  connection_url="postgresql://{{username}}:{{password}}@db:5432/mydb" \
  username="vault_admin" \
  password="admin_password"

# Create role for dynamic credentials
vault write database/roles/myapp \
  db_name=mydb \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
  default_ttl="1h" \
  max_ttl="24h"

# Generate credentials
vault read database/creds/myapp
```

## MCP Server Integration

This skill can leverage the following MCP servers:

| Server | Description | Installation |
|--------|-------------|--------------|
| claude-vault-mcp | HashiCorp Vault with TOKEN system | [PyPI](https://libraries.io/pypi/claude-vault-mcp) |

### claude-vault-mcp Features

- **TOKEN System**: AI sees tokenized references, not actual secrets
- **WebAuthn Approval**: Human-in-the-loop for sensitive operations
- **Secret Migration**: Move from .env files to Vault
- **Audit Trail**: Full operation logging

## Best Practices

### Security

1. **Never hardcode secrets** - Always use secret managers
2. **Least privilege** - Minimal access permissions
3. **Audit logging** - Enable and monitor access logs
4. **Rotation** - Implement automatic rotation
5. **Encryption** - Encrypt at rest and in transit

### Architecture

1. **Centralized management** - Single source of truth
2. **Dynamic secrets** - Short-lived credentials when possible
3. **Secret versioning** - Track secret history
4. **Access policies** - Role-based access control
5. **Emergency access** - Break-glass procedures

### Application Integration

```yaml
# Kubernetes pod with secret injection
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  containers:
    - name: app
      image: myapp:latest
      env:
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: myapp-secrets
              key: password
      volumeMounts:
        - name: secrets
          mountPath: /etc/secrets
          readOnly: true
  volumes:
    - name: secrets
      secret:
        secretName: myapp-secrets
```

## Process Integration

This skill integrates with the following processes:
- `secrets-management.js` - Initial secrets setup
- `security-scanning.js` - Secret leak detection
- `kubernetes-setup.js` - K8s secret configuration

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "create-secret",
  "platform": "vault",
  "status": "success",
  "secret": {
    "path": "secret/data/myapp/config",
    "version": 1,
    "created_time": "2026-01-24T10:00:00Z"
  },
  "policy": {
    "name": "myapp-policy",
    "applied": true
  },
  "artifacts": ["policy.hcl"]
}
```

## Error Handling

### Common Issues

| Error | Cause | Resolution |
|-------|-------|------------|
| `Permission denied` | Insufficient policy | Review and update policies |
| `Secret not found` | Path incorrect | Verify secret path |
| `Token expired` | Authentication timeout | Re-authenticate |
| `Sealed vault` | Vault needs unsealing | Unseal with threshold keys |

## Constraints

- Never log or display secret values
- Always use secure channels for transmission
- Verify permissions before granting access
- Document all policy changes
- Test rotation procedures regularly
