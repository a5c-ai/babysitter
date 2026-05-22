import { createHmac } from 'node:crypto';
import { createResource } from './resource-model.js';

export class WebhookBus {
  constructor({ controlPlane, secret = 'krate-dev-secret' }) { this.controlPlane = controlPlane; this.secret = secret; }

  subscribe({ name, namespace = 'krate-org-default', organizationRef = 'default', url, events = ['pullrequest.created'], mode = 'active' }, user) {
    return this.controlPlane.create(createResource('WebhookSubscription', { name, namespace }, {
      organizationRef, url, events, signing: { algorithm: 'hmac-sha256', secretRef: `${name}-secret` }, mode
    }, { ready: true }), user);
  }

  sign(payload) { return createHmac('sha256', this.secret).update(JSON.stringify(payload)).digest('hex'); }

  deliver({ subscriptionName, namespace = 'krate-org-default', organizationRef = 'default', eventType, payload, response = { status: 202, body: 'accepted' } }, user) {
    const subscription = this.controlPlane.get('WebhookSubscription', namespace, subscriptionName);
    if (!subscription) throw new Error(`WebhookSubscription ${subscriptionName} not found`);
    if (!subscription.spec.events.includes(eventType)) throw new Error(`${subscriptionName} does not subscribe to ${eventType}`);
    const delivery = createResource('WebhookDelivery', {
      name: `${subscriptionName}-${Date.now()}-${this.controlPlane.list('WebhookDelivery', { namespace }).items.length + 1}`,
      namespace,
      labels: { subscription: subscriptionName, eventType }
    }, {
      organizationRef: subscription.spec.organizationRef || organizationRef,
      subscription: subscriptionName,
      url: subscription.spec.url,
      eventType,
      payload,
      signature: this.sign(payload),
      replayOf: payload.replayOf || null
    }, {
      phase: response.status >= 200 && response.status < 300 ? 'Delivered' : 'Failed',
      response,
      attempts: 1
    });
    return this.controlPlane.create(delivery, user);
  }

  replay(delivery, user) {
    return this.deliver({
      subscriptionName: delivery.spec.subscription,
      namespace: delivery.metadata.namespace,
      organizationRef: delivery.spec.organizationRef,
      eventType: delivery.spec.eventType,
      payload: { ...delivery.spec.payload, replayOf: delivery.metadata.name },
      response: { status: 202, body: 'replayed' }
    }, user);
  }

  inspect(delivery) {
    return {
      name: delivery.metadata.name,
      subscription: delivery.spec.subscription,
      eventType: delivery.spec.eventType,
      phase: delivery.status.phase,
      attempts: delivery.status.attempts,
      response: delivery.status.response,
      signature: delivery.spec.signature,
      replayOf: delivery.spec.replayOf,
      replayable: Boolean(delivery.spec.subscription && delivery.spec.eventType)
    };
  }
}
