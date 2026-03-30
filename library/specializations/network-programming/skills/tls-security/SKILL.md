---
name: tls-security
description: Expert skill for TLS/SSL implementation and certificate management. Generate and validate TLS configurations, create and manage X.509 certificates, analyze cipher suite security, debug TLS handshake failures, and implement certificate pinning.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: network-security
  backlog-id: SK-004
---

# tls-security

You are **tls-security** - a specialized skill for TLS/SSL implementation and certificate management, providing deep expertise in secure communication protocols, certificate lifecycle, and cryptographic configuration.

## Overview

This skill enables AI-powered TLS/SSL operations including:
- Generating and validating TLS configurations
- Creating and managing X.509 certificates
- Analyzing cipher suite security
- Debugging TLS handshake failures
- Configuring OpenSSL/BoringSSL/mbed TLS
- Implementing certificate pinning
- Testing for TLS vulnerabilities (SSLLabs-style analysis)
- Generating secure cipher suite configurations

## Prerequisites

- OpenSSL CLI installed (`openssl` command)
- Optional: `certbot` for Let's Encrypt certificates
- Optional: `testssl.sh` for vulnerability scanning

## Capabilities

### 1. Certificate Generation

Generate X.509 certificates for various use cases:

#### Self-Signed CA Certificate
```bash
# Generate CA private key
openssl genrsa -out ca.key 4096

# Generate CA certificate (10 years)
openssl req -new -x509 -sha256 -days 3650 \
  -key ca.key \
  -out ca.crt \
  -subj "/C=US/ST=California/L=San Francisco/O=MyOrg/CN=MyOrg Root CA"
```

#### Server Certificate
```bash
# Generate server private key
openssl genrsa -out server.key 2048

# Generate CSR
openssl req -new -sha256 \
  -key server.key \
  -out server.csr \
  -subj "/C=US/ST=California/L=San Francisco/O=MyOrg/CN=server.example.com"

# Create extensions file for SAN
cat > server.ext << EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = server.example.com
DNS.2 = *.example.com
IP.1 = 192.168.1.100
EOF

# Sign with CA
openssl x509 -req -sha256 -days 365 \
  -in server.csr \
  -CA ca.crt \
  -CAkey ca.key \
  -CAcreateserial \
  -out server.crt \
  -extfile server.ext
```

#### Client Certificate (mTLS)
```bash
# Generate client key
openssl genrsa -out client.key 2048

# Generate CSR
openssl req -new -sha256 \
  -key client.key \
  -out client.csr \
  -subj "/C=US/ST=California/L=San Francisco/O=MyOrg/CN=client@example.com"

# Create client extensions
cat > client.ext << EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature
extendedKeyUsage = clientAuth
EOF

# Sign with CA
openssl x509 -req -sha256 -days 365 \
  -in client.csr \
  -CA ca.crt \
  -CAkey ca.key \
  -CAcreateserial \
  -out client.crt \
  -extfile client.ext
```

### 2. TLS Configuration

Generate secure TLS configurations:

#### Nginx TLS Configuration
```nginx
# Modern TLS configuration (A+ grade)
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;

ssl_certificate /etc/nginx/ssl/server.crt;
ssl_certificate_key /etc/nginx/ssl/server.key;

# OCSP stapling
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/nginx/ssl/ca.crt;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;

# Session settings
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_session_tickets off;

# DH parameters (generate with: openssl dhparam -out dhparam.pem 4096)
ssl_dhparam /etc/nginx/ssl/dhparam.pem;

# HSTS
add_header Strict-Transport-Security "max-age=63072000" always;
```

#### HAProxy TLS Configuration
```haproxy
global
    ssl-default-bind-ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384
    ssl-default-bind-ciphersuites TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256
    ssl-default-bind-options ssl-min-ver TLSv1.2 no-tls-tickets

frontend https
    bind *:443 ssl crt /etc/haproxy/certs/ alpn h2,http/1.1
    http-response set-header Strict-Transport-Security "max-age=63072000"
```

### 3. Certificate Validation

Validate certificates and chains:

```bash
# View certificate details
openssl x509 -in server.crt -text -noout

# Verify certificate chain
openssl verify -CAfile ca.crt server.crt

# Check certificate dates
openssl x509 -in server.crt -noout -dates

# Check certificate against private key
openssl x509 -noout -modulus -in server.crt | openssl md5
openssl rsa -noout -modulus -in server.key | openssl md5
# (hashes should match)

# Test TLS connection
openssl s_client -connect server.example.com:443 \
  -servername server.example.com \
  -CAfile ca.crt

# Check certificate expiration
echo | openssl s_client -connect server.example.com:443 2>/dev/null | \
  openssl x509 -noout -enddate
```

### 4. TLS Handshake Debugging

Debug TLS connection issues:

```bash
# Verbose TLS handshake
openssl s_client -connect server.example.com:443 \
  -servername server.example.com \
  -state -debug

# Check supported protocols
openssl s_client -connect server.example.com:443 -tls1_2
openssl s_client -connect server.example.com:443 -tls1_3

# List supported ciphers
openssl s_client -connect server.example.com:443 -cipher 'ALL' 2>&1 | \
  grep -E "Cipher|Protocol"

# Test specific cipher
openssl s_client -connect server.example.com:443 \
  -cipher ECDHE-RSA-AES256-GCM-SHA384

# Check certificate chain
openssl s_client -connect server.example.com:443 -showcerts
```

### 5. Security Analysis

Analyze TLS security posture:

```bash
# Using testssl.sh
./testssl.sh --severity HIGH server.example.com:443

# Check for vulnerabilities
./testssl.sh --vulnerable server.example.com:443

# Check cipher strength
./testssl.sh --cipher-per-proto server.example.com:443

# Using nmap
nmap --script ssl-enum-ciphers -p 443 server.example.com
```

### 6. Certificate Pinning Implementation

#### HTTP Public Key Pinning (HPKP) - Deprecated but Educational
```bash
# Generate pin hash
openssl x509 -in server.crt -pubkey -noout | \
  openssl pkey -pubin -outform der | \
  openssl dgst -sha256 -binary | \
  openssl enc -base64
```

#### Certificate Pinning in Code
```python
import ssl
import hashlib
import base64
from urllib.request import urlopen

# Expected certificate pin (SHA256 of SPKI)
EXPECTED_PIN = "base64encodedpin=="

def verify_pin(cert_der):
    """Verify certificate public key pin."""
    from cryptography import x509
    from cryptography.hazmat.backends import default_backend
    from cryptography.hazmat.primitives import serialization

    cert = x509.load_der_x509_certificate(cert_der, default_backend())
    spki = cert.public_key().public_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    pin = base64.b64encode(hashlib.sha256(spki).digest()).decode()
    return pin == EXPECTED_PIN

# Create SSL context with custom verification
ctx = ssl.create_default_context()
ctx.check_hostname = True
ctx.verify_mode = ssl.CERT_REQUIRED
```

### 7. mTLS Configuration

Configure mutual TLS authentication:

```python
import ssl

# Server-side mTLS
server_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
server_context.minimum_version = ssl.TLSVersion.TLSv1_2
server_context.load_cert_chain('server.crt', 'server.key')
server_context.load_verify_locations('ca.crt')
server_context.verify_mode = ssl.CERT_REQUIRED  # Require client cert

# Client-side mTLS
client_context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
client_context.minimum_version = ssl.TLSVersion.TLSv1_2
client_context.load_cert_chain('client.crt', 'client.key')
client_context.load_verify_locations('ca.crt')
client_context.check_hostname = True
client_context.verify_mode = ssl.CERT_REQUIRED
```

## MCP Server Integration

This skill can leverage the following MCP servers for enhanced capabilities:

| Server | Description | Integration |
|--------|-------------|-------------|
| TLS MCP Server | Fetch and analyze TLS certificates | Certificate inspection |
| mcp-for-security | SSL/TLS configuration analysis | Vulnerability scanning |

### TLS MCP Server (malaya-zemlya)

```bash
# Add to Claude
claude mcp add tls-mcp -- npx @malaya-zemlya/tls-mcp
```

**Capabilities:**
- Fetch certificates from remote hosts
- Analyze certificate chains
- zlint integration for linting
- Local certificate processing

## Best Practices

1. **Use TLS 1.2+ only** - Disable TLS 1.0 and 1.1
2. **Strong cipher suites** - Prefer ECDHE and GCM modes
3. **Certificate rotation** - Automate certificate renewal
4. **OCSP stapling** - Enable for performance and privacy
5. **HSTS headers** - Enforce HTTPS connections
6. **Perfect Forward Secrecy** - Use ephemeral key exchange
7. **Pin certificates carefully** - Have backup pins and rotation plan

## Process Integration

This skill integrates with the following processes:
- `tls-integration.js` - TLS implementation
- `mtls-implementation.js` - Mutual TLS setup
- `certificate-management.js` - Certificate lifecycle

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "analyze",
  "target": "server.example.com:443",
  "status": "success",
  "certificate": {
    "subject": "CN=server.example.com",
    "issuer": "CN=MyOrg Root CA",
    "validFrom": "2026-01-01T00:00:00Z",
    "validTo": "2027-01-01T00:00:00Z",
    "serialNumber": "01",
    "signatureAlgorithm": "sha256WithRSAEncryption",
    "keySize": 2048
  },
  "tls": {
    "version": "TLSv1.3",
    "cipher": "TLS_AES_256_GCM_SHA384",
    "hsts": true,
    "ocspStapling": true
  },
  "vulnerabilities": [],
  "grade": "A+"
}
```

## Constraints

- Never expose private keys in logs or output
- Validate certificate chains before trusting
- Use secure random number generators
- Store private keys with appropriate permissions (0600)
- Implement certificate revocation checking
