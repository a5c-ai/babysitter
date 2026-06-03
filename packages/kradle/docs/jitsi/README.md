# Jitsi Meet Integration — Requirements

Kradle integration with [Jitsi Meet](https://github.com/jitsi/jitsi-meet) for real-time video conferencing with human and agent participants.

## Documents

| File | Scope |
|------|-------|
| [01-architecture.md](./01-architecture.md) | System architecture, CRD design, controller boundaries |
| [02-helm-deployment.md](./02-helm-deployment.md) | Helm subchart integration, values.yaml, deployment topology |
| [03-crds-and-controllers.md](./03-crds-and-controllers.md) | Resource definitions, syncing controllers, reconciliation loops |
| [04-web-management.md](./04-web-management.md) | Web console pages, settings UI, meeting management |
| [05-human-meeting-experience.md](./05-human-meeting-experience.md) | Join/create meetings, embedded meeting UI, lobby |
| [06-agent-meeting-participation.md](./06-agent-meeting-participation.md) | Agent stacks with meeting capability, dispatch with Jitsi context, agent attendance |
| [07-agent-meeting-runtime.md](./07-agent-meeting-runtime.md) | Agent container plumbing, Jitsi client in K8s Jobs, audio/video/text pipelines |

## Why

Kradle orchestrates agents that work on code — but many workflows require real-time collaboration between humans and agents. Stand-ups, architecture reviews, incident response, pair programming. Today agents operate asynchronously via dispatch runs. Jitsi integration adds synchronous multi-party communication where agents can attend meetings alongside humans: listen, speak, share context, and take action.

## Scope

1. **Deploy Jitsi** — Helm subchart installs Jitsi Meet in the cluster
2. **Manage via CRDs** — JitsiMeetProvider, JitsiMeeting, JitsiMeetingTemplate, JitsiRecording as Kubernetes resources
3. **Sync controllers** — Reconcile CRD state with Jitsi server state (rooms, participants, recordings)
4. **Web console** — Create/join/manage meetings, configure Jitsi settings, view recordings
5. **Embedded meetings** — Full Jitsi iframe experience inside the kradle web console
6. **Agent participation** — Agent stacks can declare meeting capability; dispatch injects Jitsi credentials into agent containers
7. **Agent runtime** — Agents join meetings via headless Jitsi client, process audio/text, and interact through the meeting
