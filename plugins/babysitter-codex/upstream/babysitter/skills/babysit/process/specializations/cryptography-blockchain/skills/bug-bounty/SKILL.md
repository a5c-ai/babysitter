---
name: bug-bounty
description: Bug bounty program management and security disclosure expertise for smart contracts. Covers program setup on Immunefi, vulnerability triage, responsible disclosure coordination, bounty payments, and post-disclosure analysis.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch, WebSearch
---

# Bug Bounty/Security Disclosure Skill

Expert management of bug bounty programs and responsible security disclosure for blockchain protocols.

## Capabilities

- **Program Setup**: Configure bug bounty programs on Immunefi and other platforms
- **Scope Definition**: Define assets, severity tiers, and exclusions
- **Vulnerability Triage**: Assess and validate security reports
- **Responsible Disclosure**: Coordinate disclosure timelines and communications
- **Bounty Management**: Calculate and process bounty payments
- **Post-Disclosure**: Conduct post-mortem analysis and lessons learned

## MCP/Tool Integration

| Tool | Purpose | Reference |
|------|---------|-----------|
| **Trail of Bits Skills** | Security analysis, property testing | [building-secure-contracts](https://github.com/trailofbits/skills) |
| **Slither MCP** | Static analysis for validation | [slither-mcp](https://github.com/trailofbits/slither-mcp) |
| **Phalcon MCP** | Transaction analysis | [phalcon-mcp](https://github.com/mark3labs/phalcon-mcp) |

## Bug Bounty Program Setup

### Immunefi Program Structure

```yaml
program:
  name: "Protocol Name"
  website: "https://protocol.xyz"

  assets:
    smart_contracts:
      - type: "Smart Contract"
        target: "0x..."
        severity: "Critical"

    websites:
      - type: "Web Application"
        target: "https://app.protocol.xyz"
        severity: "High"

  severity_levels:
    critical:
      range: "$100,000 - $1,000,000"
      description: "Direct theft of funds, permanent freezing"
    high:
      range: "$10,000 - $100,000"
      description: "Theft requiring user action, temporary freezing"
    medium:
      range: "$1,000 - $10,000"
      description: "Griefing, DoS with medium impact"
    low:
      range: "$100 - $1,000"
      description: "Minor issues, informational"

  exclusions:
    - "Issues in test files"
    - "Third-party dependencies"
    - "Issues requiring admin key compromise"
    - "Front-running issues without significant impact"
```

### Severity Classification

| Severity | Impact | Examples |
|----------|--------|----------|
| **Critical** | Direct fund loss, protocol takeover | Reentrancy draining funds, access control bypass |
| **High** | Significant fund loss, protocol disruption | Oracle manipulation, flash loan attacks |
| **Medium** | Limited fund loss, degraded functionality | Griefing attacks, minor calculation errors |
| **Low** | No fund loss, minor issues | Gas inefficiency, informational findings |

## Vulnerability Triage Workflow

### 1. Initial Assessment

```markdown
## Triage Checklist

- [ ] Report is within program scope
- [ ] Vulnerability is reproducible
- [ ] Impact assessment is accurate
- [ ] No duplicate of existing report
- [ ] Not a known issue or design decision

## Initial Classification

| Field | Value |
|-------|-------|
| Report ID | BB-2024-XXX |
| Submission Date | YYYY-MM-DD |
| Reporter | @handle |
| Asset Affected | Contract/URL |
| Initial Severity | Critical/High/Medium/Low |
| Status | Triaging |
```

### 2. Validation Process

```bash
# Clone and setup test environment
git clone <protocol-repo>
cd protocol

# Create PoC test
forge test --match-test test_VulnerabilityPoC -vvvv

# Run against mainnet fork
forge test --fork-url $MAINNET_RPC --match-test test_VulnerabilityPoC
```

### 3. Severity Adjustment

Consider:
- **Likelihood**: How likely is exploitation?
- **Impact**: What is the maximum damage?
- **Complexity**: What resources are needed?
- **User Interaction**: Does it require victim action?

```
Final Severity = Base Impact - Mitigating Factors + Aggravating Factors
```

## Responsible Disclosure Process

### Timeline

```
Day 0:    Report received
Day 1-3:  Initial triage and acknowledgment
Day 3-7:  Validation and severity confirmation
Day 7-14: Fix development
Day 14-21: Fix review and testing
Day 21-30: Coordinated disclosure preparation
Day 30+:  Public disclosure (if agreed)
```

### Communication Templates

**Acknowledgment:**
```
Subject: [BB-XXXX] Report Acknowledged

Dear Security Researcher,

Thank you for your submission to our bug bounty program. We have received
your report and assigned it reference number BB-XXXX.

Our security team is currently reviewing your submission. We will provide
an initial assessment within 3 business days.

Timeline:
- Initial response: 24-72 hours
- Severity assessment: 3-7 days
- Fix timeline: TBD based on severity

Best regards,
Security Team
```

**Severity Confirmation:**
```
Subject: [BB-XXXX] Severity Assessment Complete

Dear Security Researcher,

After thorough review, we have assessed your vulnerability report:

Severity: [CRITICAL/HIGH/MEDIUM/LOW]
Bounty Range: $X - $Y
Fix Timeline: X days

[Details of assessment]

Next Steps:
1. Fix development (ETA: X days)
2. Fix verification with your input
3. Coordinated disclosure discussion

Best regards,
Security Team
```

## Bounty Calculation

### Factors

```javascript
const bountyCalculation = {
  baseBounty: getSeverityBase(severity), // Based on tier

  adjustments: {
    qualityOfReport: 1.0 - 1.5,    // Well-documented PoC
    impactAccuracy: 0.8 - 1.2,     // Accurate impact assessment
    firstReporter: 1.0,            // First to report
    duplicatePartial: 0.0 - 0.5,   // Partial duplicate
    responsibleBehavior: 1.0 - 1.2 // No public disclosure
  },

  calculate() {
    return this.baseBounty *
           this.adjustments.qualityOfReport *
           this.adjustments.impactAccuracy *
           this.adjustments.responsibleBehavior;
  }
};
```

### Payment Process

1. **Verify Identity**: KYC requirements for large bounties
2. **Payment Method**: Crypto (USDC, ETH) or fiat
3. **Tax Documentation**: W-9 (US) or W-8BEN (non-US)
4. **Confirmation**: Receipt and acknowledgment

## Post-Disclosure Analysis

### Post-Mortem Template

```markdown
# Security Incident Post-Mortem: [Title]

## Summary
- **Date Discovered**: YYYY-MM-DD
- **Date Fixed**: YYYY-MM-DD
- **Severity**: Critical/High/Medium/Low
- **Bounty Paid**: $X

## Root Cause
[Detailed explanation of the vulnerability]

## Timeline
| Time | Event |
|------|-------|
| T+0h | Report received |
| T+2h | Triage complete |
| T+24h | Fix developed |
| T+48h | Fix deployed |
| T+168h | Public disclosure |

## Technical Details
[Code snippets, attack vectors, affected functions]

## Fix Implementation
[How the issue was resolved]

## Lessons Learned
1. [Lesson 1]
2. [Lesson 2]
3. [Lesson 3]

## Process Improvements
- [ ] Improvement 1
- [ ] Improvement 2
```

## Process Integration

This skill integrates with:

- `bug-bounty-program.js` - Full program management process
- `incident-response-exploits.js` - Exploit response coordination
- `smart-contract-security-audit.js` - Pre-launch security review

## Immunefi Best Practices

### Program Configuration

1. **Clear Scope**: List all in-scope assets with addresses
2. **Realistic Bounties**: Competitive with market rates
3. **Response SLA**: Commit to specific timelines
4. **Safe Harbor**: Protect researchers acting in good faith

### Common Issues

| Issue | Solution |
|-------|----------|
| Slow response | Set up triage rotation, clear escalation |
| Scope disputes | Pre-define edge cases in program terms |
| Severity disagreements | Use CVSS scoring, document rationale |
| Payment delays | Pre-fund bounty pool, streamline KYC |

## Security Advisory Format

### GitHub Security Advisory

```markdown
## Summary
[Brief description]

## Severity
[CVSS Score] - [Critical/High/Medium/Low]

## Affected Versions
- >= 1.0.0, < 1.2.3

## Patches
Fixed in version 1.2.3

## Workarounds
[If applicable]

## References
- [Link to fix PR]
- [Related documentation]

## Credits
Thanks to @researcher for responsible disclosure
```

## See Also

- `agents/incident-response/AGENT.md` - Incident response expert
- `smart-contract-security-audit.js` - Security audit process
- `references.md` - Security disclosure resources
