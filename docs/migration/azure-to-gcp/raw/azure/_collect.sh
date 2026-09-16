#!/usr/bin/env bash
# Read-only Azure inventory collection. Re-run to refresh raw JSON. Never prints secret values (no `keys list`, no `helm get values` here).
set -u
OUT="$(cd "$(dirname "$0")" && pwd)"
run() { local name="$1"; shift; echo "== $name"; "$@" > "$OUT/$name.json" 2> "$OUT/$name.err" || echo "FAILED: $name (see $name.err)"; [ -s "$OUT/$name.err" ] || rm -f "$OUT/$name.err"; }
run account-show az account show -o json
run account-list az account list --all -o json
run groups az group list -o json
run resources az resource list -o json
run aks-list az aks list -o json
run aks-show az aks show -g rg-hub-development-westus3 -n aks-hub-development-westus3-v2 -o json
run aks-nodepools az aks nodepool list -g rg-hub-development-westus3 --cluster-name aks-hub-development-westus3-v2 -o json
run aks-versions az aks get-upgrades -g rg-hub-development-westus3 -n aks-hub-development-westus3-v2 -o json
run acr-list az acr list -o json
run pg-flex-list az postgres flexible-server list -o json
run storage-accounts az storage account list -o json
run keyvaults az keyvault list -o json
run cognitive-accounts az cognitiveservices account list -o json
run staticwebapps az staticwebapp list -o json
run webapps az webapp list -o json
run appservice-plans az appservice plan list -o json
run containerapps az containerapp list -o json
run containerapp-envs az containerapp env list -o json
run containerapp-jobs az containerapp job list -o json
run redis az redis list -o json
run vms az vm list -d -o json
run disks az disk list -o json
run public-ips az network public-ip list -o json
run lbs az network lb list -o json
run vnets az network vnet list -o json
run nsgs az network nsg list -o json
run nics az network nic list -o json
run dns-zones az network dns zone list -o json
run private-dns-zones az network private-dns zone list -o json
run log-analytics az monitor log-analytics workspace list -o json
run app-insights az resource list --resource-type Microsoft.Insights/components -o json
run monitor-accounts az resource list --resource-type Microsoft.Monitor/accounts -o json
run grafana az resource list --resource-type Microsoft.Dashboard/grafana -o json
run ml-workspaces az resource list --resource-type Microsoft.MachineLearningServices/workspaces -o json
run ml-endpoints az resource list --resource-type Microsoft.MachineLearningServices/workspaces/serverlessEndpoints -o json
run identities az identity list -o json
run cosmos az cosmosdb list -o json
run role-assignments az role assignment list --all -o json
run alert-rules az monitor metrics alert list -o json
run prometheus-rulegroups az resource list --resource-type Microsoft.AlertsManagement/prometheusRuleGroups -o json
run action-groups az monitor action-group list -o json
run snapshots az snapshot list -o json
run aci az container list -o json
run ad-app-list az ad app list --display-name a5c -o json
run sponsorship-consumption az consumption usage list --top 5 -o json
echo DONE
