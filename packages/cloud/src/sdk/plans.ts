import type { CloudConfig, DeploymentPlan } from "../types.js";
import { buildKrateHelmPlan } from "../helm/krate-values.js";
import { bootstrapAuth } from "./auth.js";
import { defaultReleaseTagForEnvironment } from "./environments.js";
import { buildAgentInstallPlan } from "./agents.js";
import { configureProviders } from "./providers.js";

export function buildDeploymentPlan(config: CloudConfig): DeploymentPlan {
  const releaseTag = config.releaseTag ?? defaultReleaseTagForEnvironment(config.environment);
  const auth = bootstrapAuth(config);
  const providers = configureProviders(config);
  const helm = buildKrateHelmPlan(config);

  return {
    config,
    namespace: config.namespace,
    releaseTag,
    helm,
    auth,
    providers,
    kubernetes: {
      manifests: [...auth.manifests, ...providers.manifests],
      summary: {
        namespace: config.namespace,
        manifestCount: auth.manifests.length + providers.manifests.length,
        summary: [
          `namespace ${config.namespace}`,
          `helm release: krate`,
          ...(config.ingress.hostnames.length > 0 ? [`${config.ingress.hostnames.length} ingress hostnames`] : []),
        ],
      },
    },
    terraform: {
      provider: config.target.type,
      clusterName: config.target.type === "existing"
        ? config.target.kubeContext
        : config.target.type === "minikube"
        ? (config.target.profile ?? "babysitter")
        : config.target.clusterName,
      summary: [
        `provider ${config.target.type}`,
        config.target.type === "existing"
          ? `reuse kube context ${config.target.kubeContext}`
          : "cluster creation and handoff managed via Terraform",
      ],
    },
    ...(buildAgentInstallPlan(config) ? { agents: buildAgentInstallPlan(config) } : {}),
    statusQueries: [
      `kubectl get deploy,svc,ingress,pvc -n ${config.namespace}`,
      ...(config.target.type === "existing" ? [`kubectl config use-context ${config.target.kubeContext}`] : []),
    ],
  };
}
