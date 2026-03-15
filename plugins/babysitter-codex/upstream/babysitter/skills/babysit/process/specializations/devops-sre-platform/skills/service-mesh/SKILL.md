---
name: service-mesh
description: Service mesh configuration and operations expertise for Istio, Linkerd, and Consul Connect
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Service Mesh Skill

## Overview

Specialized skill for service mesh configuration and operations across major platforms (Istio, Linkerd, Consul Connect). Provides deep expertise in traffic management, security, and observability within service meshes.

## Capabilities

### Istio Configuration
- Generate VirtualService and DestinationRule resources
- Configure Gateway and ServiceEntry resources
- Implement AuthorizationPolicy for access control
- Set up PeerAuthentication for mTLS
- Configure EnvoyFilter for advanced scenarios

### Linkerd Operations
- Create ServiceProfile configurations
- Configure TrafficSplit for canary deployments
- Implement Server and ServerAuthorization
- Set up HTTPRoute for traffic routing
- Configure multicluster communication

### Traffic Management
- Implement traffic shifting and splitting
- Configure retry policies and timeouts
- Set up circuit breakers and outlier detection
- Design fault injection for chaos testing
- Implement rate limiting

### Security Configuration
- Enable and configure mTLS across services
- Set up service-to-service authorization
- Configure external authorization (ext-authz)
- Implement JWT validation
- Design zero-trust network policies

### Observability Integration
- Configure distributed tracing (Jaeger, Zipkin)
- Set up service mesh metrics collection
- Integrate with Prometheus/Grafana
- Enable access logging
- Configure Kiali dashboards

## Target Processes

- `service-mesh.js` - Service mesh installation and configuration
- `kubernetes-setup.js` - Kubernetes networking and security

## Usage Context

This skill is invoked when processes require:
- Installing and configuring service meshes
- Implementing advanced traffic management
- Setting up mTLS and service authorization
- Debugging service mesh connectivity
- Integrating mesh observability

## Dependencies

- istioctl CLI (for Istio)
- linkerd CLI (for Linkerd)
- consul CLI (for Consul Connect)
- kubectl for resource management

## Output Formats

- Service mesh custom resource manifests
- Traffic policy configurations
- Security policy definitions
- Observability integration configs
- Troubleshooting reports
