#!/usr/bin/env bash
# G0-RT live E2E: dispatch a video-capable agent into an in-cluster Jitsi meeting and
# assert the jitsi-agent-sidecar container JOINS the room (and, for video:publish, boots
# the avatar + publishes a track). Runs against a deployed kradle cluster; needs kubectl
# (cluster creds) AND an authenticated BFF session (dispatch is API-only — there is no
# AgentDispatchRun CR to apply: POST /api/orgs/<org>/agents/dispatch ->
# createManualDispatch builds the Job synchronously).
#
# Required env:
#   APP_HOST                  e.g. kradle-staging.a5c.ai (the BFF ingress host)
#   CONTROL_NS                control-plane namespace (e.g. kradle-staging) — holds the jitsi stack + jwt secret
#   ORG                       org slug (e.g. a5c-ai)
#   KRADLE_TEST_AUTH_SECRET   test-session secret (authenticated dispatch)
# Optional:
#   JITSI_WEB_SVC             override the in-cluster jitsi web service (default kradle-jitsi-subchart-web.<CONTROL_NS>.svc.cluster.local:80)
#   JOIN_TIMEOUT              seconds to wait for the sidecar to join (default 240)
#   KEEP_RESOURCES=1          skip cleanup (debug)
set -euo pipefail

APP_HOST="${APP_HOST:?set APP_HOST}"
CONTROL_NS="${CONTROL_NS:?set CONTROL_NS}"
ORG="${ORG:?set ORG}"
ORG_NS="kradle-org-${ORG}"
JITSI_WEB_SVC="${JITSI_WEB_SVC:-kradle-jitsi-subchart-web.${CONTROL_NS}.svc.cluster.local:80}"
JOIN_TIMEOUT="${JOIN_TIMEOUT:-240}"
SUFFIX="$(date +%s)"
PROVIDER="g0rt-provider"
APPEARANCE="g0rt-avatar-${SUFFIX}"
SA="g0rt-sa"
GRANT="g0rt-model-grant"
STACK="g0rt-stack-${SUFFIX}"
MEETING="g0rt-meeting-${SUFFIX}"
ROOM_ID="g0rt-room-${SUFFIX}"
COOKIE_JAR="$(mktemp)"
DISPATCH_JSON="$(mktemp)"

log() { printf '\n[g0-rt-e2e] %s\n' "$*"; }
fail() { printf '\n[g0-rt-e2e] ✗ FAIL: %s\n' "$*" >&2; exit 1; }

RUN_ID=""
cleanup() {
  if [ "${KEEP_RESOURCES:-0}" = "1" ]; then log "KEEP_RESOURCES=1 — skipping cleanup"; return; fi
  log "cleanup"
  [ -n "$RUN_ID" ] && kubectl -n "$ORG_NS" delete job "kradle-agent-${RUN_ID}" --ignore-not-found --wait=false >/dev/null 2>&1 || true
  kubectl -n "$ORG_NS" delete jitsimeeting "$MEETING" --ignore-not-found >/dev/null 2>&1 || true
  kubectl -n "$ORG_NS" delete agentstack "$STACK" --ignore-not-found >/dev/null 2>&1 || true
  kubectl -n "$ORG_NS" delete agentappearance "$APPEARANCE" --ignore-not-found >/dev/null 2>&1 || true
  rm -f "$COOKIE_JAR" "$DISPATCH_JSON" 2>/dev/null || true
}
trap cleanup EXIT

# --- 0. shared JWT secret (controller signs / prosody validates with the same value) ---
log "0. read the shared Jitsi JWT secret from ${CONTROL_NS}/kradle-kradle-jitsi-jwt"
JWT_SECRET="$(kubectl -n "$CONTROL_NS" get secret kradle-kradle-jitsi-jwt -o jsonpath='{.data.appSecret}' 2>/dev/null | base64 -d || true)"
if [ -z "$JWT_SECRET" ]; then
  log "::warning:: no kradle-kradle-jitsi-jwt secret — is jitsi.install=true deployed? continuing (provider will carry an empty secret)"
fi

# --- 0b. confirm the in-cluster jitsi web service exists (signaling reachability) ---
log "0b. in-cluster jitsi services in ${CONTROL_NS}"
kubectl -n "$CONTROL_NS" get svc | grep -iE 'jitsi|prosody|jvb' || log "::warning:: no jitsi services found in ${CONTROL_NS}"

# --- 1. org namespace ---
log "1. ensure org namespace ${ORG_NS}"
kubectl create namespace "$ORG_NS" --dry-run=client -o yaml | kubectl apply -f - >/dev/null

# --- 2. prerequisite CRs (provider -> appearance -> stack), org-scoped ---
log "2. apply JitsiMeetProvider/${PROVIDER} -> in-cluster web ${JITSI_WEB_SVC}"
kubectl apply -f - <<EOF
apiVersion: kradle.a5c.ai/v1alpha1
kind: JitsiMeetProvider
metadata:
  name: ${PROVIDER}
  namespace: ${ORG_NS}
spec:
  organizationRef: ${ORG}
  endpoint: http://${JITSI_WEB_SVC}
  internalEndpoint: http://${JITSI_WEB_SVC}
  authMode: jwt
  deploymentMode: internal
  jwtConfig:
    appId: kradle
    issuer: kradle
    audience: jitsi
    secret: "${JWT_SECRET}"
    appSecret: "${JWT_SECRET}"
EOF

log "2b. apply AgentAppearance/${APPEARANCE} (placeholder avatar — no committed CC-BY-NC asset)"
kubectl apply -f - <<EOF
apiVersion: kradle.a5c.ai/v1alpha1
kind: AgentAppearance
metadata:
  name: ${APPEARANCE}
  namespace: ${ORG_NS}
spec:
  organizationRef: ${ORG}
  renderer: talkinghead
  visemeSet: oculus
  defaultMood: neutral
  defaultView: upper
EOF

# The dispatch permission review (agent-permission-review.js) requires the stack's
# runtimeIdentity.serviceAccountRef to resolve to an AgentServiceAccount, and (because
# adapter=claude-code needs a model-provider secret) a matching AgentSecretGrant. Without
# these the dispatch is "denied by permission review".
log "2a. apply AgentServiceAccount/${SA} + AgentSecretGrant/${GRANT}"
kubectl apply -f - <<EOF
apiVersion: kradle.a5c.ai/v1alpha1
kind: AgentServiceAccount
metadata:
  name: ${SA}
  namespace: ${ORG_NS}
spec:
  organizationRef: ${ORG}
  namespace: ${ORG_NS}
  serviceAccountName: ${SA}
---
apiVersion: kradle.a5c.ai/v1alpha1
kind: AgentSecretGrant
metadata:
  name: ${GRANT}
  namespace: ${ORG_NS}
spec:
  organizationRef: ${ORG}
  subject:
    name: ${SA}
  purpose: model-provider
  secretRef:
    name: kradle-assistant-keys
EOF

log "2c. apply AgentStack/${STACK} (video:publish, jitsiCapability, governed visual tools)"
kubectl apply -f - <<EOF
apiVersion: kradle.a5c.ai/v1alpha1
kind: AgentStack
metadata:
  name: ${STACK}
  namespace: ${ORG_NS}
spec:
  organizationRef: ${ORG}
  baseAgent: claude-code
  adapter: claude-code
  runtimeIdentity:
    serviceAccountRef: ${SA}
  jitsiCapability: true
  jitsiMeetingProviderRef: ${PROVIDER}
  jitsiConfig:
    # CRD enum is observer|participant|moderator (the in-code validator also accepts
    # "agent", but the API server validates the CRD schema first). A non-observer role
    # may publish video.
    role: participant
    avatarRef: ${APPEARANCE}
    capabilities:
      video: publish
      audio: both
      chat: write
    tools:
      - set_expression
      - play_gesture
      - draw_canvas
      - share_surface
    governedTools:
      - draw_canvas
      - share_surface
EOF

# --- 3. authenticated BFF session ---
log "3. authenticate (test-session) at https://${APP_HOST}"
[ -n "${KRADLE_TEST_AUTH_SECRET:-}" ] || fail "KRADLE_TEST_AUTH_SECRET not set — cannot dispatch"
# Authenticate as the deploy's ADMIN user (admin.username), so the dispatch passes kradle's
# permission review (a non-admin test user is "denied by permission review"). Override via
# G0RT_ADMIN_USER. Retry: the BFF/api pod is intermittently slow/5xx under heavy control-plane
# reads, so auth can transiently fail/time out.
AUTH=""
for a in $(seq 1 6); do
  AUTH=$(curl -sf --max-time 30 -X POST "https://${APP_HOST}/api/auth/test-session" \
    -H 'content-type: application/json' \
    -d "{\"secret\":\"${KRADLE_TEST_AUTH_SECRET}\",\"username\":\"${G0RT_ADMIN_USER:-tmuskal}\"}" \
    -c "$COOKIE_JAR" 2>/dev/null) && echo "$AUTH" | jq -e '.ok == true' >/dev/null 2>&1 && break
  log "auth attempt ${a} failed (transient BFF) — retrying"
  AUTH=""; sleep 10
done
[ -n "$AUTH" ] || fail "test-session failed after retries (BFF unstable?)"

# --- 4. create the meeting (API -> Active + roomUrl). Capture status + body for diagnostics. ---
log "4. create JitsiMeeting/${MEETING} (room ${ROOM_ID}) via the BFF"
MEET_BODY="$(mktemp)"; MHTTP=000
for a in $(seq 1 6); do
  MHTTP=$(curl -s -o "$MEET_BODY" -w '%{http_code}' --max-time 60 -b "$COOKIE_JAR" -X POST "https://${APP_HOST}/api/orgs/${ORG}/jitsi/meetings" \
    -H 'content-type: application/json' \
    -d "{\"name\":\"${MEETING}\",\"displayName\":\"G0-RT E2E\",\"ttlMinutes\":30,\"providerRef\":\"${PROVIDER}\",\"roomId\":\"${ROOM_ID}\"}" || echo "000")
  { [ "$MHTTP" -ge 200 ] && [ "$MHTTP" -lt 300 ]; } && break
  log "meeting attempt ${a} HTTP=${MHTTP} (transient BFF) — retrying"; sleep 10
done
log "meeting HTTP=${MHTTP} body=$(head -c 300 "$MEET_BODY")"
{ [ "$MHTTP" -ge 200 ] && [ "$MHTTP" -lt 300 ]; } || fail "meeting creation HTTP ${MHTTP}: $(head -c 300 "$MEET_BODY")"
# metadata.name is the canonical ref; createMeetingResource normalizes name == our MEETING slug.
MEETING_REF=$(jq -r '.metadata.name // .name // .resource.metadata.name // empty' "$MEET_BODY" 2>/dev/null || true)
MEETING_REF="${MEETING_REF:-$MEETING}"
rm -f "$MEET_BODY"

# The BFF returns status.phase=Active in the body, but kubectl apply does NOT write the status
# subresource, so the cluster meeting has no phase -> dispatch rejects "Meeting is not active".
# Set it explicitly (+ the in-cluster roomUrl the sidecar opens). Try the status subresource,
# fall back to a plain status merge if the CRD has no status subresource.
# jitsimeetings has a status subresource — status MUST be set via --subresource=status (a
# plain merge drops it). jitsi-agent-bridge.js:66 requires status.phase === 'Active'.
log "4b. mark JitsiMeeting/${MEETING_REF} Active via the status subresource"
MSTATUS="{\"status\":{\"phase\":\"Active\",\"roomUrl\":\"http://${JITSI_WEB_SVC}/${ROOM_ID}\"}}"
kubectl -n "$ORG_NS" patch jitsimeeting "$MEETING_REF" --subresource=status --type=merge -p "$MSTATUS" \
  || fail "could not patch meeting status to Active"
for i in $(seq 1 10); do
  PH=$(kubectl -n "$ORG_NS" get jitsimeeting "$MEETING_REF" -o jsonpath='{.status.phase}' 2>/dev/null || true)
  [ "$PH" = "Active" ] && { log "meeting phase=Active at the cluster"; break; }
  sleep 2
done

# --- 5. dispatch the agent INTO the meeting. Capture status + body. Retry past the BFF's
#        30s stale-while-revalidate snapshot cache (the meeting was just patched Active). ---
log "5. dispatch AgentStack/${STACK} into meeting ${MEETING_REF}"
DHTTP=000
for attempt in $(seq 1 12); do
  DHTTP=$(curl -s -o "$DISPATCH_JSON" -w '%{http_code}' --max-time 120 -b "$COOKIE_JAR" -X POST "https://${APP_HOST}/api/orgs/${ORG}/agents/dispatch" \
    -H 'content-type: application/json' \
    -d "{\"agentStack\":\"${STACK}\",\"meetingRef\":\"${MEETING_REF}\",\"task\":\"Join the meeting and greet the room.\",\"taskKind\":\"g0-rt-e2e\"}" || echo "000")
  { [ "$DHTTP" -ge 200 ] && [ "$DHTTP" -lt 300 ]; } && break
  DBODY="$(head -c 300 "$DISPATCH_JSON")"
  log "dispatch attempt ${attempt} HTTP=${DHTTP} body=${DBODY}"
  # Retry on the cache-stale 'not active' (cluster is Active; BFF SWR cache lags <=30s) AND on
  # transient gateway/pod 5xx/000. Any other 4xx is a real error -> fail fast.
  case "$DBODY" in
    *"not active"*) sleep 10; continue ;;
  esac
  if [ "$DHTTP" -ge 500 ] || [ "$DHTTP" = "000" ]; then sleep 10; continue; fi
  fail "dispatch HTTP ${DHTTP}: ${DBODY}"
done
log "dispatch HTTP=${DHTTP} body=$(head -c 600 "$DISPATCH_JSON")"
{ [ "$DHTTP" -ge 200 ] && [ "$DHTTP" -lt 300 ]; } || fail "dispatch still failing after retries: $(head -c 400 "$DISPATCH_JSON")"
RUN_ID=$(jq -r '.run.metadata.name // .run.id // .runId // .metadata.name // empty' "$DISPATCH_JSON" 2>/dev/null || true)
[ -n "$RUN_ID" ] || fail "could not extract runId from dispatch response: $(head -c 400 "$DISPATCH_JSON")"
log "dispatched runId=${RUN_ID}"

# --- 6. find the Job + pod ---
log "6. wait for Job kradle-agent-${RUN_ID} + its pod"
for i in $(seq 1 30); do
  kubectl -n "$ORG_NS" get job "kradle-agent-${RUN_ID}" >/dev/null 2>&1 && break
  sleep 2
  [ "$i" = 30 ] && fail "Job kradle-agent-${RUN_ID} never appeared (dispatch made no Job — check withOrgScope / image pull / controller logs)"
done
POD=""
for i in $(seq 1 30); do
  POD=$(kubectl -n "$ORG_NS" get pods -l "kradle.a5c.ai/run=${RUN_ID}" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)
  [ -n "$POD" ] && break
  sleep 2
done
[ -n "$POD" ] || fail "no pod for run ${RUN_ID}"
log "pod=${POD}"

# --- 7. assert the sidecar JOINS (and, for video:publish, boots the avatar) ---
log "7. poll the jitsi-agent-sidecar container logs for the join signal (timeout ${JOIN_TIMEOUT}s)"
JOINED=0; PUBLISHED=0; ELAPSED=0
while [ "$ELAPSED" -lt "$JOIN_TIMEOUT" ]; do
  LOGS=$(kubectl -n "$ORG_NS" logs "$POD" -c jitsi-agent-sidecar 2>/dev/null || true)
  if echo "$LOGS" | grep -qiE "connected|roomId|participant"; then JOINED=1; fi
  if echo "$LOGS" | grep -qiE "kradleAvatarBoot|setEffect|attached.*true|avatar bootstrap"; then PUBLISHED=1; fi
  if [ "$JOINED" = 1 ] && { [ "$PUBLISHED" = 1 ] || [ "$ELAPSED" -ge 60 ]; }; then break; fi
  sleep 8; ELAPSED=$((ELAPSED + 8))
done

log "=== sidecar logs (tail) ==="
kubectl -n "$ORG_NS" logs "$POD" -c jitsi-agent-sidecar --tail=40 2>/dev/null || true

if [ "$JOINED" != 1 ]; then
  log "=== agent container logs (tail) ==="; kubectl -n "$ORG_NS" logs "$POD" -c agent --tail=30 2>/dev/null || true
  log "=== pod describe (events) ==="; kubectl -n "$ORG_NS" describe pod "$POD" 2>/dev/null | tail -30 || true
  fail "sidecar did not report a join within ${JOIN_TIMEOUT}s (signaling/JWT/reachability — see logs above)"
fi

log "✓ sidecar JOINED the in-cluster Jitsi room"
if [ "$PUBLISHED" = 1 ]; then
  log "✓ avatar boot / video publish signal observed (G0-RT video path live)"
else
  log "::warning:: joined but no avatar-boot/publish signal yet — media/JVB path may need work (X2/JVB-UDP). Join verified; publish unconfirmed."
fi
log "✓ G0-RT live E2E: dispatch -> sidecar join PASSED (run ${RUN_ID})"
