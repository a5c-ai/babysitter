import { createKubernetesResourceClient, repositoryManifest } from './kubernetes-controller.js';

export const KUBERNETES_RESOURCE_GATEWAY_BOUNDARY = {
  role: 'kubernetes-resource-gateway',
  scope: 'Application port translating API controller intent into Kubernetes resource-client operations',
  owns: ['resource definitions', 'list/get/apply/delete/watch delegation', 'Repository manifest application', 'namespace scoping'],
  delegatesTo: ['kubernetes-resource-client'],
  mustNotOwn: ['HTTP routes', 'Next.js page flow decisions', 'forge DTO composition', 'Kubernetes reconciliation scheduling']
};

export function createKubernetesResourceGateway(options = {}) {
  const resourceClient = options.resourceClient || options.kubernetesClient || createKubernetesResourceClient(options);
  const namespace = options.namespace || resourceClient.namespace || process.env.KRATE_NAMESPACE || 'krate-system';

  return {
    ...KUBERNETES_RESOURCE_GATEWAY_BOUNDARY,
    namespace,
    resourceDefinitions: resourceClient.resourceDefinitions,
    async snapshot() {
      return resourceClient.snapshot();
    },
    async list(kindOrPlural) {
      return resourceClient.listResource(kindOrPlural);
    },
    async get(kindOrPlural, name) {
      return resourceClient.getResource(kindOrPlural, name);
    },
    async apply(resource) {
      return resourceClient.applyResource(resource);
    },
    async delete(kindOrPlural, name) {
      return resourceClient.deleteResource(kindOrPlural, name);
    },
    async createRepository(input) {
      return resourceClient.applyResource(repositoryManifest(input, namespace));
    },
    async createOrganization(input) {
      return resourceClient.createOrganization(input);
    },
    watch(resourcePath, handlers = {}) {
      return resourceClient.watchResource(resourcePath, handlers);
    }
  };
}




