# TLS/SSL Security Skill

## Overview

The `tls-security` skill provides expert capabilities for TLS/SSL implementation and certificate management. It enables AI-powered secure communication configuration, certificate lifecycle management, and security analysis.

## Quick Start

### Prerequisites

1. **OpenSSL** - Install from package manager
2. **Optional: testssl.sh** - For vulnerability scanning
3. **Optional: certbot** - For Let's Encrypt certificates

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

```bash
# Install OpenSSL (usually pre-installed)
apt-get install openssl    # Linux
brew install openssl       # macOS

# Install testssl.sh (optional)
git clone https://github.com/drwetter/testssl.sh.git
```

## Usage

### Basic Operations

```bash
# Generate a self-signed certificate
/skill tls-security generate-cert \
  --type self-signed \
  --cn server.example.com \
  --san "DNS:*.example.com,IP:192.168.1.100"

# Analyze remote TLS configuration
/skill tls-security analyze \
  --host server.example.com \
  --port 443

# Generate secure Nginx configuration
/skill tls-security config \
  --server nginx \
  --cert-path /etc/nginx/ssl/server.crt \
  --key-path /etc/nginx/ssl/server.key
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(tlsSecurityTask, {
  operation: 'generate-pki',
  config: {
    caName: 'MyOrg Root CA',
    serverCN: 'server.example.com',
    serverSAN: ['*.example.com', '192.168.1.100'],
    clientCN: 'client@example.com',
    validityDays: 365
  }
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Certificate Generation** | Create CA, server, and client certificates |
| **TLS Configuration** | Generate secure configs for Nginx, HAProxy, Apache |
| **Certificate Validation** | Verify chains, dates, and key matching |
| **Handshake Debugging** | Diagnose TLS connection failures |
| **Security Analysis** | Test for vulnerabilities and weak ciphers |
| **mTLS Setup** | Configure mutual TLS authentication |

## Examples

### Example 1: Create PKI Infrastructure

```bash
# Generate complete PKI (CA + server + client certs)
/skill tls-security create-pki \
  --ca-cn "MyOrg Root CA" \
  --server-cn server.example.com \
  --server-san "DNS:*.example.com" \
  --client-cn "client@example.com" \
  --output-dir ./pki
```

### Example 2: Debug TLS Issues

```bash
# Diagnose TLS handshake failures
/skill tls-security debug \
  --host failing-server.example.com \
  --port 443 \
  --verbose
```

### Example 3: Security Audit

```bash
# Run comprehensive TLS security audit
/skill tls-security audit \
  --host server.example.com \
  --check-vulnerabilities \
  --check-ciphers \
  --output report.json
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TLS_MIN_VERSION` | Minimum TLS version | `TLSv1.2` |
| `TLS_CIPHER_SUITE` | Default cipher suite | Modern suite |
| `CERT_VALIDITY_DAYS` | Default certificate validity | `365` |

### Skill Configuration

```yaml
# .babysitter/skills/tls-security.yaml
tls-security:
  defaultKeySize: 2048
  defaultHashAlgorithm: sha256
  defaultValidityDays: 365
  minTlsVersion: TLSv1.2
  enableOcspStapling: true
```

## Process Integration

### Processes Using This Skill

1. **tls-integration.js** - TLS implementation
2. **mtls-implementation.js** - Mutual TLS setup
3. **certificate-management.js** - Certificate lifecycle

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const tlsSetupTask = defineTask({
  name: 'setup-tls',
  description: 'Configure TLS for a service',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Setup TLS for ${inputs.service}`,
      skill: {
        name: 'tls-security',
        context: {
          operation: 'configure',
          server: inputs.serverType,
          certPath: inputs.certPath,
          keyPath: inputs.keyPath,
          caPath: inputs.caPath,
          mtls: inputs.enableMtls || false,
          options: {
            minVersion: 'TLSv1.2',
            ocspStapling: true,
            hsts: true
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

### TLS MCP Server (malaya-zemlya)

Analyze TLS certificates with AI assistance.

**Features:**
- Fetch and analyze certificates
- zlint integration
- Local certificate processing

**Installation:**
```bash
claude mcp add tls-mcp -- npx @malaya-zemlya/tls-mcp
```

**GitHub:** https://github.com/malaya-zemlya/tls-mcp

### mcp-for-security

Security tools collection including SSL/TLS analysis.

**Features:**
- SSL/TLS configuration analyzer
- Multiple security tool integrations

**GitHub:** https://github.com/cyproxio/mcp-for-security

## Cipher Suite Reference

### Recommended Cipher Suites (TLS 1.3)

```
TLS_AES_256_GCM_SHA384
TLS_CHACHA20_POLY1305_SHA256
TLS_AES_128_GCM_SHA256
```

### Recommended Cipher Suites (TLS 1.2)

```
ECDHE-ECDSA-AES256-GCM-SHA384
ECDHE-RSA-AES256-GCM-SHA384
ECDHE-ECDSA-CHACHA20-POLY1305
ECDHE-RSA-CHACHA20-POLY1305
ECDHE-ECDSA-AES128-GCM-SHA256
ECDHE-RSA-AES128-GCM-SHA256
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Certificate not trusted | Add CA to trust store |
| Handshake failure | Check cipher compatibility |
| Certificate expired | Renew certificate |
| Key mismatch | Verify cert and key match |
| OCSP errors | Check network connectivity |

### Debug Commands

```bash
# Test certificate validity
openssl verify -CAfile ca.crt server.crt

# Check key/cert match
openssl x509 -noout -modulus -in server.crt | md5sum
openssl rsa -noout -modulus -in server.key | md5sum

# Test remote connection
openssl s_client -connect host:443 -servername host
```

## Related Skills

- **socket-programming** - TCP socket operations
- **packet-capture** - Capture TLS handshakes
- **proxy-server** - TLS termination proxies

## References

- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [OpenSSL Documentation](https://www.openssl.org/docs/)
- [testssl.sh](https://testssl.sh/)
- [SSL Labs](https://www.ssllabs.com/ssltest/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-004
**Category:** Network Security
**Status:** Active
