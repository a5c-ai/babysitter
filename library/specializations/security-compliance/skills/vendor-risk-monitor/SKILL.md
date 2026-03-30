---
name: vendor-risk-monitor
description: Continuous vendor security monitoring for security ratings, breach notifications, and risk change detection
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - WebFetch
---

# Vendor Risk Monitor Skill

## Purpose

Provide continuous vendor security monitoring by tracking security ratings, monitoring breach notifications, detecting certificate issues, and alerting on risk changes for proactive third-party risk management.

## Capabilities

### Security Rating Monitoring
- Track vendor security ratings from rating services
- Monitor rating changes and trends
- Compare ratings against thresholds
- Analyze rating factor changes
- Generate rating trend reports
- Alert on rating downgrades

### Breach Notification Tracking
- Monitor public breach databases
- Track vendor-disclosed incidents
- Correlate breaches with vendor inventory
- Assess breach impact on data
- Generate breach impact reports
- Trigger incident response workflows

### Certificate Status Checking
- Monitor vendor SSL/TLS certificates
- Track certificate expiration dates
- Detect certificate issues
- Verify certificate chain validity
- Alert on upcoming expirations
- Check certificate transparency logs

### Dark Web Monitoring
- Monitor dark web for vendor exposures
- Detect leaked credentials
- Identify data for sale
- Track threat actor mentions
- Correlate with vendor risk profiles
- Generate exposure reports

### Risk Change Alerting
- Detect significant risk changes
- Correlate multiple risk signals
- Generate risk change notifications
- Escalate critical changes
- Update vendor risk profiles
- Trigger reassessment workflows

### Monitoring Report Generation
- Generate continuous monitoring reports
- Create executive dashboards
- Produce trend analysis
- Build risk heat maps
- Export data for GRC systems
- Support board reporting

## Monitoring Sources

| Source Type | Examples | Data Type |
|-------------|----------|-----------|
| Security Ratings | BitSight, SecurityScorecard | Posture scores |
| Breach Databases | HaveIBeenPwned, DataBreaches.net | Incident data |
| Certificate Monitors | SSL Labs, crt.sh | Certificate status |
| Dark Web | Various feeds | Exposure data |
| News/Alerts | Security news feeds | Incident reports |
| Regulatory | SEC filings, regulatory actions | Compliance events |

## Risk Signals Monitored

- Security rating changes
- New vulnerability disclosures
- Data breach announcements
- Certificate issues
- Domain security problems
- DNS configuration issues
- Email security posture
- Network security indicators
- Patching cadence
- Open ports and services

## Integrations

- **BitSight**: Security ratings platform
- **SecurityScorecard**: Security ratings and benchmarks
- **RiskRecon**: Third-party risk monitoring
- **Black Kite**: Cyber risk ratings
- **UpGuard**: Third-party risk monitoring
- **Recorded Future**: Threat intelligence

## Target Processes

- Third-Party Vendor Security Assessment
- Continuous Compliance Monitoring
- Vendor Risk Management
- Supply Chain Security

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "operation": {
      "type": "string",
      "enum": ["monitor", "check-ratings", "check-breaches", "check-certificates", "generate-report", "configure-alerts"],
      "description": "Monitoring operation type"
    },
    "vendors": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "vendorId": { "type": "string" },
          "vendorName": { "type": "string" },
          "domain": { "type": "string" },
          "riskTier": { "type": "string" }
        }
      },
      "description": "Vendors to monitor"
    },
    "monitoringScope": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["ratings", "breaches", "certificates", "dark-web", "news", "regulatory"]
      }
    },
    "alertThresholds": {
      "type": "object",
      "properties": {
        "ratingDropThreshold": { "type": "number" },
        "minimumRating": { "type": "number" },
        "certificateExpiryDays": { "type": "integer" }
      }
    },
    "reportingPeriod": {
      "type": "object",
      "properties": {
        "startDate": { "type": "string", "format": "date" },
        "endDate": { "type": "string", "format": "date" }
      }
    },
    "notificationChannels": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["operation"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "monitoringId": {
      "type": "string"
    },
    "operation": {
      "type": "string"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    },
    "vendorsMonitored": {
      "type": "integer"
    },
    "ratingsSummary": {
      "type": "object",
      "properties": {
        "vendorsWithRatings": { "type": "integer" },
        "averageRating": { "type": "number" },
        "belowThreshold": { "type": "integer" },
        "ratingChanges": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "vendorId": { "type": "string" },
              "previousRating": { "type": "number" },
              "currentRating": { "type": "number" },
              "change": { "type": "number" },
              "changeDate": { "type": "string" }
            }
          }
        }
      }
    },
    "breachAlerts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "vendorId": { "type": "string" },
          "vendorName": { "type": "string" },
          "breachDate": { "type": "string" },
          "description": { "type": "string" },
          "dataTypes": { "type": "array" },
          "recordsAffected": { "type": "integer" },
          "source": { "type": "string" }
        }
      }
    },
    "certificateAlerts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "vendorId": { "type": "string" },
          "domain": { "type": "string" },
          "issue": { "type": "string" },
          "expirationDate": { "type": "string" },
          "daysUntilExpiry": { "type": "integer" }
        }
      }
    },
    "darkWebFindings": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "vendorId": { "type": "string" },
          "findingType": { "type": "string" },
          "description": { "type": "string" },
          "discoveryDate": { "type": "string" },
          "severity": { "type": "string" }
        }
      }
    },
    "riskChanges": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "vendorId": { "type": "string" },
          "vendorName": { "type": "string" },
          "previousRiskLevel": { "type": "string" },
          "currentRiskLevel": { "type": "string" },
          "triggers": { "type": "array" },
          "recommendedAction": { "type": "string" }
        }
      }
    },
    "alertsSent": {
      "type": "integer"
    },
    "recommendations": {
      "type": "array",
      "items": { "type": "string" }
    },
    "reportPath": {
      "type": "string"
    }
  }
}
```

## Usage Example

```javascript
skill: {
  name: 'vendor-risk-monitor',
  context: {
    operation: 'monitor',
    vendors: [
      { vendorId: 'v001', vendorName: 'Cloud Provider', domain: 'cloudprovider.com', riskTier: 'critical' }
    ],
    monitoringScope: ['ratings', 'breaches', 'certificates'],
    alertThresholds: {
      ratingDropThreshold: 10,
      minimumRating: 700,
      certificateExpiryDays: 30
    }
  }
}
```
