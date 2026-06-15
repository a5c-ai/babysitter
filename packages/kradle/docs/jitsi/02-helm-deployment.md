# Jitsi Integration — Helm Deployment

## Subchart Integration

Add [jitsi-helm](https://github.com/jitsi-contrib/jitsi-helm) as a Helm subchart dependency.

### Chart.yaml Addition

```yaml
dependencies:
  # ... existing deps (vela-core, kyverno)
  - name: jitsi-meet
    version: "1.x"
    repository: https://jitsi-contrib.github.io/jitsi-helm/
    condition: jitsi.install
    alias: jitsi-subchart
```

### values.yaml — Jitsi Section

```yaml
jitsi:
  install: true                          # Deploy Jitsi in-cluster
  
  # External mode: use an existing Jitsi deployment instead
  external:
    enabled: false
    url: ""                              # e.g. https://meet.example.com
    jwtAppId: ""
    jwtAppSecret: ""

  # Jitsi subchart overrides (when jitsi.install: true)
  web:
    replicaCount: 1
    image:
      repository: jitsi/web
    ingress:
      enabled: true
      hosts:
        - host: meet.kradle.local
          paths: ["/"]
      tls: []

  prosody:
    replicaCount: 1
    image:
      repository: jitsi/prosody
    auth:
      type: jwt                          # JWT auth for programmatic access
      jwt:
        appId: kradle
        appSecret: ""                    # Override via --set or secret
        issuer: kradle
        audience: jitsi

  jicofo:
    replicaCount: 1
    image:
      repository: jitsi/jicofo

  jvb:
    replicaCount: 1
    image:
      repository: jitsi/jvb
    service:
      type: NodePort                     # UDP media traffic
    publicIP: ""                         # Set for external access

  jibri:                                 # Recording/streaming
    enabled: false
    replicaCount: 0
    image:
      repository: jitsi/jibri
    persistence:
      enabled: true
      size: 20Gi

  # Kradle-specific settings
  kradle:
    autoCreateRooms: true                # Create rooms from CRDs
    webhookSecret: ""                    # For Jitsi → Kradle event sync
    defaultRoomTTL: 120m                 # Auto-expire rooms
    agentSidecarImage: "kradle/jitsi-agent-sidecar:latest"
    maxAgentsPerRoom: 5
    recordingStorageClass: ""            # K8s storage class for recordings
```

## Deployment Topology

### In-Cluster Mode (`jitsi.install: true`)

```
Namespace: kradle-system (or jitsi-system)

Pods:
  jitsi-web          — Nginx + Jitsi web frontend
  jitsi-prosody      — XMPP server (Prosody) + JWT auth
  jitsi-jicofo       — Conference focus (room management)
  jitsi-jvb          — Video bridge (media routing)
  jitsi-jibri        — Recording bot (optional, if jibri.enabled)

Services:
  jitsi-web          — ClusterIP :80 (HTTP)
  jitsi-prosody      — ClusterIP :5222 (XMPP)
  jitsi-jvb          — NodePort :10000/UDP (media)

Ingress:
  meet.kradle.local   → jitsi-web:80

Secrets:
  jitsi-jwt-secret   — JWT app ID + secret for Prosody
  jitsi-kradle-secret — Webhook secret for event sync
```

### External Mode (`jitsi.external.enabled: true`)

No Jitsi pods deployed. Kradle connects to an existing Jitsi deployment:
- `jitsi.external.url` — Jitsi Meet URL
- `jitsi.external.jwtAppId` + `jitsi.external.jwtAppSecret` — JWT credentials

## CRD Installation

New file: `charts/crds/jitsi-resources.yaml`

Installed alongside existing CRDs during `helm install`. Contains:
- JitsiMeetProvider
- JitsiMeetingTemplate
- JitsiMeeting
- JitsiParticipant
- JitsiRecording

## Network Requirements

| Traffic | Protocol | Port | Direction |
|---------|----------|------|-----------|
| Web UI | HTTPS | 443 | Ingress → jitsi-web |
| XMPP | TCP | 5222 | jicofo/jvb → prosody |
| Media (WebRTC) | UDP | 10000 | Client → jvb |
| Agent sidecar → Jitsi | TCP/WebSocket | 443 | Agent pod → jitsi-web |
| Kradle API → Prosody | TCP | 5280 | Controller → prosody (HTTP admin) |
| Jitsi webhooks → Kradle | HTTP | internal | prosody → kradle-web (event sync) |

## Verification

After deployment:
1. `kubectl get pods -l app.kubernetes.io/name=jitsi` — all pods Running
2. `curl -s https://meet.kradle.local/config.js` — returns Jitsi config
3. Kradle health page shows Jitsi: Connected
4. Create a JitsiMeeting CRD → room appears on Jitsi server
