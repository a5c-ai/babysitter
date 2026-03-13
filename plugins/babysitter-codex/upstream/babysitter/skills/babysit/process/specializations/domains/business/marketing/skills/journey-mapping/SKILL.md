---
name: journey-mapping
description: Customer journey visualization, analysis, and experience mapping tools
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
  category: Market Research
  skill-id: SK-020
---

# Customer Journey Mapping Skill

## Overview

The Customer Journey Mapping Skill provides comprehensive capabilities for visualizing, analyzing, and optimizing customer journeys across touchpoints. This skill enables integration with journey mapping tools like Miro and Lucidchart, supports experience mapping methodologies, and connects journey insights with analytics platforms for data-driven journey optimization.

## Capabilities

### Journey Mapping Tool Integration
- Miro board creation and management
- Lucidchart diagram automation
- Journey template library access
- Collaborative editing support
- Real-time synchronization
- Export and sharing options
- Version history management
- Cross-platform compatibility

### Touchpoint Documentation
- Touchpoint inventory creation
- Channel categorization
- Touchpoint ownership mapping
- Interaction type classification
- Touchpoint frequency analysis
- Digital vs. physical mapping
- Employee touchpoint identification
- Third-party touchpoint tracking

### Experience Mapping
- Emotional journey tracking
- Satisfaction scoring by stage
- Effort level assessment
- Expectation vs. reality mapping
- Delight moment identification
- Frustration point marking
- Recovery opportunity flagging
- Experience gap analysis

### Pain Point Identification
- Friction point detection
- Drop-off analysis integration
- Customer feedback correlation
- Support ticket pattern analysis
- NPS detractor journey analysis
- Complaint categorization
- Root cause mapping
- Impact prioritization

### Moment of Truth Analysis
- Critical moment identification
- Decision point mapping
- Brand impression moments
- Loyalty-building interactions
- Defection risk moments
- Advocacy trigger identification
- Recovery moment opportunities
- Competitive switching points

### Cross-Channel Journey Visualization
- Omnichannel journey mapping
- Channel switching patterns
- Cross-device journey tracking
- Online-to-offline transitions
- Assisted vs. unassisted paths
- Channel preference by segment
- Journey complexity visualization
- Channel handoff analysis

### Journey Analytics Integration
- Behavioral data overlay
- Conversion funnel mapping
- Time-in-stage analysis
- Path frequency analysis
- Cohort journey comparison
- A/B test journey variants
- Journey metric calculation
- Real-time journey monitoring

### Persona-Journey Alignment
- Persona-specific journeys
- Segment journey variations
- Need state journey mapping
- Behavioral journey patterns
- Demographic journey differences
- Lifecycle stage journeys
- Value tier journey optimization
- New vs. returning customer paths

### Service Blueprint Creation
- Frontstage action mapping
- Backstage process documentation
- Support process visualization
- Physical evidence documentation
- Line of visibility definition
- Line of internal interaction
- Employee journey integration
- System and technology mapping

## Process Integration

This skill integrates with the following marketing processes:

- **customer-journey-analytics.js** - Journey measurement and optimization
- **customer-persona-development.js** - Persona-journey alignment
- **content-strategy-development.js** - Content touchpoint mapping

## Dependencies

- Miro API
- Lucidchart API
- Journey analytics platforms (Amplitude, Mixpanel)
- Customer feedback platforms
- CRM systems for touchpoint data
- Analytics platforms (GA4, Adobe Analytics)

## Usage

### Journey Map Creation

```yaml
skill: journey-mapping
action: create-journey-map
parameters:
  platform: miro
  journey_name: "B2B SaaS Purchase Journey"
  persona: "IT Decision Maker"
  stages:
    - name: Awareness
      touchpoints:
        - type: content
          channel: organic_search
          description: "Blog article discovery"
        - type: advertising
          channel: linkedin
          description: "Sponsored content"
      emotions:
        level: neutral
        description: "Curious but skeptical"
      actions:
        - "Searching for solutions"
        - "Reading industry content"
      pain_points:
        - "Information overload"
        - "Difficult to compare options"
    - name: Consideration
      touchpoints:
        - type: website
          channel: direct
          description: "Product page visit"
        - type: content
          channel: email
          description: "Nurture sequence"
        - type: sales
          channel: phone
          description: "Discovery call"
      emotions:
        level: engaged
        description: "Interested but cautious"
      actions:
        - "Comparing vendors"
        - "Building business case"
      pain_points:
        - "Unclear pricing"
        - "Long sales process"
    - name: Decision
      touchpoints:
        - type: sales
          channel: video_call
          description: "Demo presentation"
        - type: content
          channel: email
          description: "Proposal document"
      emotions:
        level: anxious
        description: "Worried about making wrong choice"
      actions:
        - "Getting stakeholder buy-in"
        - "Negotiating terms"
      pain_points:
        - "Internal approval process"
        - "Contract complexity"
```

### Pain Point Analysis

```yaml
skill: journey-mapping
action: analyze-pain-points
parameters:
  journey_id: "b2b_purchase_journey"
  data_sources:
    - type: support_tickets
      timeframe: last_6_months
      categories: [onboarding, billing, product_issues]
    - type: nps_feedback
      score_filter: detractors
      timeframe: last_6_months
    - type: analytics
      events: [cart_abandonment, form_abandonment, page_exit]
  analysis:
    - aggregate_by_stage: true
    - severity_scoring: true
    - frequency_analysis: true
    - impact_on_conversion: true
  output:
    format: prioritized_list
    include_recommendations: true
```

### Service Blueprint Development

```yaml
skill: journey-mapping
action: create-service-blueprint
parameters:
  platform: lucidchart
  service_name: "Customer Onboarding"
  customer_actions:
    - "Signs contract"
    - "Completes welcome form"
    - "Attends kickoff call"
    - "Configures settings"
    - "Invites team members"
    - "Completes training"
  frontstage:
    - stage: "Contract Signing"
      employee_actions:
        - "Sends contract via DocuSign"
        - "Answers questions"
      physical_evidence:
        - "Contract document"
        - "Email confirmation"
    - stage: "Kickoff Call"
      employee_actions:
        - "Conducts introduction"
        - "Reviews goals"
        - "Sets timeline"
      physical_evidence:
        - "Calendar invite"
        - "Kickoff deck"
        - "Recording"
  backstage:
    - stage: "Account Setup"
      processes:
        - "CRM record creation"
        - "Billing system setup"
        - "Environment provisioning"
      systems:
        - salesforce
        - stripe
        - aws
  support_processes:
    - "Legal review"
    - "Security assessment"
    - "Technical provisioning"
```

### Journey Analytics Overlay

```yaml
skill: journey-mapping
action: overlay-analytics
parameters:
  journey_id: "b2b_purchase_journey"
  analytics_source: amplitude
  metrics:
    by_stage:
      - conversion_rate
      - time_in_stage
      - drop_off_rate
    by_touchpoint:
      - interaction_count
      - engagement_rate
      - attribution_weight
  time_period: last_90_days
  segments:
    - name: "Enterprise"
      filter: company_size >= 1000
    - name: "SMB"
      filter: company_size < 100
  visualization:
    overlay_on_map: true
    highlight_bottlenecks: true
    show_segment_comparison: true
```

### Persona-Journey Alignment

```yaml
skill: journey-mapping
action: align-personas
parameters:
  base_journey: "product_purchase_journey"
  personas:
    - name: "First-Time Buyer"
      journey_variations:
        awareness:
          additional_touchpoints:
            - educational_content
            - comparison_guides
          extended_duration: true
        consideration:
          pain_points_added:
            - "Need more social proof"
            - "Uncertainty about fit"
    - name: "Repeat Customer"
      journey_variations:
        awareness:
          skip_stage: true
        consideration:
          shortened_duration: true
          touchpoints_removed:
            - educational_nurture
    - name: "Referred Customer"
      journey_variations:
        awareness:
          trust_level: elevated
          touchpoints_added:
            - referrer_introduction
  output:
    format: side_by_side_comparison
    highlight_differences: true
```

## Best Practices

1. **Start with Research**: Base journeys on actual customer data and feedback
2. **Include Emotions**: Map emotional states alongside actions and touchpoints
3. **Validate with Customers**: Test journey maps with real customers
4. **Cross-Functional Input**: Involve all customer-facing teams in mapping
5. **Living Documents**: Update journeys as customer behavior evolves
6. **Connect to Data**: Link journey stages to measurable analytics
7. **Actionable Insights**: Prioritize pain points with clear improvement actions
8. **Segment Journeys**: Create persona-specific journey variations

## Related Skills

- SK-001: Market Research Platform
- SK-015: Customer Data Platform
- SK-005: Marketing Analytics Platform

## Related Agents

- AG-010: Consumer Insights Specialist
- AG-002: Market Research Director
- AG-008: Marketing Analytics Director
