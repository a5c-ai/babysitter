# Vendor Risk Monitor

Continuous vendor security monitoring skill for tracking security ratings, breach notifications, certificate status, and risk changes.

## Overview

This skill provides ongoing vendor security monitoring beyond point-in-time assessments. It tracks security ratings, monitors breach databases, checks certificate status, scans dark web sources, and alerts on significant risk changes for proactive third-party risk management.

## Key Features

- **Rating Monitoring**: Track vendor security ratings and changes
- **Breach Tracking**: Monitor public breach databases and disclosures
- **Certificate Monitoring**: Check SSL/TLS certificate status and expiration
- **Dark Web Scanning**: Detect vendor data exposures
- **Risk Alerting**: Notify on significant risk changes
- **Continuous Reporting**: Generate ongoing monitoring reports

## Monitoring Sources

| Source | Data Type |
|--------|-----------|
| BitSight/SecurityScorecard | Security posture scores |
| Breach databases | Incident data |
| Certificate monitors | SSL/TLS status |
| Dark web feeds | Exposure data |
| News/regulatory | Incident reports |

## Risk Signals

- Security rating changes
- Data breach announcements
- Certificate issues and expirations
- Dark web exposures
- Regulatory actions
- Domain security problems
- Patching cadence changes

## Alert Thresholds

Configure alerts for:
- Rating drops below threshold
- Minimum rating violations
- Certificate expiration warnings
- New breach discoveries
- Dark web findings

## Deliverables

- Real-time risk alerts
- Rating trend analysis
- Breach impact assessments
- Certificate status reports
- Continuous monitoring dashboards

## Usage

```javascript
skill: {
  name: 'vendor-risk-monitor',
  context: {
    operation: 'monitor',
    vendors: [
      { vendorName: 'Cloud Provider', domain: 'provider.com', riskTier: 'critical' }
    ],
    monitoringScope: ['ratings', 'breaches', 'certificates'],
    alertThresholds: { minimumRating: 700 }
  }
}
```

## Related Processes

- Third-Party Vendor Security Assessment
- Continuous Compliance Monitoring
- Supply Chain Security
