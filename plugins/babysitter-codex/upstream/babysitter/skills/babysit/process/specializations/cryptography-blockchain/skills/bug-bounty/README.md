# Bug Bounty/Security Disclosure Skill

## Overview

The Bug Bounty skill provides comprehensive guidance for managing smart contract bug bounty programs, from initial setup through vulnerability triage, bounty payment, and post-disclosure analysis. It follows industry best practices from leading programs like Immunefi.

## Use Cases

### Program Launch
- Set up bug bounty on Immunefi or custom platform
- Define scope, assets, and severity tiers
- Establish response SLAs and bounty ranges

### Vulnerability Handling
- Triage incoming security reports
- Validate and reproduce vulnerabilities
- Assess severity and calculate bounties

### Disclosure Management
- Coordinate responsible disclosure timelines
- Communicate with researchers professionally
- Publish security advisories

### Post-Incident
- Conduct post-mortem analysis
- Document lessons learned
- Improve security processes

## Quick Start

### 1. Program Setup Checklist

```markdown
## Bug Bounty Launch Checklist

### Scope Definition
- [ ] List all smart contract addresses
- [ ] Include deployment networks (mainnet, L2s)
- [ ] Define web application scope
- [ ] Document exclusions clearly

### Bounty Structure
- [ ] Set competitive bounty ranges
- [ ] Define severity criteria
- [ ] Establish payment timeline
- [ ] Choose payment methods (crypto/fiat)

### Operations
- [ ] Assign triage team
- [ ] Set up communication channels
- [ ] Define escalation procedures
- [ ] Create response templates

### Legal
- [ ] Safe harbor provisions
- [ ] Terms of service
- [ ] Privacy policy for researchers
```

### 2. Triage a Report

```bash
# 1. Acknowledge receipt within 24h

# 2. Validate the vulnerability
forge test --match-test test_ReportedVuln -vvvv

# 3. Check against mainnet state
forge test --fork-url $MAINNET_RPC --match-test test_ReportedVuln

# 4. Document findings
# - Reproducibility
# - Impact assessment
# - Severity classification
```

### 3. Calculate Bounty

| Severity | Base Range | Quality Multiplier | Final Range |
|----------|------------|-------------------|-------------|
| Critical | $50k-$500k | 1.0-1.5x | $50k-$750k |
| High | $10k-$50k | 1.0-1.5x | $10k-$75k |
| Medium | $1k-$10k | 1.0-1.5x | $1k-$15k |
| Low | $100-$1k | 1.0-1.5x | $100-$1.5k |

## Integration with Processes

| Process | Integration |
|---------|-------------|
| `bug-bounty-program.js` | Full lifecycle management |
| `incident-response-exploits.js` | Critical vulnerability response |
| `smart-contract-security-audit.js` | Pre-launch preparation |

## Response Templates

### Initial Acknowledgment
```
Thank you for your submission. We've assigned reference #BB-XXXX.
Our team will provide an initial assessment within 72 hours.
```

### Severity Confirmation
```
We've reviewed your report and confirmed the severity as [HIGH].
Expected bounty range: $XX,XXX - $XX,XXX
Fix timeline: X days

Next: We'll share the proposed fix for your review.
```

### Bounty Payment
```
Congratulations! Your bounty of $XX,XXX has been approved.

Payment Details:
- Method: [USDC/ETH/Wire]
- Required: [KYC form/W-8BEN]
- Timeline: 5-10 business days after documentation

Thank you for helping secure our protocol.
```

## Severity Guidelines

### Critical (CVSS 9.0-10.0)
- Direct theft of user funds
- Permanent freezing of funds
- Protocol governance takeover
- Oracle manipulation leading to fund loss

### High (CVSS 7.0-8.9)
- Theft requiring user interaction
- Temporary freezing of funds
- Significant unauthorized actions
- Flash loan attacks with material loss

### Medium (CVSS 4.0-6.9)
- Griefing without fund loss
- Smart contract DoS
- Minor privilege escalation
- Calculation errors with limited impact

### Low (CVSS 0.1-3.9)
- Gas optimization issues
- Best practice violations
- Informational findings
- Minor UI/UX issues

## Output Schema

When used in process tasks:

```json
{
  "reportId": "BB-2024-XXX",
  "status": "triaged|validated|fixed|paid|disclosed",
  "severity": "critical|high|medium|low",
  "bountyRange": {
    "min": 10000,
    "max": 50000,
    "currency": "USD"
  },
  "timeline": {
    "received": "2024-01-15T10:00:00Z",
    "acknowledged": "2024-01-15T12:00:00Z",
    "validated": "2024-01-17T14:00:00Z",
    "fixed": "2024-01-20T16:00:00Z",
    "paid": "2024-01-25T10:00:00Z"
  },
  "researcher": {
    "handle": "@researcher",
    "wallet": "0x..."
  },
  "disclosure": {
    "type": "coordinated",
    "date": "2024-02-15",
    "advisoryUrl": "https://..."
  }
}
```

## Resources

- [Immunefi Bug Bounty Platform](https://immunefi.com/)
- [HackerOne Disclosure Guidelines](https://www.hackerone.com/disclosure-guidelines)
- [CVSS Calculator](https://www.first.org/cvss/calculator/3.1)
- [GitHub Security Advisories](https://docs.github.com/en/code-security/security-advisories)
