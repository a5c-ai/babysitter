#!/usr/bin/env bash
# Read-only kubectl/helm inventory of aks-hub-development-westus3-v2. Secrets are listed by name/type only (no data).
set -u
OUT="$(cd "$(dirname "$0")" && pwd)"
K="kubectl --context aks-hub-development-westus3-v2"
run() { local name="$1"; shift; echo "== $name"; "$@" > "$OUT/$name.json" 2> "$OUT/$name.err" || echo "FAILED: $name"; [ -s "$OUT/$name.err" ] || rm -f "$OUT/$name.err"; }
run nodes $K get nodes -o json
run namespaces $K get ns -o json
run deployments $K get deploy -A -o json
run statefulsets $K get sts -A -o json
run daemonsets $K get ds -A -o json
run cronjobs $K get cronjobs -A -o json
run jobs $K get jobs -A -o json
run pods $K get pods -A -o json
run services $K get svc -A -o json
run ingresses $K get ingress -A -o json
run ingressclasses $K get ingressclass -o json
run pvcs $K get pvc -A -o json
run pvs $K get pv -o json
run storageclasses $K get sc -o json
run configmaps-names $K get cm -A -o custom-columns=NS:.metadata.namespace,NAME:.metadata.name,OWNER:.metadata.labels.app\.kubernetes\.io/managed-by
run certificates $K get certificates.cert-manager.io -A -o json
run clusterissuers $K get clusterissuers.cert-manager.io -o json
run issuers $K get issuers.cert-manager.io -A -o json
run crds-names $K get crd -o custom-columns=NAME:.metadata.name,GROUP:.spec.group,SCOPE:.spec.scope
run hpa $K get hpa -A -o json
run pdb $K get pdb -A -o json
run networkpolicies $K get netpol -A -o json
run serviceaccounts $K get sa -A -o custom-columns=NS:.metadata.namespace,NAME:.metadata.name
run clusterroles-names $K get clusterrole -o custom-columns=NAME:.metadata.name
run clusterrolebindings $K get clusterrolebinding -o json
run runnerscalesets $K get autoscalingrunnersets.actions.github.com -A -o json
run ephemeralrunners $K get ephemeralrunners.actions.github.com -A -o json
run kyverno-policies $K get clusterpolicies.kyverno.io -o json
run gatekeeper-constraints $K get constraints -A -o json
run gatekeeper-templates $K get constrainttemplates -o json
run vela $K get all -n vela-system -o json
run secretproviderclasses $K get secretproviderclasses.secrets-store.csi.x-k8s.io -A -o json
run kradle-crd-groups $K api-resources -o wide
run mutatingwebhooks $K get mutatingwebhookconfigurations -o json
run validatingwebhooks $K get validatingwebhookconfigurations -o json
run events-warning $K get events -A --field-selector type=Warning -o json
run top-nodes $K top nodes
run top-pods $K top pods -A
run helm-list helm --kube-context aks-hub-development-westus3-v2 list -A -o json
run helm-history-kradle helm --kube-context aks-hub-development-westus3-v2 history kradle -n kradle -o json
run helm-history-kradle-staging helm --kube-context aks-hub-development-westus3-v2 history kradle -n kradle-staging -o json
run helm-history-babysitter-web-staging helm --kube-context aks-hub-development-westus3-v2 history babysitter-web-staging -n staging -o json
run helm-history-kyverno helm --kube-context aks-hub-development-westus3-v2 history kyverno -n kyverno -o json
run helm-history-hub-dev-runners helm --kube-context aks-hub-development-westus3-v2 history hub-dev-runners -n arc-runners -o json
echo DONE
