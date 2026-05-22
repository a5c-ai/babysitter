# Local Minikube Setup



Krate now includes a deterministic local setup script for the Kubernetes package lifecycle.



## Dry-run validation



Use dry-run mode in development and CI because it does not require a local cluster:



```bash

npm run setup:minikube -- --dry-run

npm run setup:minikube -- --dry-run --json

npm run e2e

```



Dry-run mode verifies the intended lifecycle command plan: start minikube, enable ingress and metrics, select the context, validate the chart, install the chart, apply demo resources, wait for the API deployment, and run smoke assertions.



## Apply mode



Use apply mode when `minikube`, `kubectl`, `helm`, Node.js, npm, and a working container driver are installed:



```bash

npm run setup:minikube -- --apply

```



The script defaults to profile `krate`, namespace `krate-system`, release `krate`, driver `docker`, and chart `charts/krate`. Override with `--profile=...`, `--namespace=...`, `--release=...`, `--driver=...`, and `--chart=...`.



## Release boundary

The chart is production-shaped and validates Krate install contracts against the executable Kubernetes package model, including Argo CD Application and Gitea backend surfaces. The repository includes a production-shaped controller image build, ingress values for the Next.js app, registry pull-secret support, and GitHub publishing lanes for GHCR images, chart artifacts, generated dist/example bundles, and AKS branch deployments.
