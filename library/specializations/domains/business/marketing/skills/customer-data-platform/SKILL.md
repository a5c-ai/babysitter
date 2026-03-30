---
name: customer-data-platform
description: CDP operations for unified customer data management and audience activation
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: marketing
  domain: business
  category: Marketing Analytics
  skill-id: SK-015
---

# Customer Data Platform Skill

## Overview

The Customer Data Platform Skill enables comprehensive CDP operations for unified customer data management, audience segmentation, and activation across marketing channels. This skill provides integration with major CDP platforms including Segment, mParticle, and Adobe Real-Time CDP, supporting identity resolution, event tracking, and privacy-compliant data orchestration.

## Capabilities

### Segment CDP Integration
- Source and destination configuration
- Event tracking implementation
- Persona (customer profile) management
- Audience building and syncing
- Privacy portal configuration
- Protocol schema management
- Function development
- Destination filtering and mappings

### mParticle Data Orchestration
- Input and output configuration
- Data planning and validation
- Identity resolution setup
- Audience management
- Kit integration configuration
- Data filter rules
- User attribute management
- Forwarding rules configuration

### Adobe Real-Time CDP
- Schema and dataset management
- Identity namespace configuration
- Merge policy setup
- Segment Builder operations
- Destination activation
- Data governance labeling
- Profile enrichment
- Edge profile configuration

### Customer Profile Unification
- Identity graph management
- Cross-device identity stitching
- Deterministic matching rules
- Probabilistic matching configuration
- Profile merge strategies
- Duplicate detection and resolution
- Historical profile reconstruction
- Real-time profile updates

### Audience Building and Segmentation
- Rule-based segment creation
- Behavioral segmentation
- Predictive audience modeling
- Lookalike audience generation
- Segment overlap analysis
- Dynamic segment updates
- Segment sharing across destinations
- A/B test audience allocation

### Event Tracking Configuration
- Event taxonomy design
- Event schema definition
- Event validation rules
- Custom event properties
- Event enrichment
- Real-time event streaming
- Historical event replay
- Event debugging and testing

### Data Activation
- Marketing channel activation
- Advertising platform syncing
- Email platform integration
- Personalization engine feeds
- Analytics destination routing
- CRM synchronization
- Custom destination development
- Activation scheduling

### Identity Resolution
- First-party identity management
- Third-party ID integration
- Cross-channel identity mapping
- Anonymous to known identity linking
- Identity confidence scoring
- ID graph visualization
- Identity conflict resolution
- Privacy-compliant ID management

### Privacy and Consent Management
- Consent collection configuration
- Preference center integration
- GDPR compliance implementation
- CCPA opt-out management
- Data subject request automation
- Consent signal propagation
- Privacy policy enforcement
- Audit trail maintenance

## Process Integration

This skill integrates with the following marketing processes:

- **customer-segmentation-analysis.js** - Advanced segmentation and audience building
- **customer-journey-analytics.js** - Journey tracking and profile enrichment
- **attribution-modeling-setup.js** - Identity resolution for attribution

## Dependencies

- Segment API
- mParticle API
- Adobe Experience Platform API
- Marketing platform APIs (for destinations)
- Analytics platform APIs (for data sources)
- CRM APIs (for profile synchronization)

## Usage

### Event Tracking Setup

```yaml
skill: customer-data-platform
action: configure-event-tracking
parameters:
  platform: segment
  tracking_plan:
    name: "Marketing Events"
    events:
      - name: Page Viewed
        properties:
          page_name: string
          page_category: string
          referrer: string
      - name: Product Viewed
        properties:
          product_id: string
          product_name: string
          category: string
          price: number
      - name: Campaign Clicked
        properties:
          campaign_id: string
          campaign_name: string
          channel: string
          creative_id: string
```

### Audience Building

```yaml
skill: customer-data-platform
action: create-audience
parameters:
  platform: segment
  audience_name: "High Value Prospects"
  definition:
    conditions:
      - type: event
        event: Product Viewed
        count: ">= 3"
        timeframe: last_30_days
      - type: trait
        property: customer_ltv
        operator: ">="
        value: 500
      - type: event
        event: Order Completed
        count: "= 0"
    logic: AND
  destinations:
    - facebook-ads
    - google-ads
    - braze
```

### Identity Resolution Configuration

```yaml
skill: customer-data-platform
action: configure-identity
parameters:
  platform: mparticle
  identity_strategy:
    priority_order:
      - customer_id
      - email
      - phone
      - device_id
    matching_rules:
      - type: deterministic
        identifiers: [customer_id, email]
      - type: probabilistic
        confidence_threshold: 0.85
        identifiers: [device_id, ip_address]
    merge_policy: most_recent
```

### Destination Activation

```yaml
skill: customer-data-platform
action: activate-audience
parameters:
  platform: adobe-rtcdp
  audience_id: "high-intent-shoppers"
  destinations:
    - destination: google-ads
      mapping:
        user_id: customer_id
        hashed_email: email_sha256
      schedule: real-time
    - destination: facebook-ads
      mapping:
        extern_id: customer_id
        email: email_hash
      schedule: daily
```

### Privacy Configuration

```yaml
skill: customer-data-platform
action: configure-privacy
parameters:
  platform: segment
  consent_categories:
    - name: marketing
      description: "Marketing and advertising"
      default: opt-out
    - name: analytics
      description: "Analytics and measurement"
      default: opt-in
    - name: functional
      description: "Required for site functionality"
      default: required
  regulations:
    gdpr:
      enabled: true
      data_subject_request_automation: true
    ccpa:
      enabled: true
      do_not_sell_signal: true
```

## Best Practices

1. **Data Quality**: Implement validation rules to ensure data consistency
2. **Privacy First**: Configure consent management before collecting data
3. **Identity Strategy**: Define clear identity resolution rules and priorities
4. **Event Taxonomy**: Maintain a documented event naming convention
5. **Destination Mapping**: Carefully map fields to destination requirements
6. **Testing**: Use debug mode to validate tracking before production
7. **Documentation**: Maintain data dictionaries and tracking plans
8. **Governance**: Implement data access controls and audit logging

## Related Skills

- SK-005: Marketing Analytics Platform
- SK-018: CRM Integration
- SK-020: Customer Journey Mapping

## Related Agents

- AG-008: Marketing Analytics Director
- AG-010: Consumer Insights Specialist
