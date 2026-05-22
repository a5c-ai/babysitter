# Hooks and Events Component Requirements

## Purpose

Krate separates three commonly conflated hook mechanisms: server-side Git hooks, outbound HTTP webhooks, and Kubernetes admission webhooks. Each must have its own lifecycle, security model, observability, and UI surface.

## Responsibilities

- Model branch/ref behavior with `RefPolicy`.
- Compile server-side policies into Gitea-backed receive-pack policy config.
- Execute custom Git hooks in a WASM sandbox.
- Deliver outbound webhooks durably with retries, signing, and replay.
- Surface admission policies affecting Krate resources.

## API and resource surface

- `RefPolicy`: require commit signing, block force-pushes, require linear history, and future custom WASM hooks.
- `WebhookSubscription`: endpoint, events, scope, secret reference, retry policy.
- `WebhookDelivery`: request, response, status, latency, retry chain, replay metadata.
- Admission policies: Kyverno/Gatekeeper/native policies applying to Krate resources.

## Requirements

- Server-side Git policy must run inside receive-pack and fail closed for protected refs.
- Outbound delivery must use durable queueing with exponential backoff.
- Deliveries must be HMAC-signed.
- Delivery logs must be queryable with `kubectl` and visible in UI.
- Admission policies must show in a repo Hooks & Policies view when they affect the repository.

## Dependencies

- Gitea repositories and Git receive-pack.
- ConfigMap or mounted policy bundle distribution.
- NATS JetStream or equivalent durable queue.
- Secret storage for webhook signing.
- Kyverno, Gatekeeper, or Kubernetes admission APIs.

## Security and policy

- Custom hooks must not shell out or mount broad secrets.
- Webhook secrets must support rotation.
- Replay must use current secrets and record a new delivery attempt.
- Policy authoring must support audit mode before enforce mode.

## Scaling and performance

- Git hook evaluation must add bounded latency to receive-pack.
- Webhook queueing must absorb bursts without blocking Git operations.
- Delivery log queries must be indexed by repo, subscription, status, event type, and time.

## Failure modes

- Policy compilation fails: old valid policy remains active and status reports stale/error.
- Webhook endpoint down: retries continue and delivery status records failure chain.
- Queue unavailable: new deliveries fail or buffer according to configured durability mode.
- Admission policy misconfigured: audit preview helps identify impact before enforcement.

## Observability

- Hook evaluation latency, policy rejection count, webhook delivery success/failure, retry count, endpoint latency, policy violation count.

## Acceptance criteria

- `RefPolicy` can block force-push to main.
- Webhook test delivery appears in `WebhookDelivery` within seconds.
- Failed deliveries expose request, response, latency, retries, and replay action.
- Kyverno PR policy appears in the Hooks tab and can block PR creation.
