import { createResource, clone } from './resource-model.js';

export const AGENT_TRIGGER_CONTROLLER_BOUNDARY = {
  role: 'agent-trigger-controller',
  scope: 'Event normalization, rule matching, deduplication, and dispatch creation',
  owns: ['event normalization', 'rule matching', 'trigger execution records', 'dispatch initiation'],
  delegatesTo: ['agent-dispatch-controller', 'resource-model'],
  mustNotOwn: ['event sourcing', 'webhook delivery', 'secret values']
};

export function createAgentTriggerController(options = {}) {
  const dispatchController = options.dispatchController;

  return {
    role: 'agent-trigger-controller',

    matchRule(rule, event) {
      // 1. Check event type is in rule.spec.sources
      const sources = rule.spec?.sources || [];
      if (!sources.includes(event.type)) return { matches: false, reason: `Event type '${event.type}' not in rule sources [${sources.join(', ')}]` };
      // 2. Check repository scope (if rule has spec.repository, must match)
      if (rule.spec?.repository && rule.spec.repository !== event.repository) return { matches: false, reason: `Repository '${event.repository}' does not match rule scope '${rule.spec.repository}'` };
      // 3. Check actor filter (if rule has spec.allowedActors)
      if (rule.spec?.allowedActors?.length > 0 && !rule.spec.allowedActors.includes(event.actor)) return { matches: false, reason: `Actor '${event.actor}' not in allowed actors` };
      return { matches: true, reason: 'All conditions met' };
    },

    evaluateEvent({ event, resources }) {
      const rules = resources.AgentTriggerRule || [];
      const executions = resources.AgentTriggerExecution || [];
      const eventUid = `${event.type}:${event.source?.kind}:${event.source?.name}`;

      return rules.map(rule => {
        const match = this.matchRule(rule, event);
        const isDuplicate = executions.some(ex =>
          ex.spec?.triggerRule === rule.metadata?.name &&
          ex.spec?.sourceEvent === eventUid &&
          ex.status?.phase !== 'Failed'
        );
        return { rule, matches: match.matches, reason: match.reason, isDuplicate };
      });
    },

    createTriggerExecution({ rule, event, decision, reason, namespace = 'default', organizationRef = 'default' }) {
      const eventUid = `${event.type}:${event.source?.kind}:${event.source?.name}`;
      const name = `trigger-exec-${rule.metadata?.name}-${Date.now()}`;
      const execution = createResource('AgentTriggerExecution', { name, namespace }, {
        organizationRef,
        triggerRule: rule.metadata?.name,
        sourceEvent: eventUid,
        decision,
      });
      execution.status = { phase: decision, reason, evaluatedAt: new Date().toISOString() };
      return execution;
    },

    async processEvent({ event, resources, namespace = 'default', organizationRef = 'default' }) {
      const evaluations = this.evaluateEvent({ event, resources });
      const executions = [];
      let dispatched = 0;
      let skipped = 0;

      for (const { rule, matches, reason, isDuplicate } of evaluations) {
        if (!matches) {
          executions.push(this.createTriggerExecution({ rule, event, decision: 'Skipped', reason, namespace, organizationRef }));
          skipped++;
          continue;
        }
        if (isDuplicate) {
          executions.push(this.createTriggerExecution({ rule, event, decision: 'Deduplicated', reason: 'Already dispatched for this event', namespace, organizationRef }));
          skipped++;
          continue;
        }

        const execution = this.createTriggerExecution({ rule, event, decision: 'Dispatching', reason, namespace, organizationRef });

        if (dispatchController) {
          const result = await dispatchController.createManualDispatch({
            repository: event.repository,
            ref: event.ref,
            sourceRefs: [event.source],
            agentStack: rule.spec?.agentStack,
            taskKind: rule.spec?.taskKind || 'diagnostic',
            actor: event.actor,
            namespace,
            organizationRef,
            resources,
          });
          if (result.error) {
            execution.status.phase = 'Failed';
            execution.status.reason = result.message;
          } else {
            execution.status.phase = 'Dispatched';
            execution.status.dispatchRunRef = result.run?.metadata?.name;
          }
        } else {
          execution.status.phase = 'Dispatched';
          execution.status.reason = 'No dispatch controller configured (dry-run)';
        }

        executions.push(execution);
        dispatched++;
      }

      return { processed: evaluations.length, dispatched, skipped, executions };
    },
  };
}
